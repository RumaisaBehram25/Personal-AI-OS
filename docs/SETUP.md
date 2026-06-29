# Setup Guide

## Prerequisites

Make sure the following are installed before starting:

| Tool | Version | Notes |
|---|---|---|
| Node.js | 18.17+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Comes with Node |
| Git | any | |
| Supabase CLI | latest | `npm install -g supabase` |

You will also need accounts on:
- [Supabase](https://supabase.com) — database and auth
- [OpenAI](https://platform.openai.com) — AI API key
- [Vercel](https://vercel.com) — deployment (optional for local dev)

---

## 1. Clone and Install

```bash
git clone <repo-url>
cd hypoos_mvp
npm install
```

---

## 2. Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → service_role secret |
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local dev |

> **Never commit `.env.local`** — it is already in `.gitignore`.

---

## 3. Supabase Project Setup

### Option A — Remote (Supabase Cloud)

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Wait for the project to finish provisioning (~2 minutes).
3. Copy the Project URL and API keys into `.env.local`.

### Option B — Local (Supabase CLI)

```bash
supabase start
```

This starts a local Supabase stack (PostgreSQL, Auth, Storage, Studio).
Local credentials are printed in the terminal — copy them into `.env.local`.

To stop:
```bash
supabase stop
```

---

## 4. Run Database Migrations

Apply all migrations in order:

```bash
supabase db push
```

Or if running locally:

```bash
supabase db reset
```

This runs every file in `supabase/migrations/` in order:

```
0001_foundation.sql
0002_users.sql
0003_prefs.sql
0004_conversations.sql
0005_messages.sql
0006_tasks.sql
0007_notes.sql
0008_reminders.sql
0009_expenses.sql
0010_calendar_conn.sql
0011_exec_logs.sql
0012_grants.sql
```

---

## 5. Generate TypeScript Types

After running migrations, regenerate the Supabase types:

```bash
supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
```

For local dev:

```bash
supabase gen types typescript --local > src/types/database.ts
```

Re-run this command any time the database schema changes.

---

## 6. Configure Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials.
2. Create an OAuth 2.0 Client ID (Web application).
3. Add authorized redirect URI:
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://<your-domain>/auth/callback`
4. Copy the Client ID and Client Secret.
5. In Supabase Dashboard → Authentication → Providers → Google:
   - Enable Google provider
   - Paste Client ID and Client Secret
   - Save

---

## 7. Install shadcn/ui Components

shadcn/ui components are installed individually on demand. The `src/components/ui/` directory is managed by the shadcn CLI — do not edit files there manually.

To add a component:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
# etc.
```

To see all available components:

```bash
npx shadcn@latest add
```

---

## 8. Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 9. Useful Commands

| Command | Description |
|---|---|
| `npm run dev` | Start local development server |
| `npm run build` | Production build |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run format` | Format all files with Prettier |
| `supabase db push` | Push migrations to remote Supabase |
| `supabase db reset` | Reset local DB and re-run all migrations |
| `supabase gen types typescript --local > src/types/database.ts` | Regenerate DB types |
| `supabase studio` | Open local Supabase Studio at localhost:54323 |

---

## 10. Deployment (Vercel)

1. Push the repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub.
3. Add all environment variables from `.env.example` in the Vercel project settings.
4. Set the production `NEXT_PUBLIC_APP_URL` to your Vercel domain.
5. Deploy.

For subsequent deployments:

```bash
vercel --prod
```

---

## Troubleshooting

**Styles not loading**
Make sure `postcss.config.js` exists at the root and `globals.css` has the Tailwind directives.

**Supabase auth not working**
Check that the redirect URL in Supabase Dashboard matches exactly — including trailing slashes.

**`supabase` command not found**
Install the CLI globally: `npm install -g supabase`

**TypeScript errors on `database.ts`**
The file is auto-generated — run `supabase gen types typescript` to populate it.
