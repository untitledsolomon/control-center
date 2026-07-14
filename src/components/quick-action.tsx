'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useAppState } from '@/lib/store'
import { X, ArrowUp, FileText, BookOpen, Mail, Users } from 'lucide-react'

const quickActions = [
  { icon: FileText, label: 'Scrape Leads' },
  { icon: BookOpen, label: 'Schedule Post' },
  { icon: Mail, label: 'Draft Email' },
  { icon: Users, label: 'Generate Report' },
]

export function QuickActionBar({ open, onToggle }: { open: boolean; onToggle: (v: boolean) => void }) {
  const { addTask, addActivity, addNotification } = useAppState()
  const [input, setInput] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const toastTimer = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current) }
  }, [])

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  const submitDirective = () => {
    if (!input.trim()) return
    const text = input.trim()
    addTask({ title: text, description: 'Manual directive: ' + text, priority: 'medium', category: 'System', status: 'queued' })
    addActivity({ timestamp: new Date(), badge: 'TASK_COMPLETE', title: 'Directive submitted: ' + text, description: 'Manual directive added to Mission Queue' })
    addNotification({ type: 'update', icon: 'RefreshCw', title: 'Directive sent: ' + text, description: 'New task created from Quick Action Bar', timestamp: new Date(), screen: '/queue' })
    showToast('Directive sent to DAWN: "' + text + '"')
    setInput('')
    onToggle(false)
  }

  const handleQuickAction = (label: string) => {
    const taskMap: Record<string, { title: string; description: string }> = {
      'Scrape Leads': { title: 'Scrape Leads', description: 'Automated lead scraping task' },
      'Schedule Post': { title: 'Schedule Post', description: 'Content scheduling task' },
      'Draft Email': { title: 'Draft Email', description: 'Email drafting task' },
      'Generate Report': { title: 'Generate Report', description: 'Report generation task' },
    }
    const t = taskMap[label]
    if (t) {
      addTask({ title: t.title, description: t.description, priority: 'medium', category: 'System', status: 'queued' })
      showToast(label + ' task created — check Mission Queue')
    }
    onToggle(false)
  }

  return (
    <>
      {toast && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 animate-slide-up-toast">
          <div className="bg-foreground text-white text-[13px] font-medium px-5 py-3 rounded-lg shadow-lg whitespace-nowrap">
            {toast}
          </div>
        </div>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => onToggle(false)} />
          <div className="fixed top-16 right-4 z-50 w-[360px] max-w-[calc(100vw-32px)]">
            <div className="bg-base border border-border rounded-xl shadow-xl p-4 animate-fade-in">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitDirective()
                    if (e.key === 'Escape') onToggle(false)
                  }}
                  placeholder="Give DAWN a directive..."
                  className="w-full h-10 pl-4 pr-10 bg-surface border border-border rounded-lg text-[13px] text-foreground placeholder:text-muted outline-none focus:border-accent transition-colors"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {input.trim() && (
                    <button
                      onClick={submitDirective}
                      className="p-1.5 rounded-md bg-accent text-white hover:bg-accent/90 transition-colors focus-visible:ring-2 focus-visible:ring-accent outline-none"
                      aria-label="Submit directive"
                    >
                      <ArrowUp size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => { onToggle(false); setInput('') }}
                    className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-accent outline-none"
                    aria-label="Cancel"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {quickActions.map(action => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action.label)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface border border-border text-[11px] font-medium text-muted hover:text-foreground hover:bg-surface-raised whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-accent outline-none"
                  >
                    <action.icon size={12} />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
