'use client'

import React from 'react'
import { useApp } from '@/store/AppContext'
import { Target, Plus } from 'lucide-react'

export default function GoalsPage() {
  const { state } = useApp()
  const { goals } = state

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#e6edf3]">Goals</h1>
          <p className="text-sm text-[#8b949e] mt-1">{goals.length} active goals</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-dawn-600 rounded-lg hover:bg-dawn-500 transition-colors">
          <Plus className="w-3 h-3" />
          New Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map(goal => (
          <div key={goal.id} className="p-5 rounded-xl bg-[#161b22] border border-[#30363d] card-hover">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Target className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-[#e6edf3]">{goal.title}</h3>
                {goal.description && (
                  <p className="text-xs text-[#8b949e] mt-1">{goal.description}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[#8b949e]">Progress</span>
                <span className="text-xs font-medium text-[#e6edf3]">{goal.progress}%</span>
              </div>
              <div className="h-2 bg-[#0d1117] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-dawn-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
            </div>

            {goal.target_value && (
              <div className="flex items-center justify-between mt-3 text-[10px] text-[#6e7681]">
                <span>{goal.current_value} / {goal.target_value} {goal.unit}</span>
                {goal.deadline && (
                  <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
