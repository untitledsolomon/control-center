'use client'

import { useState } from 'react'
import { useAppState } from '@/lib/store'
import { Card, Badge, Button } from '@/components/ui'
import { formatRelativeTime, cn } from '@/lib/utils'
import {
  CheckSquare, Plus, Filter, Search, Trash2,
  AlertCircle, Play, XCircle
} from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  complete: { label: 'Complete', color: 'text-success', bg: 'bg-success-light' },
  active: { label: 'Active', color: 'text-accent', bg: 'bg-accent-light' },
  queued: { label: 'Queued', color: 'text-warning', bg: 'bg-warning-light' },
  blocked: { label: 'Blocked', color: 'text-error', bg: 'bg-error-light' },
}

const priorityColors: Record<string, string> = {
  high: 'text-error',
  medium: 'text-warning',
  low: 'text-muted',
}

export default function TasksPage() {
  const { state, addTask, updateTaskStatus, deleteTask, addActivity } = useAppState()
  const { tasks } = state
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    category: 'System' as 'Outreach' | 'Content' | 'Research' | 'CRM' | 'System',
  })

  const filtered = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleAdd = () => {
    if (!newTask.title.trim()) return
    addTask({
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      category: newTask.category,
      status: 'queued',
    })
    addActivity({
      timestamp: new Date(),
      badge: 'TASK_COMPLETE',
      title: 'Task created',
      description: newTask.title,
    })
    setShowAdd(false)
    setNewTask({ title: '', description: '', priority: 'medium', category: 'System' })
  }

  const handleStatusAction = (id: string, status: string, blockedReason?: string) => {
    updateTaskStatus(id, status, blockedReason)
    const actionLabel = status === 'complete' ? 'completed' : status === 'active' ? 'started' : status === 'blocked' ? 'blocked' : 'queued'
    addActivity({
      timestamp: new Date(),
      badge: 'TASK_COMPLETE',
      title: `Task ${actionLabel}`,
      description: tasks.find(t => t.id === id)?.title || '',
    })
  }

  return (
    <div className="max-w-content mx-auto px-4 md:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold text-foreground">Tasks</h1>
          <p className="text-[13px] text-muted mt-1">{tasks.length} total tasks · {tasks.filter(t => t.status === 'active').length} active</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} /> New Task
        </Button>
      </div>

      {/* Quick Add */}
      {showAdd && (
        <Card className="mb-6 p-4 border-accent/30">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Task title..."
              value={newTask.title}
              onChange={e => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newTask.description}
              onChange={e => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <div className="flex gap-2">
              <select
                value={newTask.priority}
                onChange={e => setNewTask({ ...newTask, priority: e.target.value as any })}
                className="px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={newTask.category}
                onChange={e => setNewTask({ ...newTask, category: e.target.value as any })}
                className="px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="System">System</option>
                <option value="Outreach">Outreach</option>
                <option value="Content">Content</option>
                <option value="Research">Research</option>
                <option value="CRM">CRM</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Create Task</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex gap-1">
          {['all', 'queued', 'active', 'blocked', 'complete'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors',
                filterStatus === s
                  ? 'bg-accent-light text-accent'
                  : 'text-muted hover:text-foreground hover:bg-surface'
              )}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckSquare size={40} className="mx-auto text-muted mb-3" />
            <p className="text-[14px] text-muted">No tasks found</p>
          </Card>
        ) : (
          filtered.map(task => {
            const status = statusConfig[task.status] || statusConfig.queued
            return (
              <div
                key={task.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-base border border-border hover:border-accent/20 transition-all"
              >
                <button
                  onClick={() => handleStatusAction(task.id, task.status === 'complete' ? 'queued' : 'complete')}
                  className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                    task.status === 'complete' ? 'bg-success-light text-success' : 'bg-surface-raised text-muted hover:text-accent'
                  )}
                >
                  <CheckSquare size={16} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className={cn(
                      'text-[14px] font-medium',
                      task.status === 'complete' ? 'text-muted line-through' : 'text-foreground'
                    )}>
                      {task.title}
                    </h3>
                    <Badge variant={
                      task.status === 'complete' ? 'success' :
                      task.status === 'active' ? 'accent' :
                      task.status === 'blocked' ? 'error' : 'warning'
                    }>
                      {status.label}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-[12px] text-muted mt-0.5">{task.description}</p>
                  )}
                  {task.blockedReason && (
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-error">
                      <AlertCircle size={12} />
                      <span>{task.blockedReason}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-muted">{formatRelativeTime(task.createdAt)}</span>
                    <span className={cn('text-[10px] font-medium', priorityColors[task.priority])}>
                      {task.priority}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-surface-raised text-[10px] text-muted">
                      {task.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {task.status !== 'active' && task.status !== 'complete' && (
                    <button
                      onClick={() => handleStatusAction(task.id, 'active')}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent-light text-muted hover:text-accent transition-colors"
                      title="Start"
                    >
                      <Play size={12} />
                    </button>
                  )}
                  {task.status !== 'blocked' && task.status !== 'complete' && (
                    <button
                      onClick={() => handleStatusAction(task.id, 'blocked', 'Manually blocked')}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-error-light text-muted hover:text-error transition-colors"
                      title="Block"
                    >
                      <XCircle size={12} />
                    </button>
                  )}
                  {task.status === 'blocked' && (
                    <button
                      onClick={() => handleStatusAction(task.id, 'queued')}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-warning-light text-muted hover:text-warning transition-colors"
                      title="Unblock"
                    >
                      <AlertCircle size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      deleteTask(task.id)
                      addActivity({
                        timestamp: new Date(),
                        badge: 'TASK_COMPLETE',
                        title: 'Task deleted',
                        description: task.title,
                      })
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-error-light text-muted hover:text-error transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
