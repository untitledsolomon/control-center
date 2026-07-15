'use client'

import React from 'react'
import { useApp } from '@/store/AppContext'
import { Activity, AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react'

const severityConfig = {
  error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  success: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  info: { icon: Info, color: 'text-dawn-400', bg: 'bg-dawn-500/10' },
}

export default function ActivityPage() {
  const { state } = useApp()
  const { activityLogs } = state

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#e6edf3]">Activity Log</h1>
        <p className="text-sm text-[#8b949e] mt-1">System events and agent actions</p>
      </div>

      <div className="space-y-1">
        {activityLogs.map(log => {
          const config = severityConfig[log.severity]
          const Icon = config.icon
          return (
            <div
              key={log.id}
              className="flex items-start gap-4 p-4 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-dawn-500/20 transition-all"
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#e6edf3]">{log.summary}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[#6e7681]">{log.action}</span>
                  <span className="text-[#30363d]">·</span>
                  <span className="text-[10px] text-[#6e7681]">{new Date(log.created_at).toLocaleString()}</span>
                </div>
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${config.bg} ${config.color} border-transparent`}>
                {log.severity}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
