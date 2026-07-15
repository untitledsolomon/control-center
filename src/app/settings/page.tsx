'use client'

import { useState, useEffect } from 'react'
import { useAppState } from '@/lib/store'
import { useTheme } from '@/lib/theme'
import { Card, CardHeader, CardTitle, Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  Settings, Sun, Moon, Monitor, Bell, Shield,
  Globe, Database, Webhook, Key, RefreshCw,
  CheckCircle, XCircle, Save, User, Palette,
  Bot, Cpu, HardDrive, Clock, Mail, Smartphone
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AppSettings {
  id: string
  key: string
  value: string
  category: string
  description: string
  updated_at: string
}

interface Integration {
  id: string
  name: string
  status: 'connected' | 'disconnected' | 'error'
  icon: React.ReactNode
  lastSync?: string
  description: string
}

export default function SettingsPage() {
  const { state } = useAppState()
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<AppSettings[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('appearance')

  // Load settings from Supabase
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await supabase
          .from('jarvis_settings')
          .select('*')
          .order('category')
        if (!cancelled && data) {
          setSettings(data as AppSettings[])
        }
      } catch (e) {
        console.warn('Settings load failed:', e)
      }
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  const updateSetting = async (key: string, value: string) => {
    setSaving(key)
    setSaved(false)
    try {
      const { error } = await supabase
        .from('jarvis_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      if (!error) {
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value, updated_at: new Date().toISOString() } : s))
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (e) {
      console.warn('Settings save failed:', e)
    }
    setSaving(null)
  }

  const getSetting = (key: string, fallback: string = ''): string => {
    return settings.find(s => s.key === key)?.value ?? fallback
  }

  const integrations: Integration[] = [
    { id: 'supabase', name: 'Supabase', status: 'connected', icon: <Database size={16} />, description: 'Database & auth', lastSync: 'Just now' },
    { id: 'dawn-api', name: 'DAWN API', status: 'connected', icon: <Bot size={16} />, description: 'Agent backend', lastSync: '2m ago' },
    { id: 'llm', name: 'LLM Service', status: 'connected', icon: <Cpu size={16} />, description: 'AI model inference', lastSync: '5m ago' },
    { id: 'slack', name: 'Slack', status: 'disconnected', icon: <MessageSquare size={16} />, description: 'Team notifications' },
    { id: 'email', name: 'SMTP Email', status: 'connected', icon: <Mail size={16} />, description: 'Outbound email', lastSync: '1h ago' },
    { id: 'webhook', name: 'Webhooks', status: 'disconnected', icon: <Webhook size={16} />, description: 'External event hooks' },
  ]

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Cpu },
  ]

  return (
    <div className="max-w-content mx-auto px-4 md:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold text-foreground">Settings</h1>
          <p className="text-[13px] text-muted mt-1">Configure your DAWN Control Center</p>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 text-success text-[12px] font-medium animate-fade-in">
            <CheckCircle size={14} />
            Saved
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all duration-150',
                activeTab === tab.id
                  ? 'bg-accent-light text-accent'
                  : 'text-muted hover:text-foreground hover:bg-surface'
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <Card className="p-5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sun size={16} className="text-accent" />
                <CardTitle>Theme</CardTitle>
              </div>
            </CardHeader>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'light' as const, label: 'Light', icon: Sun, desc: 'Clean, bright interface' },
                { id: 'dark' as const, label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
                { id: 'system' as const, label: 'System', icon: Monitor, desc: 'Follows your OS' },
              ].map(opt => {
                const Icon = opt.icon
                const isActive = theme === opt.id || (opt.id === 'system' && theme !== 'light' && theme !== 'dark')
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      if (opt.id === 'system') {
                        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                        setTheme(prefersDark ? 'dark' : 'light')
                        localStorage.removeItem('dawn-theme')
                      } else {
                        setTheme(opt.id)
                      }
                    }}
                    className={cn(
                      'flex items-start gap-3 p-4 rounded-lg border text-left transition-all duration-150',
                      isActive
                        ? 'border-accent bg-accent-light'
                        : 'border-border bg-surface/50 hover:border-accent/30'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                      isActive ? 'bg-accent text-white' : 'bg-surface-raised text-muted'
                    )}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{opt.label}</p>
                      <p className="text-[11px] text-muted mt-0.5">{opt.desc}</p>
                    </div>
                    {isActive && (
                      <CheckCircle size={16} className="text-accent ml-auto shrink-0 mt-0.5" />
                    )}
                  </button>
                )
              })}
            </div>
          </Card>

          <Card className="p-5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette size={16} className="text-accent" />
                <CardTitle>Accent Color</CardTitle>
              </div>
            </CardHeader>
            <div className="flex gap-3">
              {[
                { color: '#5B6EF5', label: 'Indigo' },
                { color: '#7C3AED', label: 'Purple' },
                { color: '#DB2777', label: 'Pink' },
                { color: '#10B981', label: 'Green' },
                { color: '#D97706', label: 'Amber' },
                { color: '#EF4444', label: 'Red' },
              ].map(c => (
                <button
                  key={c.color}
                  onClick={() => updateSetting('accent_color', c.color)}
                  className="group relative"
                  title={c.label}
                >
                  <div
                    className="w-9 h-9 rounded-lg transition-transform duration-150 hover:scale-110"
                    style={{ backgroundColor: c.color }}
                  />
                  {getSetting('accent_color', '#5B6EF5') === c.color && (
                    <CheckCircle size={12} className="absolute -top-1 -right-1 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <Card className="p-5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-accent" />
                <CardTitle>Notification Preferences</CardTitle>
              </div>
            </CardHeader>
            <div className="space-y-4">
              {[
                { key: 'notif_task_complete', label: 'Task Completed', desc: 'When a task finishes execution' },
                { key: 'notif_task_failed', label: 'Task Failed', desc: 'When a task encounters an error' },
                { key: 'notif_new_lead', label: 'New Lead', desc: 'When a new lead is captured' },
                { key: 'notif_content_published', label: 'Content Published', desc: 'When content goes live' },
                { key: 'notif_system_alert', label: 'System Alerts', desc: 'CPU, memory, or service issues' },
                { key: 'notif_schedule_run', label: 'Schedule Runs', desc: 'When scheduled jobs execute' },
              ].map(n => {
                const enabled = getSetting(n.key, 'true') === 'true'
                return (
                  <div key={n.key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-[13px] font-medium text-foreground">{n.label}</p>
                      <p className="text-[11px] text-muted">{n.desc}</p>
                    </div>
                    <button
                      onClick={() => updateSetting(n.key, enabled ? 'false' : 'true')}
                      className={cn(
                        'relative w-11 h-6 rounded-full transition-colors duration-200',
                        enabled ? 'bg-accent' : 'bg-surface-raised'
                      )}
                    >
                      <div className={cn(
                        'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                        enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                      )} />
                    </button>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-4">
          <Card className="p-5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-accent" />
                <CardTitle>Connected Services</CardTitle>
              </div>
            </CardHeader>
            <div className="space-y-3">
              {integrations.map(integration => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center',
                      integration.status === 'connected' ? 'bg-success-light' :
                      integration.status === 'error' ? 'bg-error-light' : 'bg-surface-raised'
                    )}>
                      <div className={cn(
                        integration.status === 'connected' ? 'text-success' :
                        integration.status === 'error' ? 'text-error' : 'text-muted'
                      )}>
                        {integration.icon}
                      </div>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{integration.name}</p>
                      <p className="text-[11px] text-muted">{integration.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {integration.lastSync && (
                      <span className="text-[11px] text-muted">Synced {integration.lastSync}</span>
                    )}
                    <Badge variant={
                      integration.status === 'connected' ? 'success' :
                      integration.status === 'error' ? 'error' : 'warning'
                    }>
                      {integration.status === 'connected' ? 'Connected' :
                       integration.status === 'error' ? 'Error' : 'Disconnected'}
                    </Badge>
                    {integration.status === 'disconnected' && (
                      <Button variant="secondary" size="sm">Connect</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key size={16} className="text-accent" />
                <CardTitle>API Keys</CardTitle>
              </div>
            </CardHeader>
            <div className="space-y-3">
              {[
                { key: 'api_dawn', label: 'DAWN API Key', value: 'dcc-••••••••••••613' },
                { key: 'api_supabase', label: 'Supabase Key', value: 'sb_publishable_••••••••••••g9' },
                { key: 'api_openai', label: 'OpenAI API Key', value: getSetting('api_openai_key') ? 'sk-••••••••••••' : 'Not configured' },
              ].map(api => (
                <div key={api.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{api.label}</p>
                    <p className="text-[11px] font-mono text-muted">{api.value}</p>
                  </div>
                  <Button variant="secondary" size="sm">
                    <RefreshCw size={12} /> Rotate
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <Card className="p-5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-accent" />
                <CardTitle>Access Control</CardTitle>
              </div>
            </CardHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-[13px] font-medium text-foreground">Require API Key</p>
                  <p className="text-[11px] text-muted">All API requests must include a valid key</p>
                </div>
                <button
                  onClick={() => updateSetting('require_api_key', getSetting('require_api_key', 'true') === 'true' ? 'false' : 'true')}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors duration-200',
                    getSetting('require_api_key', 'true') === 'true' ? 'bg-accent' : 'bg-surface-raised'
                  )}
                >
                  <div className={cn(
                    'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                    getSetting('require_api_key', 'true') === 'true' ? 'translate-x-[22px]' : 'translate-x-0.5'
                  )} />
                </button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-[13px] font-medium text-foreground">Audit Logging</p>
                  <p className="text-[11px] text-muted">Log all system actions and API calls</p>
                </div>
                <button
                  onClick={() => updateSetting('audit_logging', getSetting('audit_logging', 'true') === 'true' ? 'false' : 'true')}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors duration-200',
                    getSetting('audit_logging', 'true') === 'true' ? 'bg-accent' : 'bg-surface-raised'
                  )}
                >
                  <div className={cn(
                    'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                    getSetting('audit_logging', 'true') === 'true' ? 'translate-x-[22px]' : 'translate-x-0.5'
                  )} />
                </button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-[13px] font-medium text-foreground">Auto-logout (minutes)</p>
                  <p className="text-[11px] text-muted">Session timeout for inactivity</p>
                </div>
                <select
                  value={getSetting('session_timeout', '60')}
                  onChange={e => updateSetting('session_timeout', e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-surface text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="240">4 hours</option>
                </select>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="space-y-4">
          <Card className="p-5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-accent" />
                <CardTitle>System Information</CardTitle>
              </div>
            </CardHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Version', value: '0.1.0', icon: Bot },
                { label: 'Environment', value: process.env.NODE_ENV || 'production', icon: Globe },
                { label: 'Database', value: 'Supabase (PostgreSQL)', icon: Database },
                { label: 'Framework', value: 'Next.js 14', icon: Cpu },
                { label: 'API Base', value: process.env.NEXT_PUBLIC_DAWN_API_URL || 'https://dawn.regentplatform.com', icon: Globe },
                { label: 'Last Deploy', value: new Date().toLocaleDateString(), icon: Clock },
              ].map(sys => {
                const Icon = sys.icon
                return (
                  <div key={sys.label} className="p-3 rounded-lg bg-surface">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={14} className="text-accent" />
                      <p className="text-[11px] text-muted font-medium">{sys.label}</p>
                    </div>
                    <p className="text-[13px] text-foreground font-medium truncate">{sys.value}</p>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="p-5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <RefreshCw size={16} className="text-accent" />
                <CardTitle>Data Management</CardTitle>
              </div>
            </CardHeader>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-[13px] font-medium text-foreground">Auto-refresh Dashboard</p>
                  <p className="text-[11px] text-muted">Automatically refresh data every 30 seconds</p>
                </div>
                <button
                  onClick={() => updateSetting('auto_refresh', getSetting('auto_refresh', 'true') === 'true' ? 'false' : 'true')}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors duration-200',
                    getSetting('auto_refresh', 'true') === 'true' ? 'bg-accent' : 'bg-surface-raised'
                  )}
                >
                  <div className={cn(
                    'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                    getSetting('auto_refresh', 'true') === 'true' ? 'translate-x-[22px]' : 'translate-x-0.5'
                  )} />
                </button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-[13px] font-medium text-foreground">Items Per Page</p>
                  <p className="text-[11px] text-muted">Number of items shown in lists</p>
                </div>
                <select
                  value={getSetting('items_per_page', '20')}
                  onChange={e => updateSetting('items_per_page', e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-surface text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              <div className="pt-3 border-t border-border">
                <Button variant="danger" size="sm">
                  <XCircle size={14} /> Reset All Settings
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// Need to import MessageSquare for the integrations
import { MessageSquare } from 'lucide-react'
