CREATE OR REPLACE FUNCTION get_user_data_by_id(id UUID)
RETURNS TABLE (
    userId UUID,
    name VARCHAR(255),
    email VARCHAR(255),
    teamId UUID,
    role "Role",
    createdOn TIMESTAMP(6),
    createdBy VARCHAR(255),
    updatedBy VARCHAR(255),
    updatedOn TIMESTAMP(6),
    accruedLeave INT,
    usedLeave INT,
    keyword VARCHAR,
    orgId UUID
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u."userId",
        u."name",
        u."email",
        u."teamId",
        u."role",
        u."createdOn",
        u."createdBy",
        u."updatedBy",
        u."updatedOn",
        u."accruedLeave",
        u."usedLeave",
        u."keyword",
        u."orgId"
    FROM 
        "User" u
    WHERE 
        u."userId" = id;
END;
$$ SECURITY DEFINER;

-- Example usage
-- SELECT * FROM get_user_data_by_id('b44487bb-824c-4777-a983-eeb88fe16de5');
