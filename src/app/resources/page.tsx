'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppState } from '@/lib/store'
import { Card, Button } from '@/components/ui'
import { formatRelativeTime, cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  FolderOpen, Search, FileText, FileSpreadsheet,
  Image, Code, X, ChevronRight, Target, BookOpen,
  MessageSquare, Upload, Edit3, Save, Plus,
  MessageCircle, Reply, Check,
  History, Hash, Calendar, FileEdit, Clock3,
  ArrowLeft, Maximize2, Minimize2, FilePlus,
  MessageSquarePlus, Eye, FileCode, User
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ResourceFile {
  id: string
  title: string
  type: string
  extension: string
  size: string
  sizeBytes: number
  createdAt: Date
  updatedAt: Date
  uploadedBy: string
  lastEditedBy: string
  version: number
  tags: string[]
  description: string
  content: string
  path: string
  isPublic: boolean
  editHistory: EditHistoryEntry[]
}

interface EditHistoryEntry {
  version: number
  editedBy: string
  editedAt: Date
  summary: string
}

interface LineComment {
  id: string
  fileId: string
  lineNumber: number
  author: string
  authorRole: 'solomon' | 'dawn' | 'agent' | 'team'
  body: string
  createdAt: Date
  updatedAt: Date
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: Date
  replies: LineCommentReply[]
}

interface LineCommentReply {
  id: string
  author: string
  authorRole: 'solomon' | 'dawn' | 'agent' | 'team'
  body: string
  createdAt: Date
}

// ─── Supabase Comment Helpers ───────────────────────────────────────────────

const COMMENTS_TABLE = 'resource_comments'

function rowToComment(row: any): LineComment {
  return {
    id: row.id,
    fileId: row.file_id,
    lineNumber: row.line_number,
    author: row.author,
    authorRole: row.author_role,
    body: row.body,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    resolved: row.resolved,
    resolvedBy: row.resolved_by ?? undefined,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
    replies: Array.isArray(row.replies) ? row.replies.map((r: any) => ({
      id: r.id,
      author: r.author,
      authorRole: r.author_role,
      body: r.body,
      createdAt: new Date(r.created_at),
    })) : [],
  }
}

function commentToRow(c: LineComment) {
  return {
    file_id: c.fileId,
    line_number: c.lineNumber,
    author: c.author,
    author_role: c.authorRole,
    body: c.body,
    resolved: c.resolved,
    resolved_by: c.resolvedBy ?? null,
    resolved_at: c.resolvedAt ? c.resolvedAt.toISOString() : null,
    replies: JSON.stringify(c.replies.map(r => ({
      id: r.id,
      author: r.author,
      author_role: r.authorRole,
      body: r.body,
      created_at: r.createdAt.toISOString(),
    }))),
  }
}

async function fetchCommentsFromDB(): Promise<LineComment[]> {
  const { data, error } = await supabase
    .from(COMMENTS_TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.warn('Failed to fetch comments from Supabase:', error.message)
    return []
  }
  return (data ?? []).map(rowToComment)
}

async function insertCommentToDB(c: LineComment): Promise<LineComment | null> {
  const { data, error } = await supabase
    .from(COMMENTS_TABLE)
    .insert(commentToRow(c))
    .select()
    .single()
  if (error) {
    console.warn('Failed to insert comment:', error.message)
    return null
  }
  return rowToComment(data)
}

async function updateCommentInDB(id: string, updates: Partial<LineComment>): Promise<LineComment | null> {
  const dbUpdates: any = {}
  if (updates.resolved !== undefined) dbUpdates.resolved = updates.resolved
  if (updates.resolvedBy !== undefined) dbUpdates.resolved_by = updates.resolvedBy
  if (updates.resolvedAt !== undefined) dbUpdates.resolved_at = updates.resolvedAt.toISOString()
  if (updates.replies !== undefined) dbUpdates.replies = JSON.stringify(updates.replies.map(r => ({
    id: r.id,
    author: r.author,
    author_role: r.authorRole,
    body: r.body,
    created_at: r.createdAt.toISOString(),
  })))
  const { data, error } = await supabase
    .from(COMMENTS_TABLE)
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()
  if (error) {
    console.warn('Failed to update comment:', error.message)
    return null
  }
  return rowToComment(data)
}

async function deleteCommentFromDB(id: string): Promise<boolean> {
  const { error } = await supabase
    .from(COMMENTS_TABLE)
    .delete()
    .eq('id', id)
  if (error) {
    console.warn('Failed to delete comment:', error.message)
    return false
  }
  return true
}

async function seedCommentsIfEmpty(): Promise<void> {
  const { count, error } = await supabase
    .from(COMMENTS_TABLE)
    .select('*', { count: 'exact', head: true })
  if (error || (count ?? 0) > 0) return

  const now = Date.now()
  const seed = [
    {
      file_id: 'r6', line_number: 8,
      author: 'Solomon', author_role: 'solomon',
      body: "We should add a question about their current tech stack here.",
      resolved: true, resolved_by: 'DAWN', resolved_at: new Date(now - 2 * 86400000).toISOString(),
      replies: JSON.stringify([
        { id: 'c1r1', author: 'DAWN', author_role: 'dawn', body: "Good idea. I'll add \"What CRM/ERP are you currently using?\" as a follow-up.", created_at: new Date(now - 2.5 * 86400000).toISOString() },
        { id: 'c1r2', author: 'Solomon', author_role: 'solomon', body: "Perfect, that's exactly what I was thinking.", created_at: new Date(now - 2 * 86400000).toISOString() },
      ]),
      created_at: new Date(now - 3 * 86400000).toISOString(),
      updated_at: new Date(now - 3 * 86400000).toISOString(),
    },
    {
      file_id: 'r6', line_number: 22,
      author: 'DAWN', author_role: 'dawn',
      body: 'Should we add a section about pricing discussion here? Some clients ask early.',
      resolved: false,
      replies: '[]',
      created_at: new Date(now - 1 * 86400000).toISOString(),
      updated_at: new Date(now - 1 * 86400000).toISOString(),
    },
    {
      file_id: 'r6', line_number: 35,
      author: 'Solomon', author_role: 'solomon',
      body: 'The training session should be 3 hours, not 2. We always run over.',
      resolved: true, resolved_by: 'DAWN', resolved_at: new Date(now - 10 * 86400000).toISOString(),
      replies: JSON.stringify([
        { id: 'c3r1', author: 'DAWN', author_role: 'dawn', body: 'Updated to 3 hours in v3. Also added a 30-min buffer for Q&A.', created_at: new Date(now - 10 * 86400000).toISOString() },
      ]),
      created_at: new Date(now - 12 * 86400000).toISOString(),
      updated_at: new Date(now - 12 * 86400000).toISOString(),
    },
    {
      file_id: 'r7', line_number: 1,
      author: 'Solomon', author_role: 'solomon',
      body: 'This implementation plan looks solid. Let me review the architecture section in detail.',
      resolved: false,
      replies: '[]',
      created_at: new Date(now - 3600000).toISOString(),
      updated_at: new Date(now - 3600000).toISOString(),
    },
  ]

  const { error: insertError } = await supabase.from(COMMENTS_TABLE).insert(seed)
  if (insertError) {
    console.warn('Failed to seed comments:', insertError.message)
  }
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_FILES: ResourceFile[] = [
  {
    id: 'r1', title: 'CRM Adoption Guide.pdf', type: 'Document', extension: 'pdf',
    size: '2.4 MB', sizeBytes: 2400000,
    createdAt: new Date(Date.now() - 14 * 86400000),
    updatedAt: new Date(Date.now() - 2 * 86400000),
    uploadedBy: 'Solomon', lastEditedBy: 'DAWN', version: 3,
    tags: ['CRM', 'Guide'], description: 'Complete guide to CRM adoption for Kampala SMEs',
    content: '', path: '', isPublic: true, editHistory: [
      { version: 1, editedBy: 'Solomon', editedAt: new Date(Date.now() - 14 * 86400000), summary: 'Initial upload' },
      { version: 2, editedBy: 'DAWN', editedAt: new Date(Date.now() - 7 * 86400000), summary: 'Added Kampala-specific examples' },
      { version: 3, editedBy: 'Solomon', editedAt: new Date(Date.now() - 2 * 86400000), summary: 'Final review and formatting' },
    ]
  },
  {
    id: 'r2', title: 'Kampala SME Outreach List.csv', type: 'Spreadsheet', extension: 'csv',
    size: '156 KB', sizeBytes: 156000,
    createdAt: new Date(Date.now() - 10 * 86400000),
    updatedAt: new Date(Date.now() - 3 * 86400000),
    uploadedBy: 'DAWN', lastEditedBy: 'Solomon', version: 2,
    tags: ['Leads', 'Outreach'], description: 'Curated list of 200+ SMEs in Kampala for outreach campaigns',
    content: '', path: '', isPublic: true, editHistory: [
      { version: 1, editedBy: 'DAWN', editedAt: new Date(Date.now() - 10 * 86400000), summary: 'Auto-generated from web scraping' },
      { version: 2, editedBy: 'Solomon', editedAt: new Date(Date.now() - 3 * 86400000), summary: 'Cleaned duplicates, added contact info' },
    ]
  },
  {
    id: 'r3', title: 'Brand Guidelines v2.pdf', type: 'Document', extension: 'pdf',
    size: '8.1 MB', sizeBytes: 8100000,
    createdAt: new Date(Date.now() - 30 * 86400000),
    updatedAt: new Date(Date.now() - 5 * 86400000),
    uploadedBy: 'Solomon', lastEditedBy: 'Solomon', version: 2,
    tags: ['Brand', 'Design'], description: 'Regent brand guidelines including colors, typography, and logo usage',
    content: '', path: '', isPublic: true, editHistory: [
      { version: 1, editedBy: 'Solomon', editedAt: new Date(Date.now() - 30 * 86400000), summary: 'Initial version' },
      { version: 2, editedBy: 'Solomon', editedAt: new Date(Date.now() - 5 * 86400000), summary: 'Updated color palette' },
    ]
  },
  {
    id: 'r4', title: 'Instagram Template Pack.zip', type: 'Archive', extension: 'zip',
    size: '45 MB', sizeBytes: 45000000,
    createdAt: new Date(Date.now() - 21 * 86400000),
    updatedAt: new Date(Date.now() - 7 * 86400000),
    uploadedBy: 'Solomon', lastEditedBy: 'DAWN', version: 1,
    tags: ['Content', 'Social'], description: 'Canva templates for Instagram carousels and stories',
    content: '', path: '', isPublic: true, editHistory: [
      { version: 1, editedBy: 'Solomon', editedAt: new Date(Date.now() - 21 * 86400000), summary: 'Initial upload' },
    ]
  },
  {
    id: 'r5', title: 'Q2 Revenue Report.xlsx', type: 'Spreadsheet', extension: 'xlsx',
    size: '892 KB', sizeBytes: 892000,
    createdAt: new Date(Date.now() - 60 * 86400000),
    updatedAt: new Date(Date.now() - 10 * 86400000),
    uploadedBy: 'DAWN', lastEditedBy: 'DAWN', version: 4,
    tags: ['Reports', 'Revenue'], description: 'Q2 2025 revenue breakdown by client and service line',
    content: '', path: '', isPublic: true, editHistory: [
      { version: 1, editedBy: 'DAWN', editedAt: new Date(Date.now() - 60 * 86400000), summary: 'Auto-generated from CRM data' },
      { version: 2, editedBy: 'Solomon', editedAt: new Date(Date.now() - 45 * 86400000), summary: 'Added client breakdown' },
      { version: 3, editedBy: 'DAWN', editedAt: new Date(Date.now() - 20 * 86400000), summary: 'Updated with May data' },
      { version: 4, editedBy: 'DAWN', editedAt: new Date(Date.now() - 10 * 86400000), summary: 'Final Q2 numbers' },
    ]
  },
  {
    id: 'r6', title: 'Client Onboarding Script.md', type: 'Document', extension: 'md',
    size: '12 KB', sizeBytes: 12000,
    createdAt: new Date(Date.now() - 45 * 86400000),
    updatedAt: new Date(Date.now() - 14 * 86400000),
    uploadedBy: 'Solomon', lastEditedBy: 'DAWN', version: 5,
    tags: ['CRM', 'Process'], description: 'Standardized onboarding script for new Regent clients',
    content: `# Client Onboarding Script

## Phase 1: Discovery Call

1. **Introduction** (5 min)
   - Welcome the client
   - Agenda overview
   - Set expectations

2. **Needs Assessment** (15 min)
   - What are your current pain points?
   - What tools are you using?
   - What's your budget?

3. **Solution Overview** (10 min)
   - Present Regent CRM
   - Show relevant features
   - Share case studies

4. **Next Steps** (5 min)
   - Schedule demo
   - Send proposal
   - Follow-up in 48h

## Phase 2: Demo

> "Show, don't tell. Let them click around."

## Phase 3: Onboarding

- Account setup (24h)
- Data migration (48h)
- Team training (2h session)
- Go-live support (1 week)`,
    path: '', isPublic: true, editHistory: [
      { version: 1, editedBy: 'Solomon', editedAt: new Date(Date.now() - 45 * 86400000), summary: 'Initial draft' },
      { version: 2, editedBy: 'DAWN', editedAt: new Date(Date.now() - 40 * 86400000), summary: 'Added discovery questions' },
      { version: 3, editedBy: 'Solomon', editedAt: new Date(Date.now() - 30 * 86400000), summary: 'Restructured phases' },
      { version: 4, editedBy: 'DAWN', editedAt: new Date(Date.now() - 20 * 86400000), summary: 'Added objection handling' },
      { version: 5, editedBy: 'DAWN', editedAt: new Date(Date.now() - 14 * 86400000), summary: 'Final polish' },
    ]
  },
  {
    id: 'r7', title: 'DAWN Control Center — Implementation Plan', type: 'Plan', extension: 'md',
    size: '26 KB', sizeBytes: 26000,
    createdAt: new Date(Date.now() - 1 * 86400000),
    updatedAt: new Date(Date.now()),
    uploadedBy: 'DAWN', lastEditedBy: 'DAWN', version: 2,
    tags: ['Strategy', 'Product', 'Architecture'],
    description: 'Full implementation plan for the DAWN Control Center evolution — performance, project management, Slack integration, and Palantir-inspired features',
    content: '', path: '/resources/implementation-plan.md', isPublic: true, editHistory: [
      { version: 1, editedBy: 'DAWN', editedAt: new Date(Date.now() - 1 * 86400000), summary: 'Initial research and plan' },
      { version: 2, editedBy: 'DAWN', editedAt: new Date(Date.now()), summary: 'Updated with Solomon feedback' },
    ]
  },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

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

const extColors: Record<string, string> = {
  md: 'bg-blue-500/10 text-blue-400',
  pdf: 'bg-red-500/10 text-red-400',
  csv: 'bg-green-500/10 text-green-400',
  xlsx: 'bg-emerald-500/10 text-emerald-400',
  zip: 'bg-amber-500/10 text-amber-400',
  ts: 'bg-indigo-500/10 text-indigo-400',
  tsx: 'bg-indigo-500/10 text-indigo-400',
  py: 'bg-yellow-500/10 text-yellow-400',
  json: 'bg-gray-500/10 text-gray-400',
}

const roleColors: Record<string, string> = {
  solomon: 'bg-accent text-white',
  dawn: 'bg-purple text-white',
  agent: 'bg-cyan-500 text-white',
  team: 'bg-surface-raised text-foreground',
}

const roleLabels: Record<string, string> = {
  solomon: 'S',
  dawn: 'D',
  agent: 'A',
  team: 'T',
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

function isEditable(ext: string): boolean {
  return ['md', 'txt', 'ts', 'tsx', 'js', 'jsx', 'py', 'json', 'css', 'html', 'yaml', 'yml', 'toml', 'env', 'csv'].includes(ext)
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

// ─── Markdown Renderer ──────────────────────────────────────────────────────

function renderMarkdownLine(line: string, index: number): { html: string; key: number; isCodeBlock?: boolean } {
  if (line.startsWith('# ')) return { html: `<h1 class="text-[22px] font-bold text-foreground mt-6 mb-3">${line.slice(2)}</h1>`, key: index }
  if (line.startsWith('## ')) return { html: `<h2 class="text-[17px] font-semibold text-foreground mt-5 mb-2">${line.slice(3)}</h2>`, key: index }
  if (line.startsWith('### ')) return { html: `<h3 class="text-[14px] font-semibold text-foreground mt-4 mb-1.5">${line.slice(4)}</h3>`, key: index }
  if (line.startsWith('#### ')) return { html: `<h4 class="text-[13px] font-semibold text-foreground mt-3 mb-1">${line.slice(5)}</h4>`, key: index }
  if (line.startsWith('---')) return { html: `<hr class="my-6 border-border" />`, key: index }
  if (line.startsWith('> ')) {
    const content = line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    return { html: `<blockquote class="border-l-2 border-accent pl-4 py-1 my-2 text-[13px] text-muted italic">${content}</blockquote>`, key: index }
  }
  if (line.startsWith('- ')) {
    const content = line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code class="bg-surface-raised px-1 rounded text-[11px] font-mono">$1</code>')
    return { html: `<li class="text-[13px] text-foreground ml-5 list-disc py-0.5">${content}</li>`, key: index }
  }
  if (/^\d+\.\s/.test(line)) {
    const content = line.replace(/^\d+\.\s/, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code class="bg-surface-raised px-1 rounded text-[11px] font-mono">$1</code>')
    return { html: `<li class="text-[13px] text-foreground ml-5 list-decimal py-0.5">${content}</li>`, key: index }
  }
  if (line.startsWith('```')) {
    const lang = line.slice(3).trim()
    return { html: lang ? `<div class="text-[11px] text-muted font-mono mt-3 mb-1">${lang}</div>` : '', key: index, isCodeBlock: true }
  }
  if (line.startsWith('|')) {
    const cells = line.split('|').filter(c => c.trim()).map(c => c.trim())
    const isHeader = line.includes('---')
    if (isHeader) return { html: '', key: index }
    const tag = 'td'
    const cellHtml = cells.map(c => `<${tag} class="px-3 py-1.5 text-[12px] border-b border-border">${c}</${tag}>`).join('')
    return { html: `<tr>${cellHtml}</tr>`, key: index }
  }
  if (line.trim() === '') return { html: '<div class="h-2"></div>', key: index }
  let html = line
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-surface-raised px-1.5 rounded text-[11px] font-mono text-accent">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-accent hover:underline" target="_blank">$1</a>')
  return { html: `<p class="text-[13px] text-foreground leading-relaxed">${html}</p>`, key: index }
}

// ─── Line Comment Thread Component ──────────────────────────────────────────

function LineCommentThread({
  comment,
  onResolve,
  onReply,
  onDelete,
}: {
  comment: LineComment
  onResolve: (id: string) => void
  onReply: (id: string, body: string) => void
  onDelete: (id: string) => void
}) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')

  return (
    <div className={cn(
      'rounded-lg border p-3 mb-2',
      comment.resolved ? 'border-success/30 bg-success/5' : 'border-border bg-surface'
    )}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn(
            'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
            roleColors[comment.authorRole]
          )}>
            {roleLabels[comment.authorRole]}
          </span>
          <span className="text-[12px] font-semibold text-foreground truncate">{comment.author}</span>
          <span className="text-[10px] text-muted shrink-0">{formatRelativeTime(comment.createdAt)}</span>
          {comment.resolved && (
            <span className="flex items-center gap-1 text-[10px] text-success">
              <Check size={10} /> Resolved
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!comment.resolved && (
            <button
              onClick={() => onResolve(comment.id)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-raised text-muted hover:text-success transition-colors"
              title="Resolve"
            >
              <Check size={12} />
            </button>
          )}
          <button
            onClick={() => onDelete(comment.id)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-raised text-muted hover:text-error transition-colors"
            title="Delete"
          >
            <X size={12} />
          </button>
        </div>
      </div>
      <p className="text-[12px] text-foreground leading-relaxed mb-2">{comment.body}</p>
      <div className="flex items-center gap-1 mb-2">
        <Hash size={10} className="text-muted" />
        <span className="text-[10px] text-muted font-mono">Line {comment.lineNumber}</span>
      </div>
      {comment.replies.length > 0 && (
        <div className="ml-4 pl-3 border-l border-border space-y-2 mb-2">
          {comment.replies.map(reply => (
            <div key={reply.id} className="flex items-start gap-2">
              <span className={cn(
                'w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 mt-0.5',
                roleColors[reply.authorRole]
              )}>
                {roleLabels[reply.authorRole]}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-foreground">{reply.author}</span>
                  <span className="text-[9px] text-muted">{formatRelativeTime(reply.createdAt)}</span>
                </div>
                <p className="text-[11px] text-foreground/80">{reply.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {replyOpen ? (
        <div className="flex items-start gap-2">
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="flex-1 min-h-[60px] px-2.5 py-1.5 rounded-lg border border-border bg-base text-[12px] text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (replyText.trim()) {
                  onReply(comment.id, replyText.trim())
                  setReplyText('')
                  setReplyOpen(false)
                }
              }
            }}
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                if (replyText.trim()) {
                  onReply(comment.id, replyText.trim())
                  setReplyText('')
                  setReplyOpen(false)
                }
              }}
              className="w-7 h-7 flex items-center justify-center rounded bg-accent text-white hover:bg-accent/90 transition-colors"
            >
              <Check size={12} />
            </button>
            <button
              onClick={() => { setReplyOpen(false); setReplyText('') }}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-raised text-muted transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setReplyOpen(true)}
          className="flex items-center gap-1 text-[11px] text-muted hover:text-foreground transition-colors"
        >
          <Reply size={10} />
          Reply
        </button>
      )}
    </div>
  )
}

// ─── File Editor Component ──────────────────────────────────────────────────

function FileEditor({
  file,
  content,
  onSave,
  onCancel,
}: {
  file: ResourceFile
  content: string
  onSave: (content: string) => void
  onCancel: () => void
}) {
  const [editedContent, setEditedContent] = useState(content)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const ext = getFileExtension(file.title)

  useEffect(() => { setEditedContent(content) }, [content])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(0, 0)
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); onSave(editedContent) }
      if (e.key === 'Escape') { onCancel() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editedContent, onSave, onCancel])

  const lineCount = editedContent.split('\n').length

  return (
    <div className={cn(
      'flex flex-col bg-base rounded-lg border border-border overflow-hidden',
      isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : 'flex-1'
    )}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-2">
          <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-mono font-medium', extColors[ext] || 'bg-surface-raised text-muted')}>.{ext}</span>
          <span className="text-[11px] text-muted">{lineCount} lines</span>
          <span className="text-[11px] text-muted">{editedContent.length.toLocaleString()} chars</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-raised text-muted hover:text-foreground transition-colors" title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          <button onClick={onCancel} className="px-2.5 py-1 text-[11px] text-muted hover:text-foreground transition-colors">Cancel</button>
          <button onClick={() => onSave(editedContent)} className="px-3 py-1 text-[11px] font-medium bg-accent text-white rounded hover:bg-accent/90 transition-colors flex items-center gap-1.5">
            <Save size={12} /> Save
          </button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="select-none px-3 py-3 text-right text-[11px] font-mono text-muted/40 border-r border-border bg-surface/50 shrink-0 leading-[20px]">
          {Array.from({ length: lineCount }, (_, i) => <div key={i} className="hover:text-muted/70 transition-colors">{i + 1}</div>)}
        </div>
        <textarea
          ref={textareaRef}
          value={editedContent}
          onChange={e => setEditedContent(e.target.value)}
          className="flex-1 px-4 py-3 bg-transparent text-[13px] font-mono text-foreground leading-[20px] resize-none focus:outline-none border-0"
          spellCheck={false}
          style={{ tabSize: 2 }}
        />
      </div>
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-surface/50 shrink-0">
        <div className="flex items-center gap-3 text-[10px] text-muted">
          <span>UTF-8</span>
          <span>{ext === 'md' ? 'Markdown' : ext.toUpperCase()}</span>
          <span>Spaces: 2</span>
        </div>
        <div className="text-[10px] text-muted">{content !== editedContent ? 'Unsaved changes' : 'Saved'}</div>
      </div>
    </div>
  )
}

// ─── Markdown Preview Component ─────────────────────────────────────────────

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split('\n')
  const renderedLines: { html: string; key: number; isCodeBlock?: boolean }[] = []
  let inCodeBlock = false
  let codeContent = ''
  let codeLang = ''
  let codeStartIndex = 0

  lines.forEach((line, index) => {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        renderedLines.push({
          html: `<pre class="bg-surface-raised rounded-lg p-4 overflow-x-auto my-3"><code class="text-[12px] font-mono leading-relaxed text-foreground">${codeContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`,
          key: codeStartIndex,
        })
        codeContent = ''
        inCodeBlock = false
      } else {
        codeLang = line.slice(3).trim()
        codeStartIndex = index
        inCodeBlock = true
      }
      return
    }
    if (inCodeBlock) { codeContent += (codeContent ? '\n' : '') + line; return }
    if (line.startsWith('|') && lines[index + 1]?.startsWith('|')) {
      if (lines[index + 1]?.includes('---')) {
        const headers = line.split('|').filter(c => c.trim()).map(c => c.trim())
        renderedLines.push({
          html: `<table class="w-full border-collapse my-3"><thead><tr>${headers.map(h => `<th class="px-3 py-2 text-[12px] font-semibold text-foreground text-left border-b-2 border-border bg-surface/50">${h}</th>`).join('')}</tr></thead><tbody>`,
          key: index,
        })
        return
      }
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim())
      renderedLines.push({ html: `<tr>${cells.map(c => `<td class="px-3 py-1.5 text-[12px] text-foreground border-b border-border">${c}</td>`).join('')}</tr>`, key: index })
      return
    }
    if (renderedLines.length > 0 && renderedLines[renderedLines.length - 1].html.startsWith('<tr>') && !line.startsWith('|')) {
      renderedLines.push({ html: '</tbody></table>', key: index })
    }
    const result = renderMarkdownLine(line, index)
    renderedLines.push(result)
  })

  if (inCodeBlock) {
    renderedLines.push({
      html: `<pre class="bg-surface-raised rounded-lg p-4 overflow-x-auto my-3"><code class="text-[12px] font-mono leading-relaxed text-foreground">${codeContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`,
      key: codeStartIndex,
    })
  }

  return (
    <div className="prose prose-sm max-w-none">
      {renderedLines.map(({ html, key }) => <div key={key} dangerouslySetInnerHTML={{ __html: html }} />)}
    </div>
  )
}

// ─── File Viewer Modal ──────────────────────────────────────────────────────

function FileViewerModal({
  file,
  fileContent,
  loadingFile,
  isEditing,
  editedContent,
  comments,
  showComments,
  showHistory,
  activeTab,
  unresolvedCount,
  fileComments,
  onClose,
  onStartEdit,
  onSave,
  onCancelEdit,
  onToggleComments,
  onToggleHistory,
  onSetActiveTab,
  onAddComment,
  onResolveComment,
  onReplyToComment,
  onDeleteComment,
  onNewCommentLine,
  newCommentLine,
  newCommentText,
  onNewCommentTextChange,
  onSubmitComment,
}: {
  file: ResourceFile
  fileContent: string | null
  loadingFile: boolean
  isEditing: boolean
  editedContent: string
  comments: LineComment[]
  showComments: boolean
  showHistory: boolean
  activeTab: 'preview' | 'edit' | 'comments'
  unresolvedCount: number
  fileComments: LineComment[]
  onClose: () => void
  onStartEdit: () => void
  onSave: (content: string) => void
  onCancelEdit: () => void
  onToggleComments: () => void
  onToggleHistory: () => void
  onSetActiveTab: (tab: 'preview' | 'edit' | 'comments') => void
  onAddComment: (lineNumber: number) => void
  onResolveComment: (id: string) => void
  onReplyToComment: (id: string, body: string) => void
  onDeleteComment: (id: string) => void
  onNewCommentLine: (line: number | null) => void
  newCommentLine: number | null
  newCommentText: string
  onNewCommentTextChange: (text: string) => void
  onSubmitComment: () => void
}) {
  const ext = getFileExtension(file.title)
  const editable = isEditable(ext)
  const isMd = ext === 'md'
  const [viewMode, setViewMode] = useState<'read' | 'code'>('read')
  const commentInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { if (newCommentLine && commentInputRef.current) commentInputRef.current.focus() }, [newCommentLine])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[85vh] bg-base border border-border rounded-xl shadow-2xl flex flex-col z-10 animate-fade-in">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-raised text-muted hover:text-foreground transition-colors shrink-0">
              <ArrowLeft size={14} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-[14px] font-semibold text-foreground truncate">{file.title}</h2>
                <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-mono font-medium', extColors[ext] || 'bg-surface-raised text-muted')}>.{ext}</span>
                <span className="px-1.5 py-0.5 rounded bg-accent-light text-accent text-[9px] font-medium">v{file.version}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted mt-0.5">
                <span className="flex items-center gap-1"><User size={9} />{file.uploadedBy}</span>
                <span>Uploaded {formatRelativeTime(file.createdAt)}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Edit3 size={9} />{file.lastEditedBy}</span>
                <span>Edited {formatRelativeTime(file.updatedAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {editable && !isEditing && (
              <button onClick={onStartEdit} className="px-2.5 py-1.5 text-[11px] font-medium bg-accent text-white rounded hover:bg-accent/90 transition-colors flex items-center gap-1.5">
                <Edit3 size={12} /> Edit
              </button>
            )}
            <button onClick={onToggleHistory} className={cn('w-7 h-7 flex items-center justify-center rounded transition-colors', showHistory ? 'bg-accent-light text-accent' : 'hover:bg-surface-raised text-muted hover:text-foreground')} title="Edit history">
              <History size={13} />
            </button>
            <button onClick={onToggleComments} className={cn('w-7 h-7 flex items-center justify-center rounded transition-colors relative', showComments ? 'bg-accent-light text-accent' : 'hover:bg-surface-raised text-muted hover:text-foreground')} title="Toggle comments">
              <MessageCircle size={13} />
              {unresolvedCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-warning text-[8px] font-bold text-white flex items-center justify-center">{unresolvedCount}</span>}
            </button>
          </div>
        </div>

        {editable && !isEditing && (
          <div className="flex items-center border-b border-border px-5 shrink-0">
            <button onClick={() => onSetActiveTab('preview')} className={cn('px-3 py-2 text-[11px] font-medium border-b-2 transition-colors', activeTab === 'preview' ? 'border-accent text-foreground' : 'border-transparent text-muted hover:text-foreground')}>Preview</button>
            <button onClick={() => onSetActiveTab('edit')} className={cn('px-3 py-2 text-[11px] font-medium border-b-2 transition-colors', activeTab === 'edit' ? 'border-accent text-foreground' : 'border-transparent text-muted hover:text-foreground')}>Edit</button>
            <button onClick={() => onSetActiveTab('comments')} className={cn('px-3 py-2 text-[11px] font-medium border-b-2 transition-colors flex items-center gap-1.5', activeTab === 'comments' ? 'border-accent text-foreground' : 'border-transparent text-muted hover:text-foreground')}>
              <MessageCircle size={11} /> Comments
              {unresolvedCount > 0 && <span className="px-1 py-0.5 rounded-full bg-warning/20 text-warning text-[9px] font-medium">{unresolvedCount}</span>}
            </button>
          </div>
        )}

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className={cn('flex-1 overflow-y-auto', showComments && activeTab !== 'comments' ? 'border-r border-border' : '')}>
            {loadingFile ? (
              <div className="p-6 space-y-3 animate-pulse">
                <div className="h-5 bg-surface-raised rounded w-3/4" />
                <div className="h-3 bg-surface-raised rounded w-1/2" />
                <div className="h-3 bg-surface-raised rounded w-5/6" />
                <div className="h-3 bg-surface-raised rounded w-2/3" />
                <div className="h-3 bg-surface-raised rounded w-4/5" />
              </div>
            ) : isEditing ? (
              <div className="p-4">
                <FileEditor file={file} content={editedContent} onSave={onSave} onCancel={onCancelEdit} />
              </div>
            ) : fileContent ? (
              <div className="p-5">
                {activeTab === 'comments' ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[13px] font-semibold text-foreground">Comments ({fileComments.length})</h3>
                      {unresolvedCount > 0 && <span className="text-[11px] text-warning">{unresolvedCount} unresolved</span>}
                    </div>
                    {fileComments.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare size={24} className="mx-auto text-muted mb-2" />
                        <p className="text-[12px] text-muted">No comments yet. Select a line in the file to add one.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {fileComments.map(comment => (
                          <LineCommentThread key={comment.id} comment={comment} onResolve={onResolveComment} onReply={onReplyToComment} onDelete={onDeleteComment} />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    {isMd && (
                      <div className="flex items-center gap-1 mb-3 border-b border-border pb-2">
                        <button onClick={() => setViewMode('read')} className={cn('px-2.5 py-1 text-[11px] font-medium rounded transition-colors flex items-center gap-1.5', viewMode === 'read' ? 'bg-accent-light text-accent' : 'text-muted hover:text-foreground')}>
                          <Eye size={12} /> Read
                        </button>
                        <button onClick={() => setViewMode('code')} className={cn('px-2.5 py-1 text-[11px] font-medium rounded transition-colors flex items-center gap-1.5', viewMode === 'code' ? 'bg-accent-light text-accent' : 'text-muted hover:text-foreground')}>
                          <FileCode size={12} /> Code
                        </button>
                      </div>
                    )}
                    <div className="flex">
                      <div className="select-none text-right text-[11px] font-mono text-muted/30 leading-[22px] pr-3 shrink-0">
                        {fileContent.split('\n').map((_, i) => (
                          <div key={i} className="relative group cursor-pointer hover:text-accent transition-colors" onClick={() => { onNewCommentLine(i + 1); onSetActiveTab('preview') }} title="Comment on this line">
                            {i + 1}
                            <span className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MessageSquarePlus size={10} className="text-accent" />
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        {isMd && viewMode === 'read' ? <MarkdownPreview content={fileContent} /> : <pre className="text-[12px] font-mono text-foreground leading-[22px] whitespace-pre-wrap">{fileContent}</pre>}
                      </div>
                    </div>
                    {newCommentLine && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-start gap-2">
                          <div className="flex items-center gap-1.5 shrink-0 mt-1.5">
                            <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold">S</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] font-semibold text-foreground">Comment on line {newCommentLine}</span>
                              <button onClick={() => onNewCommentLine(null)} className="text-[10px] text-muted hover:text-foreground transition-colors">Cancel</button>
                            </div>
                            <textarea
                              ref={commentInputRef}
                              value={newCommentText}
                              onChange={e => onNewCommentTextChange(e.target.value)}
                              placeholder="Write a comment..."
                              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[12px] text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent resize-none min-h-[60px]"
                              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmitComment() } }}
                            />
                            <div className="flex items-center justify-end gap-1.5 mt-1.5">
                              <button onClick={() => onNewCommentLine(null)} className="px-2 py-1 text-[10px] text-muted hover:text-foreground transition-colors">Cancel</button>
                              <button onClick={onSubmitComment} disabled={!newCommentText.trim()} className="px-3 py-1 text-[10px] font-medium bg-accent text-white rounded hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Comment</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted p-6">
                <p className="text-[13px]">Select a resource to view its contents</p>
              </div>
            )}
          </div>

          {showComments && !isEditing && activeTab !== 'comments' && (
            <div className="w-[320px] shrink-0 overflow-y-auto bg-surface/30">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[12px] font-semibold text-foreground flex items-center gap-1.5"><MessageCircle size={12} /> Comments</h3>
                  <span className="text-[10px] text-muted">{unresolvedCount > 0 ? `${unresolvedCount} open` : 'All resolved'}</span>
                </div>
                {fileComments.length === 0 ? (
                  <div className="text-center py-6">
                    <MessageSquare size={20} className="mx-auto text-muted mb-2" />
                    <p className="text-[11px] text-muted">No comments yet</p>
                    <p className="text-[10px] text-muted mt-1">Click a line number to add one</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fileComments.slice(0, 10).map(comment => (
                      <LineCommentThread key={comment.id} comment={comment} onResolve={onResolveComment} onReply={onReplyToComment} onDelete={onDeleteComment} />
                    ))}
                    {fileComments.length > 10 && (
                      <button onClick={() => onSetActiveTab('comments')} className="w-full text-center text-[11px] text-accent hover:underline py-2">View all {fileComments.length} comments</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-2.5 border-t border-border bg-surface/30 shrink-0">
          <div className="flex items-center gap-4 text-[10px] text-muted">
            <span className="flex items-center gap-1"><User size={10} /> Uploaded by {file.uploadedBy}</span>
            <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(file.createdAt)}</span>
            <span className="flex items-center gap-1"><Edit3 size={10} /> Last edited by {file.lastEditedBy}</span>
            <span className="flex items-center gap-1"><Clock3 size={10} /> {formatRelativeTime(file.updatedAt)}</span>
            <span className="flex items-center gap-1"><Hash size={10} /> v{file.version}</span>
          </div>
          <div className="flex items-center gap-2">
            {file.tags.map(tag => <span key={tag} className="px-1.5 py-0.5 rounded bg-surface-raised text-[9px] text-muted">{tag}</span>)}
          </div>
        </div>

        {showHistory && (
          <div className="border-t border-border p-4 bg-surface/20 shrink-0 max-h-[200px] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-foreground flex items-center gap-1.5"><History size={13} /> Edit History</h3>
              <button onClick={onToggleHistory} className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-raised text-muted transition-colors"><X size={12} /></button>
            </div>
            <div className="space-y-2">
              {file.editHistory.slice().reverse().map((entry, i) => (
                <div key={i} className="flex items-start gap-3 pb-2 border-b border-border last:border-0 last:pb-0">
                  <div className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold shrink-0">{entry.editedBy[0]}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-foreground">{entry.editedBy}</span>
                      <span className="text-[10px] text-muted">{formatRelativeTime(entry.editedAt)}</span>
                      <span className="px-1 py-0.5 rounded bg-surface-raised text-[9px] text-muted font-mono">v{entry.version}</span>
                    </div>
                    <p className="text-[11px] text-foreground/70 mt-0.5">{entry.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page Component ────────────────────────────────────────────────────

export default function ResourcesPage() {
  const { state, addNotification, addActivity } = useAppState()
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<ResourceFile | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [loadingFile, setLoadingFile] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [comments, setComments] = useState<LineComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [showComments, setShowComments] = useState(true)
  const [newCommentLine, setNewCommentLine] = useState<number | null>(null)
  const [newCommentText, setNewCommentText] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadData, setUploadData] = useState({ title: '', description: '', tags: '' })
  const [showHistory, setShowHistory] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'edit' | 'comments'>('preview')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load comments from Supabase on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await seedCommentsIfEmpty()
      const dbComments = await fetchCommentsFromDB()
      if (!cancelled) {
        setComments(dbComments)
        setCommentsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const allTags = Array.from(new Set(MOCK_FILES.flatMap(r => r.tags)))

  const filtered = MOCK_FILES.filter(r => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.description.toLowerCase().includes(search.toLowerCase())) return false
    if (filterTag && !r.tags.includes(filterTag)) return false
    return true
  })

  const handleOpen = useCallback(async (file: ResourceFile) => {
    setSelectedFile(file)
    setShowComments(true)
    setActiveTab('preview')
    setIsEditing(false)
    setShowHistory(false)
    setNewCommentLine(null)
    setNewCommentText('')

    if (file.path) {
      setLoadingFile(true)
      try {
        const res = await fetch(file.path)
        const text = await res.text()
        if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
          setFileContent(file.content || '// File content not available for preview')
        } else {
          setFileContent(text)
        }
      } catch (e) {
        setFileContent(file.content || '// Error loading file content')
      }
      setLoadingFile(false)
    } else if (file.content) {
      setFileContent(file.content)
    } else {
      setFileContent('// Binary file — preview not available')
    }
  }, [])

  const handleSave = useCallback((newContent: string) => {
    if (!selectedFile) return
    setFileContent(newContent)
    setIsEditing(false)
    setActiveTab('preview')
    const idx = MOCK_FILES.findIndex(f => f.id === selectedFile.id)
    if (idx !== -1) {
      MOCK_FILES[idx] = {
        ...MOCK_FILES[idx],
        content: newContent,
        updatedAt: new Date(),
        lastEditedBy: 'Solomon',
        version: MOCK_FILES[idx].version + 1,
        editHistory: [
          ...MOCK_FILES[idx].editHistory,
          { version: MOCK_FILES[idx].version + 1, editedBy: 'Solomon', editedAt: new Date(), summary: 'Edited in Control Center' }
        ]
      }
      setSelectedFile(MOCK_FILES[idx])
    }
    addNotification({ type: 'update', icon: 'CheckCircle', title: 'File saved', description: `${selectedFile.title} updated`, timestamp: new Date(), screen: '/resources' })
    addActivity({ badge: 'TASK_COMPLETE', title: 'File edited', description: `${selectedFile.title} updated to v${MOCK_FILES[idx]?.version || '?'}` })
  }, [selectedFile, addNotification, addActivity])

  // Submit comment — writes to Supabase
  const handleSubmitComment = useCallback(async () => {
    if (!selectedFile || !newCommentText.trim() || !newCommentLine) return
    const comment: LineComment = {
      id: generateId(),
      fileId: selectedFile.id,
      lineNumber: newCommentLine,
      author: 'Solomon',
      authorRole: 'solomon',
      body: newCommentText.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      resolved: false,
      replies: [],
    }
    const saved = await insertCommentToDB(comment)
    if (saved) {
      setComments(prev => [saved, ...prev])
    } else {
      setComments(prev => [comment, ...prev])
    }
    setNewCommentText('')
    setNewCommentLine(null)
    addNotification({ type: 'update', icon: 'MessageSquare', title: 'Comment added', description: `Line ${newCommentLine}: ${comment.body.slice(0, 60)}...`, timestamp: new Date(), screen: '/resources' })
  }, [selectedFile, newCommentText, newCommentLine, addNotification])

  // Resolve comment — writes to Supabase
  const handleResolveComment = useCallback(async (commentId: string) => {
    const now = new Date()
    const updated = await updateCommentInDB(commentId, { resolved: true, resolvedBy: 'Solomon', resolvedAt: now })
    if (updated) {
      setComments(prev => prev.map(c => c.id === commentId ? updated : c))
    } else {
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, resolved: true, resolvedBy: 'Solomon', resolvedAt: now } : c
      ))
    }
  }, [])

  // Reply to comment — writes to Supabase
  const handleReplyToComment = useCallback(async (commentId: string, body: string) => {
    const reply: LineCommentReply = {
      id: generateId(),
      author: 'Solomon',
      authorRole: 'solomon',
      body,
      createdAt: new Date(),
    }
    const existing = comments.find(c => c.id === commentId)
    if (existing) {
      const newReplies = [...existing.replies, reply]
      const updated = await updateCommentInDB(commentId, { replies: newReplies })
      if (updated) {
        setComments(prev => prev.map(c => c.id === commentId ? updated : c))
      } else {
        setComments(prev => prev.map(c =>
          c.id === commentId ? { ...c, replies: newReplies } : c
        ))
      }
    }
  }, [comments])

  // Delete comment — writes to Supabase
  const handleDeleteComment = useCallback(async (commentId: string) => {
    const ok = await deleteCommentFromDB(commentId)
    if (ok) {
      setComments(prev => prev.filter(c => c.id !== commentId))
    } else {
      setComments(prev => prev.filter(c => c.id !== commentId))
    }
  }, [])

  const handleUpload = useCallback(() => {
    if (!uploadData.title) return
    const newFile: ResourceFile = {
      id: generateId(),
      title: uploadData.title,
      type: 'Document',
      extension: getFileExtension(uploadData.title),
      size: '0 B',
      sizeBytes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      uploadedBy: 'Solomon',
      lastEditedBy: 'Solomon',
      version: 1,
      tags: uploadData.tags.split(',').map(t => t.trim()).filter(Boolean),
      description: uploadData.description,
      content: '',
      path: '',
      isPublic: true,
      editHistory: [{ version: 1, editedBy: 'Solomon', editedAt: new Date(), summary: 'Initial upload' }],
    }
    MOCK_FILES.unshift(newFile)
    setShowUploadModal(false)
    setUploadData({ title: '', description: '', tags: '' })
    addNotification({ type: 'completed', icon: 'Upload', title: 'File uploaded', description: newFile.title, timestamp: new Date(), screen: '/resources' })
  }, [uploadData, addNotification])

  const fileComments = comments.filter(c => c.fileId === selectedFile?.id).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  const unresolvedCount = fileComments.filter(c => !c.resolved).length

  return (
    <div className="max-w-content mx-auto px-4 md:px-8 py-6 md:py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold text-foreground">Resource Hub</h1>
          <p className="text-[13px] text-muted mt-1">{MOCK_FILES.length} resources · {MOCK_FILES.reduce((sum, f) => sum + f.editHistory.length, 0)} total edits</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowUploadModal(true)}>
            <Upload size={14} /> Upload
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Search resources..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {allTags.map(tag => (
            <button key={tag} onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className={cn('px-2.5 py-1 rounded text-[11px] font-medium border transition-colors',
                filterTag === tag ? 'border-accent bg-accent-light text-accent' : 'border-border bg-surface text-muted hover:text-foreground')}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <FolderOpen size={40} className="mx-auto text-muted mb-3" />
            <p className="text-[14px] text-muted">No resources found.</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => setShowUploadModal(true)}>
              <Plus size={14} /> Upload your first resource
            </Button>
          </Card>
        ) : (
          filtered.map(resource => {
            const ext = getFileExtension(resource.title)
            const fileCommentCount = comments.filter(c => c.fileId === resource.id).length
            const fileUnresolved = comments.filter(c => c.fileId === resource.id && !c.resolved).length
            return (
              <div key={resource.id}
                className={cn('bg-base border border-border rounded-[8px] p-3 flex items-center gap-3 transition-colors cursor-pointer',
                  selectedFile?.id === resource.id ? 'border-accent/50 bg-accent/5' : 'hover:border-accent/30')}
                onClick={() => handleOpen(resource)}>
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                  extColors[ext] || typeColors[resource.type] || 'bg-surface-raised text-muted')}>
                  {ext === 'md' ? <FileText size={15} /> : ext === 'pdf' ? <FileText size={15} /> : ext === 'csv' || ext === 'xlsx' ? <FileSpreadsheet size={15} /> : ext === 'zip' ? <FolderOpen size={15} /> : typeIcons[resource.type] || <FileText size={15} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[12px] font-semibold text-foreground truncate">{resource.title}</h3>
                    {isEditable(ext) && <FileEdit size={10} className="text-muted shrink-0" />}
                  </div>
                  <p className="text-[10px] text-muted mt-0.5 line-clamp-1">{resource.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted mt-1">
                    <span className={cn('px-1 py-0.5 rounded text-[9px] font-mono', extColors[ext] || 'bg-surface-raised text-muted')}>.{ext}</span>
                    <span>{resource.size}</span>
                    <span>v{resource.version}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><User size={9} />{resource.lastEditedBy}</span>
                    {fileCommentCount > 0 && (
                      <><span>·</span>
                        <span className={cn('flex items-center gap-1', fileUnresolved > 0 ? 'text-warning' : 'text-muted')}>
                          <MessageCircle size={9} />
                          {fileUnresolved > 0 ? `${fileUnresolved} open` : `${fileCommentCount}`}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight size={14} className="text-muted shrink-0" />
              </div>
            )
          })
        )}
      </div>

      {selectedFile && (
        <FileViewerModal
          file={selectedFile}
          fileContent={fileContent}
          loadingFile={loadingFile}
          isEditing={isEditing}
          editedContent={editedContent}
          comments={comments}
          showComments={showComments}
          showHistory={showHistory}
          activeTab={activeTab}
          unresolvedCount={unresolvedCount}
          fileComments={fileComments}
          onClose={() => { setSelectedFile(null); setFileContent(null); setIsEditing(false); setNewCommentLine(null) }}
          onStartEdit={() => { setIsEditing(true); setEditedContent(fileContent || ''); setActiveTab('edit') }}
          onSave={handleSave}
          onCancelEdit={() => { setIsEditing(false); setActiveTab('preview') }}
          onToggleComments={() => setShowComments(!showComments)}
          onToggleHistory={() => setShowHistory(!showHistory)}
          onSetActiveTab={setActiveTab}
          onAddComment={handleSubmitComment}
          onResolveComment={handleResolveComment}
          onReplyToComment={handleReplyToComment}
          onDeleteComment={handleDeleteComment}
          onNewCommentLine={setNewCommentLine}
          newCommentLine={newCommentLine}
          newCommentText={newCommentText}
          onNewCommentTextChange={setNewCommentText}
          onSubmitComment={handleSubmitComment}
        />
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowUploadModal(false)} />
          <div className="relative w-full max-w-md bg-base border border-border rounded-xl shadow-2xl p-6 z-10 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-foreground flex items-center gap-2"><Upload size={16} /> Upload Resource</h2>
              <button onClick={() => setShowUploadModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-raised text-muted transition-colors"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent/50 transition-colors">
                <FilePlus size={24} className="mx-auto text-muted mb-2" />
                <p className="text-[12px] text-muted">Click to select a file</p>
                <p className="text-[10px] text-muted mt-1">or drag and drop</p>
                <input ref={fileInputRef} type="file" className="hidden" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-foreground mb-1">Title</label>
                <input type="text" value={uploadData.title} onChange={e => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Q3 Marketing Plan.pdf"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-foreground mb-1">Description</label>
                <textarea value={uploadData.description} onChange={e => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this resource..." rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-foreground mb-1">Tags (comma separated)</label>
                <input type="text" value={uploadData.tags} onChange={e => setUploadData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g. Marketing, Q3, Reports"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">
              <Button variant="secondary" size="sm" onClick={() => setShowUploadModal(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleUpload} disabled={!uploadData.title}><Upload size={14} /> Upload</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
