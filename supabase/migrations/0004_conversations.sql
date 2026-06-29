-- =====================================================================
-- 0004_conversations
-- A chat session container per user.
-- =====================================================================

create table public.conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_conversations_user on public.conversations(user_id, updated_at desc);

create trigger trg_conversations_updated
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- ---- RLS: own rows only ----
alter table public.conversations enable row level security;

create policy "conversations_select_own" on public.conversations
  for select using (user_id = auth.uid());

create policy "conversations_modify_own" on public.conversations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
