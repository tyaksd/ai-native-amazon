-- Fix duplicate policies by dropping and recreating them
DROP POLICY IF EXISTS "Allow public to insert subscribers" ON subscribers;
DROP POLICY IF EXISTS "Allow public to read subscribers" ON subscribers;

-- Recreate the policies
CREATE POLICY "Allow public to insert subscribers" ON subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public to read subscribers" ON subscribers
  FOR SELECT USING (true);
