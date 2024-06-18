CREATE OR REPLACE FUNCTION get_users_by_organization(id UUID)
RETURNS TABLE(
    userId UUID,
    name VARCHAR(255),
    email VARCHAR(255),
    role "Role",
    createdOn TIMESTAMP(6),
    createdBy VARCHAR(255),
    updatedBy VARCHAR(255),
    updatedOn TIMESTAMP(6),
    accruedLeave INT,
    usedLeave INT,
    keyword VARCHAR,
    teamId UUID,
    teamName VARCHAR(255)
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        usr."userId",
        usr."name",
        usr."email",
        usr."role",
        usr."createdOn",
        usr."createdBy",
        usr."updatedBy",
        usr."updatedOn",
        usr."accruedLeave",
        usr."usedLeave",
        usr."keyword",
        usr."teamId",
        team."name" AS "teamName"
    FROM 
        "User" usr
    JOIN 
        "Organisation" org ON usr."orgId" = org."orgId"
    LEFT JOIN 
        "Team" team ON usr."teamId" = team."teamId"
    WHERE 
        usr."orgId" = (SELECT "orgId" FROM "User" WHERE "userId" = id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- SELECT * FROM get_users_by_organization('b44487bb-824c-4777-a983-eeb88fe16de5');