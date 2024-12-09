DO $$
DECLARE
    r RECORD;
BEGIN
    -- Enable RLS on all tables except specified ones
    FOR r IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename NOT IN ('"ActivityLog"', '"OrgAccessData"', '"PublicHolidays"')
    ) LOOP
        EXECUTE 'ALTER TABLE "' || r.tablename || '" ENABLE ROW LEVEL SECURITY';
    END LOOP;

    -- Explicitly disable RLS for case-sensitive table names
    EXECUTE 'ALTER TABLE "ActivityLog" DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE "OrgAccessData" DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE "PublicHolidays" DISABLE ROW LEVEL SECURITY';
END $$;
