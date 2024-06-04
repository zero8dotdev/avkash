CREATE TABLE IF NOT EXISTS "OrgActivityLog" (
    "id" SERIAL PRIMARY KEY,
    "orgId" UUID,
    "changedColumns" TEXT[],
    "oldValues" JSONB,
    "newValues" JSONB,
    "changedOn" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    "changedBy" VARCHAR(255),
    "tableName" TEXT,
    "teamId" UUID,
    "userId" UUID,
    "keyword" TEXT
);
