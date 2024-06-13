-- Drop the existing policy for user registration if it exists
drop policy if exists "user_insert" on "public"."User";
-- Create a combined policy for user registration and admin adding users
create policy "user_insert" on "public"."User" for insert to public
with
  check (
    true
  );
