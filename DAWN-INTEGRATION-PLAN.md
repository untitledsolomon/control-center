# DAWN Control Center — Integration Plan

## Overview

The DAWN Control Center is a Next.js 14 dashboard that replaces the old Jarvis Mission Control. It provides a unified interface for monitoring and managing the DAWN AI agent. This document outlines the integration plan to connect the frontend dashboard to the DAWN API backend.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   DAWN Control Center                    │
│                    (Next.js 14 / Vercel)                  │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │Dashboard │  │  Queue   │  │Directives│  │ Schedules│ │
│  │   Page   │  │   Page   │  │   Page   │  │   Page   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       │             │             │             │        │
│  ┌────┴─────────────┴─────────────┴─────────────┴────┐   │
│  │              API Layer (lib/api.ts)                │   │
│  │   ┌─────────────┐  ┌─────────────┐                │   │
│  │   │ DAWN API    │  │ Supabase    │                │   │
│  │   │ (REST)      │  │ (Direct)    │                │   │
│  │   └─────────────┘  └─────────────┘                │   │
│  └────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS
┌──────────────────────────┴──────────────────────────────┐
│                   DAWN API (FastAPI)                      │
│              https://dawn-api.regentplatform.com           │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Agent   │  │  Tasks   │  │  Nodes   │  │  Chat    │ │
│  │ Routes   │  │  Routes  │  │  Routes  │  │  Routes  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │Monitor   │  │ Security │  │  BI      │  │  AI      │ │
│  │ Routes   │  │  Routes  │  │  Routes  │  │  Routes  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└──────────────────────────────────────────────────────────┘
```

## Current State

### What's Working Now
- **Dashboard page** — fully functional with mock data fallback
- **Sidebar navigation** — 8 routes (Dashboard, Queue, Directives, Resources, Schedules, Protocols, Review, Status)
- **Notifications panel** — slide-out panel with attention/update/completed sections
- **Quick Action bar** — command palette for rapid task creation
- **Supabase integration** — reads/writes to `jarvis_*` tables with real-time subscriptions
- **Recharts charts** — weekly bar chart, hourly area chart
- **Responsive design** — mobile, tablet, desktop layouts
- **Vercel deployment** — live at https://dawn-control-center.vercel.app

### What Needs Integration
The dashboard currently uses **mock data** and **Supabase directly** for the old Jarvis tables. It needs to be connected to the DAWN API for real data.

## Integration Phases

### Phase 1: API Client Layer (Week 1)

Create `src/lib/api.ts` with a typed API client for the DAWN FastAPI backend.

**Key endpoints to integrate:**

| Dashboard Feature | DAWN API Endpoint | Method | Purpose |
|---|---|---|---|
| Stats cards | `/agent-tasks?status=active` | GET | Task counts |
| Stats cards | `/agent-tasks?status=complete` | GET | Completed tasks |
| Activity feed | `/agent-logs` | GET | Recent activity |
| Notifications | `/notifications` | GET | Alert/update notifications |
| Goals | `/agi/goals` | GET | Active goals & progress |
| Queue | `/agent-tasks` | GET/POST | Task management |
| Directives | `/agent-tasks` | POST | Create directives |
| Schedules | `/agent-schedules` | GET/POST/DELETE | Cron job management |
| Protocols | `/community/plugins` | GET | Playbook/protocol list |
| Review | `/documents` | GET | Review inbox items |
| Status | `/health` | GET | System health |
| Status | `/monitor/status` | GET | Monitoring status |
| Status | `/diagnosis/health` | GET | DAWN self-diagnosis |

**Implementation:**

```typescript
// src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_DAWN_API_URL || 'https://dawn-api.regentplatform.com'
const API_KEY = process.env.NEXT_PUBLIC_DAWN_API_KEY

class DawnApiClient {
  private base: string
  private headers: Record<string, string>

  constructor() {
    this.base = API_BASE
    this.headers = {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
    }
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.base}${path}`, { headers: this.headers })
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
    return res.json()
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
    return res.json()
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
    return res.json()
  }

  async delete(path: string): Promise<void> {
    const res = await fetch(`${this.base}${path}`, {
      method: 'DELETE',
      headers: this.headers,
    })
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  }

  // ─── Dashboard ───
  async getStats() {
    const [active, complete, blocked] = await Promise.all([
      this.get<any[]>('/agent-tasks?status=active&limit=0'),
      this.get<any[]>('/agent-tasks?status=complete&limit=0'),
      this.get<any[]>('/agent-tasks?status=blocked&limit=0'),
    ])
    return {
      tasksCompleted: complete.length,
      activeTasks: active.length,
      blockedTasks: blocked.length,
      leadsTouched: 41, // TODO: get from CRM integration
    }
  }

  async getActivity(limit = 10) {
    return this.get<any[]>(`/agent-logs?limit=${limit}`)
  }

  async getNotifications() {
    return this.get<any[]>('/notifications')
  }

  async getGoals() {
    return this.get<any[]>('/agi/goals')
  }

  // ─── Tasks ───
  async getTasks(status?: string) {
    const query = status ? `?status=${status}` : ''
    return this.get<any[]>(`/agent-tasks${query}`)
  }

  async createTask(task: any) {
    return this.post<any>('/agent-tasks', task)
  }

  async updateTask(id: string, updates: any) {
    return this.put<any>(`/agent-tasks/${id}`, updates)
  }

  async deleteTask(id: string) {
    return this.delete(`/agent-tasks/${id}`)
  }

  // ─── Schedules ───
  async getSchedules() {
    return this.get<any[]>('/agent-schedules')
  }

  async createSchedule(schedule: any) {
    return this.post<any>('/agent-schedules', schedule)
  }

  async deleteSchedule(id: string) {
    return this.delete(`/agent-schedules/${schedule_id}`)
  }

  // ─── Health ───
  async getHealth() {
    return this.get<any>('/health')
  }

  async getDiagnosis() {
    return this.get<any>('/diagnosis/health')
  }
}

export const dawnApi = new DawnApiClient()
```

### Phase 2: Replace Store Data Sources (Week 2)

Modify `src/lib/store.ts` to:
1. Try DAWN API first for all data fetches
2. Fall back to Supabase direct queries
3. Fall back to mock data if both fail

**Strategy:**
- Add a `dataSource` config option: `'api' | 'supabase' | 'mock'`
- Default to `'api'` with graceful degradation
- Each fetch function tries API → Supabase → mock

### Phase 3: Real-time Updates (Week 2-3)

Replace Supabase real-time subscriptions with:
1. **Polling** — Poll DAWN API every 30s for dashboard data
2. **WebSocket** — Connect to DAWN's WebSocket for real-time events (if available)
3. **Server-Sent Events** — Fallback for real-time updates

### Phase 4: Page Implementations (Week 3-4)

Build out the remaining placeholder pages:

| Page | Route | Key API Endpoints | Features |
|---|---|---|---|
| **Mission Queue** | `/queue` | `/agent-tasks` | Kanban board, filters, search, bulk actions |
| **Directives** | `/directives` | `/agent-tasks` (POST) | Command input, history, templates |
| **Resource Hub** | `/resources` | `/documents`, `/books` | Document library, search, folders |
| **Schedules** | `/schedules` | `/agent-schedules` | Cron editor, calendar view, run history |
| **Protocols** | `/playbooks` | `/community/plugins` | Playbook editor, versioning, variables |
| **Review Inbox** | `/review` | `/documents` | Approval workflow, comments, status |
| **Status** | `/status` | `/health`, `/diagnosis/health`, `/monitor/status` | System health, metrics, logs |

### Phase 5: Authentication (Week 4)

Add authentication to the control center:
1. **API Key** — Simple header-based auth (already supported by DAWN API)
2. **Session-based** — Login page with session management
3. **Role-based access** — Different views for admin vs. viewer

### Phase 6: Advanced Features (Week 5+)

- **BI Dashboard** — Connect to `/bi/dashboards` for custom analytics
- **AI Chat** — Embed DAWN chat interface via `/chat/` endpoints
- **Security Dashboard** — Connect to `/security/` and `/pentest/` endpoints
- **IoT Monitoring** — Connect to `/iot/` endpoints
- **Multi-modal** — Image/document analysis via `/multimodal/` endpoints

## Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_DAWN_API_URL=https://dawn-api.regentplatform.com
NEXT_PUBLIC_DAWN_API_KEY=sk-owner-xxxxxxxxxxxx
NEXT_PUBLIC_SUPABASE_URL=https://zapdeqafuaatpkqialba.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

## Deployment

### Vercel (Current)
- **Project**: `dawn-control-center`
- **URL**: https://dawn-control-center.vercel.app
- **Team**: untitledsolomon's projects
- **Framework**: Next.js 14

### Custom Domain
- **Target**: `dawn.regentplatform.com` (currently used by existing DAWN UI)
- **Action**: Either replace the existing DAWN UI deployment, or use a subdomain like `control.dawn.regentplatform.com`

## File Structure

```
control-center/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with AppStateProvider
│   │   ├── page.tsx            # Dashboard (fully implemented)
│   │   ├── globals.css         # Tailwind + custom styles
│   │   ├── queue/page.tsx      # Placeholder
│   │   ├── directives/page.tsx # Placeholder
│   │   ├── resources/page.tsx  # Placeholder
│   │   ├── schedules/page.tsx  # Placeholder
│   │   ├── playbooks/page.tsx  # Placeholder
│   │   ├── review/page.tsx     # Placeholder
│   │   └── status/page.tsx     # Placeholder
│   ├── components/
│   │   ├── layout.tsx          # Client layout with sidebar/header
│   │   ├── sidebar.tsx         # Navigation sidebar
│   │   ├── notifications.tsx   # Notifications panel
│   │   ├── quick-action.tsx    # Quick action command bar
│   │   └── ui.tsx              # Reusable UI primitives
│   └── lib/
│       ├── store.ts            # State management (context + reducer)
│       ├── supabase.ts         # Supabase client
│       ├── types.ts            # TypeScript types
│       └── utils.ts            # Utility functions
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── postcss.config.js
└── .env.local
```

## Priority Matrix

| Feature | Effort | Impact | Priority |
|---|---|---|---|
| API client layer | Low | High | P0 |
| Replace mock data with API | Medium | High | P0 |
| Status page (health check) | Low | Medium | P1 |
| Mission Queue page | Medium | High | P1 |
| Authentication | Medium | High | P1 |
| Schedules page | Medium | Medium | P2 |
| Directives page | Low | Medium | P2 |
| Real-time updates | Medium | Medium | P2 |
| Review Inbox page | Medium | Low | P3 |
| Protocols page | Medium | Low | P3 |
| Resource Hub page | High | Low | P3 |
| Advanced features | High | Low | P4 |

## Git Repository

- **URL**: https://github.com/untitledsolomon/control-center
- **Branch**: `main`
- **Status**: Initial commit pushed with full dashboard code
- **Note**: Push requires GitHub PAT — currently deploying via Vercel API directly
