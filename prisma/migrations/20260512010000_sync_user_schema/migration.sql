-- Add supabaseId column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'supabaseId'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "supabaseId" TEXT;
  END IF;
END $$;

-- Make supabaseId NOT NULL (will fail if existing rows have NULL values)
ALTER TABLE "User" ALTER COLUMN "supabaseId" SET NOT NULL;

-- Drop passwordHash column if it still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'passwordHash'
  ) THEN
    ALTER TABLE "User" DROP COLUMN "passwordHash";
  END IF;
END $$;

-- Make email NOT NULL if it isn't already
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;

-- Create unique indexes if they don't exist
CREATE UNIQUE INDEX IF NOT EXISTS "User_supabaseId_key" ON "User"("supabaseId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
