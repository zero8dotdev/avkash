-- Drop the existing policy for user registration if it exists
drop policy if exists "org_insert" on "public"."Organisation";
-- Create a combined policy for user registration and admin adding users
create policy "org_insert" on "public"."Organisation" for insert to public
with
  check (
    true
  );
