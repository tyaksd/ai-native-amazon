-- Add clerk_id column to favorites table for logged-in users
ALTER TABLE favorites 
  ADD COLUMN IF NOT EXISTS clerk_id TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_favorites_clerk_id ON favorites(clerk_id);

-- Update unique constraint to include clerk_id
-- First, drop the old unique constraint if it exists
ALTER TABLE favorites 
  DROP CONSTRAINT IF EXISTS favorites_user_id_product_id_key;

-- Add new unique constraint that works with both user_id and clerk_id
ALTER TABLE favorites 
  ADD CONSTRAINT favorites_user_id_product_id_key UNIQUE (user_id, product_id);

-- Add unique constraint for clerk_id and product_id
ALTER TABLE favorites 
  ADD CONSTRAINT favorites_clerk_id_product_id_key UNIQUE (clerk_id, product_id);

-- Note: We keep both user_id and clerk_id for backward compatibility
-- When a user logs in, we can migrate their favorites from user_id to clerk_id

