CREATE OR REPLACE FUNCTION get_users_with_teams()
RETURNS TABLE(
    userId UUID,
    name VARCHAR,
    email VARCHAR,
    role "Role",
    createdOn TIMESTAMP,
    createdBy VARCHAR,
    updatedBy VARCHAR,
    updatedOn TIMESTAMP,
    accruedLeave INT,
    usedLeave INT,
    keyword VARCHAR,
    teamId UUID,
    teamName VARCHAR
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
    LEFT JOIN 
        "Team" team ON usr."teamId" = team."teamId";
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SELECT * FROM get_users_with_teams();
