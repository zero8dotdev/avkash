CREATE OR REPLACE FUNCTION get_user_teams(id UUID)
RETURNS TABLE(
    teamId UUID,
    name VARCHAR,
    orgId UUID,
    isActive BOOLEAN,
    manager UUID,
    createdOn TIMESTAMP,
    createdBy VARCHAR,
    updatedBy VARCHAR,
    updatedOn TIMESTAMP,
    orgName VARCHAR
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        team."teamId",
        team."name",
        team."orgId",
        team."isActive",
        team."manager",
        team."createdOn",
        team."createdBy",
        team."updatedBy",
        team."updatedOn",
        org."name" AS "orgName"
    FROM 
        "Team" team
    JOIN 
        "Organisation" org ON team."orgId" = org."orgId"
    WHERE 
        org."orgId" = (SELECT "orgId" FROM "User" WHERE "userId" = id);
END;
$$ SECURITY DEFINER;

-- SELECT * FROM get_user_teams('b44487bb-824c-4777-a983-eeb88fe16de5');
