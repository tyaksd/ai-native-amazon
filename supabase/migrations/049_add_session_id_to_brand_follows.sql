-- Add session_id column to brand_follows table to support non-logged-in users
-- This allows non-logged-in users to use session_id instead of clerk_id
ALTER TABLE brand_follows 
  ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Make clerk_id nullable to support both logged-in and non-logged-in users
ALTER TABLE brand_follows 
  ALTER COLUMN clerk_id DROP NOT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_brand_follows_session_id ON brand_follows(session_id);

-- Drop existing unique constraint
ALTER TABLE brand_follows 
  DROP CONSTRAINT IF EXISTS brand_follows_clerk_id_brand_id_key;

-- Add check constraint to ensure either clerk_id or session_id is provided
ALTER TABLE brand_follows 
  ADD CONSTRAINT brand_follows_user_check CHECK (
    (clerk_id IS NOT NULL AND session_id IS NULL) OR
    (clerk_id IS NULL AND session_id IS NOT NULL)
  );

-- Add unique constraint for clerk_id and brand_id (when clerk_id is not NULL)
CREATE UNIQUE INDEX IF NOT EXISTS brand_follows_clerk_id_brand_id_key 
  ON brand_follows (clerk_id, brand_id) 
  WHERE clerk_id IS NOT NULL;

-- Add unique constraint for session_id and brand_id (when session_id is not NULL)
CREATE UNIQUE INDEX IF NOT EXISTS brand_follows_session_id_brand_id_key 
  ON brand_follows (session_id, brand_id) 
  WHERE session_id IS NOT NULL;

-- Note: Now brand_follows supports both clerk_id (logged-in users) and session_id (non-logged-in users)
-- When a user logs in, we can migrate their follows from session_id to clerk_id

