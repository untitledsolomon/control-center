import { Task, Goal, Notification, ActivityLog, Playbook, Schedule, DashboardStats, WeeklyActivity, HourlyActivity } from './types'

export const mockStats: DashboardStats = {
  total_tasks: 247,
  tasks_completed: 189,
  tasks_pending: 31,
  tasks_in_progress: 22,
  tasks_failed: 5,
  active_goals: 8,
  goal_progress_avg: 67,
  notifications_unread: 12,
  system_uptime: 99.8,
  agent_status: 'active',
  last_active: new Date().toISOString(),
  memory_usage: 42,
  cpu_usage: 18,
}

export const mockTasks: Task[] = [
  { id: '1', title: 'Process payroll for Q3', description: 'Run Axis ERP payroll for all employees', status: 'completed', priority: 'high', category: 'ERP', created_at: '2025-07-10T08:00:00Z', updated_at: '2025-07-10T14:30:00Z', completed_at: '2025-07-10T14:30:00Z' },
  { id: '2', title: 'Generate URA tax return', description: 'Prepare and file monthly PAYE return', status: 'in_progress', priority: 'critical', category: 'Compliance', created_at: '2025-07-11T09:00:00Z', updated_at: '2025-07-11T09:00:00Z' },
  { id: '3', title: 'Update CRM pipeline', description: 'Sync leads from Phantombuster to CRM', status: 'pending', priority: 'medium', category: 'CRM', created_at: '2025-07-11T10:00:00Z', updated_at: '2025-07-11T10:00:00Z' },
  { id: '4', title: 'Deploy Forge CMS update', description: 'Push latest CMS changes to production', status: 'pending', priority: 'high', category: 'DevOps', created_at: '2025-07-11T11:00:00Z', updated_at: '2025-07-11T11:00:00Z' },
  { id: '5', title: 'Run security audit', description: 'Full OSINT scan on infrastructure', status: 'in_progress', priority: 'high', category: 'Security', created_at: '2025-07-10T07:00:00Z', updated_at: '2025-07-11T08:00:00Z' },
  { id: '6', title: 'Backup databases', description: 'Nightly backup of all production DBs', status: 'completed', priority: 'medium', category: 'DevOps', created_at: '2025-07-11T02:00:00Z', updated_at: '2025-07-11T02:30:00Z', completed_at: '2025-07-11T02:30:00Z' },
  { id: '7', title: 'Analyze campaign performance', description: 'Review Q2 email campaign metrics', status: 'pending', priority: 'low', category: 'Analytics', created_at: '2025-07-09T15:00:00Z', updated_at: '2025-07-09T15:00:00Z' },
  { id: '8', title: 'Update employee records', description: 'Add new hires to Axis ERP', status: 'completed', priority: 'medium', category: 'ERP', created_at: '2025-07-08T09:00:00Z', updated_at: '2025-07-08T11:00:00Z', completed_at: '2025-07-08T11:00:00Z' },
  { id: '9', title: 'Monitor Sentinel bot', description: 'Check RL agent performance on EURUSD', status: 'in_progress', priority: 'medium', category: 'Trading', created_at: '2025-07-11T06:00:00Z', updated_at: '2025-07-11T06:00:00Z' },
  { id: '10', title: 'Review system logs', description: 'Check for anomalies in DAWN logs', status: 'pending', priority: 'low', category: 'DevOps', created_at: '2025-07-10T16:00:00Z', updated_at: '2025-07-10T16:00:00Z' },
]

export const mockGoals: Goal[] = [
  { id: '1', title: 'Process 500 payroll runs', description: 'Cumulative payroll runs processed via Axis', status: 'active', progress: 74, target_value: 500, current_value: 370, unit: 'runs', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-07-11T00:00:00Z' },
  { id: '2', title: 'Onboard 50 clients', description: 'New clients onboarded to Regent platform', status: 'active', progress: 42, target_value: 50, current_value: 21, unit: 'clients', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-07-11T00:00:00Z' },
  { id: '3', title: 'Achieve 99.9% uptime', description: 'System uptime across all services', status: 'active', progress: 88, target_value: 100, current_value: 88, unit: '%', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-07-11T00:00:00Z' },
  { id: '4', title: 'Reduce response time', description: 'Average API response time under 200ms', status: 'active', progress: 65, target_value: 200, current_value: 130, unit: 'ms', created_at: '2025-03-01T00:00:00Z', updated_at: '2025-07-11T00:00:00Z' },
  { id: '5', title: 'Complete security audit', description: 'Full infrastructure penetration testing', status: 'active', progress: 30, target_value: 100, current_value: 30, unit: '%', created_at: '2025-06-01T00:00:00Z', updated_at: '2025-07-11T00:00:00Z' },
  { id: '6', title: 'Build knowledge graph', description: 'Populate DAWN knowledge graph with 10K nodes', status: 'active', progress: 45, target_value: 10000, current_value: 4500, unit: 'nodes', created_at: '2025-04-01T00:00:00Z', updated_at: '2025-07-11T00:00:00Z' },
]

export const mockNotifications: Notification[] = [
  { id: '1', type: 'attention', title: 'Payroll deadline approaching', message: 'Monthly PAYE return due in 3 days', read: false, created_at: '2025-07-11T08:00:00Z', source: 'Axis ERP' },
  { id: '2', type: 'completed', title: 'Database backup complete', message: 'All production databases backed up successfully', read: false, created_at: '2025-07-11T02:30:00Z', source: 'System' },
  { id: '3', type: 'update', title: 'New CRM leads imported', message: '12 new leads from LinkedIn campaign', read: false, created_at: '2025-07-10T18:00:00Z', source: 'CRM' },
  { id: '4', type: 'attention', title: 'Disk usage warning', message: 'Server disk at 85% capacity', read: false, created_at: '2025-07-10T14:00:00Z', source: 'Infra' },
  { id: '5', type: 'error', title: 'Sentinel connection lost', message: 'MT5 connection dropped for 2 minutes', read: true, created_at: '2025-07-10T12:00:00Z', source: 'Trading' },
  { id: '6', type: 'completed', title: 'Tax return filed', message: 'Q2 VAT return submitted to URA', read: true, created_at: '2025-07-09T16:00:00Z', source: 'Axis ERP' },
  { id: '7', type: 'update', title: 'Forge CMS deployed', message: 'Version 2.4.1 deployed to production', read: false, created_at: '2025-07-09T14:00:00Z', source: 'DevOps' },
  { id: '8', type: 'attention', title: 'SSL certificate expiring', message: 'regentplatform.com cert expires in 14 days', read: false, created_at: '2025-07-09T10:00:00Z', source: 'Infra' },
]

export const mockActivityLogs: ActivityLog[] = [
  { id: '1', action: 'payroll.processed', entity_type: 'payroll', summary: 'Processed payroll for 15 employees', severity: 'success', created_at: '2025-07-11T14:30:00Z' },
  { id: '2', action: 'tax.return.generated', entity_type: 'tax', summary: 'Generated URA PAYE return for June', severity: 'info', created_at: '2025-07-11T14:00:00Z' },
  { id: '3', action: 'crm.leads.imported', entity_type: 'crm', summary: 'Imported 12 leads from Phantombuster', severity: 'success', created_at: '2025-07-11T10:00:00Z' },
  { id: '4', action: 'system.backup.completed', entity_type: 'system', summary: 'Database backup completed (2.4 GB)', severity: 'info', created_at: '2025-07-11T02:30:00Z' },
  { id: '5', action: 'security.scan.started', entity_type: 'security', summary: 'Full infrastructure OSINT scan initiated', severity: 'warning', created_at: '2025-07-10T22:00:00Z' },
  { id: '6', action: 'deployment.completed', entity_type: 'deployment', summary: 'Forge CMS v2.4.1 deployed to production', severity: 'success', created_at: '2025-07-10T18:00:00Z' },
  { id: '7', action: 'trading.bot.error', entity_type: 'trading', summary: 'Sentinel bot connection lost (MT5 timeout)', severity: 'error', created_at: '2025-07-10T12:00:00Z' },
  { id: '8', action: 'knowledge.graph.updated', entity_type: 'knowledge', summary: 'Added 45 new nodes to knowledge graph', severity: 'info', created_at: '2025-07-10T09:00:00Z' },
  { id: '9', action: 'employee.added', entity_type: 'erp', summary: 'Added 3 new employees to Axis ERP', severity: 'success', created_at: '2025-07-09T15:00:00Z' },
  { id: '10', action: 'system.update.available', entity_type: 'system', summary: 'Security patch available for Docker runtime', severity: 'warning', created_at: '2025-07-09T08:00:00Z' },
]

export const mockPlaybooks: Playbook[] = [
  { id: '1', name: 'Monthly Payroll Run', description: 'Complete payroll processing workflow', steps: [{ id: 's1', order: 1, action: 'validate_employees', params: {} }, { id: 's2', order: 2, action: 'calculate_payroll', params: {} }, { id: 's3', order: 3, action: 'generate_payslips', params: {} }, { id: 's4', order: 4, action: 'file_tax_returns', params: {} }], status: 'active', last_run: '2025-07-01T10:00:00Z', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-06-15T00:00:00Z' },
  { id: '2', name: 'Client Onboarding', description: 'New client setup and configuration', steps: [{ id: 's1', order: 1, action: 'create_workspace', params: {} }, { id: 's2', order: 2, action: 'configure_crm', params: {} }, { id: 's3', order: 3, action: 'setup_payroll', params: {} }, { id: 's4', order: 4, action: 'send_welcome', params: {} }], status: 'active', last_run: '2025-07-05T14:00:00Z', created_at: '2025-01-15T00:00:00Z', updated_at: '2025-06-20T00:00:00Z' },
  { id: '3', name: 'Security Audit', description: 'Weekly security scan and compliance check', steps: [{ id: 's1', order: 1, action: 'scan_ports', params: {} }, { id: 's2', order: 2, action: 'check_certificates', params: {} }, { id: 's3', order: 3, action: 'audit_logs', params: {} }, { id: 's4', order: 4, action: 'generate_report', params: {} }], status: 'active', last_run: '2025-07-07T06:00:00Z', created_at: '2025-02-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z' },
]

export const mockSchedules: Schedule[] = [
  { id: '1', name: 'Nightly Backup', description: 'Full database backup', cron_expression: '0 2 * * *', action: 'backup_databases', enabled: true, last_run: '2025-07-11T02:00:00Z', next_run: '2025-07-12T02:00:00Z', created_at: '2025-01-01T00:00:00Z' },
  { id: '2', name: 'Weekly Security Scan', description: 'Full infrastructure scan', cron_expression: '0 6 * * 0', action: 'security_scan', enabled: true, last_run: '2025-07-07T06:00:00Z', next_run: '2025-07-14T06:00:00Z', created_at: '2025-01-01T00:00:00Z' },
  { id: '3', name: 'CRM Lead Sync', description: 'Sync leads from external sources', cron_expression: '0 */4 * * *', action: 'sync_leads', enabled: true, last_run: '2025-07-11T08:00:00Z', next_run: '2025-07-11T12:00:00Z', created_at: '2025-02-01T00:00:00Z' },
  { id: '4', name: 'Monthly Tax Filing', description: 'Generate and file tax returns', cron_expression: '0 9 1 * *', action: 'file_taxes', enabled: true, last_run: '2025-07-01T09:00:00Z', next_run: '2025-08-01T09:00:00Z', created_at: '2025-01-01T00:00:00Z' },
  { id: '5', name: 'Health Check Report', description: 'System health summary email', cron_expression: '0 8 * * 1', action: 'health_report', enabled: false, last_run: '2025-06-30T08:00:00Z', next_run: null, created_at: '2025-03-01T00:00:00Z' },
]

export const mockWeeklyActivity: WeeklyActivity[] = [
  { date: 'Mon', value: 24, tasks_created: 12, tasks_completed: 12 },
  { date: 'Tue', value: 32, tasks_created: 15, tasks_completed: 17 },
  { date: 'Wed', value: 28, tasks_created: 10, tasks_completed: 18 },
  { date: 'Thu', value: 35, tasks_created: 18, tasks_completed: 17 },
  { date: 'Fri', value: 20, tasks_created: 8, tasks_completed: 12 },
  { date: 'Sat', value: 12, tasks_created: 5, tasks_completed: 7 },
  { date: 'Sun', value: 8, tasks_created: 3, tasks_completed: 5 },
]

export const mockHourlyActivity: HourlyActivity[] = [
  { date: '00:00', value: 45, requests: 45, avg_response_time: 120 },
  { date: '02:00', value: 32, requests: 32, avg_response_time: 95 },
  { date: '04:00', value: 28, requests: 28, avg_response_time: 88 },
  { date: '06:00', value: 56, requests: 56, avg_response_time: 145 },
  { date: '08:00', value: 89, requests: 89, avg_response_time: 180 },
  { date: '10:00', value: 120, requests: 120, avg_response_time: 210 },
  { date: '12:00', value: 95, requests: 95, avg_response_time: 165 },
  { date: '14:00', value: 110, requests: 110, avg_response_time: 190 },
  { date: '16:00', value: 78, requests: 78, avg_response_time: 150 },
  { date: '18:00', value: 65, requests: 65, avg_response_time: 135 },
  { date: '20:00', value: 52, requests: 52, avg_response_time: 110 },
  { date: '22:00', value: 40, requests: 40, avg_response_time: 100 },
]
