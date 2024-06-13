-- Drop the existing policy for user registration if it exists
drop policy if exists "leavepolicy_insert" on "public"."LeavePolicy";
-- Create a combined policy for user registration and admin adding users
create policy "leavepolicy_insert" on "public"."LeavePolicy" for insert to public
with
  check (
    true
  );
