CREATE OR REPLACE FUNCTION get_team_by_id(id UUID)
RETURNS TABLE(
    teamId UUID,
    name VARCHAR(255),
    orgId UUID,
    isActive BOOLEAN,
    manager UUID,
    createdOn TIMESTAMP(6),
    createdBy VARCHAR(255),
    updatedBy VARCHAR(255),
    updatedOn TIMESTAMP(6)
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
        team."updatedOn"
    FROM 
        "Team" team
    WHERE 
        team."teamId" = id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SELECT * FROM get_team_by_id();
