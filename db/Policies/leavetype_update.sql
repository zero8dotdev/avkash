DROP POLICY IF EXISTS "leavetype_update" ON "public"."LeaveType";

-- Create a new policy for accessing team records
CREATE POLICY "leavetype_update" ON "public"."LeaveType" FOR update
    TO PUBLIC
    USING (
        (
            auth.role() = 'authenticated'::TEXT
            AND (
                -- Allow access if the user is a manager or user to see their org only
                (
                public.fetch_user_role(auth.uid()) IN ('OWNER')
                AND "orgId" = public.fetch_user_orgid(auth.uid())
                )
            )
        )
    );
