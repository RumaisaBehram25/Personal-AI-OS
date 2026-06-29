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
