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
