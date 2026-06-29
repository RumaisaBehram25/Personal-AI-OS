-- =====================================================================
-- 0005_messages
-- Individual chat messages. tool_calls holds function-calling payloads;
-- embedding powers pgvector semantic memory (wired up later).
-- =====================================================================

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  role             text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content          text,
  tool_calls       jsonb,
  embedding        vector(1536),
  created_at       timestamptz not null default now()
);

create index idx_messages_conversation on public.messages(conversation_id, created_at);
create index idx_messages_user on public.messages(user_id);

-- Approximate nearest-neighbour index for semantic search (cosine distance).
-- HNSW works well on growing tables; built lazily as rows are inserted.
create index idx_messages_embedding
  on public.messages using hnsw (embedding vector_cosine_ops);

-- ---- RLS: own rows only ----
alter table public.messages enable row level security;

create policy "messages_select_own" on public.messages
  for select using (user_id = auth.uid());

create policy "messages_modify_own" on public.messages
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
