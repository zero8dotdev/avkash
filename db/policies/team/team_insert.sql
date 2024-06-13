-- Drop the existing policy for user registration if it exists
drop policy if exists "team_insert" on "public"."Team";
-- Create a combined policy for user registration and admin adding users
create policy "team_insert" on "public"."Team" for insert to public
with
  check (
    true
  );
