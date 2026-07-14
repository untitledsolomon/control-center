import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(diff / 86400000)
  return `${days}d ago`
}

export function getGreeting(): { greeting: string; subtitle: string } {
  const hour = new Date().getHours()
  const dayName = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  let greeting: string
  if (hour < 12) greeting = 'Good morning'
  else if (hour < 17) greeting = 'Good afternoon'
  else greeting = 'Good evening'

  return {
    greeting: `${greeting}, Solomon`,
    subtitle: dayName,
  }
}

export function getStatusConfig(status: string): {
  color: string
  bg: string
  label: string
} {
  const configs: Record<string, { color: string; bg: string; label: string }> = {
    on_track: { color: 'text-success', bg: 'bg-success-light', label: 'On Track' },
    at_risk: { color: 'text-warning', bg: 'bg-warning-light', label: 'At Risk' },
    behind: { color: 'text-error', bg: 'bg-error-light', label: 'Behind' },
  }
  return configs[status] || configs.on_track
}
