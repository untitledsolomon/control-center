'use client'

import { useAppState } from '@/lib/store'
import { Card, Badge } from '@/components/ui'
import { formatRelativeTime } from '@/lib/utils'
import { Activity, AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react'

const severityConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  error: { icon: AlertCircle, color: 'text-error', bg: 'bg-error-light' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning-light' },
  success: { icon: CheckCircle, color: 'text-success', bg: 'bg-success-light' },
  info: { icon: Info, color: 'text-accent', bg: 'bg-accent-light' },
}

export default function ActivityPage() {
  const { state } = useAppState()
  const { activity } = state

  return (
    <div className="max-w-content mx-auto px-4 md:px-8 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold text-foreground">Activity Log</h1>
        <p className="text-[13px] text-muted mt-1">System events and agent actions</p>
      </div>

      <div className="space-y-2">
        {activity.length === 0 ? (
          <Card className="p-8 text-center">
            <Activity size={40} className="mx-auto text-muted mb-3" />
            <p className="text-[14px] text-muted">No activity recorded yet</p>
          </Card>
        ) : (
          activity.map(log => {
            const config = severityConfig[log.badge === 'ERROR' ? 'error' : log.badge === 'OUTREACH_SENT' ? 'success' : log.badge === 'CONTENT_POSTED' ? 'success' : log.badge === 'LEAD_SCRAPED' ? 'info' : 'info']
            const Icon = config.icon
            return (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-base border border-border hover:border-accent/20 transition-all"
              >
                <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground">{log.title}</p>
                  <p className="text-[12px] text-muted mt-0.5">{log.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-muted">{formatRelativeTime(log.timestamp)}</span>
                  </div>
                </div>
                <Badge variant={log.badge === 'ERROR' ? 'error' : log.badge === 'OUTREACH_SENT' ? 'success' : log.badge === 'CONTENT_POSTED' ? 'pink' : log.badge === 'LEAD_SCRAPED' ? 'purple' : 'default'}>
                  {log.badge}
                </Badge>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
