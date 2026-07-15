-- DAWN Control Center Database Schema
-- Run this in the Supabase SQL Editor

-- 1. Tasks
CREATE TABLE IF NOT EXISTS jarvis_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  category TEXT NOT NULL DEFAULT 'system' CHECK (category IN ('outreach', 'content', 'research', 'crm', 'system')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'active', 'blocked', 'complete')),
  linked_goal_id UUID,
  blocked_reason TEXT,
  conversation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Goals / Directives
CREATE TABLE IF NOT EXISTS jarvis_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'revenue' CHECK (category IN ('revenue', 'content', 'outreach', 'product')),
  target_value NUMERIC NOT NULL DEFAULT 0,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'behind')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Instructions / Directives
CREATE TABLE IF NOT EXISTS jarvis_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'tone' CHECK (category IN ('tone', 'scheduling', 'outreach', 'privacy', 'escalation')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Notifications
CREATE TABLE IF NOT EXISTS jarvis_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'update' CHECK (type IN ('attention', 'update', 'completed')),
  title TEXT NOT NULL,
  description TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  linked_screen TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Schedules / Cron Jobs
CREATE TABLE IF NOT EXISTS jarvis_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cron_expression TEXT NOT NULL,
  human_readable TEXT,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'failed')),
  linked_instruction_id UUID,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'fail')),
  next_run_at TIMESTAMPTZ,
  run_history JSONB DEFAULT '[]'::jsonb,
  notify_on_completion BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Activity Log
CREATE TABLE IF NOT EXISTS jarvis_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL DEFAULT 'sync' CHECK (event_type IN ('task_complete', 'task_started', 'outreach_sent', 'lead_scraped', 'content_posted', 'review_requested', 'error', 'sync')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Playbooks / Protocols
CREATE TABLE IF NOT EXISTS jarvis_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'active',
  body TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Review Items
CREATE TABLE IF NOT EXISTS jarvis_review_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'content',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'needs_revision')),
  content JSONB DEFAULT '{}'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  status_history JSONB DEFAULT '[]'::jsonb,
  linked_task_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Outputs / Resources
CREATE TABLE IF NOT EXISTS jarvis_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'research' CHECK (type IN ('content', 'report', 'lead_list', 'email', 'research')),
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  item_count INTEGER,
  word_count INTEGER,
  linked_task_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Resources (for Resource Hub)
CREATE TABLE IF NOT EXISTS jarvis_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'document' CHECK (type IN ('document', 'spreadsheet', 'archive', 'image', 'script', 'other')),
  category TEXT NOT NULL DEFAULT 'general',
  size_bytes BIGINT,
  file_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON jarvis_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON jarvis_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON jarvis_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goals_status ON jarvis_goals(status);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON jarvis_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON jarvis_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_created ON jarvis_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON jarvis_schedules(status);
CREATE INDEX IF NOT EXISTS idx_review_status ON jarvis_review_items(status);
CREATE INDEX IF NOT EXISTS idx_resources_category ON jarvis_resources(category);

-- Enable Row Level Security
ALTER TABLE jarvis_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_review_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_resources ENABLE ROW LEVEL SECURITY;

-- Allow anon key to read/write all tables
CREATE POLICY "Allow anon full access" ON jarvis_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon full access" ON jarvis_goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon full access" ON jarvis_instructions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon full access" ON jarvis_notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon full access" ON jarvis_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon full access" ON jarvis_activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon full access" ON jarvis_playbooks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon full access" ON jarvis_review_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon full access" ON jarvis_outputs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon full access" ON jarvis_resources FOR ALL USING (true) WITH CHECK (true);

-- 11. Settings
CREATE TABLE IF NOT EXISTS jarvis_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default settings
INSERT INTO jarvis_settings (key, value, category, description) VALUES
  ('accent_color', '#5B6EF5', 'appearance', 'Primary accent color for the UI'),
  ('notif_task_complete', 'true', 'notifications', 'Notify when tasks complete'),
  ('notif_task_failed', 'true', 'notifications', 'Notify when tasks fail'),
  ('notif_new_lead', 'true', 'notifications', 'Notify on new leads'),
  ('notif_content_published', 'true', 'notifications', 'Notify on content publish'),
  ('notif_system_alert', 'true', 'notifications', 'Notify on system alerts'),
  ('notif_schedule_run', 'false', 'notifications', 'Notify on schedule runs'),
  ('require_api_key', 'true', 'security', 'Require API key for all requests'),
  ('audit_logging', 'true', 'security', 'Log all system actions'),
  ('session_timeout', '60', 'security', 'Session timeout in minutes'),
  ('auto_refresh', 'true', 'system', 'Auto-refresh dashboard'),
  ('items_per_page', '20', 'system', 'Items per page in lists')
ON CONFLICT (key) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_settings_key ON jarvis_settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON jarvis_settings(category);

-- Enable RLS
ALTER TABLE jarvis_settings ENABLE ROW LEVEL SECURITY;

-- Allow anon full access
CREATE POLICY "Allow anon full access" ON jarvis_settings FOR ALL USING (true) WITH CHECK (true);
