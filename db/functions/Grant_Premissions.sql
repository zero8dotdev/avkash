-- Grant usage on the public schema to supabase_auth_admin
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

-- Grant insert, update, delete, and select on all tables in the public schema to supabase_auth_admin
GRANT INSERT,
UPDATE,
DELETE,
SELECT
  ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;

-- Grant execute on all functions in the public schema to supabase_auth_admin
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO supabase_auth_admin;

-- GRANT USAGE, SELECT ON SEQUENCE public."OrgActivityLog_id_seq" TO supabase_auth_admin;
grant usage on schema "public" to anon;
grant usage on schema "public" to authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA "public" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA "public" TO anon;