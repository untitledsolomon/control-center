'use client'

import { useState } from 'react'
import { useAppState } from '@/lib/store'
import { Card, CardHeader, CardTitle, Badge, Button } from '@/components/ui'
import { formatRelativeTime, cn } from '@/lib/utils'
import {
  FolderOpen, Search, FileText, Download, ExternalLink,
  Trash2, Filter, Clock, User, BookOpen, FileSpreadsheet,
  Image, Code
} from 'lucide-react'

const mockResources = [
  { id: 'r1', title: 'CRM Adoption Guide.pdf', type: 'Document', size: '2.4 MB', updatedAt: new Date(Date.now() - 2 * 86400000), tags: ['CRM', 'Guide'] },
  { id: 'r2', title: 'Kampala SME Outreach List.csv', type: 'Spreadsheet', size: '156 KB', updatedAt: new Date(Date.now() - 3 * 86400000), tags: ['Leads', 'Outreach'] },
  { id: 'r3', title: 'Brand Guidelines v2.pdf', type: 'Document', size: '8.1 MB', updatedAt: new Date(Date.now() - 5 * 86400000), tags: ['Brand', 'Design'] },
  { id: 'r4', title: 'Instagram Template Pack.zip', type: 'Archive', size: '45 MB', updatedAt: new Date(Date.now() - 7 * 86400000), tags: ['Content', 'Social'] },
  { id: 'r5', title: 'Q2 Revenue Report.xlsx', type: 'Spreadsheet', size: '892 KB', updatedAt: new Date(Date.now() - 10 * 86400000), tags: ['Reports', 'Revenue'] },
  { id: 'r6', title: 'Client Onboarding Script.md', type: 'Document', size: '12 KB', updatedAt: new Date(Date.now() - 14 * 86400000), tags: ['CRM', 'Process'] },
]

const typeIcons: Record<string, React.ReactNode> = {
  Document: <FileText size={16} />,
  Spreadsheet: <FileSpreadsheet size={16} />,
  Archive: <FolderOpen size={16} />,
  Image: <Image size={16} />,
  Code: <Code size={16} />,
}

const typeColors: Record<string, string> = {
  Document: 'bg-accent-light text-accent',
  Spreadsheet: 'bg-success-light text-success',
  Archive: 'bg-warning-light text-warning',
  Image: 'bg-pink/10 text-pink',
  Code: 'bg-purple/10 text-purple',
}

export default function ResourcesPage() {
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState<string | null>(null)

  const allTags = Array.from(new Set(mockResources.flatMap(r => r.tags)))

  const filtered = mockResources.filter(r => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filterTag && !r.tags.includes(filterTag)) return false
    return true
  })

  return (
    <div className="max-w-content mx-auto px-4 md:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold text-foreground">Resource Hub</h1>
          <p className="text-[13px] text-muted mt-1">{mockResources.length} resources</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className={cn(
                'px-2.5 py-1 rounded text-[11px] font-medium border transition-colors',
                filterTag === tag
                  ? 'border-accent bg-accent-light text-accent'
                  : 'border-border bg-surface text-muted hover:text-foreground'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Resource List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <FolderOpen size={40} className="mx-auto text-muted mb-3" />
            <p className="text-[14px] text-muted">No resources found.</p>
          </Card>
        ) : (
          filtered.map(resource => (
            <div
              key={resource.id}
              className="bg-base border border-border rounded-[8px] p-4 flex items-center gap-4 hover:border-accent/30 transition-colors cursor-pointer"
            >
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', typeColors[resource.type] || 'bg-surface-raised text-muted')}>
                {typeIcons[resource.type] || <FileText size={16} />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-semibold text-foreground truncate">{resource.title}</h3>
                <div className="flex items-center gap-3 text-[11px] text-muted mt-0.5">
                  <span>{resource.type}</span>
                  <span>·</span>
                  <span>{resource.size}</span>
                  <span>·</span>
                  <span>Updated {formatRelativeTime(resource.updatedAt)}</span>
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  {resource.tags.map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 rounded bg-surface-raised text-[10px] text-muted">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-raised text-muted hover:text-foreground transition-colors" title="Download">
                  <Download size={14} />
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-raised text-muted hover:text-foreground transition-colors" title="Open">
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
