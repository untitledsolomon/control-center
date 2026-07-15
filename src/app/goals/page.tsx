'use client'

import { useState } from 'react'
import { useAppState } from '@/lib/store'
import { Card, Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { Target, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  on_track: { label: 'On Track', color: 'text-success', bg: 'bg-success-light' },
  at_risk: { label: 'At Risk', color: 'text-warning', bg: 'bg-warning-light' },
  behind: { label: 'Behind', color: 'text-error', bg: 'bg-error-light' },
}

const categoryColors: Record<string, string> = {
  Revenue: 'bg-accent-light text-accent',
  Content: 'bg-pink-light text-pink',
  Outreach: 'bg-purple-light text-purple',
  Product: 'bg-warning-light text-warning',
}

export default function GoalsPage() {
  const { state, addGoal, deleteGoal, updateGoalStatus, addActivity } = useAppState()
  const { goals } = state
  const [showAdd, setShowAdd] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: '',
    category: 'Revenue' as 'Revenue' | 'Content' | 'Outreach' | 'Product',
    target: 0,
    current: 0,
    unit: '',
  })

  const handleAdd = () => {
    if (!newGoal.title.trim()) return
    addGoal({
      title: newGoal.title,
      category: newGoal.category,
      target: newGoal.target,
      current: newGoal.current,
      unit: newGoal.unit,
      status: 'on_track',
    })
    addActivity({
      timestamp: new Date(),
      badge: 'TASK_COMPLETE',
      title: 'Goal created',
      description: newGoal.title,
    })
    setShowAdd(false)
    setNewGoal({ title: '', category: 'Revenue', target: 0, current: 0, unit: '' })
  }

  const cycleStatus = (id: string, current: string) => {
    const next = current === 'on_track' ? 'at_risk' : current === 'at_risk' ? 'behind' : 'on_track'
    updateGoalStatus(id, next)
  }

  return (
    <div className="max-w-content mx-auto px-4 md:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold text-foreground">Goals</h1>
          <p className="text-[13px] text-muted mt-1">{goals.length} active goals</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} /> New Goal
        </Button>
      </div>

      {/* Quick Add */}
      {showAdd && (
        <Card className="mb-6 p-4 border-accent/30">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Goal title..."
              value={newGoal.title}
              onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
            />
            <div className="flex gap-2">
              <select
                value={newGoal.category}
                onChange={e => setNewGoal({ ...newGoal, category: e.target.value as any })}
                className="px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="Revenue">Revenue</option>
                <option value="Content">Content</option>
                <option value="Outreach">Outreach</option>
                <option value="Product">Product</option>
              </select>
              <input
                type="text"
                placeholder="Unit (e.g. clients, posts)"
                value={newGoal.unit}
                onChange={e => setNewGoal({ ...newGoal, unit: e.target.value })}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-muted font-medium mb-1 block">Target</label>
                <input
                  type="number"
                  value={newGoal.target || ''}
                  onChange={e => setNewGoal({ ...newGoal, target: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted font-medium mb-1 block">Current</label>
                <input
                  type="number"
                  value={newGoal.current || ''}
                  onChange={e => setNewGoal({ ...newGoal, current: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Create Goal</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.length === 0 ? (
          <Card className="p-8 text-center md:col-span-2">
            <Target size={40} className="mx-auto text-muted mb-3" />
            <p className="text-[14px] text-muted">No goals yet. Create one to track progress.</p>
          </Card>
        ) : (
          goals.map(goal => {
            const pct = goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0
            const status = statusConfig[goal.status] || statusConfig.on_track
            return (
              <Card key={goal.id} className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-success-light">
                    <Target className="w-4 h-4 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[14px] font-semibold text-foreground">{goal.title}</h3>
                      <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', categoryColors[goal.category])}>
                        {goal.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', status.bg, status.color)}>
                        {status.label}
                      </span>
                      <span className="text-[11px] text-muted">
                        {goal.current} / {goal.target} {goal.unit}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => cycleStatus(goal.id, goal.status)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-raised text-muted hover:text-foreground transition-colors"
                      title="Cycle status"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => {
                        deleteGoal(goal.id)
                        addActivity({
                          timestamp: new Date(),
                          badge: 'TASK_COMPLETE',
                          title: 'Goal deleted',
                          description: goal.title,
                        })
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-error-light text-muted hover:text-error transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-muted">Progress</span>
                    <span className="text-[11px] font-medium text-foreground">{pct}%</span>
                  </div>
                  <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        goal.status === 'at_risk' ? 'bg-warning' :
                        goal.status === 'behind' ? 'bg-error' : 'bg-success'
                      )}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                {goal.dueDate && (
                  <div className="mt-3 text-[11px] text-muted">
                    Due: {goal.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
