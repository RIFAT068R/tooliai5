import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu } from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'

import { Sidebar } from './components/layout/Sidebar'
import { HomePage } from './pages/HomePage'
import { ChatPage } from './pages/ChatPage'
import { PricingModal } from './pages/PricingModal'

import { useAuth } from './hooks/useAuth'
import { useConversations, useStreamingChat, useUsage } from './hooks/useConversations'

import { blink } from './blink/client'
import { generateId } from './lib/utils'
import { getSmartModel, DEFAULT_CHAT_MODEL, DEFAULT_IMAGE_MODEL } from './lib/models'

import type { Mode, ChatModel, ImageModel, Message, PlanTier } from './types'

export default function App() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const { user, isLoading: authLoading, login, logout } = useAuth()

  // ── UI State ──────────────────────────────────────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [pricingOpen, setPricingOpen] = useState(false)

  // ── Chat State ────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>('chat')
  const [chatModel, setChatModel] = useState<ChatModel>(DEFAULT_CHAT_MODEL)
  const [imageModel] = useState<ImageModel>(DEFAULT_IMAGE_MODEL)
  const [activeConvId, setActiveConvId] = useState<string | null>(null)

  // Single source of truth for ALL messages shown in the current chat.
  // We manage this locally and persist to DB asynchronously.
  // This avoids any React Query cache lag / stale state issues.
  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const abortRef = useRef<AbortController | null>(null)

  // ── Data Hooks ────────────────────────────────────────────────────────────
  const { conversations, createConversation, deleteConversation } = useConversations(user?.id)
  const { streamingContent, isStreaming, isGeneratingImage, setIsGeneratingImage, streamMessage } = useStreamingChat()
  const { planTier, plan, messageCount, imageCount, canSendMessage, canGenerateImage, incrementUsage, fetchCurrentCounts } = useUsage(user?.id)

  const isInChat = localMessages.length > 0

  // ── Helpers ───────────────────────────────────────────────────────────────

  const appendMessage = useCallback((msg: Message) => {
    setLocalMessages(prev => [...prev, msg])
  }, [])

  const persistMessage = useCallback(async (msg: Message, convId: string) => {
    try {
      await blink.db.messages.create({
        id: msg.id,
        conversationId: convId,
        userId: msg.userId,
        role: msg.role,
        content: msg.content,
        imageUrl: msg.imageUrl ?? null,
        fileUrl: msg.fileUrl ?? null,
        fileName: msg.fileName ?? null,
        sources: msg.sources ? JSON.stringify(msg.sources) : null,
        createdAt: msg.createdAt,
      })
    } catch {
      // DB persist failure is non-fatal — messages still show locally
    }
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleNewChat = useCallback(() => {
    setActiveConvId(null)
    setLocalMessages([])
    setMobileSidebarOpen(false)
  }, [])

  const handleSelectConv = useCallback(async (id: string) => {
    setActiveConvId(id)
    setLocalMessages([]) // Clear while loading
    setMobileSidebarOpen(false)

    // Load messages from DB for this conversation
    try {
      const rows = await blink.db.messages.list({
        where: { conversationId: id },
        orderBy: { createdAt: 'asc' },
      })
      const msgs = rows.map((r: Record<string, unknown>) => ({
        ...r,
        sources: r.sources ? JSON.parse(r.sources as string) : undefined,
      })) as Message[]
      setLocalMessages(msgs)
    } catch {
      setLocalMessages([])
    }
  }, [])

  const handleDeleteConv = useCallback(async (id: string) => {
    await deleteConversation.mutateAsync(id)
    if (activeConvId === id) {
      setActiveConvId(null)
      setLocalMessages([])
    }
    toast.success('Conversation deleted')
  }, [activeConvId, deleteConversation])

  const handleModeChange = useCallback((newMode: Mode) => {
    setMode(newMode)
  }, [])

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const handleUpgradePlan = useCallback(async (planId: PlanTier) => {
    if (planId === 'free') {
      setPricingOpen(false)
      return
    }
    toast('Stripe checkout coming soon', { icon: '→' })
    setPricingOpen(false)
  }, [])

  const handleApplyEdit = useCallback(async (imageUrl: string) => {
    if (!user) return
    
    const userId = user.id
    const now = new Date().toISOString()
    const convId = activeConvId ?? 'pending'

    const aiMsg: Message = {
      id: generateId(),
      conversationId: convId,
      userId,
      role: 'assistant',
      content: '✨ Here is your edited image:',
      imageUrl,
      createdAt: now,
    }
    appendMessage(aiMsg)
    if (activeConvId) await persistMessage(aiMsg, activeConvId)
  }, [user, activeConvId, appendMessage, persistMessage])

  const handleSend = useCallback(async (text: string, file?: File) => {
    if (!text.trim() && !file) return

    // ── Auth gate ────────────────────────────────────────────────────────
    if (!user) {
      login()
      return
    }

    // ── Usage limits — fetch fresh counts from DB to avoid stale cache ───
    const freshCounts = await fetchCurrentCounts()
    if (mode === 'image' && freshCounts.imageCount >= plan.limits.imagesPerDay) {
      toast.error(`Image limit reached (${plan.limits.imagesPerDay}/day). Upgrade for more.`)
      setPricingOpen(true)
      return
    }
    if (mode !== 'image' && freshCounts.messageCount >= plan.limits.messagesPerDay) {
      toast.error(`Message limit reached (${plan.limits.messagesPerDay}/day). Upgrade for more.`)
      setPricingOpen(true)
      return
    }

    const effectiveChatModel: ChatModel = plan.limits.modelsAllowed.includes(chatModel)
      ? chatModel as ChatModel
      : 'gpt-4.1-mini'

    const userId = user.id
    const now = new Date().toISOString()

    // ── Build user message and add to local state immediately ─────────────
    const userMsg: Message = {
      id: generateId(),
      conversationId: activeConvId ?? 'pending',
      userId,
      role: 'user',
      content: text,
      fileName: file?.name,
      createdAt: now,
    }
    appendMessage(userMsg)
    // Increment AFTER the limit check passes
    incrementUsage.mutate(mode === 'image' ? 'image' : 'message')

    // ── Image generation ──────────────────────────────────────────────────
    if (mode === 'image') {
      setIsGeneratingImage(true)
      const blinkImageModel = imageModel === 'blink-ultra'
        ? 'fal-ai/flux-pro'
        : imageModel === 'blink-nano-pro'
          ? 'fal-ai/nano-banana-pro'
          : 'fal-ai/nano-banana'

      const imagePrompt = imageModel === 'blink-ultra'
        ? `${text}, highly detailed photorealistic masterpiece, 8k resolution, cinematic lighting, realistic textures, sharp focus`
        : text

      let convId = activeConvId
      if (!convId) {
        try {
          const conv = await createConversation.mutateAsync({ title: text.slice(0, 50), mode, model: imageModel })
          convId = conv.id
          setActiveConvId(convId)
          await persistMessage({ ...userMsg, conversationId: convId }, convId)
        } catch { /* continue */ }
      }

      try {
        const { data } = await blink.ai.generateImage({ prompt: imagePrompt, model: blinkImageModel })
        const imageUrl = data?.[0]?.url ?? ''
        const aiMsg: Message = {
          id: generateId(),
          conversationId: convId ?? 'pending',
          userId,
          role: 'assistant',
          content: imageUrl ? '✨ Here is your generated image:' : '❌ Image generation failed.',
          imageUrl,
          createdAt: new Date().toISOString(),
        }
        appendMessage(aiMsg)
        if (convId) await persistMessage(aiMsg, convId)
      } catch (err) {
        const errMsg: Message = {
          id: generateId(),
          conversationId: convId ?? 'pending',
          userId,
          role: 'assistant',
          content: `❌ Image generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          createdAt: new Date().toISOString(),
        }
        appendMessage(errMsg)
        if (convId) await persistMessage(errMsg, convId)
      } finally {
        setIsGeneratingImage(false)
      }
      return
    }

    // ── Text / Chat / Search / Analyze ───────────────────────────────────

    // File upload
    let fileUrl: string | undefined
    if (file) {
      try {
        const ext = file.name.split('.').pop() ?? 'bin'
        const { publicUrl } = await blink.storage.upload(file, `uploads/${userId}/${generateId()}.${ext}`)
        fileUrl = publicUrl
      } catch {
        toast.error('File upload failed')
      }
    }

    // Model routing
    const resolvedModel = (effectiveChatModel === DEFAULT_CHAT_MODEL && mode === 'chat')
      ? getSmartModel(text, mode)
      : effectiveChatModel

    // Build history from localMessages (always up-to-date, no stale closure issue)
    // We read from the ref-equivalent by using setLocalMessages with a callback below
    // But here we need the current value — capture it synchronously before setState
    // localMessages is captured from the closure at call time, which is correct here
    // because we just appended userMsg synchronously via appendMessage above.
    // However React batches state updates, so localMessages doesn't include userMsg yet.
    // Solution: build history from localMessages (pre-append snapshot) + userMsg manually.
    const historyMsgs = localMessages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-12)
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.imageUrl ? '[Image generated]' : m.fileUrl ? `[File: ${m.fileName}] ${m.content}` : m.content,
      }))

    const currentContent = fileUrl ? `[File attached: ${file?.name}]\n\n${text}` : text
    const allMessages = [
      { role: 'system' as const, content: buildSystemPrompt(mode, !!fileUrl) },
      ...historyMsgs,
      { role: 'user' as const, content: currentContent },
    ]

    // Create DB conversation on first message
    let convId = activeConvId
    if (!convId) {
      try {
        const conv = await createConversation.mutateAsync({ title: text.slice(0, 60), mode, model: resolvedModel })
        convId = conv.id
        setActiveConvId(convId)
        await persistMessage({ ...userMsg, conversationId: convId, fileUrl }, convId)
        // Update conversationId on all existing local messages
        setLocalMessages(prev => prev.map(m => ({ ...m, conversationId: convId! })))
      } catch { /* continue without DB */ }
    }

    // Stream response
    try {
      abortRef.current = new AbortController()
      const { content, sources } = await streamMessage(allMessages, resolvedModel, mode === 'search')

      if (!content && !sources.length) {
        throw new Error('No response received. The model may be temporarily unavailable.')
      }

      const aiMsg: Message = {
        id: generateId(),
        conversationId: convId ?? 'pending',
        userId,
        role: 'assistant',
        content,
        sources: sources.length > 0 ? sources : undefined,
        createdAt: new Date().toISOString(),
      }
      appendMessage(aiMsg)
      if (convId) await persistMessage(aiMsg, convId)

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred'

      if (msg.includes('AbortError') || msg.includes('aborted') || msg.includes('abort')) return

      if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('unauthorized')) {
        toast.error('Session expired. Please sign in again.')
        login()
        return
      }

      const friendlyMsg = (msg.includes('rate') || msg.includes('quota') || msg.includes('429'))
        ? 'Rate limit reached. Please wait a moment or switch to a different model.'
        : msg

      toast.error(friendlyMsg)

      const errMsg: Message = {
        id: generateId(),
        conversationId: convId ?? 'pending',
        userId,
        role: 'assistant',
        content: `❌ ${friendlyMsg}`,
        createdAt: new Date().toISOString(),
      }
      appendMessage(errMsg)
      if (convId) await persistMessage(errMsg, convId)
    }
  }, [
    user, login, mode, chatModel, imageModel, activeConvId, localMessages,
    plan, fetchCurrentCounts,
    appendMessage, persistMessage, createConversation, streamMessage, incrementUsage,
  ])

  const handleRegenerate = useCallback(async () => {
    const lastUser = [...localMessages].reverse().find(m => m.role === 'user')
    if (lastUser) await handleSend(lastUser.content)
  }, [localMessages, handleSend])

  // ── Loading screen ────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/logo.png"
            alt="TooliAi"
            className="w-16 h-16 rounded-2xl object-cover animate-pulse shadow-lg"
          />
          <div className="flex flex-col items-center gap-1">
            <span className="font-bold text-base text-foreground tracking-tight">TooliAi</span>
            <span className="text-xs text-muted-foreground">Loading…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
            fontSize: '13px',
          },
        }}
      />

      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar
          conversations={conversations}
          activeConvId={activeConvId}
          activeMode={mode}
          user={user}
          planTier={planTier}
          onNewChat={handleNewChat}
          onSelectConv={handleSelectConv}
          onDeleteConv={handleDeleteConv}
          onSelectMode={handleModeChange}
          onLogin={login}
          onLogout={logout}
          onUpgrade={() => setPricingOpen(true)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 z-40 lg:hidden h-full"
            >
              <Sidebar
                conversations={conversations}
                activeConvId={activeConvId}
                activeMode={mode}
                user={user}
                planTier={planTier}
                onNewChat={handleNewChat}
                onSelectConv={handleSelectConv}
                onDeleteConv={handleDeleteConv}
                onSelectMode={handleModeChange}
                onLogin={login}
                onLogout={logout}
                onUpgrade={() => { setPricingOpen(true); setMobileSidebarOpen(false) }}
                collapsed={false}
                onToggleCollapse={() => setMobileSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Mobile header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/60 backdrop-blur-sm lg:hidden shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="TooliAi" className="w-7 h-7 rounded-lg object-cover" />
            <span className="font-bold text-sm text-foreground tracking-tight">TooliAi</span>
          </div>
        </div>

        {/* Page content — stable key so it never unmounts mid-conversation */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {!isInChat ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full overflow-y-auto flex items-center"
            >
              <HomePage
                user={user}
                mode={mode}
                chatModel={chatModel}
                imageModel={imageModel}
                planTier={planTier}
                messageCount={messageCount}
                imageCount={imageCount}
                isLoading={isStreaming || isGeneratingImage}
                onSend={handleSend}
                onModeChange={handleModeChange}
                onChatModelChange={setChatModel}
                onImageModelChange={() => {}}
                onUpgrade={() => setPricingOpen(true)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full"
            >
              <ChatPage
                conversationId={activeConvId ?? 'pending'}
                messages={localMessages}
                mode={mode}
                chatModel={chatModel}
                imageModel={imageModel}
                isStreaming={isStreaming}
                isGeneratingImage={isGeneratingImage}
                streamingContent={streamingContent}
                onSend={handleSend}
                onStop={handleStop}
                onModeChange={handleModeChange}
                onChatModelChange={setChatModel}
                onImageModelChange={() => {}}
                onRegenerate={handleRegenerate}
                onApplyEdit={handleApplyEdit}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Pricing modal */}
      <PricingModal
        open={pricingOpen}
        currentPlan={planTier}
        onClose={() => setPricingOpen(false)}
        onSelectPlan={handleUpgradePlan}
      />
    </div>
  )
}

// ─── System prompt builder ────────────────────────────────────────────────────
function buildSystemPrompt(mode: Mode, hasFile: boolean): string {
  const base = `You are AI Suite, a helpful, knowledgeable, and concise AI assistant.
You provide accurate, well-structured responses using Markdown formatting where appropriate.
Keep responses focused and practical. Use code blocks for code. Use tables when comparing options.`

  const modePrompts: Record<Mode, string> = {
    chat: base,
    search: `${base}
You have access to real-time web search results. Always cite your sources.
Provide current, accurate information with source links when available.`,
    image: base,
    analyze: `${base}
The user has uploaded a file for analysis.${hasFile ? ' A file has been attached to this conversation.' : ''}
Extract key information, summarize content, identify patterns, and answer questions about the document.
Be thorough but concise in your analysis.`,
  }

  return modePrompts[mode]
}
