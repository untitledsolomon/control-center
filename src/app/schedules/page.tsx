'use client'

import React, { useState } from 'react'
import { useApp } from '@/store/AppContext'
import { Clock, Plus, Play, Pause, Trash2 } from 'lucide-react'

export default function SchedulesPage() {
  const { state, addSchedule, editSchedule } = useApp()
  const { schedules } = state
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [cron, setCron] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await addSchedule({ name, cron_expression: cron || '0 0 * * *' })
    setName('')
    setCron('')
    setShowForm(false)
  }

  const cronPresets = [
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Every 4 hours', value: '0 */4 * * *' },
    { label: 'Daily at midnight', value: '0 0 * * *' },
    { label: 'Weekly on Monday', value: '0 0 * * 1' },
    { label: 'Monthly on 1st', value: '0 0 1 * *' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#e6edf3]">Schedules</h1>
          <p className="text-sm text-[#8b949e] mt-1">{schedules.length} cron jobs</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-dawn-600 rounded-lg hover:bg-dawn-500 transition-colors"
        >
          <Plus className="w-3 h-3" />
          New Schedule
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-3">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Schedule name..."
            className="w-full px-3 py-2 text-sm bg-[#0d1117] border border-[#30363d] rounded-lg text-[#e6edf3] placeholder-[#6e7681] outline-none focus:border-dawn-500"
          />
          <div className="flex gap-2 flex-wrap">
            {cronPresets.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setCron(p.value)}
                className={`px-2 py-1 text-[10px] rounded-full border transition-colors ${
                  cron === p.value
                    ? 'bg-dawn-500/20 text-dawn-400 border-dawn-500/30'
                    : 'bg-[#0d1117] text-[#6e7681] border-[#30363d] hover:border-dawn-500/30'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={cron}
            onChange={e => setCron(e.target.value)}
            placeholder="Cron expression (e.g., 0 */4 * * *)"
            className="w-full px-3 py-2 text-sm font-mono bg-[#0d1117] border border-[#30363d] rounded-lg text-[#e6edf3] placeholder-[#6e7681] outline-none focus:border-dawn-500"
          />
          <div className="flex gap-2">
            <button type="submit" className="px-3 py-1.5 text-xs text-white bg-dawn-600 rounded-lg hover:bg-dawn-500 transition-colors">
              Create
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-[#8b949e] hover:text-[#e6edf3] transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {schedules.map(s => (
          <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-dawn-500/30 transition-all">
            <div className={`p-2 rounded-lg ${s.enabled ? 'bg-emerald-500/10' : 'bg-[#0d1117]'}`}>
              <Clock className={`w-4 h-4 ${s.enabled ? 'text-emerald-400' : 'text-[#6e7681]'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-[#e6edf3]">{s.name}</h3>
                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full border ${
                  s.enabled
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-[#0d1117] text-[#6e7681] border-[#30363d]'
                }`}>
                  {s.enabled ? 'Running' : 'Paused'}
                </span>
              </div>
              <p className="text-xs font-mono text-[#6e7681] mt-0.5">{s.cron_expression}</p>
              {s.last_run && <p className="text-[10px] text-[#6e7681] mt-0.5">Last run: {new Date(s.last_run).toLocaleString()}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => editSchedule(s.id, { enabled: !s.enabled })}
                className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#0d1117] transition-colors"
                title={s.enabled ? 'Pause' : 'Resume'}
              >
                {s.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ))}
        {schedules.length === 0 && !showForm && (
          <div className="p-8 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-center">
            <div className="text-center">
              <Clock className="w-8 h-8 text-[#30363d] mx-auto mb-2" />
              <p className="text-sm text-[#8b949e]">No schedules yet</p>
              <p className="text-xs text-[#6e7681] mt-1">Create your first cron job</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
