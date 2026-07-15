'use client'

import React from 'react'
import { useApp } from '@/store/AppContext'
import { CheckSquare, Plus, Filter } from 'lucide-react'

export default function TasksPage() {
  const { state } = useApp()
  const { tasks } = state

  const statusColors = {
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    in_progress: 'bg-dawn-500/10 text-dawn-400 border-dawn-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  const priorityColors = {
    critical: 'text-red-400',
    high: 'text-amber-400',
    medium: 'text-dawn-400',
    low: 'text-[#8b949e]',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#e6edf3]">Tasks</h1>
          <p className="text-sm text-[#8b949e] mt-1">{tasks.length} total tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#8b949e] bg-[#161b22] rounded-lg border border-[#30363d] hover:border-[#6e7681] transition-colors">
            <Filter className="w-3 h-3" />
            Filter
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-dawn-600 rounded-lg hover:bg-dawn-500 transition-colors">
            <Plus className="w-3 h-3" />
            New Task
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {tasks.map(task => (
          <div
            key={task.id}
            className="flex items-center gap-4 p-4 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-dawn-500/30 transition-all cursor-pointer"
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
              task.status === 'completed' ? 'bg-emerald-500/10' : 'bg-[#0d1117]'
            }`}>
              <CheckSquare className={`w-4 h-4 ${
                task.status === 'completed' ? 'text-emerald-400' : 'text-[#6e7681]'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-[#e6edf3] truncate">{task.title}</h3>
                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full border ${statusColors[task.status]}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              {task.description && (
                <p className="text-xs text-[#8b949e] mt-0.5 truncate">{task.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[#6e7681]">
              {task.category && (
                <span className="px-2 py-0.5 bg-[#0d1117] rounded-full border border-[#30363d]">{task.category}</span>
              )}
              <span className={priorityColors[task.priority]}>{task.priority}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
