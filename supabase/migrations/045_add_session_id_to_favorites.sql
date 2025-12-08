-- Add session_id column to favorites table to match cart_items structure
-- This allows non-logged-in users to use session_id instead of user_id
ALTER TABLE favorites 
  ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_favorites_session_id ON favorites(session_id);

-- Update unique constraint to include session_id
-- Drop old constraint if it exists
ALTER TABLE favorites 
  DROP CONSTRAINT IF EXISTS favorites_session_id_product_id_key;

-- Add unique constraint for session_id and product_id
ALTER TABLE favorites 
  ADD CONSTRAINT favorites_session_id_product_id_key UNIQUE (session_id, product_id);

-- Note: We now support both user_id (legacy) and session_id (new) for non-logged-in users
-- When a user logs in, we can migrate their favorites from session_id/user_id to clerk_id

