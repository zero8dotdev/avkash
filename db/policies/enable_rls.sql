-- Enable RLS on all relevant tables
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Enable RLS on all tables except ActivityLog
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'ActivityLog') LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY';
    END LOOP;

END $$;