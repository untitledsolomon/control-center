'use client'

import { Card, CardHeader, CardTitle } from '@/components/ui'
import { BookOpen } from 'lucide-react'

export default function PlaybooksPage() {
  return (
    <div className="max-w-content mx-auto px-4 md:px-8 py-6 md:py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-accent" />
            <CardTitle>Protocols</CardTitle>
          </div>
        </CardHeader>
        <p className="text-[14px] text-muted">Protocols management coming soon.</p>
      </Card>
    </div>
  )
}
