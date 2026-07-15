'use client'

import React from 'react'
import { ClipboardCheck, CheckCircle, XCircle } from 'lucide-react'

export default function ReviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#e6edf3]">Review Inbox</h1>
        <p className="text-sm text-[#8b949e] mt-1">Items pending your review</p>
      </div>

      <div className="p-8 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-center">
        <div className="text-center">
          <ClipboardCheck className="w-12 h-12 text-[#30363d] mx-auto mb-3" />
          <h3 className="text-sm font-medium text-[#8b949e]">No items to review</h3>
          <p className="text-xs text-[#6e7681] mt-1">All caught up!</p>
        </div>
      </div>
    </div>
  )
}
