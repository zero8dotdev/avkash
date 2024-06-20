CREATE OR REPLACE FUNCTION get_teams_by_org(id UUID)
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
        team."orgId" = id;
END;
$$ SECURITY DEFINER;

-- SELECT * FROM get_teams_by_org('5238f0a2-9e75-405c-bbbb-805f33032d49');

