CREATE OR REPLACE FUNCTION get_user_org_visibility(id UUID)
RETURNS VARCHAR AS $$
DECLARE
    org_visibility VARCHAR;
BEGIN
    SELECT o."visibility" INTO org_visibility
    FROM "User" u
    JOIN "Organisation" o ON u."orgId" = o."orgId"
    WHERE u."userId" = id;

    RETURN org_visibility;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SELECT get_user_org_visibility('b44487bb-824c-4777-a983-eeb88fe16de5');
