CREATE OR REPLACE FUNCTION get_leaves_by_user_id(id UUID)
RETURNS TABLE(
    leaveId UUID,
    leaveType VARCHAR,
    startDate TIMESTAMP,
    endDate TIMESTAMP,
    duration "LeaveDuration",
    shift "Shift",
    isApproved "LeaveStatus",
    userId UUID,
    teamId UUID,
    reason VARCHAR,
    orgId UUID,
    createdOn TIMESTAMP,
    createdBy VARCHAR,
    updatedBy VARCHAR,
    updatedOn TIMESTAMP
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l."leaveId",
        l."leaveType",
        l."startDate",
        l."endDate",
        l."duration",
        l."shift",
        l."isApproved",
        l."userId",
        l."teamId",
        l."reason",
        l."orgId",
        l."createdOn",
        l."createdBy",
        l."updatedBy",
        l."updatedOn"
    FROM 
        "Leave" l
    WHERE 
        l."userId" = id;
END;
$$ SECURITY DEFINER;
-- SELECT * FROM get_leaves_by_user_id('user-uuid-here');
