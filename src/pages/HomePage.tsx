import { motion } from 'framer-motion'
import { Globe, Image, FileSearch, MessageSquare, ArrowRight, Crown, Zap } from 'lucide-react'
import type { Mode, ChatModel, ImageModel, PlanTier } from '../types'
import { InputBar } from '../components/chat/InputBar'
import { DEFAULT_CHAT_MODEL, DEFAULT_IMAGE_MODEL, PLANS } from '../lib/models'

interface HomePageProps {
  user: { id: string; email: string; displayName?: string } | null
  mode: Mode
  chatModel: ChatModel
  imageModel: ImageModel
  planTier: PlanTier
  messageCount: number
  imageCount: number
  isLoading: boolean
  onSend: (text: string, file?: File) => void
  onModeChange: (mode: Mode) => void
  onChatModelChange: (model: ChatModel) => void
  onImageModelChange: (model: ImageModel) => void
  onUpgrade: () => void
}

const SUGGESTIONS = [
  {
    icon: <Globe size={16} className="text-emerald-500" />,
    title: 'Search the web',
    desc: 'Real-time answers with sources',
    mode: 'search' as Mode,
    prompt: 'What are the latest AI breakthroughs in 2025?',
    gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    hover: 'hover:border-emerald-300 dark:hover:border-emerald-700',
  },
  {
    icon: <Image size={16} className="text-pink-500" />,
    title: 'Generate an image',
    desc: 'Create stunning visuals with AI',
    mode: 'image' as Mode,
    prompt: 'A cinematic photo of a neon-lit Tokyo street at night, raining',
    gradient: 'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30',
    border: 'border-pink-200 dark:border-pink-800/50',
    hover: 'hover:border-pink-300 dark:hover:border-pink-700',
  },
  {
    icon: <FileSearch size={16} className="text-amber-500" />,
    title: 'Analyze a document',
    desc: 'Upload files and extract insights',
    mode: 'analyze' as Mode,
    prompt: 'Summarize and extract the key points from this document',
    gradient: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
    border: 'border-amber-200 dark:border-amber-800/50',
    hover: 'hover:border-amber-300 dark:hover:border-amber-700',
  },
  {
    icon: <MessageSquare size={16} className="text-indigo-500" />,
    title: 'Write content',
    desc: 'Draft emails, code, and more',
    mode: 'chat' as Mode,
    prompt: 'Write a compelling LinkedIn post about the importance of continuous learning in tech',
    gradient: 'from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30',
    border: 'border-indigo-200 dark:border-indigo-800/50',
    hover: 'hover:border-indigo-300 dark:hover:border-indigo-700',
  },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function HomePage({
  user, mode, chatModel, imageModel, planTier,
  messageCount, imageCount, isLoading,
  onSend, onModeChange, onChatModelChange, onImageModelChange, onUpgrade
}: HomePageProps) {
  const name = user?.displayName || user?.email?.split('@')[0] || 'there'
  const greeting = getGreeting()
  const plan = PLANS.find(p => p.id === planTier) ?? PLANS[0]

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-10 max-w-3xl mx-auto w-full">

      {/* Logo + Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="text-center mb-10"
      >
        <div className="flex items-center justify-center mb-5">
          <img
            src="/logo.png"
            alt="TooliAi"
            className="w-14 h-14 rounded-2xl object-cover shadow-md hover:scale-105 transition-transform duration-200"
          />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          {greeting},{' '}
          <span className="gradient-text">{name}</span>
        </h1>
        <p className="text-muted-foreground text-base">
          What would you like to create today?
        </p>
      </motion.div>

      {/* Usage stats for free tier */}
      {planTier === 'free' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="w-full mb-6"
        >
          <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap size={12} className="text-primary" />
              <span>{messageCount}/{plan.limits.messagesPerDay} messages today</span>
            </div>
            <div className="h-3.5 w-px bg-border" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Image size={12} className="text-pink-500" />
              <span>{imageCount}/{plan.limits.imagesPerDay} images today</span>
            </div>
            <button
              onClick={onUpgrade}
              className="ml-auto flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Crown size={11} />
              Upgrade
              <ArrowRight size={11} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Suggestion cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="grid grid-cols-2 gap-2.5 w-full mb-8"
      >
        {SUGGESTIONS.map(({ icon, title, desc, mode: suggMode, prompt, gradient, border, hover }) => (
          <motion.button
            key={title}
            whileHover={{ scale: 1.015, y: -1 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => { onModeChange(suggMode); onSend(prompt) }}
            className={`flex items-start gap-3 p-4 rounded-2xl border bg-gradient-to-br text-left transition-all duration-200 ${gradient} ${border} ${hover}`}
          >
            <div className="mt-0.5 shrink-0">{icon}</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-foreground mb-0.5">{title}</div>
              <div className="text-xs text-muted-foreground leading-snug">{desc}</div>
            </div>
            <ArrowRight size={13} className="shrink-0 text-muted-foreground mt-0.5 opacity-40" />
          </motion.button>
        ))}
      </motion.div>

      {/* Input bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.18 }}
        className="w-full"
      >
        <InputBar
          mode={mode}
          chatModel={chatModel ?? DEFAULT_CHAT_MODEL}
          imageModel={imageModel ?? DEFAULT_IMAGE_MODEL}
          isLoading={isLoading}
          onSend={onSend}
          onModeChange={onModeChange}
          onChatModelChange={onChatModelChange}
          onImageModelChange={onImageModelChange}
        />
        {!user ? (
          <p className="text-center text-[12px] text-muted-foreground mt-3">
            <span className="text-primary cursor-pointer hover:underline font-medium" onClick={() => onSend('')}>
              Sign in
            </span>
            {' '}to start chatting with TooliAi · GPT-4.1 · Gemini · Groq
          </p>
        ) : (
          <p className="text-center text-[11px] text-muted-foreground/60 mt-3">
            TooliAi · GPT-4.1 · Gemini · Groq · Cloudflare AI
          </p>
        )}
      </motion.div>
    </div>
  )
}
