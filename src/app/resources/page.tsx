'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui'
import { formatRelativeTime, cn } from '@/lib/utils'
import {
  FolderOpen, Search, FileText, FileSpreadsheet,
  Image, Code, X, Eye, ChevronRight, Target, BookOpen,
  Archive, Link as LinkIcon, AlertCircle, Download,
  ExternalLink, Clock, Tag, Type, List, CheckSquare,
  Terminal, Table as TableIcon, Quote, Hash, Bold,
  Italic, Code2, ListOrdered, Minus, ChevronDown
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────

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

// ─── Markdown Renderer ───────────────────────────────────────────────

interface MarkdownToken {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'li' | 'ol' | 'code' | 'codeblock'
    | 'hr' | 'blockquote' | 'table' | 'empty' | 'html'
  content: string
  lang?: string
  rows?: string[][]
}

function tokenizeMarkdown(text: string): MarkdownToken[] {
  const lines = text.split('\n')
  const tokens: MarkdownToken[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code block (```)
    if (line.trimStart().startsWith('```')) {
      const lang = line.trimStart().slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      tokens.push({ type: 'codeblock', content: codeLines.join('\n'), lang: lang || undefined })
      i++ // skip closing ```
      continue
    }

    // HTML comment or tag
    if (line.trimStart().startsWith('<!--') || line.trimStart().startsWith('<')) {
      tokens.push({ type: 'html', content: line })
      i++
      continue
    }

    // Headings
    const hMatch = line.match(/^(#{1,4})\s+(.+)$/)
    if (hMatch) {
      const level = hMatch[1].length as 1 | 2 | 3 | 4
      const typeMap = { 1: 'h1' as const, 2: 'h2' as const, 3: 'h3' as const, 4: 'h4' as const }
      tokens.push({ type: typeMap[level], content: hMatch[2] })
      i++
      continue
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line) || /^\*\*\*+\s*$/.test(line)) {
      tokens.push({ type: 'hr', content: '' })
      i++
      continue
    }

    // Blockquote
    if (line.trimStart().startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].trimStart().startsWith('> ')) {
        quoteLines.push(lines[i].trimStart().slice(2))
        i++
      }
      tokens.push({ type: 'blockquote', content: quoteLines.join('\n') })
      continue
    }

    // Table
    if (line.includes('|') && line.trimStart().startsWith('|')) {
      const tableRows: string[][] = []
      while (i < lines.length && lines[i].includes('|')) {
        const cells = lines[i].split('|').filter(c => c.trim()).map(c => c.trim())
        // Skip separator rows (| --- | --- |)
        if (!cells.every(c => /^[-:]+$/.test(c.replace(/\s/g, '')))) {
          tableRows.push(cells)
        }
        i++
      }
      if (tableRows.length > 0) {
        tokens.push({ type: 'table', content: '', rows: tableRows })
      }
      continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(line.trimStart())) {
      const listLines: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trimStart())) {
        listLines.push(lines[i].trimStart().replace(/^\d+\.\s/, ''))
        i++
      }
      tokens.push({ type: 'ol', content: listLines.join('\n') })
      continue
    }

    // Unordered list
    if (/^[-*+]\s/.test(line.trimStart())) {
      const listLines: string[] = []
      while (i < lines.length && /^[-*+]\s/.test(lines[i].trimStart())) {
        listLines.push(lines[i].trimStart().replace(/^[-*+]\s/, ''))
        i++
      }
      tokens.push({ type: 'li', content: listLines.join('\n') })
      continue
    }

    // Empty line
    if (line.trim() === '') {
      tokens.push({ type: 'empty', content: '' })
      i++
      continue
    }

    // Paragraph
    tokens.push({ type: 'p', content: line })
    i++
  }

  return tokens
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Process inline formatting: **bold**, *italic*, `code`, [link](url)
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/)
    if (boldMatch) {
      parts.push(<strong key={key++} className="font-semibold">{boldMatch[1]}</strong>)
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // Italic: *text*
    const italicMatch = remaining.match(/^\*(.+?)\*/)
    if (italicMatch) {
      parts.push(<em key={key++} className="italic">{italicMatch[1]}</em>)
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // Inline code: `code`
    const codeMatch = remaining.match(/^`(.+?)`/)
    if (codeMatch) {
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 rounded bg-surface-raised text-[12px] font-mono text-accent">
          {codeMatch[1]}
        </code>
      )
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }

    // Link: [text](url)
    const linkMatch = remaining.match(/^\[(.+?)\]\((.+?)\)/)
    if (linkMatch) {
      parts.push(
        <a key={key++} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
           className="text-accent hover:underline">
          {linkMatch[1]}
          <ExternalLink size={10} className="inline ml-0.5" />
        </a>
      )
      remaining = remaining.slice(linkMatch[0].length)
      continue
    }

    // Regular text up to next special char
    const nextSpecial = remaining.search(/[*`\[]/)
    if (nextSpecial === 0) {
      // Shouldn't happen, but safety
      parts.push(remaining[0])
      remaining = remaining.slice(1)
    } else if (nextSpecial > 0) {
      parts.push(remaining.slice(0, nextSpecial))
      remaining = remaining.slice(nextSpecial)
    } else {
      parts.push(remaining)
      remaining = ''
    }
  }

  return parts
}

function MarkdownRenderer({ content }: { content: string }) {
  const tokens = useMemo(() => tokenizeMarkdown(content), [content])

  return (
    <div className="space-y-3">
      {tokens.map((token, i) => {
        switch (token.type) {
          case 'h1':
            return (
              <h1 key={i} className="text-[22px] font-bold text-foreground mt-8 mb-3 pb-2 border-b border-border">
                {renderInlineMarkdown(token.content)}
              </h1>
            )
          case 'h2':
            return (
              <h2 key={i} className="text-[17px] font-semibold text-foreground mt-6 mb-2">
                {renderInlineMarkdown(token.content)}
              </h2>
            )
          case 'h3':
            return (
              <h3 key={i} className="text-[14px] font-semibold text-foreground mt-5 mb-1.5">
                {renderInlineMarkdown(token.content)}
              </h3>
            )
          case 'h4':
            return (
              <h4 key={i} className="text-[13px] font-semibold text-foreground mt-4 mb-1">
                {renderInlineMarkdown(token.content)}
              </h4>
            )
          case 'p':
            return (
              <p key={i} className="text-[13px] text-foreground leading-[1.7]">
                {renderInlineMarkdown(token.content)}
              </p>
            )
          case 'li': {
            const items = token.content.split('\n')
            return (
              <ul key={i} className="space-y-1 ml-4">
                {items.map((item, j) => (
                  <li key={j} className="text-[13px] text-foreground leading-relaxed flex items-start gap-2">
                    <span className="text-muted mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-muted" />
                    <span>{renderInlineMarkdown(item)}</span>
                  </li>
                ))}
              </ul>
            )
          }
          case 'ol': {
            const items = token.content.split('\n')
            return (
              <ol key={i} className="space-y-1 ml-4 list-decimal">
                {items.map((item, j) => (
                  <li key={j} className="text-[13px] text-foreground leading-relaxed pl-1">
                    {renderInlineMarkdown(item)}
                  </li>
                ))}
              </ol>
            )
          }
          case 'codeblock':
            return (
              <div key={i} className="relative group">
                {token.lang && (
                  <div className="absolute top-0 right-0 px-3 py-1 text-[10px] font-mono text-muted bg-surface-raised rounded-bl-lg rounded-tr-lg border-l border-b border-border">
                    {token.lang}
                  </div>
                )}
                <pre className="bg-surface-raised border border-border rounded-lg p-4 overflow-x-auto text-[12px] font-mono leading-[1.6] text-foreground">
                  <code>{token.content}</code>
                </pre>
              </div>
            )
          case 'hr':
            return <hr key={i} className="my-6 border-border" />
          case 'blockquote':
            return (
              <blockquote key={i} className="border-l-3 border-accent pl-4 py-1 bg-accent-light/30 rounded-r-lg">
                <div className="text-[13px] text-foreground leading-relaxed">
                  {token.content.split('\n').map((line, j) => (
                    <p key={j}>{renderInlineMarkdown(line)}</p>
                  ))}
                </div>
              </blockquote>
            )
          case 'table': {
            if (!token.rows || token.rows.length === 0) return null
            const [header, ...body] = token.rows
            return (
              <div key={i} className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-surface-raised">
                      {header.map((cell, j) => (
                        <th key={j} className="px-3 py-2 text-left font-semibold text-foreground border-r border-border last:border-r-0">
                          {renderInlineMarkdown(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {body.map((row, j) => (
                      <tr key={j} className="border-t border-border hover:bg-surface-raised/50">
                        {row.map((cell, k) => (
                          <td key={k} className="px-3 py-2 text-foreground border-r border-border last:border-r-0">
                            {renderInlineMarkdown(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
          case 'empty':
            return <div key={i} className="h-3" />
          case 'html':
            return null // skip HTML comments
          default:
            return null
        }
      })}
    </div>
  )
}

// ─── Syntax Highlighting for Code Files ──────────────────────────────

function CodeRenderer({ content, language }: { content: string; language?: string }) {
  return (
    <div className="relative">
      {language && (
        <div className="sticky top-0 px-4 py-2 text-[11px] font-mono text-muted bg-surface-raised border-b border-border flex items-center gap-2">
          <Code2 size={14} />
          {language}
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-[12px] font-mono leading-[1.6] text-foreground">
        <code>{content}</code>
      </pre>
    </div>
  )
}

// ─── Resource Viewer ─────────────────────────────────────────────────

function getFileExtension(url: string): string {
  const match = url.match(/\.([a-z0-9]+)(?:\?.*)?$/i)
  return match ? match[1].toLowerCase() : ''
}

function isCodeFile(ext: string): boolean {
  return ['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'rb', 'java', 'c', 'cpp', 'h', 'hpp',
    'css', 'scss', 'less', 'json', 'yaml', 'yml', 'xml', 'sql', 'sh', 'bash', 'zsh',
    'md', 'mdx', 'txt', 'env', 'toml', 'ini', 'cfg', 'conf'].includes(ext)
}

function isImageFile(ext: string): boolean {
  return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp'].includes(ext)
}

function isMarkdownFile(ext: string, title: string): boolean {
  return ext === 'md' || ext === 'mdx' || title.endsWith('.md') || title.endsWith('.mdx')
}

function ResourceViewer({
  resource,
  content,
  loading,
  error,
  onClose
}: {
  resource: Resource
  content: string | null
  loading: boolean
  error: boolean
  onClose: () => void
}) {
  const ext = resource.url ? getFileExtension(resource.url) : ''
  const isMd = isMarkdownFile(ext, resource.title)
  const isCode = isCodeFile(ext) && !isMd
  const isImg = isImageFile(ext)

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4 animate-pulse p-6">
          <div className="h-6 bg-surface-raised rounded w-3/4" />
          <div className="h-4 bg-surface-raised rounded w-1/2" />
          <div className="h-4 bg-surface-raised rounded w-5/6" />
          <div className="h-4 bg-surface-raised rounded w-2/3" />
          <div className="h-4 bg-surface-raised rounded w-4/5" />
          <div className="h-4 bg-surface-raised rounded w-3/4" />
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-muted gap-3">
          <AlertCircle size={32} className="text-warning" />
          <p className="text-[13px]">Failed to load document content.</p>
          <p className="text-[11px]">The file may not exist or there was a network error.</p>
        </div>
      )
    }

    if (!content) {
      return (
        <div className="flex flex-col items-center justify-center h-40 text-muted gap-2">
          <FileText size={28} />
          <p className="text-[13px]">No content available for this resource.</p>
        </div>
      )
    }

    if (isMd) {
      return (
        <div className="p-6">
          <MarkdownRenderer content={content} />
        </div>
      )
    }

    if (isCode) {
      return <CodeRenderer content={content} language={ext} />
    }

    if (isImg) {
      return (
        <div className="flex items-center justify-center p-6">
          <img
            src={resource.url}
            alt={resource.title}
            className="max-w-full max-h-[70vh] rounded-lg object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )
    }

    // Plain text fallback
    return (
      <pre className="p-6 text-[13px] font-mono leading-relaxed text-foreground whitespace-pre-wrap">
        {content}
      </pre>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-8 px-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-base border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col z-10 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
              typeColors[resource.type] || 'bg-surface-raised text-muted'
            )}>
              {typeIcons[resource.type] || <FileText size={16} />}
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-foreground truncate">{resource.title}</h2>
              <div className="flex items-center gap-2 text-[11px] text-muted">
                <span>{resource.type}</span>
                <span>·</span>
                <span>{resource.size}</span>
                <span>·</span>
                <span>Updated {formatRelativeTime(resource.updatedAt)}</span>
                {ext && (
                  <>
                    <span>·</span>
                    <span className="font-mono">.{ext}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {resource.url && (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-raised text-muted hover:text-foreground transition-colors"
                title="Open in new tab"
              >
                <ExternalLink size={16} />
              </a>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-raised text-muted hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

// ─── Icons & Colors ──────────────────────────────────────────────────

const typeIcons: Record<string, React.ReactNode> = {
  Document: <FileText size={16} />,
  Spreadsheet: <FileSpreadsheet size={16} />,
  Archive: <Archive size={16} />,
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

// ─── Mock Resources ──────────────────────────────────────────────────

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

// ─── Page Component ──────────────────────────────────────────────────

export default function ResourcesPage() {
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const allTags = useMemo(
    () => Array.from(new Set(mockResources.flatMap(r => r.tags))),
    []
  )

  const filtered = useMemo(
    () => mockResources.filter(r => {
      if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false
      if (filterTag && !r.tags.includes(filterTag)) return false
      return true
    }),
    [search, filterTag]
  )

  const handleOpen = useCallback(async (resource: Resource) => {
    setSelectedResource(resource)
    setFileContent(null)
    setError(false)

    if (resource.url) {
      setLoading(true)
      try {
        const res = await fetch(resource.url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()

        // Check if it's HTML (meaning the file wasn't found as static)
        if (text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) {
          setError(true)
          setFileContent(null)
        } else {
          setFileContent(text)
          setError(false)
        }
      } catch (e) {
        setError(true)
        setFileContent(null)
      }
      setLoading(false)
    }
  }, [])

  const handleClose = useCallback(() => {
    setSelectedResource(null)
    setFileContent(null)
    setError(false)
  }, [])

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
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                typeColors[resource.type] || 'bg-surface-raised text-muted'
              )}>
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
        <ResourceViewer
          resource={selectedResource}
          content={fileContent}
          loading={loading}
          error={error}
          onClose={handleClose}
        />
      )}
    </div>
  )
}
