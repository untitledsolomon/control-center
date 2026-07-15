-- DAWN Control Center Seed Data
-- Run this AFTER the migration to populate sample data

-- Sample Tasks
INSERT INTO jarvis_tasks (title, description, priority, category, status, created_at) VALUES
('Instagram carousel published', 'Content pipeline completed', 'medium', 'content', 'complete', NOW() - INTERVAL '30 minutes'),
('Blog post published', 'CRM Adoption for Kampala SMEs', 'medium', 'content', 'complete', NOW() - INTERVAL '1 hour'),
('Case study published', 'Regent CRM case study', 'medium', 'content', 'complete', NOW() - INTERVAL '1 hour'),
('Revenue tracker updated', 'Q2 revenue tracking', 'high', 'system', 'complete', NOW() - INTERVAL '2 hours'),
('Morning deal check', 'No new pipeline changes', 'low', 'system', 'complete', NOW() - INTERVAL '2 hours'),
('Generate lead list for Kampala', 'Restaurant district outreach', 'high', 'outreach', 'active', NOW() - INTERVAL '4 hours'),
('Draft Q2 case study', 'Boosted Technologies LTD', 'medium', 'content', 'active', NOW() - INTERVAL '5 hours'),
('Schedule Instagram posts', '7 carousels waiting', 'high', 'content', 'blocked', NOW() - INTERVAL '3 days');

-- Sample Goals
INSERT INTO jarvis_goals (title, category, target_value, current_value, unit, due_date, status) VALUES
('Close 2 new clients', 'revenue', 2, 1, 'clients', NOW() + INTERVAL '20 days', 'on_track'),
('Publish 60 Instagram posts', 'content', 60, 34, 'posts', NOW() + INTERVAL '25 days', 'at_risk'),
('Generate 200 qualified leads', 'outreach', 200, 147, 'leads', NOW() + INTERVAL '30 days', 'on_track'),
('Launch Regent CRM v1', 'product', 100, 65, '% complete', NOW() + INTERVAL '45 days', 'on_track');

-- Sample Notifications
INSERT INTO jarvis_notifications (type, title, description, linked_screen, created_at) VALUES
('attention', 'Content pipeline blocked', '7 carousels waiting on slide generation — 3 days overdue', '/queue', NOW() - INTERVAL '1 hour'),
('attention', 'Meta webhook not configured', 'WhatsApp message delivery tracking is unavailable', '/status', NOW() - INTERVAL '4 hours'),
('update', 'New lead reply', 'Boosted Technologies LTD — interested in CRM demo', '/queue', NOW() - INTERVAL '8 hours'),
('update', 'Pipeline update', '9 new leads identified in Kampala restaurant district', '/queue', NOW() - INTERVAL '12 hours'),
('completed', 'Task completed', 'Morning deal check — no new pipeline changes', '/', NOW() - INTERVAL '2 hours'),
('completed', 'Content published', 'CRM Adoption for Kampala SMEs posted to regentplatform.com', '/', NOW() - INTERVAL '6 hours');

-- Sample Activity Log
INSERT INTO jarvis_activity_log (event_type, description, created_at) VALUES
('task_complete', 'Instagram carousel published', NOW() - INTERVAL '30 minutes'),
('content_posted', 'Blog post published: CRM Adoption for Kampala SMEs', NOW() - INTERVAL '1 hour'),
('content_posted', 'Case study published: Regent CRM case study', NOW() - INTERVAL '1 hour'),
('task_complete', 'Revenue tracker updated: Q2 revenue tracking', NOW() - INTERVAL '2 hours'),
('error', 'Instagram token invalid: API authentication failed', NOW() - INTERVAL '3 hours');

-- Sample Resources
INSERT INTO jarvis_resources (name, type, category, size_bytes, tags) VALUES
('CRM Adoption Guide.pdf', 'document', 'CRM Guide', 2400000, ARRAY['crm', 'guide', 'onboarding']),
('Kampala SME Outreach List.csv', 'spreadsheet', 'Leads Outreach', 156000, ARRAY['leads', 'kampala', 'outreach']),
('Brand Guidelines v2.pdf', 'document', 'Brand Design', 8100000, ARRAY['brand', 'design', 'guidelines']),
('Instagram Template Pack.zip', 'archive', 'Content Social', 45000000, ARRAY['instagram', 'templates', 'social']),
('Q2 Revenue Report.xlsx', 'spreadsheet', 'Reports Revenue', 892000, ARRAY['revenue', 'q2', 'report']),
('Client Onboarding Script.md', 'document', 'CRM Process', 12000, ARRAY['onboarding', 'script', 'crm']);
