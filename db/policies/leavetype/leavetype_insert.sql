-- Drop the existing policy for user registration if it exists
drop policy if exists "leavetype_insert" on "public"."LeaveType";
-- Create a combined policy for user registration and admin adding users
create policy "leavetype_insert" on "public"."LeaveType" for insert to public
with
  check (
    true
  );
