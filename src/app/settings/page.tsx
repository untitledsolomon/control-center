'use client'

import React from 'react'
import { Settings, Cpu, Bell, Shield, Database, Globe, Key, Webhook } from 'lucide-react'

const settingsGroups = [
  {
    title: 'System',
    items: [
      { name: 'Agent Configuration', description: 'DAWN agent behavior and parameters', icon: Cpu },
      { name: 'API Keys', description: 'Manage API keys and access tokens', icon: Key },
      { name: 'Webhooks', description: 'Configure outgoing webhook endpoints', icon: Webhook },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { name: 'Database Connections', description: 'Supabase, PostgreSQL connections', icon: Database },
      { name: 'External Services', description: 'Third-party API integrations', icon: Globe },
    ],
  },
  {
    title: 'Security',
    items: [
      { name: 'Access Control', description: 'User permissions and roles', icon: Shield },
      { name: 'Notifications', description: 'Alert channels and preferences', icon: Bell },
    ],
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#e6edf3]">Settings</h1>
        <p className="text-sm text-[#8b949e] mt-1">Configure DAWN Control Center</p>
      </div>

      {settingsGroups.map(group => (
        <div key={group.title}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6e7681] mb-3">{group.title}</h2>
          <div className="space-y-2">
            {group.items.map(item => {
              const Icon = item.icon
              return (
                <div
                  key={item.name}
                  className="flex items-center gap-4 p-4 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-dawn-500/30 transition-all cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-[#0d1117] border border-[#30363d]">
                    <Icon className="w-4 h-4 text-[#8b949e]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#e6edf3]">{item.name}</h3>
                    <p className="text-xs text-[#8b949e] mt-0.5">{item.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
