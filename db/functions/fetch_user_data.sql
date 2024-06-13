CREATE OR REPLACE FUNCTION fetch_user_role (id UUID) RETURNS VARCHAR(21) AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Select the role, teamId, and orgId of the user where userId matches the given id
    SELECT "role" INTO user_role
    FROM "User"
    WHERE "userId" = id
    LIMIT 1;

    -- Return the result as a JSON object
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION fetch_user_teamid (id UUID) RETURNS UUID AS $$
DECLARE
    team_id UUID;
BEGIN
    -- Select the role, teamId, and orgId of the user where userId matches the given id
    SELECT "teamId" INTO team_id
    FROM "User"
    WHERE "userId" = id
    LIMIT 1;

    -- Return the result as a JSON object
    RETURN team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION fetch_user_orgid (id UUID) RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Select the role, teamId, and orgId of the user where userId matches the given id
    SELECT "orgId" INTO org_id
    FROM "User"
    WHERE "userId" = id
    LIMIT 1;

    -- Return the result as a JSON object
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

