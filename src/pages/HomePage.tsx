import { motion } from 'framer-motion'
import { Globe, Image, FileSearch, MessageSquare, ArrowRight, Crown, Zap, Sparkles, Bot } from 'lucide-react'
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

const FEATURE_CARDS = [
  {
    category: 'SEARCH',
    categoryColor: 'text-emerald-600',
    icon: <Globe size={22} className="text-emerald-600" />,
    iconBg: 'bg-emerald-50',
    title: 'Search the web',
    desc: 'Real-time answers with live sources',
    mode: 'search' as Mode,
    prompt: 'What are the latest AI breakthroughs in 2025?',
    border: 'hover:border-emerald-200',
  },
  {
    category: 'CREATIVITY',
    categoryColor: 'text-pink-600',
    icon: <Image size={22} className="text-pink-600" />,
    iconBg: 'bg-pink-50',
    title: 'Generate images',
    desc: 'Create stunning visuals with AI art models',
    mode: 'image' as Mode,
    prompt: 'A cinematic photo of a neon-lit Tokyo street at night, raining',
    border: 'hover:border-pink-200',
  },
  {
    category: 'ANALYSIS',
    categoryColor: 'text-amber-600',
    icon: <FileSearch size={22} className="text-amber-600" />,
    iconBg: 'bg-amber-50',
    title: 'Analyze documents',
    desc: 'Upload files and extract key insights',
    mode: 'analyze' as Mode,
    prompt: 'Summarize and extract the key points from this document',
    border: 'hover:border-amber-200',
  },
  {
    category: 'PRODUCTIVITY',
    categoryColor: 'text-indigo-600',
    icon: <MessageSquare size={22} className="text-indigo-600" />,
    iconBg: 'bg-indigo-50',
    title: 'Write & code',
    desc: 'Draft emails, essays, and generate code',
    mode: 'chat' as Mode,
    prompt: 'Write a compelling LinkedIn post about the importance of continuous learning in tech',
    border: 'hover:border-indigo-200',
  },
]

export function HomePage({
  user, mode, chatModel, imageModel, planTier,
  messageCount, imageCount, isLoading,
  onSend, onModeChange, onChatModelChange, onImageModelChange, onUpgrade
}: HomePageProps) {
  const name = user?.displayName || user?.email?.split('@')[0] || null
  const plan = PLANS.find(p => p.id === planTier) ?? PLANS[0]

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-10 max-w-2xl mx-auto w-full">

      {/* Bot Avatar + Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-8"
      >
        {/* Teal bot avatar */}
        <div className="flex items-center justify-center mb-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #0D9488, #0891B2)',
              boxShadow: '0 0 0 6px rgba(13,148,136,0.08), 0 4px 20px rgba(13,148,136,0.25)',
            }}
          >
            <Bot size={30} className="text-white" />
          </div>
        </div>

        <h1 className="text-[32px] font-bold tracking-tight text-gray-900 mb-2 leading-tight">
          {name ? (
            <>Hey, I'm <span style={{ background: 'linear-gradient(135deg, #4F46E5, #0D9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>TooliAi</span>.</>
          ) : (
            <>Hey, I'm <span style={{ background: 'linear-gradient(135deg, #4F46E5, #0D9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>TooliAi</span>.</>
          )}
        </h1>
        <p className="text-[15px] text-gray-500 leading-relaxed">
          {name ? `Welcome back, ${name}. ` : ''}
          I'm your AI assistant. Ask me anything.
        </p>
      </motion.div>

      {/* Usage stats for free tier */}
      {planTier === 'free' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="w-full mb-5"
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Zap size={12} className="text-indigo-500" />
              <span>{messageCount}/{plan.limits.messagesPerDay} messages</span>
            </div>
            <div className="h-3 w-px bg-gray-200" />
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Image size={12} className="text-pink-500" />
              <span>{imageCount}/{plan.limits.imagesPerDay} images</span>
            </div>
            <button
              onClick={onUpgrade}
              className="ml-auto flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <Crown size={11} />
              Upgrade
              <ArrowRight size={10} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Feature cards 2×2 grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 gap-3 w-full mb-7"
      >
        {FEATURE_CARDS.map(({ category, categoryColor, icon, iconBg, title, desc, mode: cardMode, prompt, border }, i) => (
          <motion.button
            key={title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 + i * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { onModeChange(cardMode); onSend(prompt) }}
            className={`flex flex-col items-start gap-2.5 p-4 rounded-2xl text-left border transition-all duration-200 ${border}`}
            style={{
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.07)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              minHeight: '130px',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'
            }}
          >
            {/* Category label */}
            <span className={`text-[9px] font-bold tracking-[0.12em] uppercase ${categoryColor} opacity-70`}>
              {category}
            </span>

            {/* Icon */}
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
              {icon}
            </div>

            {/* Text */}
            <div>
              <div className="font-semibold text-[13px] text-gray-900 mb-0.5 leading-tight">{title}</div>
              <div className="text-[11px] text-gray-400 leading-snug">{desc}</div>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Input bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.22 }}
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
          <p className="text-center text-[11px] text-gray-400 mt-3">
            <span
              className="text-indigo-600 cursor-pointer hover:underline font-medium"
              onClick={() => onSend('')}
            >
              Sign in
            </span>
            {' '}to save your chats · GPT-4.1 · Gemini · Groq
          </p>
        ) : (
          <p className="text-center text-[10px] text-gray-300 mt-3">
            TooliAi · GPT-4.1 · Gemini · Groq · Cloudflare AI
          </p>
        )}
      </motion.div>
    </div>
  )
}
