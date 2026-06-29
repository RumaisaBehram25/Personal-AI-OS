-- =====================================================================
-- 0012_grants
-- Grant table privileges to Supabase API roles. RLS still gates which
-- ROWS each role can touch; these grants just give table-level access.
-- service_role bypasses RLS entirely.
-- =====================================================================
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
