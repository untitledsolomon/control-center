'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ListChecks, Target, FolderOpen,
  Clock, BookOpen, Inbox, Activity, ChevronRight,
  Bot, X, Menu
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from './ui'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/queue', label: 'Mission Queue', icon: ListChecks },
  { href: '/directives', label: 'Directives', icon: Target },
  { href: '/resources', label: 'Resource Hub', icon: FolderOpen },
  { href: '/schedules', label: 'Schedules', icon: Clock },
  { href: '/playbooks', label: 'Protocols', icon: BookOpen },
  { href: '/review', label: 'Review Inbox', icon: Inbox },
  { href: '/status', label: 'Status', icon: Activity },
]

function SidebarItem({ item, expanded = false, isActive, onClick }: {
  item: typeof navItems[0]
  expanded?: boolean
  isActive: boolean
  onClick?: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group outline-none focus-visible:ring-2 focus-visible:ring-accent',
        isActive ? 'bg-accent-light text-accent' : 'text-muted hover:text-foreground hover:bg-surface'
      )}
    >
      <Icon size={20} className="shrink-0" />
      <span className={cn('text-[13px] font-medium whitespace-nowrap transition-opacity duration-200', expanded ? 'opacity-100' : 'opacity-0')}>
        {item.label}
      </span>
    </Link>
  )
}

function SidebarIcon({ item, isActive }: {
  item: typeof navItems[0]
  isActive: boolean
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      title={item.label}
      className={cn(
        'flex items-center justify-center w-full px-3 py-2.5 rounded-lg transition-all duration-150 group outline-none focus-visible:ring-2 focus-visible:ring-accent',
        isActive ? 'bg-accent-light text-accent' : 'text-muted hover:text-foreground hover:bg-surface'
      )}
    >
      <Icon size={20} className="shrink-0" />
    </Link>
  )
}

export function Sidebar({ mobileOpen, onMobileClose }: {
  mobileOpen: boolean
  onMobileClose: () => void
}) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const isActive = (href: string) => pathname === href

  return (
    <>
      {/* Desktop expandable sidebar */}
      <aside
        className="fixed left-0 top-0 h-screen bg-base border-r border-border z-40 flex-col sidebar-expand hidden lg:flex"
        style={{ width: expanded ? 220 : 64 }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <div className="flex items-center h-16 px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Logo />
            <span className={cn('text-[16px] font-semibold text-foreground whitespace-nowrap transition-opacity duration-200', expanded ? 'opacity-100' : 'opacity-0')}>
              DAWN Control
            </span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <SidebarItem key={item.href} item={item} expanded={expanded} isActive={isActive(item.href)} />
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-border">
          <div className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted', expanded ? '' : 'justify-center')}>
            <ChevronRight size={16} className={cn('transition-transform duration-200', expanded ? 'rotate-180' : '')} />
            {expanded && <span className="text-[11px] font-medium tracking-wide whitespace-nowrap">v0.1 · Connected</span>}
          </div>
        </div>
      </aside>

      {/* Desktop compact sidebar (md) */}
      <aside className="fixed left-0 top-0 h-screen w-16 bg-base border-r border-border z-40 flex-col hidden md:flex lg:hidden">
        <div className="flex items-center justify-center h-16 border-b border-border shrink-0">
          <Logo />
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(item => (
            <SidebarIcon key={item.href} item={item} isActive={isActive(item.href)} />
          ))}
        </nav>
        <div className="flex items-center justify-center px-2 py-4 border-t border-border">
          <ChevronRight size={16} className="text-muted" />
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="fixed left-0 top-0 h-screen w-[280px] bg-base border-r border-border z-50 flex-col animate-slide-in-left">
            <div className="flex items-center justify-between h-16 px-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <Logo />
                <span className="text-[16px] font-semibold text-foreground">DAWN Control</span>
              </div>
              <button
                onClick={onMobileClose}
                className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-surface-raised text-muted hover:text-foreground transition-all duration-150 focus-visible:ring-2 focus-visible:ring-accent outline-none"
                aria-label="Close sidebar"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map(item => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onMobileClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent',
                      active ? 'bg-accent-light text-accent' : 'text-muted hover:text-foreground hover:bg-surface'
                    )}
                  >
                    <Icon size={20} className="shrink-0" />
                    <span className="text-[14px] font-medium">{item.label}</span>
                    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />}
                  </Link>
                )
              })}
            </nav>
            <div className="px-3 py-4 border-t border-border">
              <span className="text-[11px] font-medium tracking-wide text-muted px-3">v0.1 · Connected</span>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
