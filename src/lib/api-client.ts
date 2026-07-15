/**
 * DAWN Control Center API Client
 *
 * Reads directly from Supabase tables (jarvis_tasks, jarvis_goals, etc.)
 * with mock data fallback when tables are empty or unavailable.
 */
import { createClient } from '@/utils/supabase/client'
import {
  DashboardStats, Task, Goal, Notification, ActivityLog,
  Playbook, Schedule, WeeklyActivity, HourlyActivity,
} from './types'
import {
  mockStats, mockTasks, mockGoals, mockNotifications,
  mockActivityLogs, mockPlaybooks, mockSchedules,
  mockWeeklyActivity, mockHourlyActivity,
} from './mock-data'

const supabase = createClient()

// ─── Helpers ────────────────────────────────────────────────────────────────

function toAppTask(row: any): Task {
  return {
    id: row.id,
    title: row.title || 'Untitled Task',
    description: row.description || '',
    status: row.status === 'queued' ? 'pending'
          : row.status === 'active' ? 'in_progress'
          : row.status === 'blocked' ? 'pending'
          : row.status === 'complete' ? 'completed'
          : (row.status || 'pending') as Task['status'],
    priority: (row.priority || 'medium') as Task['priority'],
    category: row.category || 'General',
    assigned_to: row.assigned_to,
    created_at: row.created_at,
    updated_at: row.updated_at,
    completed_at: row.completed_at,
    metadata: row,
  }
}

function toAppGoal(row: any): Goal {
  return {
    id: row.id,
    title: row.title,
    description: '',
    status: row.status === 'on_track' || row.status === 'at_risk' || row.status === 'behind'
      ? 'active' : 'active',
    progress: row.target_value > 0
      ? Math.round((row.current_value / row.target_value) * 100)
      : 0,
    target_value: row.target_value,
    current_value: row.current_value,
    unit: row.unit || '%',
    deadline: row.due_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function toAppNotification(row: any): Notification {
  return {
    id: row.id,
    type: (row.type || 'update') as Notification['type'],
    title: row.title,
    message: row.description || '',
    read: row.is_read === true,
    created_at: row.created_at,
    source: 'DAWN',
    action_url: row.linked_screen,
  }
}

function toAppActivity(row: any): ActivityLog {
  return {
    id: row.id,
    action: row.event_type || 'sync',
    entity_type: 'system',
    summary: row.description || '',
    severity: row.event_type === 'error' ? 'error'
            : row.event_type === 'task_complete' ? 'success'
            : 'info',
    created_at: row.created_at,
  }
}

function toAppPlaybook(row: any): Playbook {
  return {
    id: row.id,
    name: row.title,
    description: row.body?.substring(0, 200) || '',
    steps: [],
    status: (row.status === 'active' ? 'active' : 'inactive') as Playbook['status'],
    last_run: undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function toAppSchedule(row: any): Schedule {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    cron_expression: row.cron_expression,
    action: row.name || 'unknown',
    enabled: row.status === 'running',
    last_run: row.last_run_at,
    next_run: row.next_run_at,
    created_at: row.created_at,
  }
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const [tasksRes, goalsRes, notifsRes, activityRes] = await Promise.all([
      supabase.from('jarvis_tasks').select('status'),
      supabase.from('jarvis_goals').select('current_value, target_value, status'),
      supabase.from('jarvis_notifications').select('is_read'),
      supabase.from('jarvis_activity_log').select('created_at').order('created_at', { ascending: false }).limit(1),
    ])

    if (tasksRes.error) throw tasksRes.error

    const tasks = tasksRes.data || []
    const goals = goalsRes.data || []
    const notifs = notifsRes.data || []
    const lastActivity = activityRes.data?.[0]

    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'complete').length
    const inProgress = tasks.filter(t => t.status === 'active').length
    const pending = tasks.filter(t => t.status === 'queued' || t.status === 'blocked').length
    const failed = tasks.filter(t => t.status === 'failed').length
    const activeGoals = goals.filter(g => g.status === 'on_track' || g.status === 'at_risk' || g.status === 'behind').length
    const goalProgressAvg = goals.length > 0
      ? Math.round(goals.reduce((sum, g) => {
          const pct = g.target_value > 0 ? (g.current_value / g.target_value) * 100 : 0
          return sum + pct
        }, 0) / goals.length)
      : 0
    const unread = notifs.filter(n => !n.is_read).length

    return {
      total_tasks: total,
      tasks_completed: completed,
      tasks_pending: pending,
      tasks_in_progress: inProgress,
      tasks_failed: failed,
      active_goals: activeGoals,
      goal_progress_avg: goalProgressAvg,
      notifications_unread: unread,
      system_uptime: 99.8,
      agent_status: 'active',
      last_active: lastActivity?.created_at || new Date().toISOString(),
      memory_usage: 42,
      cpu_usage: 18,
    }
  } catch (err) {
    console.warn('[Supabase] Using mock stats:', err)
    return mockStats
  }
}

export async function fetchWeeklyActivity(): Promise<WeeklyActivity[]> {
  try {
    const { data, error } = await supabase
      .from('jarvis_tasks')
      .select('status, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())

    if (error) throw error

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const buckets: Record<string, { created: number; completed: number }> = {}
    days.forEach(d => { buckets[d] = { created: 0, completed: 0 } })

    ;(data || []).forEach((t: any) => {
      const d = days[new Date(t.created_at).getDay()]
      if (d) {
        buckets[d].created++
        if (t.status === 'complete') buckets[d].completed++
      }
    })

    return days.map(date => ({
      date,
      value: buckets[date].created,
      tasks_created: buckets[date].created,
      tasks_completed: buckets[date].completed,
    }))
  } catch {
    return mockWeeklyActivity
  }
}

export async function fetchHourlyActivity(): Promise<HourlyActivity[]> {
  try {
    const { data, error } = await supabase
      .from('jarvis_activity_log')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 86400000).toISOString())

    if (error) throw error

    const hours = Array.from({ length: 24 }, (_, i) =>
      `${String(i).padStart(2, '0')}:00`
    )
    const buckets: Record<string, number> = {}
    hours.forEach(h => { buckets[h] = 0 })

    ;(data || []).forEach((a: any) => {
      const h = `${String(new Date(a.created_at).getHours()).padStart(2, '0')}:00`
      if (buckets[h] !== undefined) buckets[h]++
    })

    return hours.map(date => ({
      date,
      value: buckets[date],
      requests: buckets[date],
      avg_response_time: 150,
    }))
  } catch {
    return mockHourlyActivity
  }
}

// ─── Tasks ──────────────────────────────────────────────────────────────────

export async function fetchTasks(status?: string): Promise<Task[]> {
  try {
    let query = supabase.from('jarvis_tasks').select('*').order('created_at', { ascending: false })
    if (status) {
      const statusMap: Record<string, string> = {
        pending: 'queued,blocked',
        in_progress: 'active',
        completed: 'complete',
        failed: 'failed',
      }
      const mapped = statusMap[status]
      if (mapped) {
        const statuses = mapped.split(',')
        query = query.in('status', statuses)
      }
    }
    const { data, error } = await query
    if (error) throw error
    return (data || []).map(toAppTask)
  } catch {
    return status ? mockTasks.filter(t => t.status === status) : mockTasks
  }
}

export async function createTask(task: Partial<Task>): Promise<Task> {
  try {
    const { data, error } = await supabase
      .from('jarvis_tasks')
      .insert({
        title: task.title || 'New Task',
        description: task.description || '',
        priority: task.priority || 'medium',
        category: task.category || 'system',
        status: 'queued',
      })
      .select()
      .single()
    if (error) throw error
    return toAppTask(data)
  } catch (err) {
    console.warn('[Supabase] Mock create task:', err)
    return {
      id: `mock-${Date.now()}`,
      ...task,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Task
  }
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  try {
    const dbUpdates: Record<string, any> = {}
    if (updates.title) dbUpdates.title = updates.title
    if (updates.description) dbUpdates.description = updates.description
    if (updates.priority) dbUpdates.priority = updates.priority
    if (updates.category) dbUpdates.category = updates.category
    if (updates.status) {
      const statusMap: Record<string, string> = {
        pending: 'queued',
        in_progress: 'active',
        completed: 'complete',
        failed: 'failed',
      }
      dbUpdates.status = statusMap[updates.status] || updates.status
    }
    dbUpdates.updated_at = new Date().toISOString()
    if (updates.status === 'completed') dbUpdates.completed_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('jarvis_tasks')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return toAppTask(data)
  } catch (err) {
    console.warn('[Supabase] Mock update task:', err)
    return { id, ...updates } as Task
  }
}

// ─── Goals ──────────────────────────────────────────────────────────────────

export async function fetchGoals(): Promise<Goal[]> {
  try {
    const { data, error } = await supabase
      .from('jarvis_goals')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(toAppGoal)
  } catch {
    return mockGoals
  }
}

export async function createGoal(goal: Partial<Goal>): Promise<Goal> {
  try {
    const { data, error } = await supabase
      .from('jarvis_goals')
      .insert({
        title: goal.title || 'New Goal',
        category: 'revenue',
        target_value: goal.target_value || 100,
        current_value: goal.current_value || 0,
        unit: goal.unit || '%',
        status: 'on_track',
      })
      .select()
      .single()
    if (error) throw error
    return toAppGoal(data)
  } catch (err) {
    console.warn('[Supabase] Mock create goal:', err)
    return {
      id: `mock-${Date.now()}`,
      title: goal.title || 'New Goal',
      status: 'active',
      progress: 0,
      target_value: goal.target_value,
      current_value: goal.current_value,
      unit: goal.unit,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
}

export async function updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
  try {
    const dbUpdates: Record<string, any> = {}
    if (updates.title) dbUpdates.title = updates.title
    if (updates.current_value !== undefined) dbUpdates.current_value = updates.current_value
    if (updates.target_value !== undefined) dbUpdates.target_value = updates.target_value
    if (updates.unit) dbUpdates.unit = updates.unit
    dbUpdates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('jarvis_goals')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return toAppGoal(data)
  } catch (err) {
    console.warn('[Supabase] Mock update goal:', err)
    return { id, ...updates } as Goal
  }
}

// ─── Notifications ──────────────────────────────────────────────────────────

export async function fetchNotifications(unreadOnly = false): Promise<Notification[]> {
  try {
    let query = supabase.from('jarvis_notifications').select('*').order('created_at', { ascending: false })
    if (unreadOnly) query = query.eq('is_read', false)
    const { data, error } = await query
    if (error) throw error
    return (data || []).map(toAppNotification)
  } catch {
    return unreadOnly ? mockNotifications.filter(n => !n.read) : mockNotifications
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  try {
    await supabase.from('jarvis_notifications').update({ is_read: true }).eq('id', id)
  } catch (err) {
    console.warn('[Supabase] Mock mark notification read:', err)
  }
}

// ─── Activity ───────────────────────────────────────────────────────────────

export async function fetchActivityLogs(limit = 20): Promise<ActivityLog[]> {
  try {
    const { data, error } = await supabase
      .from('jarvis_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data || []).map(toAppActivity)
  } catch {
    return mockActivityLogs.slice(0, limit)
  }
}

// ─── Playbooks ──────────────────────────────────────────────────────────────

export async function fetchPlaybooks(): Promise<Playbook[]> {
  try {
    const { data, error } = await supabase
      .from('jarvis_playbooks')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(toAppPlaybook)
  } catch {
    return mockPlaybooks
  }
}

export async function createPlaybook(playbook: Partial<Playbook>): Promise<Playbook> {
  try {
    const { data, error } = await supabase
      .from('jarvis_playbooks')
      .insert({
        title: playbook.name || 'New Playbook',
        category: 'general',
        status: 'active',
        body: playbook.description || '',
        variables: [],
      })
      .select()
      .single()
    if (error) throw error
    return toAppPlaybook(data)
  } catch (err) {
    console.warn('[Supabase] Mock create playbook:', err)
    return {
      id: `mock-${Date.now()}`,
      name: playbook.name || 'New Playbook',
      description: playbook.description,
      steps: [],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
}

export async function updatePlaybook(id: string, updates: Partial<Playbook>): Promise<Playbook> {
  try {
    const dbUpdates: Record<string, any> = {}
    if (updates.name) dbUpdates.title = updates.name
    if (updates.description) dbUpdates.body = updates.description
    if (updates.status) dbUpdates.status = updates.status
    dbUpdates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('jarvis_playbooks')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return toAppPlaybook(data)
  } catch (err) {
    console.warn('[Supabase] Mock update playbook:', err)
    return { id, ...updates } as Playbook
  }
}

// ─── Schedules ──────────────────────────────────────────────────────────────

export async function fetchSchedules(): Promise<Schedule[]> {
  try {
    const { data, error } = await supabase
      .from('jarvis_schedules')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(toAppSchedule)
  } catch {
    return mockSchedules
  }
}

export async function createSchedule(schedule: Partial<Schedule>): Promise<Schedule> {
  try {
    const { data, error } = await supabase
      .from('jarvis_schedules')
      .insert({
        name: schedule.name || 'New Schedule',
        description: schedule.description || '',
        cron_expression: schedule.cron_expression || '0 0 * * *',
        human_readable: 'Every day at midnight',
        status: 'running',
        run_history: [],
        notify_on_completion: false,
      })
      .select()
      .single()
    if (error) throw error
    return toAppSchedule(data)
  } catch (err) {
    console.warn('[Supabase] Mock create schedule:', err)
    return {
      id: `mock-${Date.now()}`,
      name: schedule.name || 'New Schedule',
      description: schedule.description,
      cron_expression: schedule.cron_expression || '0 0 * * *',
      action: schedule.name || 'unknown',
      enabled: true,
      created_at: new Date().toISOString(),
    }
  }
}

export async function updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule> {
  try {
    const dbUpdates: Record<string, any> = {}
    if (updates.name) dbUpdates.name = updates.name
    if (updates.description) dbUpdates.description = updates.description
    if (updates.cron_expression) dbUpdates.cron_expression = updates.cron_expression
    if (updates.enabled !== undefined) dbUpdates.status = updates.enabled ? 'running' : 'paused'
    dbUpdates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('jarvis_schedules')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return toAppSchedule(data)
  } catch (err) {
    console.warn('[Supabase] Mock update schedule:', err)
    return { id, ...updates } as Schedule
  }
}

// ─── Agent Control ──────────────────────────────────────────────────────────

export async function sendDirective(directive: string): Promise<{ success: boolean; response: string }> {
  try {
    // Store directive as a notification
    await supabase.from('jarvis_notifications').insert({
      type: 'update',
      title: 'Directive Sent',
      description: directive,
      is_read: false,
    })
    return { success: true, response: `Directive received: "${directive}"` }
  } catch {
    console.info('[Supabase] Mock: directive sent', directive)
    return { success: true, response: `Directive received: "${directive}" (mock)` }
  }
}

export async function getAgentStatus(): Promise<{ status: string; uptime: number; memory: number; cpu: number }> {
  try {
    // Try to get latest activity as a health check
    const { data, error } = await supabase
      .from('jarvis_activity_log')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) throw error
    const lastActive = data?.[0]?.created_at
    const minutesSinceActive = lastActive
      ? (Date.now() - new Date(lastActive).getTime()) / 60000
      : 999
    return {
      status: minutesSinceActive < 60 ? 'active' : 'idle',
      uptime: 99.8,
      memory: 42,
      cpu: 18,
    }
  } catch {
    return { status: 'active', uptime: 99.8, memory: 42, cpu: 18 }
  }
}
