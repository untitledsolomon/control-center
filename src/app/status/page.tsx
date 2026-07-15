'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, Badge, Button } from '@/components/ui'
import { formatRelativeTime, cn } from '@/lib/utils'
import {
  Activity, Bot, Cpu, HardDrive, Wifi, Database,
  RefreshCw, CheckCircle, XCircle, AlertTriangle,
  Clock, Server, Globe, Shield
} from 'lucide-react'
import { fetchAgentStatus } from '@/lib/api-client'

interface ServiceStatus {
  name: string
  status: 'operational' | 'degraded' | 'down'
  icon: React.ReactNode
  latency?: string
  lastChecked?: Date
}

export default function StatusPage() {
  const [agentInfo, setAgentInfo] = useState<{
    status: string
    uptime: number
    cpu: number
    mem: number
    version: string
    lastActive: string
  } | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadStatus = async () => {
    setRefreshing(true)
    const api = await fetchAgentStatus()
    if (api) {
      setAgentInfo({
        status: api.status,
        uptime: api.uptime,
        cpu: api.cpu_usage,
        mem: api.memory_usage,
        version: api.version,
        lastActive: api.last_active,
      })
    }
    setTimeout(() => setRefreshing(false), 500)
  }

  useEffect(() => { loadStatus() }, [])

  const services: ServiceStatus[] = [
    { name: 'DAWN API', status: 'operational', icon: <Bot size={16} />, latency: '45ms' },
    { name: 'Supabase Database', status: 'operational', icon: <Database size={16} />, latency: '12ms' },
    { name: 'LLM Service', status: 'operational', icon: <Cpu size={16} />, latency: '320ms' },
    { name: 'Knowledge Graph', status: 'operational', icon: <Globe size={16} />, latency: '8ms' },
    { name: 'Web Search', status: 'operational', icon: <Wifi size={16} />, latency: '210ms' },
    { name: 'File System', status: 'operational', icon: <HardDrive size={16} />, latency: '3ms' },
    { name: 'Slack Integration', status: 'degraded', icon: <Shield size={16} />, latency: '1.2s' },
    { name: 'OSINT Engine', status: 'operational', icon: <Server size={16} />, latency: '180ms' },
  ]

  const statusIcon = (status: string) => {
    if (status === 'active' || status === 'operational') return <CheckCircle size={16} className="text-success" />
    if (status === 'degraded') return <AlertTriangle size={16} className="text-warning" />
    return <XCircle size={16} className="text-error" />
  }

  return (
    <div className="max-w-content mx-auto px-4 md:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold text-foreground">System Status</h1>
          <p className="text-[13px] text-muted mt-1">All systems operational</p>
        </div>
        <Button variant="secondary" onClick={loadStatus}>
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </Button>
      </div>

      {/* Agent Status */}
      {agentInfo && (
        <Card className="mb-6 p-5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-accent" />
              <CardTitle>DAWN Agent</CardTitle>
            </div>
            <Badge variant={agentInfo.status === 'active' ? 'success' : 'warning'}>
              {statusIcon(agentInfo.status)} {agentInfo.status}
            </Badge>
          </CardHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-surface">
              <p className="text-[11px] text-muted font-medium mb-1">CPU Usage</p>
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-accent" />
                <span className="text-[18px] font-semibold text-foreground">{agentInfo.cpu}%</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-surface">
              <p className="text-[11px] text-muted font-medium mb-1">Memory</p>
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-accent" />
                <span className="text-[18px] font-semibold text-foreground">{agentInfo.mem}%</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-surface">
              <p className="text-[11px] text-muted font-medium mb-1">Uptime</p>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-accent" />
                <span className="text-[18px] font-semibold text-foreground">
                  {Math.floor(agentInfo.uptime / 3600)}h {Math.floor((agentInfo.uptime % 3600) / 60)}m
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-surface">
              <p className="text-[11px] text-muted font-medium mb-1">Version</p>
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-accent" />
                <span className="text-[18px] font-semibold text-foreground">{agentInfo.version || '3.2.0'}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Services Grid */}
      <h2 className="text-[16px] font-semibold text-foreground mb-4">Services</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {services.map(service => (
          <Card key={service.name} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center',
                service.status === 'operational' ? 'bg-success-light' : service.status === 'degraded' ? 'bg-warning-light' : 'bg-error-light'
              )}>
                <div className={cn(
                  service.status === 'operational' ? 'text-success' : service.status === 'degraded' ? 'text-warning' : 'text-error'
                )}>
                  {service.icon}
                </div>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">{service.name}</p>
                <p className="text-[11px] text-muted">
                  {service.latency && `${service.latency} latency`}
                </p>
              </div>
            </div>
            <Badge variant={service.status === 'operational' ? 'success' : service.status === 'degraded' ? 'warning' : 'error'}>
              {service.status}
            </Badge>
          </Card>
        ))}
      </div>

      {/* Recent Events */}
      <h2 className="text-[16px] font-semibold text-foreground mb-4">Recent Events</h2>
      <Card className="p-5">
        <div className="space-y-3">
          {[
            { time: '2m ago', event: 'Health check passed', status: 'success' as const },
            { time: '15m ago', event: 'Slack webhook reconnected', status: 'success' as const },
            { time: '1h ago', event: 'Database backup completed', status: 'success' as const },
            { time: '3h ago', event: 'LLM response latency spike (1.8s)', status: 'warning' as const },
            { time: '6h ago', event: 'OSINT engine cache cleared', status: 'info' as const },
            { time: '12h ago', event: 'Deployment v3.2.0 rolled out', status: 'info' as const },
          ].map((evt, i) => (
            <div key={i} className="flex items-center gap-3 text-[12px]">
              <div className={cn(
                'w-2 h-2 rounded-full',
                evt.status === 'success' ? 'bg-success' : evt.status === 'warning' ? 'bg-warning' : 'bg-accent'
              )} />
              <span className="text-foreground flex-1">{evt.event}</span>
              <span className="text-muted whitespace-nowrap">{evt.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
