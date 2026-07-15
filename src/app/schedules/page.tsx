'use client'

import { useState } from 'react'
import { useAppState } from '@/lib/store'
import { Card, CardHeader, CardTitle, Badge, Button } from '@/components/ui'
import { formatRelativeTime, cn } from '@/lib/utils'
import {
  Clock, Plus, Play, Pause, Trash2, RefreshCw,
  History, Bell, BellOff, Search
} from 'lucide-react'

export default function SchedulesPage() {
  const { state, addSchedule, deleteSchedule, toggleSchedule, runSchedule, updateSchedule, addActivity, addNotification } = useAppState()
  const { cronJobs } = state
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    description: '',
    cronExpression: '0 9 * * 1-5',
    humanReadable: 'Every weekday at 9:00 AM',
    notifyOnComplete: false,
  })

  const filtered = cronJobs.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = () => {
    if (!newSchedule.name.trim() || !newSchedule.cronExpression.trim()) return
    addSchedule({
      name: newSchedule.name,
      description: newSchedule.description,
      cronExpression: newSchedule.cronExpression,
      humanReadable: newSchedule.humanReadable,
      notifyOnComplete: newSchedule.notifyOnComplete,
      status: 'running',
      lastRun: null,
      lastResult: null,
      lastDuration: null,
      nextRun: new Date(Date.now() + 86400000),
      history: [],
    })
    addActivity({
      timestamp: new Date(),
      badge: 'TASK_COMPLETE',
      title: 'Schedule created',
      description: newSchedule.name,
    })
    setShowAdd(false)
    setNewSchedule({ name: '', description: '', cronExpression: '0 9 * * 1-5', humanReadable: 'Every weekday at 9:00 AM', notifyOnComplete: false })
  }

  const cronPresets = [
    { label: 'Every hour', cron: '0 * * * *', human: 'Every hour' },
    { label: 'Daily at 9 AM', cron: '0 9 * * *', human: 'Daily at 9:00 AM' },
    { label: 'Weekdays at 9 AM', cron: '0 9 * * 1-5', human: 'Every weekday at 9:00 AM' },
    { label: 'Weekly Monday', cron: '0 9 * * 1', human: 'Every Monday at 9:00 AM' },
    { label: 'Monthly 1st', cron: '0 9 1 * *', human: '1st of every month at 9:00 AM' },
  ]

  return (
    <div className="max-w-content mx-auto px-4 md:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold text-foreground">Schedules</h1>
          <p className="text-[13px] text-muted mt-1">{cronJobs.length} schedules · {cronJobs.filter(s => s.status === 'running').length} active</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} /> New Schedule
        </Button>
      </div>

      {/* Quick Add */}
      {showAdd && (
        <Card className="mb-6 p-4 border-accent/30">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Schedule name..."
              value={newSchedule.name}
              onChange={e => setNewSchedule({ ...newSchedule, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newSchedule.description}
              onChange={e => setNewSchedule({ ...newSchedule, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <div>
              <label className="text-[11px] text-muted font-medium mb-1 block">Cron Expression</label>
              <input
                type="text"
                placeholder="0 9 * * 1-5"
                value={newSchedule.cronExpression}
                onChange={e => setNewSchedule({ ...newSchedule, cronExpression: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent font-mono"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cronPresets.map(preset => (
                <button
                  key={preset.cron}
                  onClick={() => setNewSchedule({ ...newSchedule, cronExpression: preset.cron, humanReadable: preset.human })}
                  className={cn(
                    'px-2 py-1 rounded text-[11px] font-medium border transition-colors',
                    newSchedule.cronExpression === preset.cron
                      ? 'border-accent bg-accent-light text-accent'
                      : 'border-border bg-surface text-muted hover:text-foreground'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newSchedule.notifyOnComplete}
                  onChange={e => setNewSchedule({ ...newSchedule, notifyOnComplete: e.target.checked })}
                  className="rounded border-border"
                />
                <span className="text-[12px] text-muted">Notify on completion</span>
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Create Schedule</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-xs mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search schedules..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Schedule List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <Clock size={40} className="mx-auto text-muted mb-3" />
            <p className="text-[14px] text-muted">No schedules yet. Create one to automate recurring tasks.</p>
          </Card>
        ) : (
          filtered.map(schedule => (
            <Card key={schedule.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[14px] font-semibold text-foreground">{schedule.name}</h3>
                    <Badge variant={schedule.status === 'running' ? 'success' : schedule.status === 'paused' ? 'warning' : 'error'}>
                      {schedule.status}
                    </Badge>
                  </div>
                  {schedule.description && (
                    <p className="text-[12px] text-muted mb-2">{schedule.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-[11px] text-muted">
                    <span className="font-mono">{schedule.cronExpression}</span>
                    <span>—</span>
                    <span>{schedule.humanReadable}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-muted">
                    {schedule.lastRun && (
                      <span>Last: {formatRelativeTime(schedule.lastRun)}</span>
                    )}
                    <span>Next: {formatRelativeTime(schedule.nextRun)}</span>
                    {schedule.lastResult && (
                      <Badge variant={schedule.lastResult === 'success' ? 'success' : 'error'}>
                        {schedule.lastResult}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => runSchedule(schedule.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent-light text-muted hover:text-accent transition-colors"
                    title="Run now"
                  >
                    <Play size={14} />
                  </button>
                  <button
                    onClick={() => toggleSchedule(schedule.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-raised text-muted hover:text-foreground transition-colors"
                    title={schedule.status === 'paused' ? 'Resume' : 'Pause'}
                  >
                    {schedule.status === 'paused' ? <Play size={14} /> : <Pause size={14} />}
                  </button>
                  <button
                    onClick={() => {
                      deleteSchedule(schedule.id)
                      addActivity({
                        timestamp: new Date(),
                        badge: 'TASK_COMPLETE',
                        title: 'Schedule deleted',
                        description: schedule.name,
                      })
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-error-light text-muted hover:text-error transition-colors"
                    title="Delete schedule"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
