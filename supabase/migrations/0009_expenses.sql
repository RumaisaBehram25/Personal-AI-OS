-- =====================================================================
-- 0009_expenses
-- Expense entries logged via chat tools or manual UI. Money is numeric.
-- =====================================================================

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

-- ---- RLS: own rows only ----
alter table public.expenses enable row level security;

create policy "expenses_select_own" on public.expenses
  for select using (user_id = auth.uid());

create policy "expenses_modify_own" on public.expenses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
