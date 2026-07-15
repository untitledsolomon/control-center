export interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category?: string
  assigned_to?: string
  created_at: string
  updated_at: string
  completed_at?: string
  metadata?: Record<string, unknown>
}

export interface Goal {
  id: string
  title: string
  description?: string
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  progress: number
  target_value?: number
  current_value?: number
  unit?: string
  deadline?: string
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  type: 'attention' | 'update' | 'completed' | 'error'
  title: string
  message: string
  read: boolean
  created_at: string
  source?: string
  action_url?: string
}

export interface ActivityLog {
  id: string
  action: string
  entity_type: string
  entity_id?: string
  summary: string
  details?: string
  severity: 'info' | 'warning' | 'error' | 'success'
  created_at: string
}

export interface Playbook {
  id: string
  name: string
  description?: string
  steps: PlaybookStep[]
  status: 'active' | 'inactive' | 'draft'
  last_run?: string
  created_at: string
  updated_at: string
}

export interface PlaybookStep {
  id: string
  order: number
  action: string
  params?: Record<string, unknown>
  timeout?: number
  retry_count?: number
}

export interface Schedule {
  id: string
  name: string
  description?: string
  cron_expression: string
  action: string
  params?: Record<string, unknown>
  enabled: boolean
  last_run?: string
  next_run?: string | null
  created_at: string
}

export interface DashboardStats {
  total_tasks: number
  tasks_completed: number
  tasks_pending: number
  tasks_in_progress: number
  tasks_failed: number
  active_goals: number
  goal_progress_avg: number
  notifications_unread: number
  system_uptime: number
  agent_status: 'active' | 'idle' | 'offline'
  last_active: string
  memory_usage: number
  cpu_usage: number
}

export interface ChartDataPoint {
  date: string
  value: number
  category?: string
}

export interface WeeklyActivity extends ChartDataPoint {
  tasks_created: number
  tasks_completed: number
}

export interface HourlyActivity extends ChartDataPoint {
  requests: number
  avg_response_time: number
}
