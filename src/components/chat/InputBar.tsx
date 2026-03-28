import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Paperclip, Mic, MicOff, Loader2, Image, Globe,
  MessageSquare, FileSearch, ChevronDown, Zap, X, Square,
  Grid3X3, Plus
} from 'lucide-react'
import type { Mode, ChatModel, ImageModel } from '../../types'
import { CHAT_MODELS, IMAGE_MODELS, PROVIDER_COLORS } from '../../lib/models'
import { cn } from '../../lib/utils'

interface InputBarProps {
  mode: Mode
  chatModel: ChatModel
  imageModel: ImageModel
  isLoading: boolean
  isRecording?: boolean
  isProcessing?: boolean
  placeholder?: string
  onSend: (text: string, file?: File) => void
  onStop?: () => void
  onModeChange: (mode: Mode) => void
  onChatModelChange: (model: ChatModel) => void
  onImageModelChange: (model: ImageModel) => void
  onVoiceStart?: () => void
  onVoiceStop?: () => Promise<void>
  onVoiceCancel?: () => void
}

const MODE_CONFIG: Record<Mode, { icon: React.ReactNode; label: string; placeholder: string; color: string; bg: string }> = {
  chat: { icon: <MessageSquare size={12} />, label: 'Chat', placeholder: 'Ask me anything…', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  search: { icon: <Globe size={12} />, label: 'Web Search', placeholder: 'Search the web…', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  image: { icon: <Image size={12} />, label: 'Image Gen', placeholder: 'Describe an image to create…', color: 'text-pink-600', bg: 'bg-pink-50' },
  analyze: { icon: <FileSearch size={12} />, label: 'Analyze', placeholder: 'Attach a file and ask anything…', color: 'text-amber-600', bg: 'bg-amber-50' },
}

export function InputBar({
  mode, chatModel, imageModel,
  isLoading, isRecording, isProcessing,
  onSend, onStop, onModeChange, onChatModelChange, onImageModelChange,
  onVoiceStart, onVoiceStop,
}: InputBarProps) {
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [showModeMenu, setShowModeMenu] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isImageMode = mode === 'image'
  const currentMode = MODE_CONFIG[mode]

  const activeModel = isImageMode
    ? IMAGE_MODELS.find(m => m.value === imageModel)
    : CHAT_MODELS.find(m => m.value === chatModel)

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if ((!trimmed && !file) || isLoading) return
    onSend(trimmed, file ?? undefined)
    setText('')
    setFile(null)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [text, file, isLoading, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 180) + 'px'
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const handleVoiceClick = async () => {
    if (isRecording) {
      await onVoiceStop?.()
    } else {
      onVoiceStart?.()
    }
  }

  const canSend = !!(text.trim() || file)

  return (
    <div className="relative">
      {/* File preview */}
      <AnimatePresence>
        {file && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="mb-2 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs"
          >
            <Paperclip size={12} className="text-gray-400 shrink-0" />
            <span className="truncate flex-1 text-gray-700">{file.name}</span>
            <span className="text-gray-400 shrink-0">{(file.size / 1024).toFixed(0)}KB</span>
            <button
              onClick={() => setFile(null)}
              className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input card */}
      <div
        className="relative rounded-2xl transition-all duration-200"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.09)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        }}
        onFocus={() => {
          const el = document.activeElement?.closest('.relative') as HTMLElement
          if (el) el.style.boxShadow = '0 2px 16px rgba(79,70,229,0.12)'
        }}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={currentMode.placeholder}
          rows={1}
          disabled={isLoading && !onStop}
          className="w-full px-4 pt-4 pb-2 text-sm bg-transparent resize-none focus:outline-none text-gray-800 leading-relaxed min-h-[52px]"
          style={{
            maxHeight: '180px',
            fontSize: '14px',
            color: '#111827',
          }}
        />
        <style>{`textarea::placeholder { color: rgba(0,0,0,0.35); font-size: 14px; }`}</style>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-3 pb-3 pt-1 gap-2">

          {/* Left tools */}
          <div className="flex items-center gap-1.5">
            {/* Attach file button */}
            {(mode === 'analyze' || mode === 'chat') && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.txt,.md,.csv,.json,.docx"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150"
                  style={{ background: 'rgba(0,0,0,0.05)', color: 'rgba(0,0,0,0.45)' }}
                  title="Attach file"
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.09)'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.05)'}
                >
                  <Plus size={13} />
                </button>
              </>
            )}

            {/* Mode picker */}
            <div className="relative">
              <button
                onClick={() => { setShowModeMenu(v => !v); setShowModelMenu(false) }}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-150',
                  currentMode.bg, currentMode.color
                )}
              >
                {currentMode.icon}
                <span>{currentMode.label}</span>
                <ChevronDown size={9} className="opacity-60" />
              </button>
              <AnimatePresence>
                {showModeMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowModeMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute bottom-full left-0 mb-2 w-44 bg-white border border-gray-100 rounded-2xl shadow-lg z-20 overflow-hidden py-1"
                    >
                      {Object.entries(MODE_CONFIG).map(([key, cfg]) => (
                        <button
                          key={key}
                          onClick={() => { onModeChange(key as Mode); setShowModeMenu(false) }}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs transition-colors text-left',
                            mode === key ? `${cfg.bg} ${cfg.color} font-semibold` : 'hover:bg-gray-50 text-gray-600'
                          )}
                        >
                          <span className={mode === key ? cfg.color : 'text-gray-400'}>{cfg.icon}</span>
                          {cfg.label}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Model picker */}
            <div className="relative">
              <button
                onClick={() => { setShowModelMenu(v => !v); setShowModeMenu(false) }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 hover:bg-gray-150 transition-colors"
                style={{ background: 'rgba(0,0,0,0.05)' }}
              >
                <Zap size={10} className="text-indigo-500" />
                <span className="max-w-[90px] truncate">{activeModel?.label ?? 'Model'}</span>
                <ChevronDown size={9} className="opacity-50" />
              </button>
              <AnimatePresence>
                {showModelMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowModelMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute bottom-full left-0 mb-2 w-60 bg-white border border-gray-100 rounded-2xl shadow-lg z-20 overflow-hidden"
                    >
                      <div className="px-3.5 pt-3 pb-1.5">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                          {isImageMode ? 'Image Models' : 'Chat Models'}
                        </p>
                      </div>
                      <div className="px-2 pb-2 max-h-60 overflow-y-auto space-y-0.5">
                        {(isImageMode ? IMAGE_MODELS : CHAT_MODELS).map((m) => {
                          const isActive = isImageMode ? imageModel === m.value : chatModel === m.value
                          return (
                            <button
                              key={m.value}
                              onClick={() => {
                                if (isImageMode) onImageModelChange(m.value as ImageModel)
                                else onChatModelChange(m.value as ChatModel)
                                setShowModelMenu(false)
                              }}
                              className={cn(
                                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors text-left',
                                isActive ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-600'
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate">{m.label}</div>
                                <div className="text-[10px] text-gray-400">{m.desc}</div>
                              </div>
                              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0', PROVIDER_COLORS[m.provider])}>
                                {m.badge}
                              </span>
                              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />}
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Voice input */}
            {onVoiceStart && (
              <button
                onClick={handleVoiceClick}
                disabled={isProcessing}
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center transition-colors',
                  isRecording
                    ? 'text-red-500 bg-red-50 hover:bg-red-100'
                    : 'text-gray-400 hover:text-gray-600',
                  isProcessing && 'opacity-60 cursor-not-allowed'
                )}
                style={{ background: isRecording ? undefined : 'rgba(0,0,0,0.05)' }}
                title={isRecording ? 'Stop recording' : 'Voice input'}
              >
                {isProcessing ? <Loader2 size={13} className="animate-spin" /> :
                  isRecording ? <MicOff size={13} /> : <Mic size={13} />}
              </button>
            )}
          </div>

          {/* Send / Stop button — circular */}
          <button
            onClick={isLoading && onStop ? onStop : handleSend}
            disabled={isLoading && !onStop ? true : !isLoading && !canSend}
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shrink-0',
              (isLoading && onStop) || canSend
                ? 'text-white scale-100 hover:scale-105 active:scale-95'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            )}
            style={
              (isLoading && onStop) || canSend
                ? { background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', boxShadow: '0 2px 8px rgba(79,70,229,0.35)' }
                : undefined
            }
          >
            {isLoading ? (
              onStop ? <Square size={13} fill="currentColor" /> : <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
