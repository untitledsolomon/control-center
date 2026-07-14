export interface Task {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: 'Outreach' | 'Content' | 'Research' | 'CRM' | 'System'
  status: 'queued' | 'active' | 'blocked' | 'complete'
  linkedGoal?: string
  createdAt: Date
  blockedReason?: string
  conversation?: string
}

export interface Goal {
  id: string
  title: string
  category: 'Revenue' | 'Content' | 'Outreach' | 'Product'
  target: number
  current: number
  unit: string
  dueDate: Date
  taskCount: number
  status: 'on_track' | 'at_risk' | 'behind'
}

export interface Instruction {
  id: string
  title: string
  body: string
  category: 'Tone' | 'Scheduling' | 'Outreach' | 'Privacy' | 'Escalation'
  active: boolean
  lastModified: Date
}

export interface Notification {
  id: string
  type: 'attention' | 'update' | 'completed'
  icon: string
  title: string
  description: string
  timestamp: Date
  screen: string
}

export interface Activity {
  id: string
  timestamp: Date
  badge: string
  title: string
  description: string
}

export interface Output {
  id: string
  type: 'Content' | 'Reports' | 'Lead Lists' | 'Emails' | 'Research'
  title: string
  summary: string
  date: Date
  linkedTask?: string
  count?: number
  wordCount?: number
  body?: string
}

export interface CronJob {
  id: string
  name: string
  description: string
  cronExpression: string
  humanReadable: string
  status: 'running' | 'paused' | 'failed'
  linkedDirective?: string
  lastRun: Date | null
  lastResult: 'success' | 'fail' | null
  lastDuration: number | null
  nextRun: Date
  history: any[]
  notifyOnComplete: boolean
}

export interface Playbook {
  id: string
  title: string
  category: string
  status: string
  body: string
  variables: { key: string; value: string }[]
  createdAt: Date
  updatedAt: Date
}

export interface ReviewItem {
  id: string
  title: string
  type: string
  status: string
  content: Record<string, any>
  comments: { author: string; text: string; timestamp: Date }[]
  statusHistory: { status: string; timestamp: Date; note?: string }[]
  linkedTaskId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface DashboardStats {
  tasksCompleted: number
  activeTasks: number
  leadsTouched: number
  blockedTasks: number
}

export interface WeeklyData {
  day: string
  tasks: number
  posts: number
  leads: number
}

export interface HourlyData {
  hour: string
  value: number
}

export interface AppState {
  tasks: Task[]
  goals: Goal[]
  instructions: Instruction[]
  notifications: Notification[]
  activity: Activity[]
  stats: { label: string; value: number; icon: string; color: string }[]
  alerts: { id: string; title: string; description: string; timestamp: Date; actionLabel: string; type: string }[]
  outputs: Output[]
  cronJobs: CronJob[]
  playbooks: Playbook[]
  reviewItems: ReviewItem[]
}
