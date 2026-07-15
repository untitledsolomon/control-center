'use client'

import { useState } from 'react'
import { useAppState } from '@/lib/store'
import { Card, CardHeader, CardTitle, Badge, Button } from '@/components/ui'
import { formatRelativeTime, cn } from '@/lib/utils'
import {
  Inbox, Search, CheckCircle, XCircle, RefreshCw,
  MessageSquare, Clock, ArrowUpDown, Eye
} from 'lucide-react'

const statusColors: Record<string, string> = {
  pending: 'bg-warning-light text-warning',
  approved: 'bg-success-light text-success',
  declined: 'bg-error-light text-error',
  needs_revision: 'bg-accent-light text-accent',
}

const typeColors: Record<string, string> = {
  Content: 'bg-pink/10 text-pink',
  Reports: 'bg-accent-light text-accent',
  'Lead Lists': 'bg-purple/10 text-purple',
  Emails: 'bg-success-light text-success',
  Research: 'bg-warning-light text-warning',
}

export default function ReviewPage() {
  const { state, updateReviewItem, deleteReviewItem, addActivity, addNotification } = useAppState()
  const { reviewItems } = state
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = reviewItems
    .filter(r => {
      if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false
      if (filterStatus && r.status !== filterStatus) return false
      return true
    })
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

  const handleStatusChange = (id: string, newStatus: string) => {
    const item = reviewItems.find(r => r.id === id)
    updateReviewItem(id, {
      status: newStatus,
      statusHistory: [
        ...(item?.statusHistory || []),
        { status: newStatus, timestamp: new Date(), note: `Status changed to ${newStatus}` },
      ],
    })
    addActivity({
      timestamp: new Date(),
      badge: 'TASK_COMPLETE',
      title: `Review item ${newStatus}`,
      description: item?.title || '',
    })
    addNotification({
      type: newStatus === 'approved' ? 'completed' : 'update',
      icon: newStatus === 'approved' ? 'CheckCircle' : 'RefreshCw',
      title: `Review ${newStatus}`,
      description: item?.title || '',
      timestamp: new Date(),
      screen: '/review',
    })
  }

  return (
    <div className="max-w-content mx-auto px-4 md:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold text-foreground">Review Inbox</h1>
          <p className="text-[13px] text-muted mt-1">{reviewItems.length} items · {reviewItems.filter(r => r.status === 'pending').length} pending review</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search review items..."
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
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="declined">Declined</option>
          <option value="needs_revision">Needs Revision</option>
        </select>
      </div>

      {/* Review Items */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <Inbox size={40} className="mx-auto text-muted mb-3" />
            <p className="text-[14px] text-muted">No items to review.</p>
          </Card>
        ) : (
          filtered.map(item => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-[14px] font-semibold text-foreground">{item.title}</h3>
                    <Badge variant={statusColors[item.status]?.includes('success') ? 'success' : statusColors[item.status]?.includes('error') ? 'error' : statusColors[item.status]?.includes('accent') ? 'accent' : 'warning'}>
                      {item.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant={typeColors[item.type]?.includes('pink') ? 'pink' : typeColors[item.type]?.includes('accent') ? 'accent' : typeColors[item.type]?.includes('purple') ? 'purple' : 'default'}>
                      {item.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted">
                    <span>Created {formatRelativeTime(item.createdAt)}</span>
                    <span>·</span>
                    <span>Updated {formatRelativeTime(item.updatedAt)}</span>
                    {item.comments.length > 0 && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={12} />
                          {item.comments.length} comments
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {item.status !== 'approved' && (
                    <button
                      onClick={() => handleStatusChange(item.id, 'approved')}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-success-light text-muted hover:text-success transition-colors"
                      title="Approve"
                    >
                      <CheckCircle size={16} />
                    </button>
                  )}
                  {item.status !== 'declined' && (
                    <button
                      onClick={() => handleStatusChange(item.id, 'declined')}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-error-light text-muted hover:text-error transition-colors"
                      title="Decline"
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                  {item.status !== 'needs_revision' && (
                    <button
                      onClick={() => handleStatusChange(item.id, 'needs_revision')}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent-light text-muted hover:text-accent transition-colors"
                      title="Request revision"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-raised text-muted hover:text-foreground transition-colors"
                    title="View details"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === item.id && (
                <div className="mt-3 pt-3 border-t border-border animate-fade-in space-y-3">
                  {/* Content */}
                  {Object.keys(item.content).length > 0 && (
                    <div>
                      <h4 className="text-[11px] text-muted font-medium mb-1">Content</h4>
                      <div className="bg-surface rounded-lg p-3 text-[12px] text-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {JSON.stringify(item.content, null, 2)}
                      </div>
                    </div>
                  )}

                  {/* Comments */}
                  {item.comments.length > 0 && (
                    <div>
                      <h4 className="text-[11px] text-muted font-medium mb-1">Comments</h4>
                      <div className="space-y-2">
                        {item.comments.map((c, i) => (
                          <div key={i} className="flex items-start gap-2 text-[12px]">
                            <Badge variant={c.author === 'solomon' ? 'accent' : 'default'}>
                              {c.author}
                            </Badge>
                            <span className="text-foreground">{c.text}</span>
                            <span className="text-muted ml-auto whitespace-nowrap">{formatRelativeTime(c.timestamp)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status History */}
                  {item.statusHistory.length > 0 && (
                    <div>
                      <h4 className="text-[11px] text-muted font-medium mb-1">History</h4>
                      <div className="space-y-1">
                        {item.statusHistory.map((h, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px] text-muted">
                            <Clock size={12} />
                            <Badge variant={h.status === 'approved' ? 'success' : h.status === 'declined' ? 'error' : h.status === 'needs_revision' ? 'accent' : 'warning'}>
                              {h.status.replace('_', ' ')}
                            </Badge>
                            <span>{formatRelativeTime(h.timestamp)}</span>
                            {h.note && <span>— {h.note}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
