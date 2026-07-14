'use client'
import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { NotificationsPanel } from '@/components/notifications'
import { QuickActionBar } from '@/components/quick-action'
import { useAppState } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Bot, Plus, Bell, ChevronDown, Menu, X } from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/queue': 'Mission Queue',
  '/directives': 'Directives',
  '/resources': 'Resource Hub',
  '/schedules': 'Schedules',
  '/playbooks': 'Protocols',
  '/review': 'Review Inbox',
  '/status': 'Status',
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { state } = useAppState()
  const [notifOpen, setNotifOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const title = pageTitles[pathname] || 'Mission Control'
  const notifCount = state.notifications.length

  useEffect(() => {
    document.title = title + ' — DAWN Control'
  }, [title])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <header className="md:ml-16 h-16 bg-base border-b border-border flex items-center justify-between px-4 md:px-8 z-30">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-11 h-11 flex md:hidden items-center justify-center rounded-lg hover:bg-surface-raised text-muted hover:text-foreground transition-all duration-150 focus-visible:ring-2 focus-visible:ring-accent outline-none"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
          <Bot size={20} className="text-accent hidden md:block" />
          <h1 className="text-[16px] font-semibold text-foreground">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuickOpen(!quickOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-raised text-muted hover:text-foreground transition-all duration-150 focus-visible:ring-2 focus-visible:ring-accent outline-none"
            aria-label="Quick Action"
            title="Quick Action"
          >
            {quickOpen ? <X size={18} /> : <Plus size={18} />}
          </button>

          {pathname === '/schedules' && (
            <button
              onClick={() => router.push('/schedules?add=true')}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-accent text-white hover:bg-accent/90 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-accent outline-none"
              aria-label="Add Schedule"
              title="Add Schedule"
            >
              <Plus size={18} />
            </button>
          )}

          <button
            onClick={() => setNotifOpen(true)}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-raised text-muted hover:text-foreground transition-all duration-150 focus-visible:ring-2 focus-visible:ring-accent outline-none"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-error text-white text-[10px] font-bold px-1">
                {notifCount > 99 ? '99+' : notifCount}
              </span>
            )}
          </button>

          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-border">
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-[11px] font-semibold">
              S
            </div>
            <span className="text-[13px] font-medium text-foreground">Solomon</span>
            <ChevronDown size={14} className="text-muted" />
          </div>
        </div>
      </header>

      <main className="md:ml-16 min-h-[calc(100vh-64px)]">
        {children}
      </main>

      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      <QuickActionBar open={quickOpen} onToggle={setQuickOpen} />
    </>
  )
}
