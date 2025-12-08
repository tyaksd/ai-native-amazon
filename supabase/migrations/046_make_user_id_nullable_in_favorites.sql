-- Make user_id nullable in favorites table
-- This allows logged-in users to use only clerk_id without requiring user_id
-- Non-logged-in users can still use user_id

ALTER TABLE favorites 
  ALTER COLUMN user_id DROP NOT NULL;

-- Update the unique constraints to handle NULL values properly using partial unique indexes
-- Drop the existing constraints
ALTER TABLE favorites 
  DROP CONSTRAINT IF EXISTS favorites_user_id_product_id_key;

ALTER TABLE favorites 
  DROP CONSTRAINT IF EXISTS favorites_clerk_id_product_id_key;

-- Recreate as partial unique indexes to handle NULLs properly
-- This allows multiple NULL user_id values with the same product_id
-- but ensures uniqueness when user_id is not NULL
CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_id_product_id_key 
  ON favorites (user_id, product_id) 
  WHERE user_id IS NOT NULL;

-- Ensure uniqueness for clerk_id and product_id when clerk_id is not NULL
CREATE UNIQUE INDEX IF NOT EXISTS favorites_clerk_id_product_id_key 
  ON favorites (clerk_id, product_id) 
  WHERE clerk_id IS NOT NULL;

-- Note: Now user_id can be NULL when clerk_id is used, and vice versa
-- Each user type (logged-in vs non-logged-in) has its own uniqueness constraint

