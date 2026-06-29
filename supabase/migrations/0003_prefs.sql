-- =====================================================================
-- 0003_prefs
-- Per-user settings (1:1). Also wires the signup trigger that seeds
-- a users + prefs row for every new auth.users record.
-- =====================================================================

create table public.prefs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references auth.users(id) on delete cascade,
  timezone     text not null default 'UTC',
  currency     text not null default 'USD',
  preferences  jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

create trigger trg_prefs_updated
  before update on public.prefs
  for each row execute function public.set_updated_at();

-- ---- RLS: own rows only ----
alter table public.prefs enable row level security;

create policy "prefs_select_own" on public.prefs
  for select using (user_id = auth.uid());

create policy "prefs_modify_own" on public.prefs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Signup trigger: create users + prefs rows when a new auth user exists.
-- security definer so it can insert despite RLS.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.prefs (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
