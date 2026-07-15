'use client'

import { useState } from 'react'
import { useAppState } from '@/lib/store'
import { Card, CardHeader, CardTitle, Badge, Button } from '@/components/ui'
import { formatRelativeTime, cn } from '@/lib/utils'
import {
  BookOpen, Plus, Search, Play, Trash2,
  Edit3, Save, X, ChevronDown, ChevronRight, Copy
} from 'lucide-react'

export default function PlaybooksPage() {
  const { state, addPlaybook, deletePlaybook, updatePlaybook, addActivity } = useAppState()
  const { playbooks } = state
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', body: '', category: '', status: '' })
  const [newPlaybook, setNewPlaybook] = useState({
    title: '',
    category: 'General',
    body: '',
    status: 'draft',
    variables: [] as { key: string; value: string }[],
  })

  const filtered = playbooks.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = () => {
    if (!newPlaybook.title.trim()) return
    addPlaybook({
      title: newPlaybook.title,
      category: newPlaybook.category,
      body: newPlaybook.body,
      status: newPlaybook.status,
      variables: newPlaybook.variables,
    })
    addActivity({
      timestamp: new Date(),
      badge: 'TASK_COMPLETE',
      title: 'Protocol created',
      description: newPlaybook.title,
    })
    setShowAdd(false)
    setNewPlaybook({ title: '', category: 'General', body: '', status: 'draft', variables: [] })
  }

  const startEdit = (pb: typeof playbooks[0]) => {
    setEditingId(pb.id)
    setEditForm({ title: pb.title, body: pb.body, category: pb.category, status: pb.status })
  }

  const saveEdit = (id: string) => {
    updatePlaybook(id, editForm)
    setEditingId(null)
  }

  return (
    <div className="max-w-content mx-auto px-4 md:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold text-foreground">Protocols</h1>
          <p className="text-[13px] text-muted mt-1">{playbooks.length} protocols</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} /> New Protocol
        </Button>
      </div>

      {/* Quick Add */}
      {showAdd && (
        <Card className="mb-6 p-4 border-accent/30">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Protocol title..."
              value={newPlaybook.title}
              onChange={e => setNewPlaybook({ ...newPlaybook, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
            />
            <div className="flex gap-2">
              <select
                value={newPlaybook.category}
                onChange={e => setNewPlaybook({ ...newPlaybook, category: e.target.value })}
                className="px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="General">General</option>
                <option value="Outreach">Outreach</option>
                <option value="Content">Content</option>
                <option value="Research">Research</option>
                <option value="CRM">CRM</option>
                <option value="System">System</option>
              </select>
              <select
                value={newPlaybook.status}
                onChange={e => setNewPlaybook({ ...newPlaybook, status: e.target.value })}
                className="px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <textarea
              placeholder="Protocol body (markdown supported)..."
              value={newPlaybook.body}
              onChange={e => setNewPlaybook({ ...newPlaybook, body: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-y"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Create Protocol</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-xs mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search protocols..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Playbook List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen size={40} className="mx-auto text-muted mb-3" />
            <p className="text-[14px] text-muted">No protocols yet. Create one to standardize workflows.</p>
          </Card>
        ) : (
          filtered.map(pb => (
            <Card key={pb.id} className="p-4">
              {editingId === pb.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[14px] font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <div className="flex gap-2">
                    <select
                      value={editForm.category}
                      onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="General">General</option>
                      <option value="Outreach">Outreach</option>
                      <option value="Content">Content</option>
                      <option value="Research">Research</option>
                      <option value="CRM">CRM</option>
                      <option value="System">System</option>
                    </select>
                    <select
                      value={editForm.status}
                      onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <textarea
                    value={editForm.body}
                    onChange={e => setEditForm({ ...editForm, body: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-y font-mono"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="secondary" onClick={() => setEditingId(null)}><X size={14} /> Cancel</Button>
                    <Button onClick={() => saveEdit(pb.id)}><Save size={14} /> Save</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => setExpandedId(expandedId === pb.id ? null : pb.id)}
                          className="text-muted hover:text-foreground"
                        >
                          {expandedId === pb.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        <h3 className="text-[14px] font-semibold text-foreground">{pb.title}</h3>
                        <Badge variant={pb.category === 'Outreach' ? 'purple' : pb.category === 'Content' ? 'pink' : pb.category === 'CRM' ? 'success' : pb.category === 'System' ? 'warning' : 'default'}>
                          {pb.category}
                        </Badge>
                        <Badge variant={pb.status === 'active' ? 'success' : pb.status === 'archived' ? 'error' : 'default'}>
                          {pb.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted">
                        Updated {formatRelativeTime(pb.updatedAt)} · {pb.variables.length} variables
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(pb)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-raised text-muted hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          deletePlaybook(pb.id)
                          addActivity({ timestamp: new Date(), badge: 'TASK_COMPLETE', title: 'Protocol deleted', description: pb.title })
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-error-light text-muted hover:text-error transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {expandedId === pb.id && (
                    <div className="mt-3 pt-3 border-t border-border animate-fade-in">
                      <div className="bg-surface rounded-lg p-3 text-[13px] text-foreground whitespace-pre-wrap font-mono text-[12px] leading-relaxed max-h-60 overflow-y-auto">
                        {pb.body || 'No body content'}
                      </div>
                      {pb.variables.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {pb.variables.map((v, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-accent-light text-accent text-[11px] font-mono">
                              {v.key}={v.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
