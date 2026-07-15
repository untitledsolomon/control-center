'use client'

import React from 'react'
import { useApp } from '@/store/AppContext'
import {
  CheckSquare,
  Target,
  Activity,
  AlertTriangle,
  Cpu,
  Clock,
  TrendingUp,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

export default function DashboardPage() {
  const { state } = useApp()
  const { stats, weeklyActivity, hourlyActivity, goals, activityLogs, tasks, loading } = state

  if (loading || !stats) {
    return <DashboardSkeleton />
  }

  const tasksByStatus = [
    { name: 'Completed', value: stats.tasks_completed, color: '#12b886' },
    { name: 'In Progress', value: stats.tasks_in_progress, color: '#4c6ef5' },
    { name: 'Pending', value: stats.tasks_pending, color: '#f59f00' },
    { name: 'Failed', value: stats.tasks_failed, color: '#fa5252' },
  ]

  const completionRate = stats.total_tasks > 0
    ? Math.round((stats.tasks_completed / stats.total_tasks) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#e6edf3]">Dashboard</h1>
          <p className="text-sm text-[#8b949e] mt-1">
            DAWN agent status: <span className="text-emerald-400 capitalize">{stats.agent_status}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#8b949e] bg-[#161b22] rounded-lg border border-[#30363d]">
            <Clock className="w-3 h-3" />
            Last active: {new Date(stats.last_active).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks"
          value={stats.total_tasks}
          icon={CheckSquare}
          color="text-dawn-400"
          bg="bg-dawn-500/10"
          trend={{ value: completionRate, label: 'completion rate', up: completionRate > 50 }}
        />
        <StatCard
          title="Active Goals"
          value={stats.active_goals}
          icon={Target}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
          trend={{ value: stats.goal_progress_avg, label: 'avg progress', up: stats.goal_progress_avg > 50 }}
        />
        <StatCard
          title="System Uptime"
          value={`${stats.system_uptime}%`}
          icon={TrendingUp}
          color="text-violet-400"
          bg="bg-violet-500/10"
          trend={{ value: 0.2, label: 'vs last week', up: true }}
        />
        <StatCard
          title="Unread Alerts"
          value={stats.notifications_unread}
          icon={AlertTriangle}
          color="text-amber-400"
          bg="bg-amber-500/10"
          trend={{ value: stats.notifications_unread, label: 'needs attention', up: stats.notifications_unread > 5 }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <div className="p-5 rounded-xl bg-[#161b22] border border-[#30363d]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#e6edf3]">Weekly Activity</h3>
            <div className="flex items-center gap-3 text-[10px] text-[#6e7681]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-dawn-500" />
                Created
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Completed
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                <XAxis dataKey="date" stroke="#6e7681" fontSize={12} />
                <YAxis stroke="#6e7681" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#e6edf3' }}
                />
                <Bar dataKey="tasks_created" fill="#4c6ef5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tasks_completed" fill="#12b886" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Activity */}
        <div className="p-5 rounded-xl bg-[#161b22] border border-[#30363d]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#e6edf3]">Hourly Requests</h3>
            <div className="flex items-center gap-1 text-[10px] text-[#6e7681]">
              <span className="w-2 h-2 rounded-full bg-dawn-500" />
              Response time
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                <XAxis dataKey="date" stroke="#6e7681" fontSize={12} />
                <YAxis stroke="#6e7681" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#e6edf3' }}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="#4c6ef5"
                  fill="#4c6ef5"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals Progress */}
        <div className="p-5 rounded-xl bg-[#161b22] border border-[#30363d]">
          <h3 className="text-sm font-medium text-[#e6edf3] mb-4">Goals Progress</h3>
          <div className="space-y-4">
            {goals.slice(0, 4).map(goal => (
              <div key={goal.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#8b949e] truncate">{goal.title}</span>
                  <span className="text-[10px] text-[#6e7681] flex-shrink-0 ml-2">{goal.progress}%</span>
                </div>
                <div className="h-1.5 bg-[#0d1117] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-dawn-500 to-dawn-400 transition-all duration-500"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-5 rounded-xl bg-[#161b22] border border-[#30363d]">
          <h3 className="text-sm font-medium text-[#e6edf3] mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {activityLogs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  log.severity === 'error' ? 'bg-red-500/10' :
                  log.severity === 'warning' ? 'bg-amber-500/10' :
                  log.severity === 'success' ? 'bg-emerald-500/10' :
                  'bg-dawn-500/10'
                }`}>
                  <Activity className={`w-3 h-3 ${
                    log.severity === 'error' ? 'text-red-400' :
                    log.severity === 'warning' ? 'text-amber-400' :
                    log.severity === 'success' ? 'text-emerald-400' :
                    'text-dawn-400'
                  }`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[#e6edf3] truncate">{log.summary}</p>
                  <p className="text-[10px] text-[#6e7681] mt-0.5">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks Overview */}
        <div className="p-5 rounded-xl bg-[#161b22] border border-[#30363d]">
          <h3 className="text-sm font-medium text-[#e6edf3] mb-4">Tasks Overview</h3>
          <div className="space-y-3">
            {tasksByStatus.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-[#8b949e]">{item.name}</span>
                </div>
                <span className="text-xs font-medium text-[#e6edf3]">{item.value}</span>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t border-[#30363d]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6e7681]">Completion Rate</span>
                <span className="text-sm font-semibold text-emerald-400">{completionRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
  trend,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  color: string
  bg: string
  trend?: { value: number; label: string; up: boolean }
}) {
  return (
    <div className="p-5 rounded-xl bg-[#161b22] border border-[#30363d] card-hover">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[10px] ${trend.up ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend.value}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-semibold text-[#e6edf3]">{value}</p>
        <p className="text-xs text-[#8b949e] mt-1">{title}</p>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 skeleton" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-5 rounded-xl bg-[#161b22] border border-[#30363d]">
            <div className="h-8 w-8 skeleton rounded-lg" />
            <div className="mt-3 h-8 w-20 skeleton" />
            <div className="mt-1 h-4 w-24 skeleton" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="p-5 rounded-xl bg-[#161b22] border border-[#30363d]">
            <div className="h-5 w-32 skeleton mb-4" />
            <div className="h-64 skeleton" />
          </div>
        ))}
      </div>
    </div>
  )
}
