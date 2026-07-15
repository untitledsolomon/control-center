'use client'

import { useState } from 'react'
import { useAppState } from '@/lib/store'
import { Card, CardHeader, CardTitle, Badge, Button } from '@/components/ui'
import { formatRelativeTime, cn } from '@/lib/utils'
import {
  Target, Plus, Search, ToggleLeft, ToggleRight,
  Trash2, Edit3, Save, X, BookOpen
} from 'lucide-react'

const categoryColors: Record<string, string> = {
  Revenue: 'bg-success-light text-success',
  Content: 'bg-pink/10 text-pink',
  Outreach: 'bg-purple/10 text-purple',
  Product: 'bg-warning-light text-warning',
}

export default function DirectivesPage() {
  const { state, addGoal, deleteGoal, updateGoalStatus, addActivity } = useAppState()
  const { goals } = state
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: '',
    category: 'Revenue' as const,
    target: 0,
    current: 0,
    unit: '',
    dueDate: new Date(Date.now() + 30 * 86400000),
  })

  const filtered = goals.filter(g =>
    !search || g.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddGoal = () => {
    if (!newGoal.title.trim()) return
    addGoal({
      title: newGoal.title,
      category: newGoal.category,
      target: newGoal.target,
      current: newGoal.current,
      unit: newGoal.unit,
      dueDate: newGoal.dueDate,
    })
    addActivity({
      timestamp: new Date(),
      badge: 'TASK_COMPLETE',
      title: 'Goal created',
      description: newGoal.title,
    })
    setShowAdd(false)
    setNewGoal({ title: '', category: 'Revenue', target: 0, current: 0, unit: '', dueDate: new Date(Date.now() + 30 * 86400000) })
  }

  return (
    <div className="max-w-content mx-auto px-4 md:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold text-foreground">Directives</h1>
          <p className="text-[13px] text-muted mt-1">{goals.length} active directives</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} /> New Directive
        </Button>
      </div>

      {/* Quick Add */}
      {showAdd && (
        <Card className="mb-6 p-4 border-accent/30">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Directive title..."
              value={newGoal.title}
              onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted font-medium mb-1 block">Category</label>
                <select
                  value={newGoal.category}
                  onChange={e => setNewGoal({ ...newGoal, category: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="Revenue">Revenue</option>
                  <option value="Content">Content</option>
                  <option value="Outreach">Outreach</option>
                  <option value="Product">Product</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-muted font-medium mb-1 block">Unit</label>
                <input
                  type="text"
                  placeholder="e.g. clients, posts, leads"
                  value={newGoal.unit}
                  onChange={e => setNewGoal({ ...newGoal, unit: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted font-medium mb-1 block">Target</label>
                <input
                  type="number"
                  placeholder="Target value"
                  value={newGoal.target || ''}
                  onChange={e => setNewGoal({ ...newGoal, target: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted font-medium mb-1 block">Current</label>
                <input
                  type="number"
                  placeholder="Current value"
                  value={newGoal.current || ''}
                  onChange={e => setNewGoal({ ...newGoal, current: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleAddGoal}>Create Directive</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-xs mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search directives..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center md:col-span-2">
            <Target size={40} className="mx-auto text-muted mb-3" />
            <p className="text-[14px] text-muted">No directives yet. Create one to get started.</p>
          </Card>
        ) : (
          filtered.map(goal => {
            const pct = Math.round((goal.current / goal.target) * 100)
            return (
              <Card key={goal.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={goal.category === 'Revenue' ? 'accent' : goal.category === 'Content' ? 'pink' : goal.category === 'Outreach' ? 'purple' : 'warning'}>
                      {goal.category}
                    </Badge>
                    <Badge
                      variant={goal.status === 'on_track' ? 'success' : goal.status === 'at_risk' ? 'warning' : 'error'}
                    >
                      {goal.status === 'on_track' ? 'On Track' : goal.status === 'at_risk' ? 'At Risk' : 'Behind'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const statuses = ['on_track', 'at_risk', 'behind'] as const
                        const idx = statuses.indexOf(goal.status)
                        const next = statuses[(idx + 1) % 3]
                        updateGoalStatus(goal.id, next)
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-raised text-muted hover:text-foreground"
                      title="Cycle status"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        deleteGoal(goal.id)
                        addActivity({
                          timestamp: new Date(),
                          badge: 'TASK_COMPLETE',
                          title: 'Directive deleted',
                          description: goal.title,
                        })
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-error-light text-muted hover:text-error"
                      title="Delete directive"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="text-[15px] font-semibold text-foreground mb-3">{goal.title}</h3>
                <div className="mb-2">
                  <div className="flex justify-between text-[12px] mb-1.5">
                    <span className="text-muted">Progress</span>
                    <span className="text-foreground font-medium">{goal.current}/{goal.target} {goal.unit}</span>
                  </div>
                  <div className="w-full h-2.5 bg-border rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        goal.status === 'at_risk' ? 'bg-warning' : goal.status === 'behind' ? 'bg-error' : 'bg-success'
                      )}
                      style={{ width: Math.min(pct, 100) + '%' }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="text-[11px] text-muted">
                    Due {goal.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-[11px] text-muted">{goal.taskCount} tasks</span>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
