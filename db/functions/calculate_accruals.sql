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

-- Create the pg_cron extension if it doesn't exist
drop extension if exists pg_cron;

-- Example: enable the "pg_cron" extension
create extension pg_cron with schema extensions;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- Schedule the monthly accruals
SELECT cron.schedule(
  'monthly_start',
  '0 0 1 * *',
  $$ CALL calculate_accruals('MONTHLY'); $$
);

SELECT cron.schedule(
  'monthly_end',
  '0 0 28-31 * *',
  $$
  BEGIN
    IF (date_trunc('day', now()) = date_trunc('month', now()) + INTERVAL '1 month' - INTERVAL '1 day') THEN
      PERFORM calculate_accruals('MONTHLY');
    END IF;
  END;
  $$
);

-- Schedule the quarterly accruals
SELECT cron.schedule(
  'quarterly_start',
  '0 0 1 1,4,7,10 *',
  $$ CALL calculate_accruals('QUARTERLY'); $$
);

SELECT cron.schedule(
  'quarterly_end',
  '0 0 28-31 3,6,9,12 *',
  $$
  BEGIN
    IF (date_trunc('day', now()) = date_trunc('month', now()) + INTERVAL '1 month' - INTERVAL '1 day') AND
       EXTRACT(month FROM now()) IN (3, 6, 9, 12) THEN
      PERFORM calculate_accruals('QUARTERLY');
    END IF;
  END;
  $$
);