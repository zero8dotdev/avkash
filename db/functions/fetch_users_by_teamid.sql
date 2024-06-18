CREATE OR REPLACE FUNCTION get_users_by_team_id(id UUID)
RETURNS TABLE(
    userId UUID,
    name VARCHAR,
    email VARCHAR,
    teamId UUID,
    role "Role",
    createdOn TIMESTAMP,
    createdBy VARCHAR,
    updatedBy VARCHAR,
    updatedOn TIMESTAMP,
    accruedLeave INT,
    usedLeave INT,
    keyword VARCHAR,
    orgId UUID
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        usr."userId",
        usr."name",
        usr."email",
        usr."teamId",
        usr."role",
        usr."createdOn",
        usr."createdBy",
        usr."updatedBy",
        usr."updatedOn",
        usr."accruedLeave",
        usr."usedLeave",
        usr."keyword",
        usr."orgId"
    FROM 
        "User" usr
    WHERE 
        usr."teamId" = id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SELECT * FROM get_users_by_team_id('2909f8de-fb83-41c4-86af-2e04948f5c47');
