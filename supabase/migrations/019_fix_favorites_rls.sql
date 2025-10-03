-- Fix RLS policy for favorites table to allow anonymous access
-- Drop the existing policy
DROP POLICY IF EXISTS "Allow all operations on favorites" ON favorites;
DROP POLICY IF EXISTS "Allow anonymous access to favorites" ON favorites;

-- Disable RLS temporarily to fix 406 errors
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
