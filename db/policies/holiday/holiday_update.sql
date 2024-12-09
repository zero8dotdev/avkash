DROP POLICY IF EXISTS "holiday_update" ON "public"."Holiday";

-- Create a new policy for accessing team records
CREATE POLICY "holiday_update" ON "public"."Holiday" FOR update
    TO PUBLIC
    USING (
        (
            auth.role() = 'authenticated'::TEXT
            AND (
                -- Allow access if the user is a manager or user to see their org only
                (
                public.fetch_user_role(auth.uid()) IN ('OWNER')
                AND "teamId" = public.fetch_user_teamid(auth.uid())
                )
            )
        )
    );