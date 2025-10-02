-- Create favorites table to store user's favorite products
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- We'll use a simple text identifier for now
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);

-- Enable RLS (Row Level Security)
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (we can restrict this later)
DO $$ BEGIN
    CREATE POLICY "Allow all operations on favorites" ON favorites
      FOR ALL USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
