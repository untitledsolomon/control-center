'use client'

import React from 'react'
import { FileText, FolderOpen, Search } from 'lucide-react'

export default function ResourcesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#e6edf3]">Resource Hub</h1>
        <p className="text-sm text-[#8b949e] mt-1">Files, documents, and outputs</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e7681]" />
        <input
          type="text"
          placeholder="Search resources..."
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#161b22] border border-[#30363d] rounded-lg text-[#e6edf3] placeholder-[#6e7681] outline-none focus:border-dawn-500 transition-colors"
        />
      </div>

      <div className="p-8 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-center">
        <div className="text-center">
          <FolderOpen className="w-12 h-12 text-[#30363d] mx-auto mb-3" />
          <h3 className="text-sm font-medium text-[#8b949e]">Resource Library</h3>
          <p className="text-xs text-[#6e7681] mt-1">Connect to DAWN storage to view files</p>
        </div>
      </div>
    </div>
  )
}
