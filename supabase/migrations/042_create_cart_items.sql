-- Create cart_items table to store user's cart items
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id TEXT, -- Clerk user ID (null for non-logged-in users)
  session_id TEXT, -- Session ID for non-logged-in users
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  size TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (
    (clerk_id IS NOT NULL AND session_id IS NULL) OR
    (clerk_id IS NULL AND session_id IS NOT NULL)
  )
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_cart_items_clerk_id ON cart_items(clerk_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Create unique constraints (separate for clerk_id and session_id)
-- For logged-in users
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_unique_clerk 
  ON cart_items(clerk_id, product_id, COALESCE(size, ''), COALESCE(color, '')) 
  WHERE clerk_id IS NOT NULL;

-- For non-logged-in users
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_unique_session 
  ON cart_items(session_id, product_id, COALESCE(size, ''), COALESCE(color, '')) 
  WHERE session_id IS NOT NULL;

-- Enable RLS (Row Level Security)
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all operations on cart_items" ON cart_items;

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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_items_updated_at();

