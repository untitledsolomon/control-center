'use client'

import { useState, useEffect } from 'react'
import { getGreeting, getStatusConfig, formatRelativeTime, cn } from '@/lib/utils'
import { useAppState, weeklyData as mockWeekly, hourlyData as mockHourly } from '@/lib/store'
import { Card, CardHeader, CardTitle, Badge, Button } from '@/components/ui'
import {
  CheckCircle, FileText, Users, AlertTriangle, Activity,
  Target, RefreshCw, ChevronRight, Clock, Bot, Cpu, HardDrive
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import { fetchDashboardStats, fetchActivityLog, fetchWeeklyChartData, fetchHourlyChartData, fetchAgentStatus } from '@/lib/api-client'

const iconMap: Record<string, React.ReactNode> = {
  CheckCircle: <CheckCircle size={18} />,
  FileText: <FileText size={18} />,
  Users: <Users size={18} />,
  AlertTriangle: <AlertTriangle size={18} />,
}

const colorMap: Record<string, string> = {
  success: 'text-success',
  accent: 'text-accent',
  purple: 'text-purple',
  error: 'text-error',
}

export default function DashboardPage() {
  const { greeting, subtitle } = getGreeting()
  const { state, addActivity, addNotification, refreshStats } = useAppState()
  const { stats, alerts, activity, goals } = state
  const [refreshing, setRefreshing] = useState(false)
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState(new Date())
  const [weeklyData, setWeeklyData] = useState(mockWeekly)
  const [hourlyData, setHourlyData] = useState(mockHourly)
  const [liveStats, setLiveStats] = useState<{ label: string; value: number; icon: string; color: string }[] | null>(null)
  const [agentInfo, setAgentInfo] = useState<{ status: string; uptime: number; cpu: number; mem: number } | null>(null)

  // Load real data from DAWN API on mount
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const [apiStats, apiWeekly, apiHourly, apiAgent] = await Promise.all([
        fetchDashboardStats(),
        fetchWeeklyChartData(),
        fetchHourlyChartData(),
        fetchAgentStatus(),
      ])

      if (cancelled) return

      if (apiStats) {
        setLiveStats([
          { label: 'Tasks Completed', value: apiStats.tasks_completed, icon: 'CheckCircle', color: 'success' },
          { label: 'Active Tasks', value: apiStats.tasks_in_progress, icon: 'FileText', color: 'accent' },
          { label: 'Pending Tasks', value: apiStats.tasks_pending, icon: 'Users', color: 'purple' },
          { label: 'Failed Tasks', value: apiStats.tasks_failed, icon: 'AlertTriangle', color: 'error' },
        ])
      }

      if (apiWeekly && apiWeekly.length > 0) {
        setWeeklyData(apiWeekly.map(d => ({
          day: d.day,
          tasks: d.tasks,
          posts: d.posts,
          leads: d.leads,
        })))
      }

      if (apiHourly && apiHourly.length > 0) {
        setHourlyData(apiHourly.map(d => ({
          hour: d.hour,
          value: d.value,
        })))
      }

      if (apiAgent) {
        setAgentInfo({
          status: apiAgent.status,
          uptime: apiAgent.uptime,
          cpu: apiAgent.cpu_usage,
          mem: apiAgent.memory_usage,
        })
      }
    })()

    return () => { cancelled = true }
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      const now = new Date()
      setLastSync(now)
      addActivity({ timestamp: now, badge: 'TASK_COMPLETE', title: 'Briefing refreshed', description: 'Manual refresh — dashboard data synced and updated' })
      addNotification({ type: 'update', icon: 'RefreshCw', title: 'Briefing refreshed', description: 'Dashboard data synced and updated', timestamp: now, screen: '/' })
      refreshStats()
    }, 1500)
  }

  const displayStats = liveStats || stats

  return (
    <div className="max-w-content mx-auto px-4 md:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-semibold text-foreground">{greeting}</h1>
          <p className="text-[14px] text-muted mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-[12px] text-muted font-medium tracking-wide">
            Synced {formatRelativeTime(lastSync)}
          </span>
          <button
            onClick={handleRefresh}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-raised text-muted hover:text-foreground transition-all duration-150"
            aria-label="Refresh"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Agent Status Bar */}
      {agentInfo && (
        <div className="mb-6 p-3 rounded-lg bg-accent-light border border-accent/20 flex items-center gap-4 text-[12px]">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-accent" />
            <span className="font-medium text-accent">DAWN Agent</span>
          </div>
          <span className="text-muted">•</span>
          <span className="text-foreground capitalize">{agentInfo.status}</span>
          <span className="text-muted">•</span>
          <div className="flex items-center gap-1 text-muted">
            <Cpu size={14} />
            <span>{agentInfo.cpu}% CPU</span>
          </div>
          <div className="flex items-center gap-1 text-muted">
            <HardDrive size={14} />
            <span>{agentInfo.mem}% MEM</span>
          </div>
          <span className="text-muted">•</span>
          <span className="text-muted">Uptime: {Math.floor(agentInfo.uptime / 3600)}h {Math.floor((agentInfo.uptime % 3600) / 60)}m</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {displayStats.map(stat => (
          <Card key={stat.label} className="p-4 md:p-5">
            <div className="flex items-center gap-3">
              <div className={colorMap[stat.color]}>
                {iconMap[stat.icon]}
              </div>
              <div>
                <p className="text-[20px] font-semibold text-foreground">{stat.value}</p>
                <p className="text-[12px] text-muted font-medium tracking-wide">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Weekly Performance + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2 p-5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-accent" />
              <CardTitle>Weekly Performance</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-[11px] text-muted">Tasks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-pink/60" />
                <span className="text-[11px] text-muted">Posts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-purple/60" />
                <span className="text-[11px] text-muted">Leads</span>
              </div>
            </div>
          </CardHeader>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EC" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E5EC', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="tasks" fill="#5B6EF5" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="posts" fill="#DB2777" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="leads" fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-accent" />
              <CardTitle>Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-1 -mx-1">
            {activity.slice(0, 5).map(act => (
              <div key={act.id} className="border-b border-border last:border-b-0">
                <button
                  onClick={() => setExpandedActivity(expandedActivity === act.id ? null : act.id)}
                  className="w-full flex items-center gap-2.5 px-2 py-2.5 text-left hover:bg-surface transition-colors rounded"
                >
                  <Badge
                    variant={act.badge === 'TASK_COMPLETE' ? 'success' : act.badge === 'OUTREACH_SENT' ? 'accent' : act.badge === 'CONTENT_POSTED' ? 'pink' : act.badge === 'LEAD_SCRAPED' ? 'purple' : 'error'}
                  >
                    {act.badge === 'TASK_COMPLETE' ? '✓' : act.badge === 'OUTREACH_SENT' ? '→' : act.badge === 'CONTENT_POSTED' ? '📄' : act.badge === 'LEAD_SCRAPED' ? '👤' : '⚠'}
                  </Badge>
                  <span className="flex-1 text-[12px] text-foreground font-medium truncate">{act.title}</span>
                  <span className="text-[10px] text-muted whitespace-nowrap">{formatRelativeTime(act.timestamp)}</span>
                </button>
                {expandedActivity === act.id && (
                  <p className="px-2 pb-2 text-[11px] text-muted leading-relaxed animate-fade-in">{act.description}</p>
                )}
              </div>
            ))}
          </div>
          <a href="/queue" className="block mt-3 text-center text-[12px] text-accent font-medium hover:underline">
            View all tasks →
          </a>
        </Card>
      </div>

      {/* Needs Attention */}
      {alerts.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[16px] font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-warning" />
            Needs Attention
          </h2>
          <div className="space-y-3">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className="bg-base border border-warning/30 rounded-[8px] p-4"
                style={{ borderLeft: '3px solid #D97706' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[14px] font-semibold text-foreground">{alert.title}</h3>
                      <Badge variant={alert.type === 'error' ? 'error' : 'warning'}>
                        {formatRelativeTime(alert.timestamp)}
                      </Badge>
                    </div>
                    <p className="text-[13px] text-muted">{alert.description}</p>
                  </div>
                  <Button variant="secondary" size="sm" className="shrink-0">
                    {alert.actionLabel} <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active Goals + Activity Today */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2 p-5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target size={16} className="text-accent" />
              <CardTitle>Active Goals</CardTitle>
            </div>
            <a href="/directives" className="text-[12px] text-accent font-medium hover:underline">
              View all →
            </a>
          </CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {goals.map(goal => {
              const pct = Math.round((goal.current / goal.target) * 100)
              const statusCfg = getStatusConfig(goal.status)
              return (
                <div key={goal.id} className="p-3 rounded-lg border border-border bg-surface/50">
                  <div className="flex items-start justify-between mb-2">
                    <Badge
                      variant={goal.category === 'Revenue' ? 'accent' : goal.category === 'Content' ? 'pink' : goal.category === 'Outreach' ? 'purple' : 'warning'}
                    >
                      {goal.category}
                    </Badge>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${statusCfg.bg} ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                  <h4 className="text-[13px] font-semibold text-foreground mb-2">{goal.title}</h4>
                  <div className="mb-1">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-muted">Progress</span>
                      <span className="text-foreground font-medium">{goal.current}/{goal.target} {goal.unit}</span>
                    </div>
                    <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          goal.status === 'at_risk' ? 'bg-warning' : goal.status === 'behind' ? 'bg-error' : 'bg-success'
                        )}
                        style={{ width: Math.min(pct, 100) + '%' }}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted">{goal.taskCount} linked task{goal.taskCount !== 1 ? 's' : ''}</p>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-accent" />
              <CardTitle>Activity Today</CardTitle>
            </div>
          </CardHeader>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EC" vertical={false} />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} hide />
                <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E5EC', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke="#5B6EF5" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#5B6EF5' }} fill="#EEF0FF" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-2 pt-3 border-t border-border">
            <div className="text-center">
              <p className="text-[18px] font-semibold text-foreground">74</p>
              <p className="text-[10px] text-muted">Actions</p>
            </div>
            <div className="text-center">
              <p className="text-[18px] font-semibold text-foreground">12</p>
              <p className="text-[10px] text-muted">Active</p>
            </div>
            <div className="text-center">
              <p className="text-[18px] font-semibold text-foreground">847</p>
              <p className="text-[10px] text-muted">API Calls</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
