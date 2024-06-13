DROP POLICY IF EXISTS "team_select" ON "public"."Team";

-- Create a new policy for accessing team records
CREATE POLICY "team_select" ON "public"."Team" FOR SELECT
    TO PUBLIC
    USING (
        (
            auth.role() = 'authenticated'::TEXT
            AND (
                -- Allow access if the user is an owner to see all teams in their organization
                (
                public.fetch_user_role(auth.uid()) = 'OWNER'
                AND "orgId" = public.fetch_user_orgid(auth.uid())
                )
                OR
                -- Allow access if the user is a manager or user to see their team only
                (
                public.fetch_user_role(auth.uid()) IN ('MANAGER', 'USER')
                AND "teamId" = public.fetch_user_teamid(auth.uid())
                )
            )
        )
    );
