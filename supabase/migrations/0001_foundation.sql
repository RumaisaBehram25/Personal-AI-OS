-- =====================================================================
-- 0001_foundation
-- Extensions + shared helper function used across all tables.
-- =====================================================================

-- gen_random_uuid()
create extension if not exists "pgcrypto";

-- pgvector for semantic memory (messages.embedding)
create extension if not exists "vector";

-- ---------------------------------------------------------------------
-- Keep updated_at fresh on every UPDATE.
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
