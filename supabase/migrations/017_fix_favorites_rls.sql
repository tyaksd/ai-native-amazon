-- Fix RLS policy for favorites table to allow anonymous access
-- Drop the existing policy
DROP POLICY IF EXISTS "Allow all operations on favorites" ON favorites;

-- Create new policies that allow anonymous access
CREATE POLICY "Allow anonymous access to favorites" ON favorites
  FOR ALL USING (true) WITH CHECK (true);

-- Alternative: If the above doesn't work, try disabling RLS temporarily
-- ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
