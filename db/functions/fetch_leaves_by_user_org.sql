CREATE OR REPLACE FUNCTION get_leaves_by_user_org(id UUID)
RETURNS TABLE(
    leaveId UUID,
    leaveType VARCHAR(255),
    startDate TIMESTAMP(6),
    endDate TIMESTAMP(6),
    duration "LeaveDuration",
    shift "Shift",
    isApproved "LeaveStatus",
    userId UUID,
    userName VARCHAR(255),
    teamId UUID,
    teamName VARCHAR(255),
    reason VARCHAR(255),
    orgId UUID,
    orgName VARCHAR(255),
    createdOn TIMESTAMP(6),
    createdBy VARCHAR(255),
    updatedBy VARCHAR(255),
    updatedOn TIMESTAMP(6)
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lv."leaveId",
        lv."leaveType",
        lv."startDate",
        lv."endDate",
        lv."duration",
        lv."shift",
        lv."isApproved",
        lv."userId",
        usr."name" AS "userName",
        lv."teamId",
        team."name" AS "teamName",
        lv."reason",
        lv."orgId",
        org."name" AS "orgName",
        lv."createdOn",
        lv."createdBy",
        lv."updatedBy",
        lv."updatedOn"
    FROM 
        "Leave" lv
    JOIN 
        "User" usr ON lv."userId" = usr."userId"
    JOIN 
        "Team" team ON lv."teamId" = team."teamId"
    JOIN 
        "Organisation" org ON lv."orgId" = org."orgId"
    WHERE 
        lv."orgId" = (SELECT "orgId" FROM "User" WHERE "userId" = id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SELECT * FROM get_leaves_by_user_org('b44487bb-824c-4777-a983-eeb88fe16de5');
