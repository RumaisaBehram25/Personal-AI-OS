-- =====================================================================
-- 0006_tasks
-- User to-dos, editable via chat tools or the manual UI.
-- =====================================================================

create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  description   text,
  status        text not null default 'pending' check (status in ('pending', 'completed')),
  due_at        timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_tasks_user_status on public.tasks(user_id, status, due_at);

create trigger trg_tasks_updated
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---- RLS: own rows only ----
alter table public.tasks enable row level security;

create policy "tasks_select_own" on public.tasks
  for select using (user_id = auth.uid());

create policy "tasks_modify_own" on public.tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
