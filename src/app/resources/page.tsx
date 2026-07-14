'use client'

import { Card, CardHeader, CardTitle } from '@/components/ui'
import { FolderOpen } from 'lucide-react'

export default function ResourcesPage() {
  return (
    <div className="max-w-content mx-auto px-4 md:px-8 py-6 md:py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-accent" />
            <CardTitle>Resource Hub</CardTitle>
          </div>
        </CardHeader>
        <p className="text-[14px] text-muted">Resource Hub management coming soon.</p>
      </Card>
    </div>
  )
}
