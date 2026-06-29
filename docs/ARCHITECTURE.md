# Architecture

## Overview

HypoOS is a personal AI operating system built as a mobile-responsive web application. Users interact with a conversational AI assistant that can create tasks, log expenses, set reminders, capture notes, and retrieve summaries — all through natural language. The architecture is intentionally modular so that future capabilities (calendar, health, finance, legal) can be added without restructuring the core.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        User                             │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                      Frontend                           │
│   Next.js (web / mobile browser)  →  Next.js API routes │
│              React + Tailwind + shadcn/ui               │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                      AI Layer                           │
│   OpenAI Responses API  →  Tool Registry                │
│         (tool calling / function calling)               │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
               ▼                      ▼
   AI selects tool          Backend validates tool call
   (structured JSON)        Schema · user ID · permissions
               │
┌──────────────▼──────────────────────────────────────────┐
│               Backend Tools (server-side)               │
│  Task tools · Note tools · Reminder tools               │
│  Calendar tools · Preference tools                      │
└──────────────┬──────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────┐
│           Supabase (Postgres + Auth + pgvector)         │
│                                                         │
│  Auth          Postgres (RLS)    pgvector    exec_logs  │
│  OAuth/session  Row-level sec    Semantic    Debug/audit│
│                                  memory                 │
│                                                         │
│  Tables: users · conversations · messages · tasks       │
│          notes · reminders · prefs · expenses           │
│          calendar_conn · exec_logs                      │
└────────────┬──────────────────────┬─────────────────────┘
             │                      │
             ▼                      ▼
  Google Calendar API       Notification Service
  OAuth — Phase 2           Email / in-app reminders
             │                      │
             └──────────┬───────────┘
                        ▼
              Vercel (Next.js) + Supabase Cloud
```

> Reference: `docs/hypoos_system_architecture.png`

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 15 (App Router) | Routing, SSR, API routes, Server Actions |
| Language | TypeScript | Type safety across the full stack |
| Styling | Tailwind CSS + shadcn/ui | Utility-first styling with accessible components |
| Database | Supabase (PostgreSQL) | Relational data, RLS, real-time |
| Auth | Supabase Auth | Email/password + Google OAuth |
| Vector | pgvector (Supabase extension) | Semantic memory on `messages.embedding` |
| AI | OpenAI GPT-4o-mini | Conversational AI with tool calling |
| AI SDK | Vercel AI SDK + `@ai-sdk/openai` | Streaming, tool orchestration |
| Hosting | Vercel + Supabase Cloud | Deployment and managed DB |

---

## Modular Architecture

The application is structured around independent domain modules under `src/modules/`. Each module owns its UI components, database queries, server actions, AI tool definitions, and Zod schemas. The app layer (`src/app/`) is thin — it only handles routing and delegates to modules.

```
src/modules/
├── auth/           # Session, login/register forms
├── profile/        # User profile (users table)
├── tasks/          # Task CRUD + AI tools
├── expenses/       # Expense CRUD + AI tools
├── notes/          # Notes CRUD + AI tools
├── reminders/      # Reminder CRUD + AI tools
├── conversations/  # Chat interface + message history
├── memory/         # prefs table + AI context retrieval
├── notifications/  # In-app and email delivery
├── calendar/       # Google Calendar OAuth + sync (Phase 2)
├── dashboard/      # Read-only aggregation across modules
├── admin/          # Platform metrics (service-role only)
└── registry.ts     # Assembles all AI tools — consumed by api/chat/route.ts
```

Each module follows the same internal shape:

```
modules/<domain>/
├── components/     # React UI components for this domain
├── queries.ts      # Read-only DB functions (used in Server Components)
├── actions.ts      # 'use server' mutations (create, update, delete)
├── ai-tools.ts     # OpenAI tool definitions + handlers
├── schema.ts       # Zod schemas and TypeScript types
└── index.ts        # Module manifest — public exports
```

**Adding a new capability** means creating a new module folder, implementing `ai-tools.ts`, and exporting the tools into `registry.ts`. No existing code needs to change.

---

## AI Function Calling Architecture

The AI assistant uses OpenAI's tool calling to perform real actions. The full flow for a message like *"Remind me to call John tomorrow at 5 PM"*:

```
1. User sends message
   └─ "Remind me to call John tomorrow at 5 PM"

2. Next.js API route (app/api/chat/route.ts)
   └─ Attaches: user context · conversation history · timezone

3. OpenAI Responses API called
   └─ Message + context + full tool registry sent to model

4. OpenAI selects tool: create_reminder
   └─ Returns structured JSON — no DB write yet

5. Backend validates the tool call
   └─ Zod schema · user ID · timezone · permissions

6. Supabase write
   └─ Reminder row inserted · RLS enforces user_id scope
   └─ exec_logs row written (tool name, params, result, latency)

7. Assistant replies with confirmation
   └─ "Done — I'll remind you to call John at 5 PM tomorrow."

8. Reminder worker fires at scheduled time
   └─ Cron / Vercel Cron job → push / email notification sent
```

> Reference: `docs/hypoos_function_calling_workflow.png`

### Tool Registry

`src/modules/registry.ts` is the single assembly point for all AI tools. It imports tool definitions from each module and exports a combined array passed to every OpenAI API call. The registry is a strict consumer — no module imports from it.

```
registry.ts
  ← tasks/ai-tools.ts      (create_task, update_task, delete_task, get_tasks)
  ← expenses/ai-tools.ts   (log_expense, get_expenses, get_expense_summary)
  ← notes/ai-tools.ts      (create_note, get_notes, search_notes)
  ← reminders/ai-tools.ts  (create_reminder, get_reminders, dismiss_reminder)
  ← memory/ai-tools.ts     (get_user_context, update_preferences)
  ← conversations/ai-tools.ts (get_conversation_history)
```

---

## Database Schema

All tables live in the `public` schema. Migrations run in numeric order from `supabase/migrations/`. Each migration file is self-contained — it creates the table, adds indexes, attaches triggers, and enables RLS in one file.

| # | Migration | Table | Notes |
|---|---|---|---|
| 0001 | `foundation` | — | Enables `pgcrypto` and `vector` extensions |
| 0002 | `users` | `users` | Extends `auth.users` — profile, role |
| 0003 | `prefs` | `prefs` | Timezone, currency, JSONB preferences |
| 0004 | `conversations` | `conversations` | Chat session containers |
| 0005 | `messages` | `messages` | Chat messages + `embedding vector` (pgvector) |
| 0006 | `tasks` | `tasks` | Status, priority, due date |
| 0007 | `notes` | `notes` | Freeform notes with tags |
| 0008 | `reminders` | `reminders` | Scheduled reminders with sent tracking |
| 0009 | `expenses` | `expenses` | Amount, category, date |
| 0010 | `calendar_conn` | `calendar_conn` | Google Calendar OAuth tokens (server-only) |
| 0011 | `exec_logs` | `exec_logs` | AI tool call audit log |
| 0012 | `grants` | — | Final RLS grants and permissions |

### pgvector — Semantic Memory

The `messages` table includes an `embedding vector(1536)` column. When a message is saved, its embedding is generated via OpenAI's `text-embedding-3-small` model and stored. The `memory` module retrieves semantically relevant past messages using cosine similarity to provide long-term context to the AI.

### Row Level Security

RLS is enabled on every table. The base policy on all user-owned tables:

```sql
-- Users can only access their own rows
using (auth.uid() = user_id)
```

`calendar_conn` and `exec_logs` are written exclusively via the Supabase service role key (never from the browser). Admins access aggregate data through the service role in `modules/admin/queries.ts`.

---

## Authentication

Supabase Auth handles all authentication flows.

| Flow | Implementation |
|---|---|
| Email / Password | Supabase built-in |
| Google OAuth | Supabase OAuth provider → `app/auth/callback/route.ts` |
| Session management | `@supabase/ssr` — cookies-based, refreshed in `middleware.ts` |
| Route protection | `middleware.ts` intercepts all requests, redirects unauthenticated users to `/sign-in` |
| Role guard | `(admin)/layout.tsx` checks `users.role = 'admin'` server-side |

On signup, a database trigger (`handle_new_user`) automatically inserts a row into `users` and `prefs` so every authenticated user always has a complete profile.

---

## Deployment Architecture

```
Developer  →  GitHub  →  Vercel CI/CD  →  Vercel Edge (Next.js)
                                                  │
                                          Supabase Cloud
                                          (Postgres + Auth + Storage)
```

- **Vercel** hosts the Next.js application. API routes run as serverless functions.
- **Supabase Cloud** hosts the database, auth, and storage. The connection is via the Supabase JS SDK using environment variables.
- **Environment variables** are set in Vercel project settings — never committed to the repo.
- **Cron jobs** for reminder delivery run as Vercel Cron functions (configured in `vercel.json` in a future milestone).

---

## Roadmap

```
P1 — Foundation          Auth · onboarding · base dashboard · database schema
P2 — AI Core             AI chat interface · OpenAI tool calling · tasks · notes
P3 — Memory & Reliability  Reminders · user preferences · pgvector memory · exec logs
P4 — Integrations        Google Calendar · notifications · testing · Vercel deployment
P5 — Future Expansion    Email agent · documents · browser extension · mobile app
```

> Reference: `docs/hypoos_mvp_roadmap.png`

Post-launch (not in MVP): Desktop companion app or browser extension.

---

## Key Design Decisions

**Modular over layered** — Organising by domain (`modules/tasks/`) rather than by layer (`controllers/`, `services/`, `repositories/`) keeps related code co-located and makes it easy to add or remove a domain without touching unrelated code.

**Server Actions over REST for mutations** — Next.js Server Actions (`actions.ts` in each module) are used for all write operations. REST API routes (`app/api/`) are reserved for the streaming AI chat endpoint and any external client needs.

**Tool registry as a single seam** — All AI capability is wired through `registry.ts`. Adding a new feature to the AI means writing one `ai-tools.ts` file and one line in `registry.ts`.

**RLS as the security boundary** — Database-level row security means even a bug in application code cannot leak another user's data. The service role key is only used server-side for admin reads and system writes (`exec_logs`, `calendar_conn`).

**pgvector for memory** — Storing message embeddings in the same Postgres database (rather than a separate vector store) avoids operational complexity and keeps the data model simple for an MVP.
