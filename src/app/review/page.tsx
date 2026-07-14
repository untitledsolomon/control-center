'use client'

import { Card, CardHeader, CardTitle } from '@/components/ui'
import { Inbox } from 'lucide-react'

export default function ReviewPage() {
  return (
    <div className="max-w-content mx-auto px-4 md:px-8 py-6 md:py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Inbox size={16} className="text-accent" />
            <CardTitle>Review Inbox</CardTitle>
          </div>
        </CardHeader>
        <p className="text-[14px] text-muted">Review Inbox management coming soon.</p>
      </Card>
    </div>
  )
}
