# HypoOS MVP

A personal AI operating system that helps users manage daily life through a conversational AI assistant.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Backend / Auth | Supabase (PostgreSQL + Auth) |
| AI | OpenAI GPT-4o-mini + Vercel AI SDK |
| Hosting | Vercel + Supabase |

## Features

- **AI Chat Assistant** — Conversational interface with function calling (create tasks, log expenses, set reminders)
- **Task Management** — Create, update, complete, and delete tasks via chat or manual UI
- **Expense Tracking** — Log and categorize expenses, view history and weekly totals
- **Notes** — Capture and retrieve notes through chat or directly
- **Reminders** — Set and manage reminders via natural language
- **Daily Summary Dashboard** — Pending tasks, today's expenses, AI-generated summary
- **User Memory** — Persists preferences and context across sessions
- **Admin Dashboard** — Registered users, total tasks/expenses, platform metrics

## Project Structure

```
src/
├── app/               # Next.js App Router — routing only
│   ├── (auth)/        # Public: sign-in, sign-up
│   ├── (app)/         # Protected: dashboard, chat, tasks, expenses, notes, reminders, profile, settings
│   ├── (admin)/       # Admin-only: metrics, user management
│   └── api/           # Route handlers: chat (streaming), tasks, expenses, admin
│
├── modules/           # Modular core — one folder per domain
│   ├── auth/          # Login/register forms, session queries, auth actions
│   ├── profile/       # Profile view/edit, avatar upload
│   ├── tasks/         # Task UI, DB queries, server actions, AI tools
│   ├── expenses/      # Expense UI, DB queries, server actions, AI tools
│   ├── notes/         # Notes UI, DB queries, server actions, AI tools
│   ├── reminders/     # Reminders UI, DB queries, server actions, AI tools
│   ├── conversations/ # Chat interface, message history, AI tools
│   ├── memory/        # User preferences + AI context retrieval
│   ├── dashboard/     # Aggregates data across modules (read-only)
│   ├── notifications/ # In-app and email notification delivery
│   ├── calendar/      # Google Calendar OAuth + sync (Phase 2)
│   ├── admin/         # Platform metrics (service-role only)
│   └── registry.ts    # Assembles all AI tools for the chat endpoint
│
├── components/
│   ├── ui/            # shadcn/ui primitives (auto-generated — do not edit)
│   ├── shared/        # App-wide composites: sidebar, header, mobile-nav
│   └── providers.tsx  # Global context: Toaster, ThemeProvider
│
├── lib/
│   ├── supabase/      # Browser client, server client, middleware helper, admin client
│   ├── ai/            # OpenAI + Vercel AI SDK config, system prompt
│   └── utils.ts       # cn() and shared helpers
│
├── hooks/             # Shared React client hooks
├── types/             # Supabase-generated database types
└── config/            # Zod-validated env vars, app constants

supabase/
└── migrations/        # One SQL file per entity (foundation → users → ... → exec_logs)
```

## Database Schema

| Table | Purpose |
|---|---|
| `users` | Extends `auth.users` — display name, avatar, role (`user` / `admin`) |
| `prefs` | Timezone, currency, extensible JSONB preferences (user memory) |
| `conversations` | Chat session container per user |
| `messages` | Chat messages with role, tool-call metadata, and pgvector `embedding` |
| `tasks` | User tasks with status, due date, completion |
| `notes` | Freeform notes captured via chat or directly |
| `reminders` | Scheduled reminders (in-app/email), optional task link |
| `expenses` | Expense entries with amount, category, date, source |
| `calendar_conn` | Connected calendar OAuth accounts (Google, Phase 2) — server-only |
| `exec_logs` | AI tool/function-call audit log (debug, reliability, admin metrics) |

Row Level Security is enabled on all tables. Users can only access their own rows.
`messages.embedding` uses **pgvector** for semantic memory. `calendar_conn` (OAuth
tokens) and `exec_logs` writes are server-only via the Supabase service role key.

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd hypoos_mvp
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=        # from Supabase project settings
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # from Supabase project settings
SUPABASE_SERVICE_ROLE_KEY=       # from Supabase project settings (keep secret)
OPENAI_API_KEY=                  # from platform.openai.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Supabase migrations

```bash
npx supabase db push
```

Or apply migrations manually via the Supabase SQL editor in order:
`0001_foundation` → `0002_users` → `0003_prefs` → ... → `0011_exec_logs`

> Each file is self-contained (table + indexes + triggers + RLS). Run them in
> numeric order. `0001_foundation` enables the `pgcrypto` and `vector` extensions.

### 4. Enable Google OAuth (optional)

In Supabase Dashboard → Authentication → Providers → Google, add your OAuth credentials and set the callback URL to:

```
https://<your-domain>/auth/callback
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Development

```bash
npm run dev      # start dev server
npm run build    # production build
npm run lint     # ESLint
```

## Deployment

Deploy to Vercel:

```bash
vercel --prod
```

Set all environment variables from `.env.example` in the Vercel project settings.

## Milestones

| Milestone | Scope | Status |
|---|---|---|
| M1 | Project structure, Supabase auth, database schema, RLS | In Progress |
| M2 | AI chat with tool calling, task + expense management UI | Planned |
| M3 | Dashboard, notes, reminders, user memory | Planned |
| M4 | Admin dashboard, polish, deployment | Planned |
