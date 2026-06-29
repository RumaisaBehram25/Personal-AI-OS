-- =====================================================================
-- 0002_users
-- App-level profile that extends Supabase-managed auth.users.
-- =====================================================================

create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_users_updated
  before update on public.users
  for each row execute function public.set_updated_at();

-- ---- RLS: a user can read/update only their own row ----
alter table public.users enable row level security;

create policy "users_select_own" on public.users
  for select using (id = auth.uid());

create policy "users_update_own" on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

-- No INSERT/DELETE policy: rows are created by the signup trigger (0003)
-- and removed via auth.users cascade.
