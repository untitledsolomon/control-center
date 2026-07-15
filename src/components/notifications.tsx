'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { cn, formatRelativeTime } from '@/lib/utils'
import { useAppState } from '@/lib/store'
import { X, Bell, AlertTriangle, MessageCircle, RefreshCw, CheckCircle } from 'lucide-react'

const iconMap: Record<string, React.ReactNode> = {
  AlertTriangle: <AlertTriangle size={16} />,
  MessageCircle: <MessageCircle size={16} />,
  RefreshCw: <RefreshCw size={16} />,
  CheckCircle: <CheckCircle size={16} />,
}

const borderMap: Record<string, string> = {
  attention: 'border-l-error',
  update: 'border-l-accent',
  completed: 'border-l-success',
}

const iconColorMap: Record<string, string> = {
  attention: 'text-error',
  update: 'text-accent',
  completed: 'text-success',
}

export function NotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const { state, dismissNotification, markAllNotificationsRead } = useAppState()
  const { notifications } = state
  const count = notifications.length
  const attention = notifications.filter(n => n.type === 'attention')
  const updates = notifications.filter(n => n.type === 'update')
  const completed = notifications.filter(n => n.type === 'completed')

  const handleClick = (notif: any) => {
    router.push(notif.screen)
    onClose()
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/20 z-50 md:hidden" onClick={onClose} />}
      <div className={cn(
        'fixed top-0 right-0 h-full bg-base border-l border-border z-50 flex flex-col transition-transform duration-300 ease-out',
        'w-full md:w-[320px]',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-foreground" />
            <h2 className="text-[15px] font-semibold text-foreground">Notifications</h2>
            {count > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-error text-white text-[10px] font-bold">
                {count}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {count > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-[11px] text-accent font-medium hover:underline focus-visible:ring-2 focus-visible:ring-accent outline-none rounded px-1"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-raised text-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent outline-none"
              aria-label="Close notifications"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-8">
              <Bell size={32} className="text-border mb-3" />
              <p className="text-[14px] text-foreground font-medium">All clear</p>
              <p className="text-[12px] text-muted mt-1">No notifications to show</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {attention.length > 0 && (
                <div className="px-5 py-3">
                  <h3 className="text-[11px] font-semibold tracking-wide text-error mb-2">ATTENTION REQUIRED</h3>
                  <div className="space-y-1.5">
                    {attention.map(n => (
                      <NotificationItem key={n.id} notification={n} onDismiss={dismissNotification} onClick={handleClick} />
                    ))}
                  </div>
                </div>
              )}
              {updates.length > 0 && (
                <div className="px-5 py-3">
                  <h3 className="text-[11px] font-semibold tracking-wide text-accent mb-2">UPDATES</h3>
                  <div className="space-y-1.5">
                    {updates.map(n => (
                      <NotificationItem key={n.id} notification={n} onDismiss={dismissNotification} onClick={handleClick} />
                    ))}
                  </div>
                </div>
              )}
              {completed.length > 0 && (
                <div className="px-5 py-3">
                  <h3 className="text-[11px] font-semibold tracking-wide text-success mb-2">COMPLETED</h3>
                  <div className="space-y-1.5">
                    {completed.map(n => (
                      <NotificationItem key={n.id} notification={n} onDismiss={dismissNotification} onClick={handleClick} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function NotificationItem({ notification, onDismiss, onClick }: {
  notification: any
  onDismiss: (id: string) => void
  onClick: (n: any) => void
}) {
  return (
    <div
      onClick={() => onClick(notification)}
      className={cn('flex items-start gap-3 px-3 py-2.5 rounded-lg border-l-[3px] cursor-pointer hover:bg-surface transition-colors', borderMap[notification.type])}
    >
      <div className={cn('mt-0.5', iconColorMap[notification.type])}>
        {iconMap[notification.icon] || <AlertTriangle size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-foreground">{notification.title}</p>
        <p className="text-[11px] text-muted mt-0.5 line-clamp-2">{notification.description}</p>
        <span className="text-[10px] text-muted mt-1 block">{formatRelativeTime(notification.timestamp)}</span>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(notification.id) }}
        className="p-1 rounded hover:bg-surface-raised text-muted hover:text-foreground shrink-0"
      >
        <X size={12} />
      </button>
    </div>
  )
}
