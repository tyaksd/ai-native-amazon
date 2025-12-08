-- Fix RLS policies for cart_items table
-- This migration should be run if the previous migration didn't work correctly

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on cart_items" ON cart_items;
DROP POLICY IF EXISTS "Allow public select cart_items" ON cart_items;
DROP POLICY IF EXISTS "Allow public insert cart_items" ON cart_items;
DROP POLICY IF EXISTS "Allow public update cart_items" ON cart_items;
DROP POLICY IF EXISTS "Allow public delete cart_items" ON cart_items;

-- Create separate policies for each operation to ensure they work correctly
-- Allow SELECT (read)
CREATE POLICY "Allow public select cart_items" ON cart_items
  FOR SELECT USING (true);

-- Allow INSERT (create)
CREATE POLICY "Allow public insert cart_items" ON cart_items
  FOR INSERT WITH CHECK (true);

-- Allow UPDATE (modify)
CREATE POLICY "Allow public update cart_items" ON cart_items
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow DELETE (remove)
CREATE POLICY "Allow public delete cart_items" ON cart_items
  FOR DELETE USING (true);

