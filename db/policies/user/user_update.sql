DROP POLICY IF EXISTS "user_update" ON "public"."User";

-- Create a new policy for accessing user records
CREATE POLICY "user_update" ON "public"."User" FOR UPDATE
    TO PUBLIC
    USING (
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