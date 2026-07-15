/**
 * DAWN Control Center API Client
 * Communicates with the DAWN backend API for real dashboard data.
 * Falls back to store-based mock data when API is unreachable.
 */

const API_BASE = process.env.NEXT_PUBLIC_DAWN_API_URL || 'https://dawn.regentplatform.com'
const API_KEY = process.env.NEXT_PUBLIC_DAWN_API_KEY || ''

interface FetchOptions {
  method?: string
  body?: unknown
  timeout?: number
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T | null> {
  const { method = 'GET', body, timeout = 5000 } = options

  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    clearTimeout(id)

    if (!res.ok) {
      console.warn(`[API] ${method} ${path} returned ${res.status}`)
      return null
    }

    return await res.json() as T
  } catch (err) {
    console.warn(`[API] ${method} ${path} failed:`, err instanceof Error ? err.message : err)
    return null
  }
}

// ─── Dashboard Stats ────────────────────────────────────────────────

export interface DashboardStatsResponse {
  total_tasks: number
  tasks_completed: number
  tasks_pending: number
  tasks_in_progress: number
  tasks_failed: number
  active_goals: number
  goal_progress_avg: number
  notifications_unread: number
  system_uptime: number
  agent_status: string
  last_active: string
  memory_usage: number
  cpu_usage: number
}

export async function fetchDashboardStats(): Promise<DashboardStatsResponse | null> {
  return apiFetch<DashboardStatsResponse>('/dashboard/stats')
}

// ─── Activity Log ───────────────────────────────────────────────────

export interface ActivityEntry {
  id: string
  action: string
  entity_type: string
  summary: string
  severity: string
  created_at: string
}

export async function fetchActivityLog(limit = 20): Promise<ActivityEntry[] | null> {
  return apiFetch<ActivityEntry[]>(`/activity?limit=${limit}`)
}

// ─── Notifications ──────────────────────────────────────────────────

export interface NotificationEntry {
  id: string
  type: string
  title: string
  description: string
  read: boolean
  created_at: string
  linked_screen?: string
}

export async function fetchNotifications(unread?: boolean, limit = 50): Promise<NotificationEntry[] | null> {
  let path = `/notifications?limit=${limit}`
  if (unread !== undefined) path += `&unread=${unread}`
  return apiFetch<NotificationEntry[]>(path)
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const result = await apiFetch<{ ok: boolean }>(`/notifications/${id}/read`, { method: 'POST' })
  return result?.ok ?? false
}

// ─── Weekly / Hourly Chart Data ─────────────────────────────────────

export interface WeeklyChartEntry {
  day: string
  tasks: number
  posts: number
  leads: number
}

export interface HourlyChartEntry {
  hour: string
  value: number
}

export async function fetchWeeklyChartData(): Promise<WeeklyChartEntry[] | null> {
  return apiFetch<WeeklyChartEntry[]>('/dashboard/activity/weekly')
}

export async function fetchHourlyChartData(): Promise<HourlyChartEntry[] | null> {
  return apiFetch<HourlyChartEntry[]>('/dashboard/activity/hourly')
}

// ─── Agent Status ───────────────────────────────────────────────────

export interface AgentStatus {
  status: string
  uptime: number
  memory_usage: number
  cpu_usage: number
  last_active: string
  version: string
}

export async function fetchAgentStatus(): Promise<AgentStatus | null> {
  return apiFetch<AgentStatus>('/agent/status')
}

// ─── Agent Directive ────────────────────────────────────────────────

export async function sendDirective(directive: string): Promise<{ ok: boolean; response?: string } | null> {
  return apiFetch<{ ok: boolean; response?: string }>('/agent/directive', {
    method: 'POST',
    body: { directive },
    timeout: 30000,
  })
}
