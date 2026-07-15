'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '@/store/AppContext'
import { Terminal, Send, X, Zap, CheckSquare, Target, BookTemplate } from 'lucide-react'

const quickActions = [
  { id: 'task', label: 'Create Task', icon: CheckSquare, action: '/tasks' },
  { id: 'goal', label: 'Set Goal', icon: Target, action: '/goals' },
  { id: 'playbook', label: 'Run Playbook', icon: BookTemplate, action: '/playbooks' },
]

export function QuickActionBar() {
  const { state, toggleQuickAction, sendCommand } = useApp()
  const { quickActionOpen } = state
  const [command, setCommand] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [response, setResponse] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (quickActionOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [quickActionOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!command.trim()) return

    setHistory(prev => [...prev, command])
    setResponse('Processing...')

    try {
      await sendCommand(command)
      setResponse('Command sent successfully')
    } catch {
      setResponse('Error processing command')
    }

    setCommand('')
  }

  const handleQuickAction = (action: string) => {
    setCommand(`/${action}`)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  if (!quickActionOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={toggleQuickAction}
      />

      {/* Command Palette */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
        <div
          className="w-full max-w-2xl mx-4 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden animate-fade-in"
          onClick={e => e.stopPropagation()}
        >
          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3 border-b border-[#30363d]">
            <Terminal className="w-4 h-4 text-dawn-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={e => setCommand(e.target.value)}
              placeholder="Type a command or directive for DAWN..."
              className="flex-1 bg-transparent text-sm text-[#e6edf3] placeholder-[#6e7681] outline-none"
            />
            <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-mono text-[#6e7681] bg-[#0d1117] rounded border border-[#30363d]">
              Esc
            </kbd>
          </form>

          {/* Quick Actions */}
          <div className="px-4 py-3 border-b border-[#30363d]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6e7681] mb-2">
              Quick Actions
            </p>
            <div className="flex gap-2">
              {quickActions.map(qa => {
                const Icon = qa.icon
                return (
                  <button
                    key={qa.id}
                    onClick={() => handleQuickAction(qa.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#8b949e] bg-[#0d1117] rounded-lg border border-[#30363d] hover:border-dawn-500/30 hover:text-dawn-400 transition-all"
                  >
                    <Icon className="w-3 h-3" />
                    {qa.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Response */}
          {response && (
            <div className="px-4 py-3 border-b border-[#30363d]">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
                <Zap className="w-3 h-3 text-dawn-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#8b949e] font-mono">{response}</p>
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="px-4 py-3 max-h-40 overflow-y-auto">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6e7681] mb-2">
                Recent Commands
              </p>
              <div className="space-y-1">
                {history.slice(-5).reverse().map((cmd, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#6e7681] hover:bg-[#0d1117] cursor-pointer"
                    onClick={() => setCommand(cmd)}
                  >
                    <Send className="w-2.5 h-2.5" />
                    <span className="font-mono">{cmd}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2 bg-[#0d1117] flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] text-[#6e7681]">
              <span><kbd className="px-1 py-0.5 font-mono bg-[#161b22] rounded border border-[#30363d]">↑↓</kbd> navigate</span>
              <span><kbd className="px-1 py-0.5 font-mono bg-[#161b22] rounded border border-[#30363d]">↵</kbd> send</span>
            </div>
            <button
              onClick={toggleQuickAction}
              className="text-[10px] text-[#6e7681] hover:text-[#8b949e] transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
