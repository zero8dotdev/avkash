DROP POLICY IF EXISTS "leavetype_select" ON "public"."LeaveType";

-- Create a new policy for accessing team records
CREATE POLICY "leavetype_select" ON "public"."LeaveType" FOR SELECT
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
