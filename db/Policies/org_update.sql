DROP POLICY IF EXISTS "org_update" ON "public"."Organisation";

-- Create a new policy for accessing team records
CREATE POLICY "org_update" ON "public"."Organisation" FOR UPDATE
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
