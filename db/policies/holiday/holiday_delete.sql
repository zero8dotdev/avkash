drop policy if exists "holiday_delete" on "public"."Holiday";
-- Create a combined policy for user registration and admin adding users
create policy "holiday_delete" on "public"."Holiday" for delete to public
with
  check (true);
