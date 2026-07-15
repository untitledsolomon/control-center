'use client'

import React from 'react'
import { useApp } from '@/store/AppContext'
import { BookTemplate, Play, Plus } from 'lucide-react'

export default function PlaybooksPage() {
  const { state } = useApp()
  const { playbooks } = state

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#e6edf3]">Playbooks</h1>
          <p className="text-sm text-[#8b949e] mt-1">Automated workflows and procedures</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-dawn-600 rounded-lg hover:bg-dawn-500 transition-colors">
          <Plus className="w-3 h-3" />
          New Playbook
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playbooks.map(playbook => (
          <div key={playbook.id} className="p-5 rounded-xl bg-[#161b22] border border-[#30363d] card-hover">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <BookTemplate className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-[#e6edf3]">{playbook.name}</h3>
                {playbook.description && (
                  <p className="text-xs text-[#8b949e] mt-1">{playbook.description}</p>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              {playbook.steps.map((step, i) => (
                <div key={step.id} className="flex items-center gap-2 text-[10px] text-[#6e7681]">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[8px]">
                    {i + 1}
                  </span>
                  <span className="font-mono">{step.action}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#30363d]">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                playbook.status === 'active'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-[#0d1117] text-[#6e7681] border-[#30363d]'
              }`}>
                {playbook.status}
              </span>
              <button className="flex items-center gap-1 px-2 py-1 text-[10px] text-dawn-400 hover:text-dawn-300 transition-colors">
                <Play className="w-3 h-3" />
                Run
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
