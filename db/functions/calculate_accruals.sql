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

create extension if not exists pg_cron with schema extensions;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

select cron.schedule(
  'monthly_start', 
  '0 0 1 * *', 
  $$ call calculate_accruals('MONTHLY'); $$ 
);

select cron.schedule(
  'monthly_end', 
  '0 0 28-31 * *', 
  $$
  begin
    if (date_trunc('day', now()) = date_trunc('month', now()) + interval '1 month' - interval '1 day') then
      perform calculate_accruals('MONTHLY');
    end if;
  end;
  $$
);

select cron.schedule(
  'quarterly_start', 
  '0 0 1 1,4,7,10 *', 
  $$ call calculate_accruals('QUARTERLY'); $$ 
);

select cron.schedule(
  'quarterly_end', 
  '0 0 28-31 3,6,9,12 *', 
  $$
  begin
    if (date_trunc('day', now()) = date_trunc('month', now()) + interval '1 month' - interval '1 day') and 
       extract(month from now()) in (3, 6, 9, 12) then
      perform calculate_accruals('QUARTERLY');
    end if;
  end;
  $$
);

