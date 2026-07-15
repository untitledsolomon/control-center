'use client'

import { useState, useEffect } from 'react'
import { useAppState } from '@/lib/store'
import { Card, CardHeader, CardTitle, Badge, Button } from '@/components/ui'
import { formatRelativeTime, cn } from '@/lib/utils'
import {
  FolderOpen, Search, FileText, Download, ExternalLink,
  Trash2, Filter, Clock, User, BookOpen, FileSpreadsheet,
  Image, Code, X, Eye, ChevronRight, Target, ListChecks,
  MessageSquare, Cpu, Globe
} from 'lucide-react'

interface Resource {
  id: string
  title: string
  type: string
  size: string
  updatedAt: Date
  tags: string[]
  description: string
  content?: string
  url?: string
}

const typeIcons: Record<string, React.ReactNode> = {
  Document: <FileText size={16} />,
  Spreadsheet: <FileSpreadsheet size={16} />,
  Archive: <FolderOpen size={16} />,
  Image: <Image size={16} />,
  Code: <Code size={16} />,
  Plan: <Target size={16} />,
  Guide: <BookOpen size={16} />,
}

const typeColors: Record<string, string> = {
  Document: 'bg-accent-light text-accent',
  Spreadsheet: 'bg-success-light text-success',
  Archive: 'bg-warning-light text-warning',
  Image: 'bg-pink/10 text-pink',
  Code: 'bg-purple/10 text-purple',
  Plan: 'bg-accent-light text-accent',
  Guide: 'bg-purple/10 text-purple',
}

const mockResources: Resource[] = [
  {
    id: 'r1', title: 'CRM Adoption Guide.pdf', type: 'Document', size: '2.4 MB',
    updatedAt: new Date(Date.now() - 2 * 86400000), tags: ['CRM', 'Guide'],
    description: 'Complete guide to CRM adoption for Kampala SMEs',
  },
  {
    id: 'r2', title: 'Kampala SME Outreach List.csv', type: 'Spreadsheet', size: '156 KB',
    updatedAt: new Date(Date.now() - 3 * 86400000), tags: ['Leads', 'Outreach'],
    description: 'Curated list of 200+ SMEs in Kampala for outreach campaigns',
  },
  {
    id: 'r3', title: 'Brand Guidelines v2.pdf', type: 'Document', size: '8.1 MB',
    updatedAt: new Date(Date.now() - 5 * 86400000), tags: ['Brand', 'Design'],
    description: 'Regent brand guidelines including colors, typography, and logo usage',
  },
  {
    id: 'r4', title: 'Instagram Template Pack.zip', type: 'Archive', size: '45 MB',
    updatedAt: new Date(Date.now() - 7 * 86400000), tags: ['Content', 'Social'],
    description: 'Canva templates for Instagram carousels and stories',
  },
  {
    id: 'r5', title: 'Q2 Revenue Report.xlsx', type: 'Spreadsheet', size: '892 KB',
    updatedAt: new Date(Date.now() - 10 * 86400000), tags: ['Reports', 'Revenue'],
    description: 'Q2 2025 revenue breakdown by client and service line',
  },
  {
    id: 'r6', title: 'Client Onboarding Script.md', type: 'Document', size: '12 KB',
    updatedAt: new Date(Date.now() - 14 * 86400000), tags: ['CRM', 'Process'],
    description: 'Standardized onboarding script for new Regent clients',
  },
  {
    id: 'r7', title: 'DAWN Control Center — Implementation Plan', type: 'Plan', size: '26 KB',
    updatedAt: new Date(Date.now()), tags: ['Strategy', 'Product', 'Architecture'],
    description: 'Full implementation plan for the DAWN Control Center evolution — performance, project management, Slack integration, and Palantir-inspired features',
    url: '/resources/implementation-plan.md',
  },
]

export default function ResourcesPage() {
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [planContent, setPlanContent] = useState<string | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(false)

  const allTags = Array.from(new Set(mockResources.flatMap(r => r.tags)))

  const filtered = mockResources.filter(r => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filterTag && !r.tags.includes(filterTag)) return false
    return true
  })

  const handleOpen = async (resource: Resource) => {
    setSelectedResource(resource)
    if (resource.url) {
      setLoadingPlan(true)
      try {
        const res = await fetch(resource.url)
        const text = await res.text()
        setPlanContent(text)
      } catch (e) {
        setPlanContent('Failed to load document content.')
      }
      setLoadingPlan(false)
    }
  }

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
              onClick={() => handleOpen(resource)}
            >
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', typeColors[resource.type] || 'bg-surface-raised text-muted')}>
                {typeIcons[resource.type] || <FileText size={16} />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-semibold text-foreground truncate">{resource.title}</h3>
                <p className="text-[11px] text-muted mt-0.5 line-clamp-1">{resource.description}</p>
                <div className="flex items-center gap-3 text-[11px] text-muted mt-1">
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
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpen(resource) }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-raised text-muted hover:text-foreground transition-colors"
                  title="Open"
                >
                  <Eye size={14} />
                </button>
                <ChevronRight size={16} className="text-muted" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Document Viewer Modal */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-8 px-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setSelectedResource(null); setPlanContent(null) }} />
          <div className="relative w-full max-w-4xl max-h-[85vh] bg-base border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col z-10 animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', typeColors[selectedResource.type] || 'bg-surface-raised text-muted')}>
                  {typeIcons[selectedResource.type] || <FileText size={16} />}
                </div>
                <div className="min-w-0">
                  <h2 className="text-[16px] font-semibold text-foreground truncate">{selectedResource.title}</h2>
                  <p className="text-[11px] text-muted">{selectedResource.type} · {selectedResource.size} · Updated {formatRelativeTime(selectedResource.updatedAt)}</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedResource(null); setPlanContent(null) }}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-raised text-muted hover:text-foreground transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingPlan ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-6 bg-surface-raised rounded w-3/4" />
                  <div className="h-4 bg-surface-raised rounded w-1/2" />
                  <div className="h-4 bg-surface-raised rounded w-5/6" />
                  <div className="h-4 bg-surface-raised rounded w-2/3" />
                  <div className="h-4 bg-surface-raised rounded w-4/5" />
                  <div className="h-4 bg-surface-raised rounded w-3/4" />
                </div>
              ) : planContent ? (
                <div className="prose prose-sm max-w-none text-foreground">
                  {planContent.split('\n').map((line, i) => {
                    if (line.startsWith('# ')) return <h1 key={i} className="text-[24px] font-bold text-foreground mt-6 mb-2">{line.slice(2)}</h1>
                    if (line.startsWith('## ')) return <h2 key={i} className="text-[18px] font-semibold text-foreground mt-5 mb-2">{line.slice(3)}</h2>
                    if (line.startsWith('### ')) return <h3 key={i} className="text-[15px] font-semibold text-foreground mt-4 mb-1">{line.slice(4)}</h3>
                    if (line.startsWith('---')) return <hr key={i} className="my-6 border-border" />
                    if (line.startsWith('- ')) return <li key={i} className="text-[13px] text-foreground ml-4 list-disc">{line.slice(2)}</li>
                    if (line.startsWith('| ')) return <p key={i} className="text-[12px] font-mono text-muted">{line}</p>
                    if (line.startsWith('**')) {
                      const bold = line.replace(/\*\*/g, '')
                      return <p key={i} className="text-[13px] font-semibold text-foreground mt-2">{bold}</p>
                    }
                    if (line.trim() === '') return <div key={i} className="h-2" />
                    return <p key={i} className="text-[13px] text-foreground leading-relaxed">{line}</p>
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-muted">
                  <p>Select a resource to view its contents</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
