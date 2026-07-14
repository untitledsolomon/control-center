'use client'
import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from 'react'
import { supabase } from './supabase'
import type {
  Task, Goal, Instruction, Notification, Activity,
  Output, CronJob, Playbook, ReviewItem, AppState,
  WeeklyData, HourlyData
} from './types'

// ─── Supabase Table Names ───
const TABLES = {
  tasks: 'jarvis_tasks',
  goals: 'jarvis_goals',
  instructions: 'jarvis_instructions',
  notifications: 'jarvis_notifications',
  schedules: 'jarvis_schedules',
  activity: 'jarvis_activity_log',
  playbooks: 'jarvis_playbooks',
  review: 'jarvis_review_items',
  outputs: 'jarvis_outputs',
} as const

class DbError extends Error {
  constructor(op: string, cause: unknown) {
    super('db:' + op + ' — ' + (cause instanceof Error ? cause.message : typeof cause === 'object' && cause !== null && 'message' in cause ? String((cause as any).message) : 'Unknown error'))
    this.name = 'DbError'
  }
}

function throwDbError(op: string, cause: unknown): never {
  throw new DbError(op, cause)
}

function parseDate(val: string | undefined | null, fallback: Date = new Date()): Date {
  if (!val) return fallback
  const d = new Date(val)
  return isNaN(d.getTime()) ? fallback : d
}

function mapTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    priority: row.priority === 'high' ? 'high' : row.priority === 'low' ? 'low' : 'medium',
    category: row.category === 'outreach' ? 'Outreach' : row.category === 'content' ? 'Content' : row.category === 'research' ? 'Research' : row.category === 'crm' ? 'CRM' : 'System',
    status: row.status === 'queued' ? 'queued' : row.status === 'active' ? 'active' : row.status === 'blocked' ? 'blocked' : 'complete',
    linkedGoal: row.linked_goal_id ?? undefined,
    createdAt: parseDate(row.created_at),
    blockedReason: row.blocked_reason ?? undefined,
    conversation: row.conversation ?? undefined,
  }
}

function mapGoal(row: any): Goal {
  const cat = row.category || 'revenue'
  return {
    id: row.id,
    title: row.title,
    category: cat === 'revenue' ? 'Revenue' : cat === 'content' ? 'Content' : cat === 'outreach' ? 'Outreach' : 'Product',
    target: Number(row.target_value) || 0,
    current: Number(row.current_value) || 0,
    unit: row.unit || '',
    dueDate: parseDate(row.due_date, new Date(Date.now() + 30 * 86400000)),
    taskCount: 0,
    status: row.status === 'at_risk' ? 'at_risk' : row.status === 'behind' ? 'behind' : 'on_track',
  }
}

function mapInstruction(row: any): Instruction {
  const cat = row.category || 'tone'
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: cat === 'tone' ? 'Tone' : cat === 'scheduling' ? 'Scheduling' : cat === 'outreach' ? 'Outreach' : cat === 'privacy' ? 'Privacy' : 'Escalation',
    active: row.is_active,
    lastModified: parseDate(row.updated_at),
  }
}

function mapNotification(row: any): Notification {
  return {
    id: row.id,
    type: row.type === 'attention' ? 'attention' : row.type === 'completed' ? 'completed' : 'update',
    icon: row.type === 'attention' ? 'AlertTriangle' : row.type === 'completed' ? 'CheckCircle' : 'RefreshCw',
    title: row.title,
    description: row.description || '',
    timestamp: parseDate(row.created_at),
    screen: row.linked_screen || '/',
  }
}

function mapActivity(row: any): Activity {
  const badgeMap: Record<string, string> = {
    task_complete: 'TASK_COMPLETE',
    task_started: 'TASK_COMPLETE',
    outreach_sent: 'OUTREACH_SENT',
    lead_scraped: 'LEAD_SCRAPED',
    content_posted: 'CONTENT_POSTED',
    review_requested: 'TASK_COMPLETE',
    error: 'ERROR',
    sync: 'TASK_COMPLETE',
  }
  const titleMap: Record<string, string> = {
    task_complete: 'Task completed',
    outreach_sent: 'Outreach sent',
    lead_scraped: 'Leads scraped',
    content_posted: 'Content posted',
    error: 'Error occurred',
    sync: 'System sync',
  }
  return {
    id: row.id,
    timestamp: parseDate(row.created_at),
    badge: badgeMap[row.event_type] || 'TASK_COMPLETE',
    title: titleMap[row.event_type] || row.event_type?.replace(/_/g, ' ') || 'Activity',
    description: row.description || '',
  }
}

function mapCronJob(row: any): CronJob {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    cronExpression: row.cron_expression,
    humanReadable: row.human_readable || '',
    status: row.status === 'paused' ? 'paused' : row.status === 'failed' ? 'failed' : 'running',
    linkedDirective: row.linked_instruction_id ?? undefined,
    lastRun: row.last_run_at ? new Date(row.last_run_at) : null,
    lastResult: row.last_run_status === 'failed' ? 'fail' : row.last_run_status === 'success' ? 'success' : null,
    lastDuration: null,
    nextRun: parseDate(row.next_run_at, new Date(Date.now() + 86400000)),
    history: row.run_history ? row.run_history : [],
    notifyOnComplete: row.notify_on_completion,
  }
}

function mapPlaybook(row: any): Playbook {
  let vars: { key: string; value: string }[] = []
  if (row.variables) {
    const v = row.variables
    if (Array.isArray(v)) {
      vars = v.map((item: any) => ({
        key: typeof item.key === 'string' ? item.key : String(item.key ?? ''),
        value: typeof item.value === 'string' ? item.value : String(item.value ?? ''),
      }))
    } else if (typeof v === 'string') {
      try {
        const parsed = JSON.parse(v)
        if (Array.isArray(parsed)) {
          vars = parsed.map((item: any) => ({
            key: typeof item.key === 'string' ? item.key : String(item.key ?? ''),
            value: typeof item.value === 'string' ? item.value : String(item.value ?? ''),
          }))
        }
      } catch {}
    }
  }
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    status: row.status,
    body: row.body || '',
    variables: vars,
    createdAt: parseDate(row.created_at),
    updatedAt: parseDate(row.updated_at),
  }
}

function mapReviewItem(row: any): ReviewItem {
  let content: Record<string, any> = {}
  if (row.content) {
    const c = row.content
    content = typeof c === 'object' && c !== null ? c : {}
  }
  let comments: { author: string; text: string; timestamp: Date }[] = []
  if (row.comments) {
    const c = row.comments
    if (Array.isArray(c)) {
      comments = c.map((item: any) => ({
        author: item.author === 'solomon' || item.author === 'jarvis' ? item.author : 'jarvis',
        text: typeof item.text === 'string' ? item.text : String(item.text ?? ''),
        timestamp: new Date(item.timestamp ?? Date.now()),
      }))
    }
  }
  let statusHistory: { status: string; timestamp: Date; note?: string }[] = []
  if (row.status_history) {
    const sh = row.status_history
    if (Array.isArray(sh)) {
      statusHistory = sh.map((item: any) => ({
        status: ['pending', 'approved', 'declined', 'needs_revision'].includes(item.status) ? item.status : 'pending',
        timestamp: new Date(item.timestamp ?? Date.now()),
        note: item.note ?? undefined,
      }))
    }
  }
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    status: row.status,
    content,
    comments,
    statusHistory,
    linkedTaskId: row.linked_task_id ?? null,
    createdAt: new Date(row.created_at ?? Date.now()),
    updatedAt: new Date(row.updated_at ?? Date.now()),
  }
}

function mapOutput(row: any): Output {
  const type = row.type || 'research'
  return {
    id: row.id,
    type: type === 'content' ? 'Content' : type === 'report' ? 'Reports' : type === 'lead_list' ? 'Lead Lists' : type === 'email' ? 'Emails' : 'Research',
    title: row.title,
    summary: row.summary || '',
    date: parseDate(row.created_at),
    linkedTask: row.linked_task_id ?? undefined,
    count: row.item_count ?? undefined,
    wordCount: row.word_count ?? undefined,
    body: row.content || '',
  }
}

// ─── Database Operations ───
async function fetchAll<T>(table: string, mapper: (row: any) => T, orderBy?: string): Promise<T[]> {
  let query = supabase.from(table).select('*')
  if (orderBy) query = query.order(orderBy, { ascending: false })
  const { data, error } = await query
  if (error) throwDbError('fetch:' + table, error)
  return (data ?? []).map(mapper)
}

async function insertOne<T>(table: string, payload: any, mapper: (row: any) => T): Promise<T> {
  const { data, error } = await supabase.from(table).insert(payload).select().single()
  if (error) throwDbError('insert:' + table, error)
  return mapper(data)
}

async function updateOne<T>(table: string, id: string, updates: any, mapper: (row: any) => T): Promise<T> {
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single()
  if (error) throwDbError('update:' + table, error)
  return mapper(data)
}

async function deleteOne(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throwDbError('delete:' + table, error)
}

// ─── Task Operations ───
async function fetchTasks() { return fetchAll(TABLES.tasks, mapTask, 'created_at') }
async function createTask(task: Partial<Task>) {
  return insertOne(TABLES.tasks, {
    title: task.title,
    description: task.description || null,
    priority: task.priority === 'high' ? 'high' : task.priority === 'low' ? 'low' : 'medium',
    category: task.category === 'Outreach' ? 'outreach' : task.category === 'Content' ? 'content' : task.category === 'Research' ? 'research' : task.category === 'CRM' ? 'crm' : 'system',
    status: task.status === 'queued' ? 'queued' : task.status === 'active' ? 'active' : task.status === 'blocked' ? 'blocked' : 'complete',
    linked_goal_id: task.linkedGoal || null,
    blocked_reason: task.blockedReason || null,
  }, mapTask)
}
async function updateTask(id: string, updates: any) { return updateOne(TABLES.tasks, id, updates, mapTask) }
async function deleteTask(id: string) { return deleteOne(TABLES.tasks, id) }

// ─── Goal Operations ───
async function fetchGoals() { return fetchAll(TABLES.goals, mapGoal, 'created_at') }
async function createGoal(goal: Partial<Goal>) {
  return insertOne(TABLES.goals, {
    title: goal.title,
    category: goal.category === 'Revenue' ? 'revenue' : goal.category === 'Content' ? 'content' : goal.category === 'Outreach' ? 'outreach' : 'product',
    target_value: goal.target || 0,
    current_value: goal.current || 0,
    unit: goal.unit || null,
    due_date: goal.dueDate ? goal.dueDate.toISOString().split('T')[0] : null,
    status: goal.status === 'at_risk' ? 'at_risk' : goal.status === 'behind' ? 'behind' : 'on_track',
  }, mapGoal)
}
async function updateGoal(id: string, updates: any) { return updateOne(TABLES.goals, id, updates, mapGoal) }
async function deleteGoal(id: string) { return deleteOne(TABLES.goals, id) }

// ─── Instruction Operations ───
async function fetchInstructions() { return fetchAll(TABLES.instructions, mapInstruction, 'updated_at') }
async function createInstruction(inst: Partial<Instruction>) {
  return insertOne(TABLES.instructions, {
    title: inst.title,
    body: inst.body,
    category: inst.category === 'Tone' ? 'tone' : inst.category === 'Scheduling' ? 'scheduling' : inst.category === 'Outreach' ? 'outreach' : inst.category === 'Privacy' ? 'privacy' : 'escalation',
    is_active: inst.active ?? true,
  }, mapInstruction)
}
async function updateInstruction(id: string, updates: any) { return updateOne(TABLES.instructions, id, updates, mapInstruction) }
async function deleteInstruction(id: string) { return deleteOne(TABLES.instructions, id) }

// ─── Notification Operations ───
async function fetchNotifications() { return fetchAll(TABLES.notifications, mapNotification, 'created_at') }
async function createNotification(notif: Partial<Notification>) {
  return insertOne(TABLES.notifications, {
    title: notif.title,
    description: notif.description || null,
    type: notif.type || 'update',
    linked_screen: notif.screen || null,
  }, mapNotification)
}
async function dismissNotification(id: string) { return deleteOne(TABLES.notifications, id) }
async function markAllNotificationsRead() {
  const { error } = await supabase.from(TABLES.notifications).update({ is_read: true }).is('is_read', false)
  if (error) throwDbError('markAllNotificationsRead', error)
}

// ─── Activity Operations ───
async function fetchActivity() { return fetchAll(TABLES.activity, mapActivity, 'created_at') }
async function createActivity(act: Partial<Activity>) {
  const eventMap: Record<string, string> = {
    TASK_COMPLETE: 'task_complete',
    OUTREACH_SENT: 'outreach_sent',
    LEAD_SCRAPED: 'lead_scraped',
    CONTENT_POSTED: 'content_posted',
    ERROR: 'error',
  }
  return insertOne(TABLES.activity, {
    event_type: eventMap[act.badge || ''] || 'sync',
    description: act.description || null,
  }, mapActivity)
}

// ─── Schedule/Cron Operations ───
async function fetchSchedules() { return fetchAll(TABLES.schedules, mapCronJob, 'created_at') }
async function createSchedule(sched: Partial<CronJob>) {
  return insertOne(TABLES.schedules, {
    name: sched.name,
    description: sched.description || null,
    cron_expression: sched.cronExpression,
    human_readable: sched.humanReadable || null,
    status: sched.status === 'paused' ? 'paused' : 'running',
    linked_instruction_id: sched.linkedDirective || null,
    notify_on_completion: sched.notifyOnComplete ?? false,
  }, mapCronJob)
}
async function updateSchedule(id: string, updates: any) { return updateOne(TABLES.schedules, id, updates, mapCronJob) }
async function deleteSchedule(id: string) { return deleteOne(TABLES.schedules, id) }

// ─── Playbook Operations ───
async function fetchPlaybooks() { return fetchAll(TABLES.playbooks, mapPlaybook, 'updated_at') }
async function createPlaybook(pb: Partial<Playbook>) {
  return insertOne(TABLES.playbooks, {
    title: pb.title,
    category: pb.category,
    status: pb.status,
    body: pb.body || null,
    variables: pb.variables ? JSON.stringify(pb.variables) : null,
  }, mapPlaybook)
}
async function updatePlaybook(id: string, updates: any) { return updateOne(TABLES.playbooks, id, updates, mapPlaybook) }
async function deletePlaybook(id: string) { return deleteOne(TABLES.playbooks, id) }

// ─── Review Operations ───
async function fetchReviewItems() { return fetchAll(TABLES.review, mapReviewItem, 'created_at') }
async function createReviewItem(item: Partial<ReviewItem>) {
  return insertOne(TABLES.review, {
    title: item.title,
    type: item.type,
    status: item.status || 'pending',
    content: item.content ? JSON.stringify(item.content) : '{}',
    comments: item.comments ? JSON.stringify(item.comments) : '[]',
    status_history: item.statusHistory ? JSON.stringify(item.statusHistory) : '[]',
    linked_task_id: item.linkedTaskId || null,
  }, mapReviewItem)
}
async function updateReviewItem(id: string, updates: any) { return updateOne(TABLES.review, id, updates, mapReviewItem) }
async function deleteReviewItem(id: string) { return deleteOne(TABLES.review, id) }

// ─── Output Operations ───
async function fetchOutputs() { return fetchAll(TABLES.outputs, mapOutput, 'created_at') }

// ─── Mock Data ───
let mockIdCounter = 100
function genId(prefix: string) { return prefix + (++mockIdCounter) }

export const weeklyData: WeeklyData[] = [
  { day: 'Mon', tasks: 4, posts: 2, leads: 8 },
  { day: 'Tue', tasks: 6, posts: 1, leads: 12 },
  { day: 'Wed', tasks: 3, posts: 2, leads: 5 },
  { day: 'Thu', tasks: 8, posts: 1, leads: 15 },
  { day: 'Fri', tasks: 5, posts: 2, leads: 7 },
  { day: 'Sat', tasks: 2, posts: 0, leads: 3 },
  { day: 'Sun', tasks: 1, posts: 1, leads: 0 },
]

export const hourlyData: HourlyData[] = [
  { hour: '06', value: 2 },
  { hour: '08', value: 8 },
  { hour: '10', value: 15 },
  { hour: '12', value: 12 },
  { hour: '14', value: 18 },
  { hour: '16', value: 10 },
  { hour: '18', value: 6 },
  { hour: '20', value: 3 },
]

const mockTasks: Task[] = [
  { id: 't1', title: 'Instagram carousel published', description: 'Content pipeline completed', priority: 'medium', category: 'Content', status: 'complete', createdAt: new Date(Date.now() - 30 * 60000) },
  { id: 't2', title: 'Blog post published', description: 'CRM Adoption for Kampala SMEs', priority: 'medium', category: 'Content', status: 'complete', createdAt: new Date(Date.now() - 60 * 60000) },
  { id: 't3', title: 'Case study published', description: 'Regent CRM case study', priority: 'medium', category: 'Content', status: 'complete', createdAt: new Date(Date.now() - 60 * 60000) },
  { id: 't4', title: 'Revenue tracker updated', description: 'Q2 revenue tracking', priority: 'high', category: 'System', status: 'complete', createdAt: new Date(Date.now() - 120 * 60000) },
  { id: 't5', title: 'Morning deal check', description: 'No new pipeline changes', priority: 'low', category: 'System', status: 'complete', createdAt: new Date(Date.now() - 120 * 60000) },
  { id: 't6', title: 'Generate lead list for Kampala', description: 'Restaurant district outreach', priority: 'high', category: 'Outreach', status: 'active', createdAt: new Date(Date.now() - 240 * 60000) },
  { id: 't7', title: 'Draft Q2 case study', description: 'Boosted Technologies LTD', priority: 'medium', category: 'Content', status: 'active', createdAt: new Date(Date.now() - 300 * 60000) },
  { id: 't8', title: 'Schedule Instagram posts', description: '7 carousels waiting', priority: 'high', category: 'Content', status: 'blocked', createdAt: new Date(Date.now() - 3 * 86400000), blockedReason: 'Waiting on slide generation' },
]

const mockGoals: Goal[] = [
  { id: 'g1', title: 'Close 2 new clients', category: 'Revenue', target: 2, current: 1, unit: 'clients', dueDate: new Date(Date.now() + 20 * 86400000), taskCount: 3, status: 'on_track' },
  { id: 'g2', title: 'Publish 60 Instagram posts', category: 'Content', target: 60, current: 34, unit: 'posts', dueDate: new Date(Date.now() + 25 * 86400000), taskCount: 4, status: 'at_risk' },
  { id: 'g3', title: 'Generate 200 qualified leads', category: 'Outreach', target: 200, current: 147, unit: 'leads', dueDate: new Date(Date.now() + 30 * 86400000), taskCount: 2, status: 'on_track' },
  { id: 'g4', title: 'Launch Regent CRM v1', category: 'Product', target: 100, current: 65, unit: '% complete', dueDate: new Date(Date.now() + 45 * 86400000), taskCount: 5, status: 'on_track' },
]

const mockNotifications: Notification[] = [
  { id: 'n1', type: 'attention', icon: 'AlertTriangle', title: 'Content pipeline blocked', description: '7 carousels waiting on slide generation — 3 days overdue', timestamp: new Date(Date.now() - 60 * 60000), screen: '/queue' },
  { id: 'n2', type: 'attention', icon: 'AlertTriangle', title: 'Meta webhook not configured', description: 'WhatsApp message delivery tracking is unavailable', timestamp: new Date(Date.now() - 4 * 3600000), screen: '/status' },
  { id: 'n3', type: 'update', icon: 'RefreshCw', title: 'New lead reply', description: 'Boosted Technologies LTD — interested in CRM demo', timestamp: new Date(Date.now() - 8 * 3600000), screen: '/queue' },
  { id: 'n4', type: 'update', icon: 'RefreshCw', title: 'Pipeline update', description: '9 new leads identified in Kampala restaurant district', timestamp: new Date(Date.now() - 12 * 3600000), screen: '/queue' },
  { id: 'n5', type: 'completed', icon: 'CheckCircle', title: 'Task completed', description: 'Morning deal check — no new pipeline changes', timestamp: new Date(Date.now() - 2 * 3600000), screen: '/' },
  { id: 'n6', type: 'completed', icon: 'CheckCircle', title: 'Content published', description: 'CRM Adoption for Kampala SMEs posted to regentplatform.com', timestamp: new Date(Date.now() - 6 * 3600000), screen: '/' },
]

const mockActivity: Activity[] = [
  { id: 'a1', timestamp: new Date(Date.now() - 30 * 60000), badge: 'TASK_COMPLETE', title: 'Instagram carousel published', description: 'Content pipeline completed' },
  { id: 'a2', timestamp: new Date(Date.now() - 60 * 60000), badge: 'CONTENT_POSTED', title: 'Blog post published', description: 'CRM Adoption for Kampala SMEs' },
  { id: 'a3', timestamp: new Date(Date.now() - 60 * 60000), badge: 'CONTENT_POSTED', title: 'Case study published', description: 'Regent CRM case study' },
  { id: 'a4', timestamp: new Date(Date.now() - 120 * 60000), badge: 'TASK_COMPLETE', title: 'Revenue tracker updated', description: 'Q2 revenue tracking' },
  { id: 'a5', timestamp: new Date(Date.now() - 180 * 60000), badge: 'ERROR', title: 'Instagram token invalid', description: 'API authentication failed' },
]

function computeStats(tasks: Task[], notifications: Notification[]) {
  return [
    { label: 'Tasks Completed', value: tasks.filter(t => t.status === 'complete').length, icon: 'CheckCircle', color: 'success' },
    { label: 'Active Tasks', value: tasks.filter(t => t.status === 'active').length, icon: 'FileText', color: 'accent' },
    { label: 'Leads Touched', value: 41, icon: 'Users', color: 'purple' },
    { label: 'Blocked Tasks', value: tasks.filter(t => t.status === 'blocked').length, icon: 'AlertTriangle', color: 'error' },
  ]
}

function computeAlerts(notifications: Notification[]) {
  return notifications.filter(n => n.type === 'attention').slice(0, 3).map(n => ({
    id: n.id,
    title: n.title,
    description: n.description,
    timestamp: n.timestamp,
    actionLabel: 'View',
    type: 'warning' as const,
  }))
}

function getInitialState(): AppState {
  return {
    tasks: [...mockTasks],
    goals: [...mockGoals],
    instructions: [],
    notifications: [...mockNotifications],
    activity: [...mockActivity],
    stats: computeStats(mockTasks, mockNotifications),
    alerts: computeAlerts(mockNotifications),
    outputs: [],
    cronJobs: [],
    playbooks: [],
    reviewItems: [],
  }
}

// ─── Reducer ───
type Action =
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK_STATUS'; payload: { id: string; status: string; blockedReason?: string } }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: any } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'UPDATE_GOAL_STATUS'; payload: { id: string; status: string } }
  | { type: 'SET_INSTRUCTIONS'; payload: Instruction[] }
  | { type: 'TOGGLE_INSTRUCTION'; payload: string }
  | { type: 'ADD_INSTRUCTION'; payload: Instruction }
  | { type: 'UPDATE_INSTRUCTION'; payload: { id: string; updates: any } }
  | { type: 'DELETE_INSTRUCTION'; payload: string }
  | { type: 'SET_OUTPUTS'; payload: Output[] }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'DISMISS_NOTIFICATION'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'PUSH_NOTIFICATION'; payload: Notification }
  | { type: 'SET_ACTIVITY'; payload: Activity[] }
  | { type: 'ADD_ACTIVITY'; payload: Activity }
  | { type: 'PUSH_ACTIVITY'; payload: Activity }
  | { type: 'SET_CRON_JOBS'; payload: CronJob[] }
  | { type: 'ADD_SCHEDULE'; payload: CronJob }
  | { type: 'DELETE_SCHEDULE'; payload: string }
  | { type: 'TOGGLE_SCHEDULE'; payload: string }
  | { type: 'RUN_SCHEDULE'; payload: string }
  | { type: 'UPDATE_SCHEDULE'; payload: { id: string; updates: any } }
  | { type: 'SET_PLAYBOOKS'; payload: Playbook[] }
  | { type: 'ADD_PLAYBOOK'; payload: Playbook }
  | { type: 'UPDATE_PLAYBOOK'; payload: { id: string; updates: any } }
  | { type: 'DELETE_PLAYBOOK'; payload: string }
  | { type: 'SET_REVIEW_ITEMS'; payload: ReviewItem[] }
  | { type: 'ADD_REVIEW_ITEM'; payload: ReviewItem }
  | { type: 'UPDATE_REVIEW_ITEM'; payload: { id: string; updates: any } }
  | { type: 'DELETE_REVIEW_ITEM'; payload: string }
  | { type: 'REFRESH_STATS' }

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.payload }
    case 'ADD_TASK': {
      const task = { ...action.payload, id: action.payload.id || genId('t'), createdAt: new Date() }
      return { ...state, tasks: [task, ...state.tasks] }
    }
    case 'UPDATE_TASK_STATUS': {
      const tasks = state.tasks.map(t =>
        t.id === action.payload.id ? { ...t, status: action.payload.status as any, blockedReason: action.payload.blockedReason } : t
      )
      return { ...state, tasks }
    }
    case 'UPDATE_TASK': {
      const tasks = state.tasks.map(t =>
        t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
      )
      return { ...state, tasks }
    }
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) }
    case 'SET_GOALS':
      return { ...state, goals: action.payload }
    case 'ADD_GOAL': {
      const goal = { ...action.payload, id: action.payload.id || genId('g'), status: 'on_track' as const }
      return { ...state, goals: [...state.goals, goal] }
    }
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter(g => g.id !== action.payload) }
    case 'UPDATE_GOAL_STATUS': {
      const goals = state.goals.map(g =>
        g.id === action.payload.id ? { ...g, status: action.payload.status as any } : g
      )
      return { ...state, goals }
    }
    case 'SET_INSTRUCTIONS':
      return { ...state, instructions: action.payload }
    case 'TOGGLE_INSTRUCTION': {
      const instructions = state.instructions.map(i =>
        i.id === action.payload ? { ...i, active: !i.active, lastModified: new Date() } : i
      )
      return { ...state, instructions }
    }
    case 'ADD_INSTRUCTION': {
      const inst = { ...action.payload, id: action.payload.id || genId('si'), lastModified: new Date() }
      return { ...state, instructions: [...state.instructions, inst] }
    }
    case 'UPDATE_INSTRUCTION': {
      const instructions = state.instructions.map(i =>
        i.id === action.payload.id ? { ...i, ...action.payload.updates, lastModified: new Date() } : i
      )
      return { ...state, instructions }
    }
    case 'DELETE_INSTRUCTION':
      return { ...state, instructions: state.instructions.filter(i => i.id !== action.payload) }
    case 'SET_OUTPUTS':
      return { ...state, outputs: action.payload }
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload }
    case 'DISMISS_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) }
    case 'MARK_ALL_NOTIFICATIONS_READ':
      return { ...state, notifications: [] }
    case 'ADD_NOTIFICATION': {
      const notif = { ...action.payload, id: action.payload.id || genId('n') }
      return { ...state, notifications: [notif, ...state.notifications] }
    }
    case 'PUSH_NOTIFICATION': {
      const notif = { ...action.payload, id: action.payload.id || genId('n') }
      return { ...state, notifications: [notif, ...state.notifications] }
    }
    case 'SET_ACTIVITY':
      return { ...state, activity: action.payload }
    case 'ADD_ACTIVITY': {
      const act = { ...action.payload, id: action.payload.id || genId('a') }
      return { ...state, activity: [act, ...state.activity] }
    }
    case 'PUSH_ACTIVITY': {
      const act = { ...action.payload, id: action.payload.id || genId('a') }
      return { ...state, activity: [act, ...state.activity] }
    }
    case 'SET_CRON_JOBS':
      return { ...state, cronJobs: action.payload }
    case 'ADD_SCHEDULE': {
      const sched = { ...action.payload, id: action.payload.id || genId('s') }
      return { ...state, cronJobs: [...state.cronJobs, sched] }
    }
    case 'DELETE_SCHEDULE':
      return { ...state, cronJobs: state.cronJobs.filter(s => s.id !== action.payload) }
    case 'TOGGLE_SCHEDULE': {
      const cronJobs = state.cronJobs.map(s =>
        s.id === action.payload ? { ...s, status: s.status === 'paused' ? 'running' as const : 'paused' as const } : s
      )
      return { ...state, cronJobs }
    }
    case 'RUN_SCHEDULE': {
      const cronJobs = state.cronJobs.map(s =>
        s.id === action.payload ? { ...s, lastRun: new Date(), lastResult: 'success' as const, nextRun: new Date(Date.now() + 86400000) } : s
      )
      return { ...state, cronJobs }
    }
    case 'UPDATE_SCHEDULE': {
      const cronJobs = state.cronJobs.map(s =>
        s.id === action.payload.id ? { ...s, ...action.payload.updates } : s
      )
      return { ...state, cronJobs }
    }
    case 'SET_PLAYBOOKS':
      return { ...state, playbooks: action.payload }
    case 'ADD_PLAYBOOK': {
      const pb = { ...action.payload, id: action.payload.id || genId('pb') }
      return { ...state, playbooks: [...state.playbooks, pb] }
    }
    case 'UPDATE_PLAYBOOK': {
      const playbooks = state.playbooks.map(p =>
        p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
      )
      return { ...state, playbooks }
    }
    case 'DELETE_PLAYBOOK':
      return { ...state, playbooks: state.playbooks.filter(p => p.id !== action.payload) }
    case 'SET_REVIEW_ITEMS':
      return { ...state, reviewItems: action.payload }
    case 'ADD_REVIEW_ITEM': {
      const item = { ...action.payload, id: action.payload.id || genId('ri'), createdAt: new Date(), updatedAt: new Date() }
      return { ...state, reviewItems: [item, ...state.reviewItems] }
    }
    case 'UPDATE_REVIEW_ITEM': {
      const reviewItems = state.reviewItems.map(r =>
        r.id === action.payload.id ? { ...r, ...action.payload.updates, updatedAt: new Date() } : r
      )
      return { ...state, reviewItems }
    }
    case 'DELETE_REVIEW_ITEM':
      return { ...state, reviewItems: state.reviewItems.filter(r => r.id !== action.payload) }
    case 'REFRESH_STATS':
      return {
        ...state,
        stats: computeStats(state.tasks, state.notifications),
        alerts: computeAlerts(state.notifications),
      }
    default:
      return state
  }
}

// ─── Context ───
interface AppContextValue {
  state: AppState
  loading: boolean
  error: string | null
  refreshStats: () => void
  addTask: (task: Partial<Task>) => Promise<void>
  updateTaskStatus: (id: string, status: string, blockedReason?: string) => Promise<void>
  updateTask: (id: string, updates: any) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  addGoal: (goal: Partial<Goal>) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  updateGoalStatus: (id: string, status: string) => Promise<void>
  toggleInstruction: (id: string) => Promise<void>
  addInstruction: (inst: Partial<Instruction>) => Promise<void>
  updateInstruction: (id: string, updates: any) => Promise<void>
  deleteInstruction: (id: string) => Promise<void>
  dismissNotification: (id: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>
  addNotification: (notif: Partial<Notification>) => Promise<void>
  addActivity: (act: Partial<Activity>) => Promise<void>
  addSchedule: (sched: Partial<CronJob>) => Promise<void>
  deleteSchedule: (id: string) => Promise<void>
  toggleSchedule: (id: string) => Promise<void>
  runSchedule: (id: string) => Promise<void>
  updateSchedule: (id: string, updates: any) => Promise<void>
  refreshPlaybooks: () => Promise<void>
  addPlaybook: (pb: Partial<Playbook>) => Promise<void>
  updatePlaybook: (id: string, updates: any) => Promise<void>
  deletePlaybook: (id: string) => Promise<void>
  refreshReviewItems: () => Promise<void>
  addReviewItem: (item: Partial<ReviewItem>) => Promise<void>
  updateReviewItem: (id: string, updates: any) => Promise<void>
  deleteReviewItem: (id: string) => Promise<void>
  createTaskWithNotification: (task: Partial<Task>, activity: Partial<Activity>, notification: Partial<Notification>) => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, getInitialState)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    let cancelled = false

    ;(async () => {
      try {
        const [tasks, goals, instructions, outputs, notifications, activity, schedules, playbooks, review] = await Promise.all([
          fetchTasks().catch(() => [] as Task[]),
          fetchGoals().catch(() => [] as Goal[]),
          fetchInstructions().catch(() => [] as Instruction[]),
          fetchOutputs().catch(() => [] as Output[]),
          fetchNotifications().catch(() => [] as Notification[]),
          fetchActivity().catch(() => [] as Activity[]),
          fetchSchedules().catch(() => [] as CronJob[]),
          fetchPlaybooks().catch(() => [] as Playbook[]),
          fetchReviewItems().catch(() => [] as ReviewItem[]),
        ])
        if (cancelled) return

        if (tasks.length) dispatch({ type: 'SET_TASKS', payload: tasks })
        if (goals.length) dispatch({ type: 'SET_GOALS', payload: goals })
        if (instructions.length) dispatch({ type: 'SET_INSTRUCTIONS', payload: instructions })
        if (outputs.length) dispatch({ type: 'SET_OUTPUTS', payload: outputs })
        if (notifications.length) dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications })
        if (activity.length) dispatch({ type: 'SET_ACTIVITY', payload: activity })
        if (schedules.length) dispatch({ type: 'SET_CRON_JOBS', payload: schedules })
        if (playbooks.length) dispatch({ type: 'SET_PLAYBOOKS', payload: playbooks })
        if (review.length) dispatch({ type: 'SET_REVIEW_ITEMS', payload: review })
        dispatch({ type: 'REFRESH_STATS' })
        setLoading(false)
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : 'Failed to load data'
        console.warn('Supabase load failed, using mock data:', msg)
        setError(msg)
        setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [])

  // Real-time subscriptions
  useEffect(() => {
    const activitySub = supabase
      .channel('activity-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLES.activity }, (payload: any) => {
        dispatch({ type: 'PUSH_ACTIVITY', payload: mapActivity(payload.new) })
      })
      .subscribe()

    const notifSub = supabase
      .channel('notification-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLES.notifications }, (payload: any) => {
        dispatch({ type: 'PUSH_NOTIFICATION', payload: mapNotification(payload.new) })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(activitySub)
      supabase.removeChannel(notifSub)
    }
  }, [])

  const refreshStats = useCallback(() => { dispatch({ type: 'REFRESH_STATS' }) }, [])

  const addTask = useCallback(async (task: Partial<Task>) => {
    try {
      const created = await createTask(task)
      dispatch({ type: 'ADD_TASK', payload: created })
      dispatch({ type: 'REFRESH_STATS' })
      return
    } catch {}
    dispatch({ type: 'ADD_TASK', payload: task as Task })
    dispatch({ type: 'REFRESH_STATS' })
  }, [])

  const updateTaskStatus = useCallback(async (id: string, status: string, blockedReason?: string) => {
    try { await updateTask(id, { status, blocked_reason: blockedReason || null }) } catch {}
    dispatch({ type: 'UPDATE_TASK_STATUS', payload: { id, status, blockedReason } })
    dispatch({ type: 'REFRESH_STATS' })
  }, [])

  const updateTask = useCallback(async (id: string, updates: any) => {
    try { await updateTask(id, updates) } catch {}
    dispatch({ type: 'UPDATE_TASK', payload: { id, updates } })
    dispatch({ type: 'REFRESH_STATS' })
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    try { await deleteTask(id) } catch {}
    dispatch({ type: 'DELETE_TASK', payload: id })
    dispatch({ type: 'REFRESH_STATS' })
  }, [])

  const addGoal = useCallback(async (goal: Partial<Goal>) => {
    try {
      const created = await createGoal(goal)
      dispatch({ type: 'ADD_GOAL', payload: created })
      return
    } catch {}
    dispatch({ type: 'ADD_GOAL', payload: goal as Goal })
  }, [])

  const deleteGoal = useCallback(async (id: string) => {
    try { await deleteGoal(id) } catch {}
    dispatch({ type: 'DELETE_GOAL', payload: id })
  }, [])

  const updateGoalStatus = useCallback(async (id: string, status: string) => {
    try { await updateGoal(id, { status }) } catch {}
    dispatch({ type: 'UPDATE_GOAL_STATUS', payload: { id, status } })
  }, [])

  const toggleInstruction = useCallback(async (id: string) => {
    const inst = state.instructions.find(i => i.id === id)
    if (inst) {
      try { await updateInstruction(id, { is_active: !inst.active }) } catch {}
    }
    dispatch({ type: 'TOGGLE_INSTRUCTION', payload: id })
  }, [state.instructions])

  const addInstruction = useCallback(async (inst: Partial<Instruction>) => {
    try {
      const created = await createInstruction(inst)
      dispatch({ type: 'ADD_INSTRUCTION', payload: created })
      return
    } catch {}
    dispatch({ type: 'ADD_INSTRUCTION', payload: inst as Instruction })
  }, [])

  const updateInstruction = useCallback(async (id: string, updates: any) => {
    const dbUpdates: any = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.body !== undefined) dbUpdates.body = updates.body
    if (updates.active !== undefined) dbUpdates.is_active = updates.active
    if (updates.category !== undefined) {
      const c = updates.category.toLowerCase()
      dbUpdates.category = c === 'tone' ? 'tone' : c === 'scheduling' ? 'scheduling' : c === 'outreach' ? 'outreach' : c === 'privacy' ? 'privacy' : 'escalation'
    }
    try { await updateInstruction(id, dbUpdates) } catch {}
    dispatch({ type: 'UPDATE_INSTRUCTION', payload: { id, updates } })
  }, [])

  const deleteInstruction = useCallback(async (id: string) => {
    try { await deleteInstruction(id) } catch {}
    dispatch({ type: 'DELETE_INSTRUCTION', payload: id })
  }, [])

  const dismissNotification = useCallback(async (id: string) => {
    try { await dismissNotification(id) } catch {}
    dispatch({ type: 'DISMISS_NOTIFICATION', payload: id })
    dispatch({ type: 'REFRESH_STATS' })
  }, [])

  const markAllNotificationsRead = useCallback(async () => {
    try { await markAllNotificationsRead() } catch {}
    dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' })
    dispatch({ type: 'REFRESH_STATS' })
  }, [])

  const addNotification = useCallback(async (notif: Partial<Notification>) => {
    try {
      const created = await createNotification(notif)
      dispatch({ type: 'ADD_NOTIFICATION', payload: created })
      dispatch({ type: 'REFRESH_STATS' })
      return
    } catch {}
    dispatch({ type: 'ADD_NOTIFICATION', payload: notif as Notification })
    dispatch({ type: 'REFRESH_STATS' })
  }, [])

  const addActivity = useCallback(async (act: Partial<Activity>) => {
    try {
      const created = await createActivity(act)
      dispatch({ type: 'ADD_ACTIVITY', payload: created })
      return
    } catch {}
    dispatch({ type: 'ADD_ACTIVITY', payload: act as Activity })
  }, [])

  const addSchedule = useCallback(async (sched: Partial<CronJob>) => {
    try {
      await createSchedule(sched)
      dispatch({ type: 'PUSH_NOTIFICATION', payload: { id: genId('n'), type: 'update', icon: 'Clock', title: 'Schedule created: ' + sched.name, description: sched.description || '', timestamp: new Date(), screen: '/schedules' } as any })
      try { const s = await fetchSchedules(); dispatch({ type: 'SET_CRON_JOBS', payload: s }) } catch {}
      return
    } catch {}
    dispatch({ type: 'ADD_SCHEDULE', payload: sched as CronJob })
  }, [])

  const deleteSchedule = useCallback(async (id: string) => {
    try { await deleteSchedule(id) } catch {}
    dispatch({ type: 'DELETE_SCHEDULE', payload: id })
  }, [])

  const toggleSchedule = useCallback(async (id: string) => {
    const sched = state.cronJobs.find(s => s.id === id)
    if (sched) {
      try { await updateSchedule(id, { status: sched.status === 'paused' ? 'running' : 'paused' }) } catch {}
    }
    dispatch({ type: 'TOGGLE_SCHEDULE', payload: id })
  }, [state.cronJobs])

  const runSchedule = useCallback(async (id: string) => {
    try {
      const now = new Date().toISOString()
      await updateSchedule(id, { last_run_at: now, last_run_status: 'success', next_run_at: new Date(Date.now() + 86400000).toISOString() })
    } catch {}
    dispatch({ type: 'RUN_SCHEDULE', payload: id })
  }, [])

  const updateSchedule = useCallback(async (id: string, updates: any) => {
    const dbUpdates: any = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.cronExpression !== undefined) dbUpdates.cron_expression = updates.cronExpression
    if (updates.humanReadable !== undefined) dbUpdates.human_readable = updates.humanReadable
    if (updates.notifyOnComplete !== undefined) dbUpdates.notify_on_completion = updates.notifyOnComplete
    if (updates.status !== undefined) dbUpdates.status = updates.status
    try { await updateSchedule(id, dbUpdates) } catch {}
    dispatch({ type: 'UPDATE_SCHEDULE', payload: { id, updates } })
  }, [])

  const refreshPlaybooks = useCallback(async () => {
    try { const p = await fetchPlaybooks(); dispatch({ type: 'SET_PLAYBOOKS', payload: p }); return } catch {}
  }, [])

  const addPlaybook = useCallback(async (pb: Partial<Playbook>) => {
    try { const created = await createPlaybook(pb); dispatch({ type: 'ADD_PLAYBOOK', payload: created }); return } catch {}
    dispatch({ type: 'ADD_PLAYBOOK', payload: pb as Playbook })
  }, [])

  const updatePlaybook = useCallback(async (id: string, updates: any) => {
    const dbUpdates: any = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.category !== undefined) dbUpdates.category = updates.category
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.body !== undefined) dbUpdates.body = updates.body
    if (updates.variables !== undefined) dbUpdates.variables = JSON.stringify(updates.variables)
    try { await updatePlaybook(id, dbUpdates) } catch {}
    dispatch({ type: 'UPDATE_PLAYBOOK', payload: { id, updates } })
  }, [])

  const deletePlaybook = useCallback(async (id: string) => {
    try { await deletePlaybook(id) } catch {}
    dispatch({ type: 'DELETE_PLAYBOOK', payload: id })
  }, [])

  const refreshReviewItems = useCallback(async () => {
    try { const r = await fetchReviewItems(); dispatch({ type: 'SET_REVIEW_ITEMS', payload: r }); return } catch {}
  }, [])

  const addReviewItem = useCallback(async (item: Partial<ReviewItem>) => {
    try { const created = await createReviewItem(item); dispatch({ type: 'ADD_REVIEW_ITEM', payload: created }); return } catch {}
    dispatch({ type: 'ADD_REVIEW_ITEM', payload: item as ReviewItem })
  }, [])

  const updateReviewItem = useCallback(async (id: string, updates: any) => {
    const dbUpdates: any = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.type !== undefined) dbUpdates.type = updates.type
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.content !== undefined) dbUpdates.content = JSON.stringify(updates.content)
    if (updates.comments !== undefined) dbUpdates.comments = JSON.stringify(updates.comments)
    if (updates.statusHistory !== undefined) dbUpdates.status_history = JSON.stringify(updates.statusHistory)
    try { await updateReviewItem(id, dbUpdates) } catch {}
    dispatch({ type: 'UPDATE_REVIEW_ITEM', payload: { id, updates } })
  }, [])

  const deleteReviewItem = useCallback(async (id: string) => {
    try { await deleteReviewItem(id) } catch {}
    dispatch({ type: 'DELETE_REVIEW_ITEM', payload: id })
  }, [])

  const createTaskWithNotification = useCallback(async (task: Partial<Task>, activity: Partial<Activity>, notification: Partial<Notification>) => {
    addTask(task)
    addActivity(activity)
    addNotification(notification)
  }, [addTask, addActivity, addNotification])

  const value: AppContextValue = {
    state, loading, error, refreshStats,
    addTask, updateTaskStatus, updateTask, deleteTask,
    addGoal, deleteGoal, updateGoalStatus,
    toggleInstruction, addInstruction, updateInstruction, deleteInstruction,
    dismissNotification, markAllNotificationsRead, addNotification,
    addActivity,
    addSchedule, deleteSchedule, toggleSchedule, runSchedule, updateSchedule,
    refreshPlaybooks, addPlaybook, updatePlaybook, deletePlaybook,
    refreshReviewItems, addReviewItem, updateReviewItem, deleteReviewItem,
    createTaskWithNotification,
  }

  return React.createElement(AppContext.Provider, { value }, children)
}

export function useAppState() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
