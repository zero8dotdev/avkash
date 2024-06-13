drop policy if exists "holiday_insert" on "public"."Holiday";

-- Create a combined policy for user registration and admin adding users
create policy "holiday_insert" on "public"."Holiday" for insert to public
with
  check (true);
