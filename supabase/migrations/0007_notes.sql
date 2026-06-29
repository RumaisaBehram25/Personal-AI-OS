-- =====================================================================
-- 0007_notes
-- Freeform notes captured via chat or directly.
-- =====================================================================

create table public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text,
  content     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_notes_user on public.notes(user_id, updated_at desc);

create trigger trg_notes_updated
  before update on public.notes
  for each row execute function public.set_updated_at();

-- ---- RLS: own rows only ----
alter table public.notes enable row level security;

create policy "notes_select_own" on public.notes
  for select using (user_id = auth.uid());

create policy "notes_modify_own" on public.notes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
