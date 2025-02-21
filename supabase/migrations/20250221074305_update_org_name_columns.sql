-- Split "name" column into "firstName" and "lastName"
ALTER TABLE "User"
ADD COLUMN "firstName" VARCHAR(255),
ADD COLUMN "lastName" VARCHAR(255);

-- Migrate existing data
UPDATE "User"
SET 
  "firstName" = split_part("name", ' ', 1),
  "lastName" = CASE 
    WHEN "name" LIKE '% %' THEN split_part("name", ' ', 2)
    ELSE ''
  END;

-- Remove the old "name" column
ALTER TABLE "User" DROP COLUMN "name";
