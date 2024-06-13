-- Drop the existing policy for user registration if it exists
drop policy if exists "leave_insert" on "public"."Leave";
-- Create a combined policy for user registration and admin adding users
create policy "leave_insert" on "public"."Leave" for insert to public
with
  check (
    (
            (auth.role() = 'authenticated'::TEXT)
            AND (
                -- Allow access if the user's team is managed by the authenticated user
                (
                "teamId" = (public.fetch_user_teamid(auth.uid())) AND (public.fetch_user_role(auth.uid()) = 'MANAGER' )
                )
                OR
                -- Allow access if the user is in an organization owned by the authenticated user
                ("orgId" = (public.fetch_user_orgid(auth.uid())) AND (public.fetch_user_role(auth.uid()) = 'OWNER' ))
            )
        )
        OR
        -- Allow access to the user's own record
        (auth.uid() = "userId")
  );
