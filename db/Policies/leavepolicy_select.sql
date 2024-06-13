DROP POLICY IF EXISTS "leavepolicy_select" ON "public"."LeavePolicy";

-- Create a new policy for accessing team records
CREATE POLICY "leavepolicy_select" ON "public"."LeavePolicy" FOR SELECT
    TO PUBLIC
    USING (
        (
            auth.role() = 'authenticated'::TEXT
            AND (
                -- Allow access if the user is a manager or user to see their org only
                (
                public.fetch_user_role(auth.uid()) IN ('MANAGER', 'USER','OWNER')
                AND "orgId" = public.fetch_user_orgid(auth.uid())
                )
            )
        )
    );
