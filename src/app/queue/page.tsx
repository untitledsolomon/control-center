'use client'

import { useState } from 'react'
import { useAppState } from '@/lib/store'
import { Card, CardHeader, CardTitle, Badge, Button } from '@/components/ui'
import { formatRelativeTime, cn } from '@/lib/utils'
import {
  ListChecks, Plus, Search, Filter, AlertCircle,
  Play, CheckCircle, XCircle, Clock, ArrowUpDown, Trash2
} from 'lucide-react'

const priorityColors: Record<string, string> = {
  high: 'bg-error-light text-error',
  medium: 'bg-warning-light text-warning',
  low: 'bg-surface-raised text-muted',
}

const statusColors: Record<string, string> = {
  queued: 'bg-surface-raised text-muted',
  active: 'bg-accent-light text-accent',
  blocked: 'bg-error-light text-error',
  complete: 'bg-success-light text-success',
}

const categoryColors: Record<string, string> = {
  Outreach: 'bg-purple/10 text-purple',
  Content: 'bg-pink/10 text-pink',
  Research: 'bg-accent-light text-accent',
  CRM: 'bg-success-light text-success',
  System: 'bg-warning-light text-warning',
}

export default function QueuePage() {
  const { state, updateTaskStatus, deleteTask, addActivity, addNotification } = useAppState()
  const { tasks } = state
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'createdAt' | 'priority'>('createdAt')
  const [showAdd, setShowAdd] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as const, category: 'System' as const })

  const filtered = tasks
    .filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false
      if (filterStatus && t.status !== filterStatus) return false
      if (filterPriority && t.priority !== filterPriority) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const order = { high: 0, medium: 1, low: 2 }
        return order[a.priority] - order[b.priority]
      }
      return b.createdAt.getTime() - a.createdAt.getTime()
    })

  const handleStatusChange = (id: string, status: string) => {
    updateTaskStatus(id, status)
    addActivity({
      timestamp: new Date(),
      badge: status === 'complete' ? 'TASK_COMPLETE' : 'TASK_COMPLETE',
      title: `Task ${status === 'complete' ? 'completed' : status === 'active' ? 'started' : status === 'blocked' ? 'blocked' : 'queued'}`,
      description: tasks.find(t => t.id === id)?.title || '',
    })
  }

  const handleDelete = (id: string) => {
    const task = tasks.find(t => t.id === id)
    deleteTask(id)
    addNotification({
      type: 'update',
      icon: 'Trash2',
      title: 'Task deleted',
      description: task?.title || '',
      timestamp: new Date(),
      screen: '/queue',
    })
  }

  const handleAddTask = () => {
    if (!newTask.title.trim()) return
    const { addTask } = useAppState()
    // We'll use the store's addTask via the context
    setShowAdd(false)
    setNewTask({ title: '', description: '', priority: 'medium', category: 'System' })
  }

  return (
    <div className="max-w-content mx-auto px-4 md:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold text-foreground">Mission Queue</h1>
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
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
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
              <Button onClick={handleAddTask}>Create Task</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
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
        <select
          value={filterStatus || ''}
          onChange={e => setFilterStatus(e.target.value || null)}
          className="px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">All Status</option>
          <option value="queued">Queued</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
          <option value="complete">Complete</option>
        </select>
        <select
          value={filterPriority || ''}
          onChange={e => setFilterPriority(e.target.value || null)}
          className="px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button
          onClick={() => setSortBy(sortBy === 'createdAt' ? 'priority' : 'createdAt')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-muted hover:text-foreground"
        >
          <ArrowUpDown size={14} />
          {sortBy === 'createdAt' ? 'Newest' : 'Priority'}
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <ListChecks size={40} className="mx-auto text-muted mb-3" />
            <p className="text-[14px] text-muted">No tasks match your filters</p>
          </Card>
        ) : (
          filtered.map(task => (
            <div
              key={task.id}
              className={cn(
                'bg-base border border-border rounded-[8px] p-4 transition-all duration-150 hover:border-accent/30',
                task.status === 'blocked' && 'border-l-4 border-l-error',
                task.status === 'active' && 'border-l-4 border-l-accent',
                task.status === 'complete' && 'opacity-70',
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className={cn('text-[14px] font-semibold text-foreground', task.status === 'complete' && 'line-through')}>
                      {task.title}
                    </h3>
                    <Badge variant={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'default'}>
                      {task.priority}
                    </Badge>
                    <Badge variant={categoryColors[task.category]?.includes('purple') ? 'purple' : categoryColors[task.category]?.includes('pink') ? 'pink' : categoryColors[task.category]?.includes('accent') ? 'accent' : 'default'}>
                      {task.category}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-[12px] text-muted mb-1">{task.description}</p>
                  )}
                  {task.blockedReason && (
                    <div className="flex items-center gap-1.5 text-[11px] text-error mt-1">
                      <AlertCircle size={12} />
                      <span>{task.blockedReason}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-muted">{formatRelativeTime(task.createdAt)}</span>
                    {task.linkedGoal && (
                      <span className="text-[10px] text-accent">Linked to goal</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {task.status !== 'complete' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'complete')}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-success-light text-muted hover:text-success transition-colors"
                      title="Mark complete"
                    >
                      <CheckCircle size={16} />
                    </button>
                  )}
                  {task.status === 'queued' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'active')}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent-light text-muted hover:text-accent transition-colors"
                      title="Start task"
                    >
                      <Play size={16} />
                    </button>
                  )}
                  {task.status === 'active' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'blocked')}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-error-light text-muted hover:text-error transition-colors"
                      title="Block task"
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                  {task.status === 'blocked' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'active')}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent-light text-muted hover:text-accent transition-colors"
                      title="Unblock task"
                    >
                      <Play size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-error-light text-muted hover:text-error transition-colors"
                    title="Delete task"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
