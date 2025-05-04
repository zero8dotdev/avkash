DROP POLICY IF EXISTS "leave_select" ON "public"."Leave";

-- Create a new policy for accessing team records
CREATE POLICY "leave_select" ON "public"."Leave" FOR SELECT
    TO PUBLIC
    USING (
         (
            (auth.role() = 'authenticated'::TEXT)
            AND (
                -- Allow access if the user's team is managed by the authenticated user
                (
                    "teamId" = (public.fetch_user_teamid(auth.uid())) 
                    AND (public.fetch_user_role(auth.uid()) = 'MANAGER')
                )
                OR
                -- Allow access if the user is in an organization owned by the authenticated user
                ("orgId" = (public.fetch_user_orgid(auth.uid())) 
                AND (public.fetch_user_role(auth.uid()) = 'OWNER'))
            )
        )
        OR
        -- Allow access if the visibility is TEAM AND the user is in the same team
        (public.get_visibility() = 'TEAM' AND "teamId" = public.fetch_user_teamid(auth.uid()))
        OR
        -- Allow access to the user's own record
        (auth.uid() = "userId")
    );
