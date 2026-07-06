-- HypoOS MVP - full schema (all migrations combined, in order). Run once on a fresh project.

create extension if not exists "pgcrypto";

create extension if not exists "vector";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

alter table public.users enable row level security;

create policy "users_select_own" on public.users
  for select using (id = auth.uid());

create policy "users_update_own" on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

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

alter table public.prefs enable row level security;

create policy "prefs_select_own" on public.prefs
  for select using (user_id = auth.uid());

create policy "prefs_modify_own" on public.prefs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

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

create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text,
  summary         text,
  summary_through timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_conversations_user on public.conversations(user_id, updated_at desc);

create trigger trg_conversations_updated
  before update on public.conversations
  for each row execute function public.set_updated_at();

alter table public.conversations enable row level security;

create policy "conversations_select_own" on public.conversations
  for select using (user_id = auth.uid());

create policy "conversations_modify_own" on public.conversations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

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

create index idx_messages_embedding
  on public.messages using hnsw (embedding vector_cosine_ops);

alter table public.messages enable row level security;

create policy "messages_select_own" on public.messages
  for select using (user_id = auth.uid());

create policy "messages_modify_own" on public.messages
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

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

alter table public.tasks enable row level security;

create policy "tasks_select_own" on public.tasks
  for select using (user_id = auth.uid());

create policy "tasks_modify_own" on public.tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

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

alter table public.notes enable row level security;

create policy "notes_select_own" on public.notes
  for select using (user_id = auth.uid());

create policy "notes_modify_own" on public.notes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.reminders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  task_id     uuid references public.tasks(id) on delete set null,
  message     text not null,
  remind_at   timestamptz not null,
  is_sent     boolean not null default false,
  channel     text not null default 'in_app' check (channel in ('in_app', 'email')),
  created_at  timestamptz not null default now()
);

create index idx_reminders_due on public.reminders(remind_at) where is_sent = false;
create index idx_reminders_user on public.reminders(user_id);

alter table public.reminders enable row level security;

create policy "reminders_select_own" on public.reminders
  for select using (user_id = auth.uid());

create policy "reminders_modify_own" on public.reminders
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  amount       numeric(12,2) not null check (amount >= 0),
  currency     text not null default 'USD',
  category     text not null default 'other',
  description  text,
  source       text not null default 'manual' check (source in ('manual', 'chat')),
  spent_at     timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index idx_expenses_user_date on public.expenses(user_id, spent_at desc);
create index idx_expenses_user_category on public.expenses(user_id, category);

alter table public.expenses enable row level security;

create policy "expenses_select_own" on public.expenses
  for select using (user_id = auth.uid());

create policy "expenses_modify_own" on public.expenses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.calendar_conn (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  provider          text not null default 'google' check (provider in ('google')),
  account_email     text,
  access_token      text,
  refresh_token     text,
  token_expires_at  timestamptz,
  scope             text,
  calendar_id       text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, provider, account_email)
);

create index idx_calendar_conn_user on public.calendar_conn(user_id);

create trigger trg_calendar_conn_updated
  before update on public.calendar_conn
  for each row execute function public.set_updated_at();

alter table public.calendar_conn enable row level security;

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

alter table public.exec_logs enable row level security;

create policy "exec_logs_select_own" on public.exec_logs
  for select using (user_id = auth.uid());

grant usage on schema public to anon, authenticated, service_role;

grant all privileges on all tables    in schema public to anon, authenticated, service_role;
grant all privileges on all sequences in schema public to anon, authenticated, service_role;
grant all privileges on all routines  in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on routines to anon, authenticated, service_role;
