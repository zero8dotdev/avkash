DECLARE
    leave_policy RECORD;
    accural_count NUMERIC;
BEGIN
    -- Check if the frequency parameter is valid
    IF frequency NOT IN ('MONTHLY', 'QUARTERLY') THEN
        RAISE EXCEPTION 'Invalid frequency: %, only MONTHLY and QUARTERLY are supported', frequency;
    END IF;

    FOR leave_policy IN
        SELECT * FROM "LeavePolicy"
        WHERE accurals = TRUE AND accural_frequency = frequency::"AccuralFrequencyOptions"
    LOOP
        -- Calculate the accrual count based on accural_frequency
        IF leave_policy.accural_frequency = 'MONTHLY' THEN
            accural_count := leave_policy.max_leaves / 12;
        ELSIF leave_policy.accural_frequency = 'QUARTERLY' THEN
            accural_count := leave_policy.max_leaves / 4;
        ELSE
            RAISE EXCEPTION 'Unsupported accural_frequency in data: %', leave_policy.accural_frequency;
        END IF;

        -- Update accrued_leave for users belonging to the same organization
        UPDATE "User"
        SET accrued_leave = accrued_leave + accural_count
        WHERE team_id IN (
            SELECT team_id
            FROM "Team"
            WHERE org_id = leave_policy.org_id
        );
    END LOOP;
END;