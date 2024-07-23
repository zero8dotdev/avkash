CREATE OR REPLACE FUNCTION create_org_team_user(
    org_name text,
    team_name text,
    user_name text,
    user_email text,
    OUT org_id UUID,
    OUT team_id UUID,
    OUT user_id UUID
) AS $$
DECLARE
    existing_org RECORD;
    new_org_id UUID;
    new_team_id UUID;
    new_user_id UUID;
BEGIN
    -- Check if the organization already exists
    SELECT * INTO existing_org
    FROM "Organisation"
    WHERE name = org_name;

    IF FOUND THEN
        RAISE EXCEPTION 'Organisation already exists';
    ELSE
        -- Insert into Organisation
        INSERT INTO "Organisation" (name)
        VALUES (org_name)
        RETURNING "orgId" INTO new_org_id;

        -- Insert into Team
        INSERT INTO "Team" (name, "orgId")
        VALUES (team_name, new_org_id)
        RETURNING "teamId" INTO new_team_id;

        -- Insert into User
        INSERT INTO "User" (name, email, "teamId", role, "accruedLeave", "usedLeave","orgId")
        VALUES (user_name, user_email, new_team_id, 'OWNER', 0, 0, new_org_id)
        RETURNING "userId" INTO new_user_id;

        -- Update Team with manager
        UPDATE "Team"
        SET manager = new_user_id
        WHERE "teamId" = new_team_id;

        -- Set OUT parameters
        org_id := new_org_id;
        team_id := new_team_id;
        user_id := new_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
