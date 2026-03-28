import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Image, FileSearch, Plus, Trash2,
  Globe, ChevronLeft, ChevronRight, LogOut, LogIn,
  Crown, Zap
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
  { mode: 'chat', label: 'AI Chat', icon: <MessageSquare size={16} />, color: 'text-indigo-500' },
  { mode: 'search', label: 'Web Search', icon: <Globe size={16} />, color: 'text-emerald-500' },
  { mode: 'image', label: 'Image Gen', icon: <Image size={16} />, color: 'text-pink-500' },
  { mode: 'analyze', label: 'Analyze Files', icon: <FileSearch size={16} />, color: 'text-amber-500' },
]

const PLAN_BADGE: Record<PlanTier, { label: string; icon: React.ReactNode; cls: string }> = {
  free: { label: 'Free', icon: <Zap size={10} />, cls: 'bg-muted text-muted-foreground' },
  pro: { label: 'Pro', icon: <Crown size={10} />, cls: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' },
  max: { label: 'Max', icon: <Crown size={10} />, cls: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' },
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
      animate={{ width: collapsed ? 64 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative h-screen flex flex-col border-r border-border bg-sidebar overflow-hidden shrink-0"
    >
      {/* Header */}
      <div className={cn(
        'flex items-center border-b border-border shrink-0 px-3',
        collapsed ? 'justify-center py-4' : 'justify-between py-3.5'
      )}>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2.5"
            >
              <img src="/logo.png" alt="TooliAi" className="w-8 h-8 rounded-xl object-cover shrink-0" />
              <span className="font-bold text-sm text-foreground tracking-tight">TooliAi</span>
            </motion.div>
          )}
        </AnimatePresence>

        {collapsed && (
          <img src="/logo.png" alt="TooliAi" className="w-8 h-8 rounded-xl object-cover mx-auto" />
        )}

        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={onToggleCollapse}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-5 h-10 bg-border rounded-full flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
        >
          <ChevronRight size={11} className="text-muted-foreground" />
        </button>
      )}

      {/* New Chat */}
      <div className={cn('px-2 py-2.5 shrink-0', collapsed ? 'px-2' : 'px-3')}>
        <button
          onClick={onNewChat}
          title={collapsed ? 'New Chat' : undefined}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-xl',
            'bg-primary text-primary-foreground text-sm font-medium',
            'hover:opacity-90 transition-all duration-150 shadow-sm',
            collapsed ? 'justify-center px-2' : ''
          )}
        >
          <Plus size={15} />
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Tools */}
      <div className={cn('shrink-0', collapsed ? 'px-2' : 'px-3')}>
        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-1.5">Modes</p>
        )}
        <div className="space-y-0.5">
          {TOOLS.map(({ mode, label, icon, color }) => (
            <button
              key={mode}
              onClick={() => onSelectMode(mode)}
              title={collapsed ? label : undefined}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors text-left',
                activeMode === mode
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed ? 'justify-center' : ''
              )}
            >
              <span className={activeMode === mode ? 'text-primary' : color}>{icon}</span>
              {!collapsed && <span className="text-[13px]">{label}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-3 my-2 border-t border-border/60" />

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto min-h-0 px-1.5">
        {!collapsed && conversations.length > 0 && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-1.5">Recent</p>
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
                'group relative flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors',
                activeConvId === conv.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed ? 'justify-center' : ''
              )}
            >
              <span className="shrink-0 opacity-60">{CONV_MODE_ICONS[conv.mode as Mode] ?? <MessageSquare size={12} />}</span>
              {!collapsed && (
                <>
                  <span className="text-xs truncate flex-1 leading-relaxed">{conv.title}</span>
                  <AnimatePresence>
                    {hoveredConvId === conv.id && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={(e) => { e.stopPropagation(); onDeleteConv(conv.id) }}
                        className="shrink-0 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
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

      {/* Upgrade banner (free tier only) */}
      {!collapsed && planTier === 'free' && (
        <div className="mx-3 mb-2">
          <button
            onClick={onUpgrade}
            className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-medium hover:from-indigo-600 hover:to-violet-600 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Crown size={12} />
            Upgrade to Pro
            <span className="ml-auto opacity-75">→</span>
          </button>
        </div>
      )}

      {/* User section */}
      <div className="border-t border-border shrink-0 p-2">
        {user ? (
          <div className={cn('flex items-center gap-2 px-2 py-1.5 rounded-lg', collapsed ? 'justify-center' : '')}>
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">
              {userInitial}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">
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
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onLogin}
            title={collapsed ? 'Sign in' : undefined}
            className={cn(
              'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium',
              'text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
              collapsed ? 'justify-center' : ''
            )}
          >
            <LogIn size={15} />
            {!collapsed && 'Sign in'}
          </button>
        )}
      </div>
    </motion.div>
  )
}
