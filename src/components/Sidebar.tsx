'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/store/AppContext'
import {
  LayoutDashboard,
  CheckSquare,
  Target,
  Activity,
  BookTemplate,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Terminal,
  Cpu,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/playbooks', label: 'Playbooks', icon: BookTemplate },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { state, toggleSidebar, toggleNotifications } = useApp()
  const { sidebarCollapsed, stats } = state

  return (
    <aside
      className={`flex flex-col border-r border-[#30363d] bg-[#0d1117] transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-[#30363d]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-dawn-500 to-dawn-700 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-[#e6edf3] truncate">DAWN</h1>
              <p className="text-[10px] text-[#8b949e] truncate">Control Center</p>
            </div>
          )}
        </div>
      </div>

      {/* Agent Status */}
      {!sidebarCollapsed && stats && (
        <div className="px-4 py-3 border-b border-[#30363d]">
          <div className="flex items-center gap-2 text-xs">
            <span className={`status-dot ${stats.agent_status}`} />
            <span className="text-[#8b949e] capitalize">{stats.agent_status}</span>
            <span className="text-[#6e7681]">·</span>
            <span className="text-[#6e7681]">{stats.system_uptime}% uptime</span>
          </div>
          <div className="flex gap-4 mt-2 text-[10px] text-[#6e7681]">
            <span>CPU: {stats.cpu_usage}%</span>
            <span>MEM: {stats.memory_usage}%</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-dawn-500/10 text-dawn-400 border border-dawn-500/20'
                  : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22] border border-transparent'
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              {isActive && !sidebarCollapsed && (
                <div className="ml-auto w-1 h-4 rounded-full bg-dawn-500" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 py-3 border-t border-[#30363d] space-y-1">
        <button
          onClick={toggleNotifications}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22] transition-all duration-200 border border-transparent"
          title="Notifications"
        >
          <Bell className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && (
            <>
              <span className="truncate">Notifications</span>
              {stats && stats.notifications_unread > 0 && (
                <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-dawn-500/20 text-dawn-400 rounded-full">
                  {stats.notifications_unread}
                </span>
              )}
            </>
          )}
        </button>

        <button
          onClick={toggleSidebar}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22] transition-all duration-200 border border-transparent"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 flex-shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
