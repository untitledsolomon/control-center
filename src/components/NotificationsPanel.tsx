'use client'

import React from 'react'
import { useApp } from '@/store/AppContext'
import { X, AlertTriangle, CheckCircle, Info, AlertCircle, ExternalLink } from 'lucide-react'
import type { Notification } from '@/lib/types'

const iconMap: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  attention: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  completed: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  update: { icon: Info, color: 'text-dawn-400', bg: 'bg-dawn-500/10' },
  error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
}

export function NotificationsPanel() {
  const { state, toggleNotifications, markRead } = useApp()
  const { notificationsOpen, notifications } = state

  const attention = notifications.filter((n: Notification) => n.type === 'attention' && !n.read)
  const updates = notifications.filter((n: Notification) => (n.type === 'update' || n.type === 'completed') && !n.read)
  const history = notifications.filter((n: Notification) => n.read)

  return (
    <>
      {/* Overlay */}
      {notificationsOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:bg-transparent lg:pointer-events-none"
          onClick={toggleNotifications}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed lg:relative inset-y-0 right-0 w-full sm:w-96 bg-[#0d1117] border-l border-[#30363d] z-50 transform transition-transform duration-300 ease-in-out ${
          notificationsOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#30363d]">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[#e6edf3]">Notifications</h2>
            {attention.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-500/20 text-red-400 rounded-full">
                {attention.length}
              </span>
            )}
          </div>
          <button
            onClick={toggleNotifications}
            className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-[calc(100vh-4rem)] overflow-y-auto">
          {/* Needs Attention */}
          {attention.length > 0 && (
            <div className="px-4 py-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 mb-2">
                Needs Attention
              </h3>
              <div className="space-y-2">
                {attention.map(n => (
                  <NotificationCard key={n.id} notification={n} onRead={markRead} />
                ))}
              </div>
            </div>
          )}

          {/* Updates */}
          {updates.length > 0 && (
            <div className="px-4 py-3 border-t border-[#30363d]">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#8b949e] mb-2">
                Updates
              </h3>
              <div className="space-y-2">
                {updates.map(n => (
                  <NotificationCard key={n.id} notification={n} onRead={markRead} />
                ))}
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="px-4 py-3 border-t border-[#30363d]">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#6e7681] mb-2">
                History
              </h3>
              <div className="space-y-1">
                {history.slice(0, 5).map(n => (
                  <div
                    key={n.id}
                    className="px-3 py-2 rounded-lg text-xs text-[#6e7681] hover:bg-[#161b22] transition-colors cursor-pointer"
                  >
                    <p className="truncate">{n.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-[#6e7681]">
              <CheckCircle className="w-8 h-8 mb-2" />
              <p className="text-sm">All clear</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function NotificationCard({
  notification,
  onRead,
}: {
  notification: Notification
  onRead: (id: string) => void
}) {
  const meta = iconMap[notification.type] || iconMap.update
  const Icon = meta.icon

  return (
    <div
      className="group relative p-3 rounded-lg bg-[#161b22] border border-[#30363d] hover:border-dawn-500/30 transition-all cursor-pointer"
      onClick={() => onRead(notification.id)}
    >
      <div className="flex gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${meta.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[#e6edf3] truncate">{notification.title}</p>
          <p className="text-[10px] text-[#8b949e] mt-0.5 line-clamp-2">{notification.message}</p>
          {notification.source && (
            <div className="flex items-center gap-1 mt-1.5">
              <ExternalLink className="w-2.5 h-2.5 text-[#6e7681]" />
              <span className="text-[10px] text-[#6e7681]">{notification.source}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
