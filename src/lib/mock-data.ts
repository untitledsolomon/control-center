import { Task, Goal, Notification, Activity, Playbook, CronJob, DashboardStats, WeeklyData, HourlyData } from './types'

export const mockStats: DashboardStats = {
  tasksCompleted: 189,
  activeTasks: 31,
  leadsTouched: 247,
  blockedTasks: 5,
}

export const mockTasks: Task[] = [
  { id: '1', title: 'Process payroll for Q3', description: 'Run Axis ERP payroll for all employees', status: 'complete', priority: 'high', category: 'System', createdAt: new Date('2025-07-10T08:00:00Z'), linkedGoal: '1' },
  { id: '2', title: 'Generate URA tax return', description: 'Prepare and file monthly PAYE return', status: 'active', priority: 'high', category: 'System', createdAt: new Date('2025-07-11T09:00:00Z') },
  { id: '3', title: 'Update CRM pipeline', description: 'Sync leads from Phantombuster to CRM', status: 'queued', priority: 'medium', category: 'CRM', createdAt: new Date('2025-07-11T10:00:00Z') },
  { id: '4', title: 'Deploy Forge CMS update', description: 'Push latest CMS changes to production', status: 'queued', priority: 'high', category: 'System', createdAt: new Date('2025-07-11T11:00:00Z') },
  { id: '5', title: 'Run security audit', description: 'Full OSINT scan on infrastructure', status: 'active', priority: 'high', category: 'System', createdAt: new Date('2025-07-10T07:00:00Z') },
  { id: '6', title: 'Backup databases', description: 'Nightly backup of all production DBs', status: 'complete', priority: 'medium', category: 'System', createdAt: new Date('2025-07-11T02:00:00Z') },
  { id: '7', title: 'Analyze campaign performance', description: 'Review Q2 email campaign metrics', status: 'queued', priority: 'low', category: 'Research', createdAt: new Date('2025-07-09T15:00:00Z') },
  { id: '8', title: 'Update employee records', description: 'Add new hires to Axis ERP', status: 'complete', priority: 'medium', category: 'System', createdAt: new Date('2025-07-08T09:00:00Z') },
  { id: '9', title: 'Monitor Sentinel bot', description: 'Check RL agent performance on EURUSD', status: 'active', priority: 'medium', category: 'System', createdAt: new Date('2025-07-11T06:00:00Z') },
  { id: '10', title: 'Review system logs', description: 'Check for anomalies in DAWN logs', status: 'queued', priority: 'low', category: 'System', createdAt: new Date('2025-07-10T16:00:00Z') },
]

export const mockGoals: Goal[] = [
  { id: '1', title: 'Process 500 payroll runs', category: 'Product', target: 500, current: 370, unit: 'runs', dueDate: new Date('2025-12-31'), taskCount: 5, status: 'on_track' },
  { id: '2', title: 'Onboard 50 clients', category: 'Revenue', target: 50, current: 21, unit: 'clients', dueDate: new Date('2025-12-31'), taskCount: 8, status: 'at_risk' },
  { id: '3', title: 'Achieve 99.9% uptime', category: 'Product', target: 100, current: 88, unit: '%', dueDate: new Date('2025-12-31'), taskCount: 3, status: 'on_track' },
  { id: '4', title: 'Reduce response time', category: 'Product', target: 200, current: 130, unit: 'ms', dueDate: new Date('2025-12-31'), taskCount: 4, status: 'on_track' },
  { id: '5', title: 'Complete security audit', category: 'Product', target: 100, current: 30, unit: '%', dueDate: new Date('2025-09-30'), taskCount: 6, status: 'behind' },
  { id: '6', title: 'Build knowledge graph', category: 'Product', target: 10000, current: 4500, unit: 'nodes', dueDate: new Date('2025-12-31'), taskCount: 2, status: 'on_track' },
]

export const mockNotifications: Notification[] = [
  { id: '1', type: 'attention', icon: 'alert-circle', title: 'Payroll deadline approaching', description: 'Monthly PAYE return due in 3 days', message: 'Monthly PAYE return due in 3 days', read: false, timestamp: new Date('2025-07-11T08:00:00Z'), screen: 'dashboard' },
  { id: '2', type: 'completed', icon: 'check-circle', title: 'Database backup complete', description: 'All production databases backed up successfully', message: 'All production databases backed up successfully', read: false, timestamp: new Date('2025-07-11T02:30:00Z'), screen: 'dashboard' },
  { id: '3', type: 'update', icon: 'bell', title: 'New CRM leads imported', description: '12 new leads from LinkedIn campaign', message: '12 new leads from LinkedIn campaign', read: false, timestamp: new Date('2025-07-10T18:00:00Z'), screen: 'dashboard' },
  { id: '4', type: 'attention', icon: 'alert-triangle', title: 'Disk usage warning', description: 'Server disk at 85% capacity', message: 'Server disk at 85% capacity', read: false, timestamp: new Date('2025-07-10T14:00:00Z'), screen: 'dashboard' },
  { id: '5', type: 'completed', icon: 'x-circle', title: 'Sentinel connection lost', description: 'MT5 connection dropped for 2 minutes', message: 'MT5 connection dropped for 2 minutes', read: true, timestamp: new Date('2025-07-10T12:00:00Z'), screen: 'dashboard' },
  { id: '6', type: 'completed', icon: 'check-circle', title: 'Tax return filed', description: 'Q2 VAT return submitted to URA', message: 'Q2 VAT return submitted to URA', read: true, timestamp: new Date('2025-07-09T16:00:00Z'), screen: 'dashboard' },
  { id: '7', type: 'update', icon: 'bell', title: 'Forge CMS deployed', description: 'Version 2.4.1 deployed to production', message: 'Version 2.4.1 deployed to production', read: false, timestamp: new Date('2025-07-09T14:00:00Z'), screen: 'dashboard' },
  { id: '8', type: 'attention', icon: 'alert-triangle', title: 'SSL certificate expiring', description: 'regentplatform.com cert expires in 14 days', message: 'regentplatform.com cert expires in 14 days', read: false, timestamp: new Date('2025-07-09T10:00:00Z'), screen: 'dashboard' },
]

export const mockActivity: Activity[] = [
  { id: '1', timestamp: new Date('2025-07-11T14:30:00Z'), badge: 'success', title: 'Payroll Processed', description: 'Processed payroll for 15 employees' },
  { id: '2', timestamp: new Date('2025-07-11T14:00:00Z'), badge: 'info', title: 'Tax Return Generated', description: 'Generated URA PAYE return for June' },
  { id: '3', timestamp: new Date('2025-07-11T10:00:00Z'), badge: 'success', title: 'Leads Imported', description: 'Imported 12 leads from Phantombuster' },
  { id: '4', timestamp: new Date('2025-07-11T02:30:00Z'), badge: 'info', title: 'Backup Completed', description: 'Database backup completed (2.4 GB)' },
  { id: '5', timestamp: new Date('2025-07-10T22:00:00Z'), badge: 'warning', title: 'Security Scan Started', description: 'Full infrastructure OSINT scan initiated' },
  { id: '6', timestamp: new Date('2025-07-10T18:00:00Z'), badge: 'success', title: 'Deployment Completed', description: 'Forge CMS v2.4.1 deployed to production' },
  { id: '7', timestamp: new Date('2025-07-10T12:00:00Z'), badge: 'error', title: 'Bot Connection Error', description: 'Sentinel bot connection lost (MT5 timeout)' },
  { id: '8', timestamp: new Date('2025-07-10T09:00:00Z'), badge: 'info', title: 'Knowledge Graph Updated', description: 'Added 45 new nodes to knowledge graph' },
  { id: '9', timestamp: new Date('2025-07-09T15:00:00Z'), badge: 'success', title: 'Employees Added', description: 'Added 3 new employees to Axis ERP' },
  { id: '10', timestamp: new Date('2025-07-09T08:00:00Z'), badge: 'warning', title: 'Update Available', description: 'Security patch available for Docker runtime' },
]

export const mockPlaybooks: Playbook[] = [
  { id: '1', title: 'Monthly Payroll Run', category: 'ERP', status: 'active', body: 'Complete payroll processing workflow including validation, calculation, payslip generation, and tax filing.', variables: [{ key: 'period', value: 'current_month' }], createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-06-15') },
  { id: '2', title: 'Client Onboarding', category: 'CRM', status: 'active', body: 'New client setup including workspace creation, CRM configuration, payroll setup, and welcome email.', variables: [{ key: 'client_name', value: '' }], createdAt: new Date('2025-01-15'), updatedAt: new Date('2025-06-20') },
  { id: '3', title: 'Security Audit', category: 'System', status: 'active', body: 'Weekly security scan including port scanning, certificate checks, log auditing, and report generation.', variables: [], createdAt: new Date('2025-02-01'), updatedAt: new Date('2025-06-01') },
]

export const mockCronJobs: CronJob[] = [
  { id: '1', name: 'Nightly Backup', description: 'Full database backup', cronExpression: '0 2 * * *', humanReadable: 'Every day at 2:00 AM', status: 'running', lastRun: new Date('2025-07-11T02:00:00Z'), lastResult: 'success', lastDuration: 1800, nextRun: new Date('2025-07-12T02:00:00Z'), history: [], notifyOnComplete: true },
  { id: '2', name: 'Weekly Security Scan', description: 'Full infrastructure scan', cronExpression: '0 6 * * 0', humanReadable: 'Every Sunday at 6:00 AM', status: 'running', lastRun: new Date('2025-07-07T06:00:00Z'), lastResult: 'success', lastDuration: 3600, nextRun: new Date('2025-07-14T06:00:00Z'), history: [], notifyOnComplete: true },
  { id: '3', name: 'CRM Lead Sync', description: 'Sync leads from external sources', cronExpression: '0 */4 * * *', humanReadable: 'Every 4 hours', status: 'running', lastRun: new Date('2025-07-11T08:00:00Z'), lastResult: 'success', lastDuration: 300, nextRun: new Date('2025-07-11T12:00:00Z'), history: [], notifyOnComplete: false },
  { id: '4', name: 'Monthly Tax Filing', description: 'Generate and file tax returns', cronExpression: '0 9 1 * *', humanReadable: '1st of every month at 9:00 AM', status: 'running', lastRun: new Date('2025-07-01T09:00:00Z'), lastResult: 'success', lastDuration: 600, nextRun: new Date('2025-08-01T09:00:00Z'), history: [], notifyOnComplete: true },
  { id: '5', name: 'Health Check Report', description: 'System health summary email', cronExpression: '0 8 * * 1', humanReadable: 'Every Monday at 8:00 AM', status: 'paused', lastRun: new Date('2025-06-30T08:00:00Z'), lastResult: 'success', lastDuration: 120, nextRun: new Date('2025-07-14T08:00:00Z'), history: [], notifyOnComplete: false },
]

export const mockWeeklyData: WeeklyData[] = [
  { day: 'Mon', tasks: 24, posts: 12, leads: 8 },
  { day: 'Tue', tasks: 32, posts: 15, leads: 12 },
  { day: 'Wed', tasks: 28, posts: 10, leads: 15 },
  { day: 'Thu', tasks: 35, posts: 18, leads: 10 },
  { day: 'Fri', tasks: 20, posts: 8, leads: 6 },
  { day: 'Sat', tasks: 12, posts: 5, leads: 3 },
  { day: 'Sun', tasks: 8, posts: 3, leads: 2 },
]

export const mockHourlyData: HourlyData[] = [
  { hour: '00:00', value: 45 },
  { hour: '02:00', value: 32 },
  { hour: '04:00', value: 28 },
  { hour: '06:00', value: 56 },
  { hour: '08:00', value: 89 },
  { hour: '10:00', value: 120 },
  { hour: '12:00', value: 95 },
  { hour: '14:00', value: 110 },
  { hour: '16:00', value: 78 },
  { hour: '18:00', value: 65 },
  { hour: '20:00', value: 52 },
  { hour: '22:00', value: 40 },
]
