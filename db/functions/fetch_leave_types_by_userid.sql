CREATE OR REPLACE FUNCTION get_leave_types_by_user_id(id UUID)
RETURNS TABLE(
    leaveTypeId UUID,
    name VARCHAR,
    color VARCHAR,
    isActive BOOLEAN,
    orgId UUID,
    setSlackStatus BOOLEAN,
    emoji VARCHAR,
    statusMsg VARCHAR,
    createdOn TIMESTAMP,
    createdBy VARCHAR,
    updatedBy VARCHAR,
    updatedOn TIMESTAMP
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        lt."leaveTypeId",
        lt."name",
        lt."color",
        lt."isActive",
        lt."orgId",
        lt."setSlackStatus",
        lt."emoji",
        lt."statusMsg",
        lt."createdOn",
        lt."createdBy",
        lt."updatedBy",
        lt."updatedOn"
    FROM
        "User" u
    JOIN
        "LeaveType" lt
    ON
        u."orgId" = lt."orgId"
    WHERE
        u."userId" = id;
END;
$$ SECURITY DEFINER;
-- SELECT * FROM get_leave_types_by_user_id('b44487bb-824c-4777-a983-eeb88fe16de5');
