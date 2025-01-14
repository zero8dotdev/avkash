CREATE OR REPLACE FUNCTION fetch_user_role (id UUID)
RETURNS VARCHAR(21) AS $$
DECLARE
    org_owner_id UUID;
    team_managers UUID[];
BEGIN
    -- Check if the user is an Organisation Owner
    SELECT "ownerId"
    INTO org_owner_id
    FROM "Organisation"
    WHERE "ownerId" = id
    LIMIT 1;

    IF org_owner_id IS NOT NULL THEN
        RETURN 'OWNER';
    END IF;

    -- Check if the user is a Team Manager
    SELECT "managers"
    INTO team_managers
    FROM "Team"
    WHERE id = ANY ("managers")
    LIMIT 1;

    IF team_managers IS NOT NULL AND id = ANY (team_managers) THEN
        RETURN 'MANAGER';
    END IF;

    -- Default to USER
    RETURN 'USER';
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

