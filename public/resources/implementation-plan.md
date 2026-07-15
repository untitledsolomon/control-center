# DAWN Control Center — Full Implementation Plan

> **Version**: 1.0  
> **Date**: July 2025  
> **Author**: DAWN (Regent Platform)  
> **Status**: Draft for review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [The Slow CRUD Problem — Root Cause & Fix](#3-the-slow-crud-problem)
4. [Phase 1: Performance & Real Data (Immediate)](#4-phase-1-performance--real-data)
5. [Phase 2: Project Management Module](#5-phase-2-project-management-module)
6. [Phase 3: DAWN & Slack Integration](#6-phase-3-dawn--slack-integration)
7. [Phase 4: Palantir-Inspired Features](#7-phase-4-palantir-inspired-features)
8. [Architecture & Data Model](#8-architecture--data-model)
9. [UI/UX Design System](#9-uiux-design-system)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Appendix: Research Sources](#11-appendix-research-sources)

---

## 1. Executive Summary

The DAWN Control Center is a Next.js 14 operations dashboard for managing the DAWN AI agent. It currently has 8 pages (Dashboard, Mission Queue, Directives, Resource Hub, Schedules, Protocols, Review Inbox, Status, Settings) with Supabase-backed CRUD operations.

**Key problems identified:**
- CRUD operations (especially delete) take ~2 seconds due to synchronous Supabase calls + state dispatch waterfall
- All data is mock/static — no real DAWN API integration on most pages
- No project management views (kanban, calendar, timeline, Gantt)
- No Slack integration
- No real-time collaboration
- Responsive but not optimized for mobile workflows

**This plan covers** a phased approach to transform the Control Center into a world-class operations platform inspired by Palantir Foundry, Linear, and modern project management tools.

---

## 2. Current State Analysis

### Pages & Their State

| Page | Route | Data Source | CRUD | Real-time | Notes |
|------|-------|-------------|------|-----------|-------|
| Dashboard | `/` | Mock + API fallback | No | Partial | Tries DAWN API, falls back to mock |
| Mission Queue | `/queue` | Supabase + Mock | Yes | No | Tasks CRUD works but slow |
| Directives | `/directives` | Supabase + Mock | Yes | No | **Delete takes ~2s** |
| Resource Hub | `/resources` | Static mock | No | No | No Supabase table |
| Schedules | `/schedules` | Supabase + Mock | Yes | No | Cron jobs CRUD |
| Protocols | `/playbooks` | Supabase + Mock | Yes | No | Playbooks CRUD |
| Review Inbox | `/review` | Supabase + Mock | Yes | No | Review items |
| Status | `/status` | Unknown | - | - | Not inspected |
| Settings | `/settings` | Supabase | Partial | No | Theme + integrations |

### Tech Stack
- **Framework**: Next.js 14 (Pages Router)
- **State**: useReducer + Context (no React Query / SWR)
- **Database**: Supabase (PostgreSQL)
- **UI**: Custom components (no shadcn/ui or Radix)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Styling**: Tailwind CSS + clsx/tailwind-merge

---

## 3. The Slow CRUD Problem

### Root Cause Analysis

When you click "Delete" on a directive, this happens:

```
1. onClick fires
2. Calls deleteGoal(id) from useAppState()
3. deleteGoal() calls:
   a. await supabase.from('jarvis_goals').delete().eq('id', id)  // ~300-800ms network
   b. dispatch({ type: 'DELETE_GOAL', payload: id })              // ~1ms
4. Then addActivity() calls:
   a. await supabase.from('jarvis_activity_log').insert(...)      // ~300-800ms network
   b. dispatch({ type: 'ADD_ACTIVITY', payload: act })            // ~1ms
```

**Total**: ~600ms–1.6s of sequential network calls, plus React re-render.

### The Fix: Optimistic Updates

Replace the current pattern with **React 19's `useOptimistic`** (or a manual optimistic pattern for React 18):

```typescript
// BEFORE (slow - waits for server)
const deleteGoal = async (id: string) => {
  await supabase.from('jarvis_goals').delete().eq('id', id)  // wait...
  dispatch({ type: 'DELETE_GOAL', payload: id })
}

// AFTER (instant - updates UI immediately)
const deleteGoal = async (id: string) => {
  // 1. Snapshot current state
  const previousGoals = state.goals
  
  // 2. Optimistically update UI
  dispatch({ type: 'DELETE_GOAL', payload: id })
  
  // 3. Fire & forget the server call
  supabase.from('jarvis_goals').delete().eq('id', id)
    .then(({ error }) => {
      if (error) {
        // 4. Rollback on failure
        dispatch({ type: 'SET_GOALS', payload: previousGoals })
        addNotification({ type: 'error', title: 'Delete failed', ... })
      }
    })
}
```

**Expected improvement**: Delete goes from ~2s to **instant** (< 50ms perceived).

### Additional Performance Fixes

1. **Batch activity + notification writes** — don't do them sequentially
2. **Use Supabase channel subscriptions** for real-time sync instead of polling
3. **Debounce search inputs** (currently re-renders on every keystroke)
4. **Virtual scrolling** for task lists with 100+ items
5. **React.memo** on list item components to prevent unnecessary re-renders

---

## 4. Phase 1: Performance & Real Data (Immediate)

### 4.1 Optimistic CRUD Everywhere

Replace all CRUD operations in `store.ts` with the optimistic pattern:

| Operation | Current | Optimistic |
|-----------|---------|------------|
| deleteTask | ~800ms | Instant |
| deleteGoal | ~800ms | Instant |
| deleteInstruction | ~800ms | Instant |
| deleteSchedule | ~800ms | Instant |
| deletePlaybook | ~800ms | Instant |
| deleteReviewItem | ~800ms | Instant |
| addTask | ~800ms | Instant |
| addGoal | ~800ms | Instant |
| updateTaskStatus | ~800ms | Instant |

### 4.2 Real DAWN API Integration

Currently only the Dashboard page attempts to fetch from the DAWN API. All other pages use mock data or Supabase fallback.

**What needs to happen:**
- Create a unified data layer that tries DAWN API first, falls back to Supabase, then mock
- Add real API endpoints for: tasks, goals, instructions, notifications, activity, cron jobs, playbooks, review items
- Add loading skeletons (not spinners) for every data-fetching state
- Add error states with retry buttons

### 4.3 Supabase Real-time Subscriptions

Currently only activity and notifications have real-time subscriptions. Add them for:
- Tasks (so kanban board updates live)
- Goals (so progress bars update live)
- Instructions (so toggle state syncs)
- Cron jobs (so status changes reflect immediately)

### 4.4 Loading States & Error Handling

Every page needs:
- **Skeleton loading** (shimmer placeholders matching the layout)
- **Error state** with retry button
- **Empty state** with CTA to create first item
- **Offline indicator** when Supabase/API is unreachable

---

## 5. Phase 2: Project Management Module

This is the biggest new feature. The Control Center needs a full project management system inspired by Linear, Notion, and Asana.

### 5.1 Data Model

```typescript
interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  priority: 'critical' | 'high' | 'medium' | 'low'
  startDate: Date
  targetDate: Date
  completedDate?: Date
  owner: string
  team: string[]
  tags: string[]
  progress: number  // 0-100 auto-calculated
  taskCount: number
  completedTaskCount: number
  createdAt: Date
  updatedAt: Date
}

interface Epic {
  id: string
  projectId: string
  name: string
  description: string
  status: 'backlog' | 'planned' | 'in_progress' | 'completed'
  priority: 'critical' | 'high' | 'medium' | 'low'
  startDate?: Date
  targetDate?: Date
  owner: string
  labels: string[]
  taskCount: number
  completedTaskCount: number
  sortOrder: number
}

// Extend existing Task with:
interface Task {
  // ...existing fields...
  projectId?: string
  epicId?: string
  sprintId?: string
  assignee?: string
  labels: string[]
  sortOrder: number
  estimatedHours?: number
  actualHours?: number
  dueDate?: Date
  attachments: string[]
  comments: Comment[]
}

interface Sprint {
  id: string
  projectId: string
  name: string
  goal: string
  startDate: Date
  endDate: Date
  status: 'planning' | 'active' | 'completed'
  taskIds: string[]
  velocity?: number
  completedPoints?: number
}

interface Comment {
  id: string
  taskId: string
  author: string
  body: string
  createdAt: Date
  updatedAt: Date
  attachments: string[]
}
```

### 5.2 Views

#### Kanban Board (`/projects/[id]/board`)
- Drag-and-drop columns: Backlog → To Do → In Progress → Review → Done
- Customizable columns per project
- Card shows: title, priority badge, assignee avatar, due date, labels
- Quick status change via drag
- WIP limits per column
- Swimlanes by assignee or epic

**Implementation**: Use `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop. Optimistic updates on every card move.

#### Calendar View (`/projects/[id]/calendar`)
- Month/week/day views
- Tasks with due dates shown as cards on the calendar
- Drag to reschedule
- Color-coded by project/epic
- Overlay with task details on click
- Sprint boundaries shown as colored bars

**Implementation**: Build a custom calendar component (no heavy library — just CSS Grid + date math). Use `date-fns` for date manipulation.

#### Timeline / Gantt View (`/projects/[id]/timeline`)
- Horizontal bar chart showing tasks over time
- Dependencies shown as arrows between bars
- Milestones as diamond markers
- Critical path highlighted
- Zoom: day/week/month
- Drag to adjust dates

**Implementation**: Custom SVG-based Gantt chart. No heavy library needed — SVG rects + lines are simple and performant.

#### List View (`/projects/[id]/list`)
- Sortable table with all fields
- Inline editing
- Bulk actions (select multiple, change status/assignee)
- Export to CSV
- Group by status/priority/assignee/epic

#### Board View (for all projects) (`/projects`)
- Card-based overview of all projects
- Shows: progress bar, task counts, days remaining, owner
- Filter by status/priority/tags
- Sort by name/deadline/progress

### 5.3 Key UX Patterns (from Linear)

1. **Command+K palette** — Quick search and action menu
2. **Keyboard shortcuts** — `C` create, `⌘K` search, `E` edit, `Del` delete
3. **Inline editing** — Click any field to edit in place
4. **Drag to reorder** — Tasks, columns, projects
5. **Batch operations** — Select multiple, bulk edit
6. **Auto-save** — No save button needed
7. **Undo** — Toast with undo option after destructive actions
8. **Notifications** — Real-time updates when something changes

### 5.4 Supabase Tables to Add

```sql
-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  priority TEXT DEFAULT 'medium',
  start_date DATE,
  target_date DATE,
  completed_date DATE,
  owner TEXT,
  team TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Epics
CREATE TABLE epics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'backlog',
  priority TEXT DEFAULT 'medium',
  start_date DATE,
  target_date DATE,
  owner TEXT,
  labels TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sprints
CREATE TABLE sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'planning',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comments
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES jarvis_tasks(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns to existing jarvis_tasks
ALTER TABLE jarvis_tasks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);
ALTER TABLE jarvis_tasks ADD COLUMN IF NOT EXISTS epic_id UUID REFERENCES epics(id);
ALTER TABLE jarvis_tasks ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES sprints(id);
ALTER TABLE jarvis_tasks ADD COLUMN IF NOT EXISTS assignee TEXT;
ALTER TABLE jarvis_tasks ADD COLUMN IF NOT EXISTS labels TEXT[] DEFAULT '{}';
ALTER TABLE jarvis_tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE jarvis_tasks ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC;
ALTER TABLE jarvis_tasks ADD COLUMN IF NOT EXISTS actual_hours NUMERIC;
ALTER TABLE jarvis_tasks ADD COLUMN IF NOT EXISTS due_date DATE;
```

---

## 6. Phase 3: DAWN & Slack Integration

### 6.1 DAWN Agent Integration

The Control Center is the UI for DAWN. Currently it barely talks to the actual DAWN API.

**What needs to happen:**

#### Agent Status (Real-time)
- Live agent status: online/idle/offline/error
- Current task being executed
- Memory/CPU usage (already partially done)
- Uptime, version, last heartbeat
- Queue depth (how many tasks pending)

#### Agent Commands
- Send directives from the UI (already has `/agent/directive` endpoint)
- View agent's decision log
- Override agent decisions
- Pause/resume agent
- View agent's knowledge graph status

#### Agent Outputs
- Real-time streaming of agent actions (SSE or WebSocket)
- View agent-generated content before publishing
- Approve/reject agent suggestions
- View agent's reasoning chain

#### Agent Configuration
- Set agent personality/tone (instructions page partially does this)
- Configure which tools the agent can use
- Set rate limits and safety constraints
- Configure notification preferences

### 6.2 Slack Integration

Slack is where Solomon lives. The Control Center needs deep Slack integration.

#### Inbound (Slack → Control Center)
- **Slash commands**: `/dawn status`, `/dawn tasks`, `/dawn create task "..."`, `/dawn directives`
- **Channel listening**: DAWN monitors specific channels for commands
- **Message actions**: Right-click a message → "Create task" / "Send to DAWN"
- **Workflow Builder steps**: "Create DAWN task" as a workflow step

#### Outbound (Control Center → Slack)
- **Notifications**: Task completed, goal at risk, system alert
- **Daily digest**: Morning briefing in Slack
- **Approval requests**: "Approve this content?" with buttons
- **Status updates**: Agent status changes
- **Customizable**: Per-channel notification preferences

#### Implementation

```typescript
// Slack Bolt app running alongside the Control Center
import { App } from '@slack/bolt'

const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
})

// Slash command: /dawn create task "Write blog post" high
slackApp.command('/dawn', async ({ command, ack, respond }) => {
  await ack()
  const parsed = parseDawnCommand(command.text)
  // Create task in Supabase
  // Respond in thread
  await respond(`✅ Task created: "${parsed.title}"`)
})

// Send notification to Slack
async function notifySlack(channel: string, message: string, blocks?: any[]) {
  await slackApp.client.chat.postMessage({
    channel,
    text: message,
    blocks,
  })
}
```

**Slack tables to add:**
```sql
CREATE TABLE slack_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  channel_name TEXT,
  notification_types TEXT[] DEFAULT '{}', -- which events to notify on
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE slack_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slack_message_ts TEXT,
  channel_id TEXT,
  task_id UUID REFERENCES jarvis_tasks(id),
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 7. Phase 4: Palantir-Inspired Features

Palantir Foundry/Gotham's core philosophy: **Ontology-driven operations**. Everything is an object with properties, links, and actions.

### 7.1 Ontology Engine

Instead of separate tables for tasks, goals, projects, etc., create a unified object model:

```typescript
interface OntologyObject {
  id: string
  type: 'task' | 'goal' | 'project' | 'epic' | 'client' | 'lead' | 'document'
  properties: Record<string, any>  // type-specific fields
  links: {                         // relationships to other objects
    targetId: string
    targetType: string
    relationship: 'depends_on' | 'parent' | 'related' | 'assigned_to'
  }[]
  timeline: {                      // full audit trail
    timestamp: Date
    action: string
    actor: string
    details: any
  }[]
  created_at: Date
  updated_at: Date
}
```

This enables:
- **Graph view**: Visualize relationships between tasks, goals, projects, clients
- **Impact analysis**: "If this task is delayed, what else is affected?"
- **Unified search**: Search across all object types
- **Cross-object linking**: Link a task to a goal, a lead, and a document

### 7.2 Advanced Analytics

- **Velocity charts**: Tasks completed per day/week/sprint
- **Burndown charts**: For sprints
- **Cycle time**: Average time from "in progress" to "done"
- **Throughput**: Tasks completed per unit time
- **Work in progress**: Current WIP vs limits
- **Forecasting**: When will this project finish based on current velocity?

### 7.3 Decision Log

Every action DAWN takes should be logged with:
- What was decided
- Why (reasoning chain)
- What data was used
- What the outcome was
- Whether it was approved/rejected by human

This is the **audit trail** that makes AI operations trustworthy.

### 7.4 Collaborative Features

- **@mentions** in comments
- **Activity feed** per project/task
- **Watch/unwatch** objects for notifications
- **Share views** with team members
- **Saved filters** and custom views

---

## 8. Architecture & Data Layer

### 8.1 Current Architecture Problem

```
Page Component → useAppState() → dispatch() → reducer → re-render
                    ↕
                Supabase calls (sequential, blocking)
```

### 8.2 Target Architecture

```
Page Component → useQuery/useMutation (React Query) → Optimistic Cache
                    ↕                              ↕
                Supabase/DAWN API              UI updates instantly
                    ↕
                Real-time subscriptions (background sync)
```

### 8.3 Recommended Libraries

| Library | Purpose | Why |
|---------|---------|-----|
| `@tanstack/react-query` | Server state management | Built-in optimistic updates, caching, retry, refetch |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag and drop | Accessible, performant, works with React 18 |
| `date-fns` | Date manipulation | Tree-shakeable, no moment.js bloat |
| `@slack/bolt` | Slack integration | Official Slack SDK |
| `zustand` or `jotai` | Client state | Lighter than Context for frequent updates |
| `sonner` or `react-hot-toast` | Toast notifications | For undo/error toasts |
| `cmdk` | Command palette | Linear-style ⌘K menu |
| `vaul` | Drawer/modal | For mobile-friendly task creation |

### 8.4 Data Flow

```
User Action → Optimistic UI Update → Background API Call
                                         ↓
                                    Success? → No → Rollback + Toast
                                         ↓
                                    Yes → Background Sync
                                         ↓
                                    Real-time Subscription → Update if changed
```

---

## 9. UI/UX Design System

### 9.1 Current Issues
- Inconsistent spacing (some pages use `p-4`, others `p-5`)
- No loading skeletons (just raw content or nothing)
- No keyboard shortcuts
- No command palette
- Mobile experience is functional but not optimized

### 9.2 Design Principles (from Palantir + Linear)

1. **Information density** — Show more data, not less. Power users want to see everything.
2. **Keyboard-first** — Every action should have a keyboard shortcut.
3. **Instant response** — Optimistic updates everywhere. No spinners for CRUD.
4. **Progressive disclosure** — Show the most important info first, expand for details.
5. **Consistent patterns** — Same delete button, same edit flow, same filter pattern everywhere.
6. **Dark mode first** — Design for dark mode, ensure light mode works.

### 9.3 Component Library Upgrade

Replace the current ad-hoc components with a proper system:

| Component | Current | Target |
|-----------|---------|--------|
| Button | Custom | Custom (good, keep) |
| Card | Custom | Custom (good, keep) |
| Badge | Custom | Custom (good, keep) |
| Input | Raw HTML | Custom Input component |
| Select | Raw HTML | Custom Select with search |
| Modal | None | Drawer (vaul) |
| Toast | None | sonner |
| Command Palette | None | cmdk |
| Skeleton | None | Custom shimmer |
| Table | None | TanStack Table |
| Dropdown | None | Custom dropdown menu |
| Tooltip | None | Custom tooltip |
| Avatar | None | Custom with initials |

### 9.4 Mobile Optimization

- Bottom navigation bar instead of sidebar on mobile
- Swipe gestures for task actions
- Pull-to-refresh
- Responsive data tables (horizontal scroll on mobile)
- Touch-friendly hit targets (min 44px)

---

## 10. Implementation Roadmap

### Phase 1: Performance & Real Data (Week 1-2)

| Task | Effort | Dependencies |
|------|--------|-------------|
| Install React Query + migrate store | 2 days | None |
| Implement optimistic updates for all CRUD | 2 days | React Query |
| Add loading skeletons to all pages | 1 day | None |
| Add error states with retry | 1 day | None |
| Add Supabase real-time for all tables | 1 day | None |
| Debounce search inputs | 0.5 day | None |
| Virtual scrolling for task lists | 1 day | None |
| **Total** | **~8.5 days** | |

### Phase 2: Project Management (Week 3-5)

| Task | Effort | Dependencies |
|------|--------|-------------|
| Create Supabase tables (projects, epics, sprints, comments) | 1 day | None |
| Build Projects overview page | 2 days | Phase 1 |
| Build Kanban board with drag-and-drop | 4 days | @dnd-kit |
| Build Calendar view | 3 days | date-fns |
| Build Timeline/Gantt view | 4 days | None |
| Build List view with inline editing | 2 days | None |
| Add keyboard shortcuts | 1 day | None |
| Add Command+K palette | 2 days | cmdk |
| Add batch operations | 1 day | None |
| Add undo toasts | 1 day | sonner |
| **Total** | **~21 days** | |

### Phase 3: DAWN & Slack Integration (Week 6-7)

| Task | Effort | Dependencies |
|------|--------|-------------|
| Build DAWN agent status panel | 2 days | Phase 1 |
| Build DAWN command interface | 2 days | None |
| Build DAWN decision log viewer | 2 days | None |
| Build DAWN output approval workflow | 3 days | None |
| Set up Slack Bolt app | 1 day | None |
| Implement slash commands | 2 days | Slack app |
| Implement outbound notifications | 2 days | Slack app |
| Implement approval buttons in Slack | 2 days | Slack app |
| **Total** | **~16 days** | |

### Phase 4: Palantir-Inspired Features (Week 8-10)

| Task | Effort | Dependencies |
|------|--------|-------------|
| Build ontology data model | 3 days | Phase 2 |
| Build graph view | 4 days | Ontology |
| Build analytics dashboard | 3 days | Phase 2 |
| Build burndown/velocity charts | 2 days | Phase 2 |
| Build collaborative features | 3 days | Phase 2 |
| Build saved views/filters | 2 days | None |
| **Total** | **~17 days** | |

### Total: ~62.5 days (~3 months)

---

## 11. Appendix: Research Sources

### Palantir
- [Palantir Foundry — Ontology Overview](https://www.palantir.com/docs/foundry/ontology/overview)
- [Palantir Gotham — Service Definition](https://assets.applytosupply.digitalmarketplace.service.gov.uk/g-cloud-14/documents/92736/801146272055049-service-definition-document-2024-11-26-1253.pdf)
- [Palantir Quiver Dashboards](https://www.palantir.com/docs/foundry/quiver/dashboards-overview)
- [Palantir Workshop — Building Dashboards](https://medium.com/d-one/mastering-palantir-foundry-workshop-building-insightful-dashboards-a5697adeb17d)

### Project Management UX
- [Linear App — UX Patterns](https://www.saasui.design/application/linear)
- [Asana Project Views](https://asana.com/features/project-management/project-views)
- [Visual Project Management Guide](https://asana.com/resources/visual-project-management-kanban-timeline-calendar)
- [Kanban vs Gantt vs Calendar](https://www.taskopad.com/blog/when-to-use-kanban-gantt-list-or-calendar-views-project-views-explained/)

### Performance Patterns
- [React useOptimistic](https://react.dev/reference/react/useOptimistic)
- [Optimistic Updates in React](https://dev.to/whoffagents/optimistic-updates-in-react-ux-that-feels-instant-2k31)
- [React Query CRUD Guide](https://dev.to/zopdev/react-query-from-beginner-to-advanced-a-practical-guide-to-mastering-crud-53an)

### Slack Integration
- [Slack Developer Docs](https://docs.slack.dev/)
- [Slack Integrations](https://slack.com/integrations)
- [Slack Bolt Framework](https://slack.dev/bolt-js/)

### AI Agent Dashboards
- [AI Agent Dashboard Comparison](https://thecrunch.io/ai-agent-dashboard/)
- [DAWN Framework Paper](https://arxiv.org/html/2410.22339v3)
- [Forbes: AI Agents at Work](https://www.forbes.com/councils/forbestechcouncil/2026/04/20/ai-agents-at-work-the-dawn-of-autonomous-business-operations/)

---

## Next Steps

1. **Review this plan** — Solomon reads and approves/modifies
2. **Start Phase 1** — Install React Query, implement optimistic updates
3. **Fix the delete latency** — This is the most visible pain point
4. **Build the project management module** — Start with Kanban board
5. **Integrate Slack** — Start with slash commands
6. **Iterate** — Based on real usage

---

*This document was generated by DAWN on July 2025. It represents a research-backed implementation plan for the DAWN Control Center evolution.*
