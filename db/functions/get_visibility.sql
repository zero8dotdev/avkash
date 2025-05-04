CREATE OR REPLACE FUNCTION get_visibility()
RETURNS TEXT AS $$
DECLARE
    org_id UUID;
    result TEXT;
BEGIN
    -- Get the user's organisation ID
    SELECT "orgId" INTO org_id
    FROM "User"
    WHERE "userId" = auth.uid()
    LIMIT 1;

    IF org_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Fetch the visibility using "orgId" from Organisation
    SELECT o.visibility INTO result
    FROM "Organisation" o
    WHERE o."orgId" = org_id
    LIMIT 1;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
