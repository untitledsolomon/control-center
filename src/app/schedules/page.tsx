'use client'

import { Card, CardHeader, CardTitle } from '@/components/ui'
import { Clock } from 'lucide-react'

export default function SchedulesPage() {
  return (
    <div className="max-w-content mx-auto px-4 md:px-8 py-6 md:py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-accent" />
            <CardTitle>Schedules</CardTitle>
          </div>
        </CardHeader>
        <p className="text-[14px] text-muted">Schedules management coming soon.</p>
      </Card>
    </div>
  )
}
