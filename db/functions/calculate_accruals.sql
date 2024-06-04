CREATE OR REPLACE FUNCTION calculate_accruals(frequency TEXT) RETURNS VOID AS
$$
DECLARE
    leavePolicy RECORD;
    accrualCount NUMERIC;
BEGIN
    -- Check if the frequency parameter is valid
    IF frequency NOT IN ('MONTHLY', 'QUARTERLY') THEN
        RAISE EXCEPTION 'Invalid frequency: %, only MONTHLY and QUARTERLY are supported', frequency;
    END IF;

    FOR leavePolicy IN
        SELECT * FROM "LeavePolicy"
        WHERE accruals = TRUE AND accrualFrequency = frequency::"AccrualFrequencyOptions"
    LOOP
        -- Calculate the accrual count based on accrualFrequency
        IF leavePolicy.accrualFrequency = 'MONTHLY' THEN
            accrualCount := leavePolicy.maxLeaves / 12;
        ELSIF leavePolicy.accrualFrequency = 'QUARTERLY' THEN
            accrualCount := leavePolicy.maxLeaves / 4;
        ELSE
            RAISE EXCEPTION 'Unsupported accrualFrequency in data: %', leavePolicy.accrualFrequency;
        END IF;

        -- Update accruedLeave for users belonging to the same organization
        UPDATE "User"
        SET accruedLeave = accruedLeave + accrualCount
        WHERE teamId IN (
            SELECT teamId
            FROM "Team"
            WHERE orgId = leavePolicy.orgId
        );
    END LOOP;
END;
$$
LANGUAGE plpgsql;
