import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Paperclip, Mic, MicOff, Loader2, Image, Globe,
  MessageSquare, FileSearch, ChevronDown, Zap, X, Square
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

const MODE_CONFIG: Record<Mode, { icon: React.ReactNode; label: string; placeholder: string; color: string }> = {
  chat: { icon: <MessageSquare size={13} />, label: 'Chat', placeholder: 'Message AI Suite…', color: 'text-indigo-500' },
  search: { icon: <Globe size={13} />, label: 'Search', placeholder: 'Search the web…', color: 'text-emerald-500' },
  image: { icon: <Image size={13} />, label: 'Image', placeholder: 'Describe an image to generate…', color: 'text-pink-500' },
  analyze: { icon: <FileSearch size={13} />, label: 'Analyze', placeholder: 'Attach a file and ask anything…', color: 'text-amber-500' },
}

export function InputBar({
  mode, chatModel, imageModel,
  isLoading, isRecording, isProcessing,
  onSend, onStop, onModeChange, onChatModelChange, onImageModelChange,
  onVoiceStart, onVoiceStop, onVoiceCancel,
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
    // Auto-resize
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

  return (
    <div className="relative">
      {/* File preview */}
      <AnimatePresence>
        {file && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="mb-2 flex items-center gap-2 px-3 py-2 bg-muted rounded-xl border border-border text-xs"
          >
            <Paperclip size={12} className="text-muted-foreground shrink-0" />
            <span className="truncate flex-1 text-foreground">{file.name}</span>
            <span className="text-muted-foreground shrink-0">{(file.size / 1024).toFixed(0)}KB</span>
            <button
              onClick={() => setFile(null)}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input container */}
      <div className="relative bg-card border border-border rounded-2xl shadow-sm focus-within:border-primary/50 focus-within:shadow-md transition-all duration-200">

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={currentMode.placeholder}
          rows={1}
          disabled={isLoading && !onStop}
          className="w-full px-4 pt-3.5 pb-1 text-sm bg-transparent resize-none focus:outline-none placeholder:text-muted-foreground/60 leading-relaxed min-h-[48px]"
          style={{ maxHeight: '180px' }}
        />

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1 gap-2">

          {/* Left tools */}
          <div className="flex items-center gap-1">
            {/* Mode picker */}
            <div className="relative">
              <button
                onClick={() => { setShowModeMenu(v => !v); setShowModelMenu(false) }}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                  'bg-muted/50 border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <span className={currentMode.color}>{currentMode.icon}</span>
                <span>{currentMode.label}</span>
                <ChevronDown size={11} className="opacity-50" />
              </button>
              <AnimatePresence>
                {showModeMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowModeMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute bottom-full left-0 mb-2 w-44 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden"
                    >
                      {Object.entries(MODE_CONFIG).map(([key, cfg]) => (
                        <button
                          key={key}
                          onClick={() => { onModeChange(key as Mode); setShowModeMenu(false) }}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors text-left',
                            mode === key ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <span className={cfg.color}>{cfg.icon}</span>
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
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-muted/50 border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Zap size={11} className="text-primary" />
                <span className="max-w-[120px] truncate">{activeModel?.label ?? 'Model'}</span>
                <ChevronDown size={11} className="opacity-50" />
              </button>
              <AnimatePresence>
                {showModelMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowModelMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute bottom-full left-0 mb-2 w-64 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden"
                    >
                      <div className="px-3 pt-3 pb-1.5">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {isImageMode ? 'Image Models' : 'Chat Models'}
                        </p>
                      </div>
                      <div className="px-2 pb-2 max-h-64 overflow-y-auto space-y-0.5">
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
                                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-left',
                                isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate">{m.label}</div>
                                <div className="text-[10px] text-muted-foreground">{m.desc}</div>
                              </div>
                              <span className={cn('text-[9px] font-semibold px-1.5 py-0.5 rounded-md shrink-0', PROVIDER_COLORS[m.provider])}>
                                {m.badge}
                              </span>
                              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* File attach */}
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
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Attach file"
                >
                  <Paperclip size={15} />
                </button>
              </>
            )}

            {/* Voice input */}
            {onVoiceStart && (
              <button
                onClick={handleVoiceClick}
                disabled={isProcessing}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  isRecording
                    ? 'text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                  isProcessing && 'opacity-60 cursor-not-allowed'
                )}
                title={isRecording ? 'Stop recording' : 'Voice input'}
              >
                {isProcessing ? <Loader2 size={15} className="animate-spin" /> :
                  isRecording ? <MicOff size={15} /> : <Mic size={15} />}
              </button>
            )}
          </div>

          {/* Send / Stop button */}
          <button
            onClick={isLoading && onStop ? onStop : handleSend}
            disabled={isLoading && !onStop ? true : !isLoading && !text.trim() && !file}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 shrink-0',
              (isLoading && onStop) || (text.trim() || file)
                ? 'bg-primary text-primary-foreground shadow-sm hover:opacity-90 scale-100'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {isLoading ? (
              onStop ? <Square size={14} fill="currentColor" /> : <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
