-- =====================================================================
-- 0011_exec_logs
-- Audit log of every AI tool/function call (debug, reliability, admin
-- metrics). Rows are WRITTEN server-side (service role) after each tool
-- runs. Users may READ their own log via RLS; admin metrics are read
-- server-side with the service role.
-- =====================================================================

create table public.exec_logs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  conversation_id  uuid references public.conversations(id) on delete set null,
  message_id       uuid references public.messages(id) on delete set null,
  tool_name        text not null,
  arguments        jsonb,
  result           jsonb,
  status           text not null default 'success' check (status in ('success', 'error')),
  error_message    text,
  duration_ms      integer,
  created_at       timestamptz not null default now()
);

create index idx_exec_logs_user_date on public.exec_logs(user_id, created_at desc);
create index idx_exec_logs_tool on public.exec_logs(tool_name);

-- ---- RLS ----
-- Read-only for the owning user. No INSERT/UPDATE/DELETE policy: writes
-- happen via the service role (which bypasses RLS) from server code.
alter table public.exec_logs enable row level security;

create policy "exec_logs_select_own" on public.exec_logs
  for select using (user_id = auth.uid());
