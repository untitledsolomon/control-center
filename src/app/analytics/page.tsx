'use client'

import React from 'react'
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#e6edf3]">Analytics</h1>
        <p className="text-sm text-[#8b949e] mt-1">Business intelligence and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Revenue', value: '$0', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { title: 'Active Clients', value: '0', icon: Users, color: 'text-dawn-400', bg: 'bg-dawn-500/10' },
          { title: 'Conversion Rate', value: '0%', icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { title: 'Reports', value: '0', icon: BarChart3, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="p-5 rounded-xl bg-[#161b22] border border-[#30363d]">
              <div className={`p-2 rounded-lg ${stat.bg} inline-flex`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-semibold text-[#e6edf3] mt-3">{stat.value}</p>
              <p className="text-xs text-[#8b949e] mt-1">{stat.title}</p>
            </div>
          )
        })}
      </div>

      <div className="p-8 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-[#30363d] mx-auto mb-3" />
          <h3 className="text-sm font-medium text-[#8b949e]">Analytics Dashboard</h3>
          <p className="text-xs text-[#6e7681] mt-1">Connect to DAWN API to view real-time analytics</p>
        </div>
      </div>
    </div>
  )
}
