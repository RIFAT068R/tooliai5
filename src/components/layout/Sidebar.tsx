import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Image, FileSearch, Plus, Trash2,
  Globe, ChevronLeft, ChevronRight, LogOut, LogIn,
  Crown, Zap, Sparkles
} from 'lucide-react'
import type { Conversation, Mode, PlanTier } from '../../types'
import { cn } from '../../lib/utils'

interface SidebarProps {
  conversations: Conversation[]
  activeConvId: string | null
  activeMode: Mode
  user: { id: string; email: string; displayName?: string } | null
  planTier: PlanTier
  onNewChat: () => void
  onSelectConv: (id: string) => void
  onDeleteConv: (id: string) => void
  onSelectMode: (mode: Mode) => void
  onLogin: () => void
  onLogout: () => void
  onUpgrade: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

const TOOLS: { mode: Mode; label: string; icon: React.ReactNode; color: string }[] = [
  { mode: 'chat', label: 'AI Chat', icon: <MessageSquare size={15} />, color: 'text-indigo-500' },
  { mode: 'search', label: 'Web Search', icon: <Globe size={15} />, color: 'text-emerald-500' },
  { mode: 'image', label: 'Image Gen', icon: <Image size={15} />, color: 'text-pink-500' },
  { mode: 'analyze', label: 'Analyze Files', icon: <FileSearch size={15} />, color: 'text-amber-500' },
]

const PLAN_BADGE: Record<PlanTier, { label: string; icon: React.ReactNode; cls: string }> = {
  free: { label: 'Free', icon: <Zap size={10} />, cls: 'bg-gray-100 text-gray-500' },
  pro: { label: 'Pro', icon: <Crown size={10} />, cls: 'bg-indigo-50 text-indigo-600' },
  max: { label: 'Max', icon: <Crown size={10} />, cls: 'bg-amber-50 text-amber-600' },
}

const CONV_MODE_ICONS: Record<Mode, React.ReactNode> = {
  chat: <MessageSquare size={12} />,
  search: <Globe size={12} />,
  image: <Image size={12} />,
  analyze: <FileSearch size={12} />,
}

export function Sidebar({
  conversations, activeConvId, activeMode, user, planTier,
  onNewChat, onSelectConv, onDeleteConv, onSelectMode,
  onLogin, onLogout, onUpgrade, collapsed, onToggleCollapse,
}: SidebarProps) {
  const [hoveredConvId, setHoveredConvId] = useState<string | null>(null)
  const plan = PLAN_BADGE[planTier]

  const userInitial = (user?.displayName || user?.email || 'U')[0].toUpperCase()

  return (
    <motion.div
      animate={{ width: collapsed ? 60 : 240 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="relative h-screen flex flex-col overflow-hidden shrink-0"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRight: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center h-14 px-3 shrink-0',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm shrink-0">
                <Sparkles size={13} className="text-white" />
              </div>
              <span className="font-semibold text-[14px] text-gray-900 tracking-tight">TooliAi</span>
            </motion.div>
          )}
        </AnimatePresence>

        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm">
            <Sparkles size={13} className="text-white" />
          </div>
        )}

        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            className="w-6 h-6 rounded-md flex items-center justify-center transition-all duration-150"
            style={{ color: 'rgba(0,0,0,0.3)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.04)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(0,0,0,0.6)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(0,0,0,0.3)'
            }}
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={onToggleCollapse}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-4 h-8 bg-white rounded-full flex items-center justify-center transition-colors shadow-sm"
          style={{ border: '1px solid rgba(0,0,0,0.08)' }}
        >
          <ChevronRight size={10} style={{ color: 'rgba(0,0,0,0.4)' }} />
        </button>
      )}

      {/* New Chat */}
      <div className={cn('px-2.5 pb-2 shrink-0')}>
        <button
          onClick={onNewChat}
          title={collapsed ? 'New Chat' : undefined}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150',
            'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm',
            collapsed ? 'justify-center px-0' : ''
          )}
          style={{ boxShadow: '0 1px 6px rgba(99,102,241,0.25)' }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.92'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
        >
          <Plus size={14} />
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Tools / Modes */}
      <div className={cn('shrink-0', collapsed ? 'px-1.5' : 'px-2.5')}>
        {!collapsed && (
          <p
            className="text-[10px] font-semibold tracking-[0.08em] uppercase px-2 mb-1"
            style={{ color: 'rgba(0,0,0,0.3)' }}
          >
            Modes
          </p>
        )}
        <div className="space-y-0.5">
          {TOOLS.map(({ mode, label, icon, color }) => (
            <button
              key={mode}
              onClick={() => onSelectMode(mode)}
              title={collapsed ? label : undefined}
              className={cn(
                'relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] transition-all duration-150 text-left',
                activeMode === mode
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'hover:bg-black/[0.04]',
                collapsed ? 'justify-center' : ''
              )}
              style={activeMode !== mode ? { color: 'rgba(0,0,0,0.5)' } : undefined}
            >
              {activeMode === mode && !collapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-indigo-500 rounded-r" />
              )}
              <span className={activeMode === mode ? 'text-indigo-500' : color}>{icon}</span>
              {!collapsed && <span>{label}</span>}
            </button>
          ))}
        </div>
      </div>

      <div
        className={cn('my-2 shrink-0', collapsed ? 'mx-2' : 'mx-3')}
        style={{ height: '1px', background: 'rgba(0,0,0,0.05)' }}
      />

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2 custom-scrollbar">
        {!collapsed && conversations.length > 0 && (
          <p
            className="text-[10px] font-semibold tracking-[0.08em] uppercase px-2 mb-1"
            style={{ color: 'rgba(0,0,0,0.3)' }}
          >
            Recent
          </p>
        )}
        <div className="space-y-0.5">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onMouseEnter={() => setHoveredConvId(conv.id)}
              onMouseLeave={() => setHoveredConvId(null)}
              onClick={() => onSelectConv(conv.id)}
              title={collapsed ? conv.title : undefined}
              className={cn(
                'group relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all duration-150',
                activeConvId === conv.id
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'hover:bg-black/[0.04]',
                collapsed ? 'justify-center' : ''
              )}
              style={activeConvId !== conv.id ? { color: 'rgba(0,0,0,0.45)' } : undefined}
            >
              <span className="shrink-0 opacity-60">{CONV_MODE_ICONS[conv.mode as Mode] ?? <MessageSquare size={12} />}</span>
              {!collapsed && (
                <>
                  <span className="text-[12px] truncate flex-1 leading-relaxed">{conv.title}</span>
                  <AnimatePresence>
                    {hoveredConvId === conv.id && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.1 }}
                        onClick={(e) => { e.stopPropagation(); onDeleteConv(conv.id) }}
                        className="shrink-0 w-5 h-5 flex items-center justify-center rounded-md transition-colors"
                        style={{ color: 'rgba(0,0,0,0.25)' }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'
                          ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(239,68,68,0.7)'
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                          ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(0,0,0,0.25)'
                        }}
                      >
                        <Trash2 size={11} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade (free tier) */}
      {!collapsed && planTier === 'free' && (
        <div className="px-2.5 pb-2 shrink-0">
          <button
            onClick={onUpgrade}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-white text-[12px] font-semibold transition-all shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              boxShadow: '0 1px 6px rgba(245,158,11,0.25)',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
          >
            <Crown size={12} />
            Upgrade to Pro
            <span className="ml-auto">→</span>
          </button>
        </div>
      )}

      {/* User section */}
      <div
        className={cn('shrink-0 p-2')}
        style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}
      >
        {user ? (
          <div className={cn('flex items-center gap-2 px-2 py-1.5 rounded-xl', collapsed ? 'justify-center' : '')}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center shrink-0 text-[11px] font-semibold text-white shadow-sm">
              {userInitial}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-gray-800 truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </div>
                <div className={cn('inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5', plan.cls)}>
                  {plan.icon} {plan.label}
                </div>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg transition-colors"
                title="Sign out"
                style={{ color: 'rgba(0,0,0,0.25)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.04)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(0,0,0,0.6)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(0,0,0,0.25)'
                }}
              >
                <LogOut size={13} />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onLogin}
            title={collapsed ? 'Sign in' : undefined}
            className={cn(
              'w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-150',
              'hover:bg-black/[0.04]',
              collapsed ? 'justify-center' : ''
            )}
            style={{ color: 'rgba(0,0,0,0.4)' }}
          >
            <LogIn size={14} />
            {!collapsed && 'Sign in'}
          </button>
        )}
      </div>
    </motion.div>
  )
}
