'use client'

import React, { useState, useEffect } from 'react'
import { getAgentStatus } from '@/lib/api-client'
import { Cpu, HardDrive, Activity, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

export default function StatusPage() {
  const [agent, setAgent] = useState<{ status: string; uptime: number; memory: number; cpu: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAgentStatus().then(a => {
      setAgent(a)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const services = [
    { name: 'Supabase Database', status: 'operational', latency: '12ms' },
    { name: 'DAWN API', status: 'operational', latency: '45ms' },
    { name: 'Vercel Hosting', status: 'operational', latency: '8ms' },
    { name: 'GitHub Integration', status: 'operational', latency: '23ms' },
    { name: 'Authentication', status: 'operational', latency: '34ms' },
    { name: 'WebSocket', status: 'operational', latency: '15ms' },
    { name: 'CDN', status: 'operational', latency: '5ms' },
    { name: 'Email Service', status: 'operational', latency: '67ms' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#e6edf3]">System Status</h1>
        <p className="text-sm text-[#8b949e] mt-1">DAWN agent and service health</p>
      </div>

      {/* Agent Status */}
      <div className="p-5 rounded-xl bg-[#161b22] border border-[#30363d]">
        <h2 className="text-sm font-medium text-[#e6edf3] mb-4">DAWN Agent</h2>
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-32 skeleton" />
            <div className="h-8 w-48 skeleton" />
          </div>
        ) : agent ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#8b949e] mb-1">Status</div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  agent.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'
                }`} />
                <span className="text-sm font-medium text-[#e6edf3] capitalize">{agent.status}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-[#8b949e] mb-1">Uptime</div>
              <p className="text-sm font-medium text-[#e6edf3]">{agent.uptime}%</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-[#8b949e] mb-1">CPU</div>
              <p className="text-sm font-medium text-[#e6edf3]">{agent.cpu}%</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-[#8b949e] mb-1">Memory</div>
              <p className="text-sm font-medium text-[#e6edf3]">{agent.memory}%</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#8b949e]">Unable to fetch agent status</p>
        )}
      </div>

      {/* Services */}
      <div className="p-5 rounded-xl bg-[#161b22] border border-[#30363d]">
        <h2 className="text-sm font-medium text-[#e6edf3] mb-4">Services</h2>
        <div className="space-y-2">
          {services.map(s => (
            <div key={s.name} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-sm text-[#e6edf3]">{s.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-emerald-400 px-1.5 py-0.5 bg-emerald-500/10 rounded-full">{s.status}</span>
                <span className="text-[10px] text-[#6e7681] font-mono">{s.latency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
