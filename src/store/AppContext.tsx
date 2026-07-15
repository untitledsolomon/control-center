'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react'
import { DashboardStats, Task, Goal, Notification, ActivityLog, Playbook, Schedule, WeeklyActivity, HourlyActivity } from '@/lib/types'
import {
  fetchDashboardStats,
  fetchWeeklyActivity,
  fetchHourlyActivity,
  fetchTasks,
  createTask,
  updateTask,
  fetchGoals,
  createGoal,
  updateGoal,
  fetchNotifications,
  fetchActivityLogs,
  fetchPlaybooks,
  createPlaybook,
  updatePlaybook,
  fetchSchedules,
  createSchedule,
  updateSchedule,
  markNotificationRead,
  sendDirective,
} from '@/lib/api-client'

// ─── State ──────────────────────────────────────────────────────────────────

interface AppState {
  stats: DashboardStats | null
  weeklyActivity: WeeklyActivity[]
  hourlyActivity: HourlyActivity[]
  tasks: Task[]
  goals: Goal[]
  notifications: Notification[]
  activityLogs: ActivityLog[]
  playbooks: Playbook[]
  schedules: Schedule[]
  sidebarCollapsed: boolean
  notificationsOpen: boolean
  quickActionOpen: boolean
  loading: boolean
  error: string | null
}

const initialState: AppState = {
  stats: null,
  weeklyActivity: [],
  hourlyActivity: [],
  tasks: [],
  goals: [],
  notifications: [],
  activityLogs: [],
  playbooks: [],
  schedules: [],
  sidebarCollapsed: false,
  notificationsOpen: false,
  quickActionOpen: false,
  loading: true,
  error: null,
}

// ─── Actions ────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_STATS'; payload: DashboardStats }
  | { type: 'SET_WEEKLY_ACTIVITY'; payload: WeeklyActivity[] }
  | { type: 'SET_HOURLY_ACTIVITY'; payload: HourlyActivity[] }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'SET_ACTIVITY_LOGS'; payload: ActivityLog[] }
  | { type: 'SET_PLAYBOOKS'; payload: Playbook[] }
  | { type: 'SET_SCHEDULES'; payload: Schedule[] }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_NOTIFICATIONS_OPEN'; payload: boolean }
  | { type: 'SET_QUICK_ACTION_OPEN'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: { id: string; updates: Partial<Goal> } }
  | { type: 'ADD_PLAYBOOK'; payload: Playbook }
  | { type: 'UPDATE_PLAYBOOK'; payload: { id: string; updates: Partial<Playbook> } }
  | { type: 'ADD_SCHEDULE'; payload: Schedule }
  | { type: 'UPDATE_SCHEDULE'; payload: { id: string; updates: Partial<Schedule> } }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STATS':
      return { ...state, stats: action.payload }
    case 'SET_WEEKLY_ACTIVITY':
      return { ...state, weeklyActivity: action.payload }
    case 'SET_HOURLY_ACTIVITY':
      return { ...state, hourlyActivity: action.payload }
    case 'SET_TASKS':
      return { ...state, tasks: action.payload }
    case 'SET_GOALS':
      return { ...state, goals: action.payload }
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload }
    case 'SET_ACTIVITY_LOGS':
      return { ...state, activityLogs: action.payload }
    case 'SET_PLAYBOOKS':
      return { ...state, playbooks: action.payload }
    case 'SET_SCHEDULES':
      return { ...state, schedules: action.payload }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }
    case 'SET_NOTIFICATIONS_OPEN':
      return { ...state, notificationsOpen: action.payload }
    case 'SET_QUICK_ACTION_OPEN':
      return { ...state, quickActionOpen: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      }
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
        ),
      }
    case 'ADD_GOAL':
      return { ...state, goals: [action.payload, ...state.goals] }
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(g =>
          g.id === action.payload.id ? { ...g, ...action.payload.updates } : g
        ),
      }
    case 'ADD_PLAYBOOK':
      return { ...state, playbooks: [action.payload, ...state.playbooks] }
    case 'UPDATE_PLAYBOOK':
      return {
        ...state,
        playbooks: state.playbooks.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        ),
      }
    case 'ADD_SCHEDULE':
      return { ...state, schedules: [action.payload, ...state.schedules] }
    case 'UPDATE_SCHEDULE':
      return {
        ...state,
        schedules: state.schedules.map(s =>
          s.id === action.payload.id ? { ...s, ...action.payload.updates } : s
        ),
      }
    default:
      return state
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<Action>
  loadDashboard: () => Promise<void>
  loadTasks: (status?: string) => Promise<void>
  loadGoals: () => Promise<void>
  loadNotifications: () => Promise<void>
  loadPlaybooks: () => Promise<void>
  loadSchedules: () => Promise<void>
  markRead: (id: string) => Promise<void>
  sendCommand: (directive: string) => Promise<void>
  addTask: (task: Partial<Task>) => Promise<void>
  editTask: (id: string, updates: Partial<Task>) => Promise<void>
  addGoal: (goal: Partial<Goal>) => Promise<void>
  editGoal: (id: string, updates: Partial<Goal>) => Promise<void>
  addPlaybook: (playbook: Partial<Playbook>) => Promise<void>
  editPlaybook: (id: string, updates: Partial<Playbook>) => Promise<void>
  addSchedule: (schedule: Partial<Schedule>) => Promise<void>
  editSchedule: (id: string, updates: Partial<Schedule>) => Promise<void>
  toggleSidebar: () => void
  toggleNotifications: () => void
  toggleQuickAction: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// ─── Provider ───────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const loadDashboard = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    try {
      const [stats, weekly, hourly, goals, activity, playbooks, schedules] = await Promise.all([
        fetchDashboardStats(),
        fetchWeeklyActivity(),
        fetchHourlyActivity(),
        fetchGoals(),
        fetchActivityLogs(10),
        fetchPlaybooks(),
        fetchSchedules(),
      ])
      dispatch({ type: 'SET_STATS', payload: stats })
      dispatch({ type: 'SET_WEEKLY_ACTIVITY', payload: weekly })
      dispatch({ type: 'SET_HOURLY_ACTIVITY', payload: hourly })
      dispatch({ type: 'SET_GOALS', payload: goals })
      dispatch({ type: 'SET_ACTIVITY_LOGS', payload: activity })
      dispatch({ type: 'SET_PLAYBOOKS', payload: playbooks })
      dispatch({ type: 'SET_SCHEDULES', payload: schedules })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to load dashboard' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const loadTasks = useCallback(async (status?: string) => {
    try {
      const tasks = await fetchTasks(status)
      dispatch({ type: 'SET_TASKS', payload: tasks })
    } catch (err) {
      console.error('Failed to load tasks:', err)
    }
  }, [])

  const loadGoals = useCallback(async () => {
    try {
      const goals = await fetchGoals()
      dispatch({ type: 'SET_GOALS', payload: goals })
    } catch (err) {
      console.error('Failed to load goals:', err)
    }
  }, [])

  const loadNotifications = useCallback(async () => {
    try {
      const notifications = await fetchNotifications()
      dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications })
    } catch (err) {
      console.error('Failed to load notifications:', err)
    }
  }, [])

  const loadPlaybooks = useCallback(async () => {
    try {
      const playbooks = await fetchPlaybooks()
      dispatch({ type: 'SET_PLAYBOOKS', payload: playbooks })
    } catch (err) {
      console.error('Failed to load playbooks:', err)
    }
  }, [])

  const loadSchedules = useCallback(async () => {
    try {
      const schedules = await fetchSchedules()
      dispatch({ type: 'SET_SCHEDULES', payload: schedules })
    } catch (err) {
      console.error('Failed to load schedules:', err)
    }
  }, [])

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id)
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id })
  }, [])

  const sendCommand = useCallback(async (directive: string) => {
    await sendDirective(directive)
  }, [])

  const addTask = useCallback(async (task: Partial<Task>) => {
    const created = await createTask(task)
    dispatch({ type: 'ADD_TASK', payload: created })
  }, [])

  const editTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const updated = await updateTask(id, updates)
    dispatch({ type: 'UPDATE_TASK', payload: { id, updates: updated } })
  }, [])

  const addGoal = useCallback(async (goal: Partial<Goal>) => {
    const created = await createGoal(goal)
    dispatch({ type: 'ADD_GOAL', payload: created })
  }, [])

  const editGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    const updated = await updateGoal(id, updates)
    dispatch({ type: 'UPDATE_GOAL', payload: { id, updates: updated } })
  }, [])

  const addPlaybook = useCallback(async (playbook: Partial<Playbook>) => {
    const created = await createPlaybook(playbook)
    dispatch({ type: 'ADD_PLAYBOOK', payload: created })
  }, [])

  const editPlaybook = useCallback(async (id: string, updates: Partial<Playbook>) => {
    const updated = await updatePlaybook(id, updates)
    dispatch({ type: 'UPDATE_PLAYBOOK', payload: { id, updates: updated } })
  }, [])

  const addSchedule = useCallback(async (schedule: Partial<Schedule>) => {
    const created = await createSchedule(schedule)
    dispatch({ type: 'ADD_SCHEDULE', payload: created })
  }, [])

  const editSchedule = useCallback(async (id: string, updates: Partial<Schedule>) => {
    const updated = await updateSchedule(id, updates)
    dispatch({ type: 'UPDATE_SCHEDULE', payload: { id, updates: updated } })
  }, [])

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' })
  }, [])

  const toggleNotifications = useCallback(() => {
    dispatch({ type: 'SET_NOTIFICATIONS_OPEN', payload: !state.notificationsOpen })
  }, [state.notificationsOpen])

  const toggleQuickAction = useCallback(() => {
    dispatch({ type: 'SET_QUICK_ACTION_OPEN', payload: !state.quickActionOpen })
  }, [state.quickActionOpen])

  // Load initial data
  useEffect(() => {
    loadDashboard()
    loadTasks()
    loadNotifications()
  }, [loadDashboard, loadTasks, loadNotifications])

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        loadDashboard,
        loadTasks,
        loadGoals,
        loadNotifications,
        loadPlaybooks,
        loadSchedules,
        markRead,
        sendCommand,
        addTask,
        editTask,
        addGoal,
        editGoal,
        addPlaybook,
        editPlaybook,
        addSchedule,
        editSchedule,
        toggleSidebar,
        toggleNotifications,
        toggleQuickAction,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
