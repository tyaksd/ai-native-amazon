-- Printful Variant Mappings Table Creation
-- Execute this in Supabase SQL Editor

-- Create variant mappings table for Printful integration
CREATE TABLE IF NOT EXISTS printful_variant_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size VARCHAR(10) NOT NULL,
  color VARCHAR(50) NOT NULL,
  printful_variant_id INTEGER NOT NULL,
  printful_product_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique combination
  UNIQUE(product_id, size, color)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_printful_variant_mappings_lookup 
ON printful_variant_mappings(product_id, size, color);

-- Create index for Printful variant ID lookups
CREATE INDEX IF NOT EXISTS idx_printful_variant_mappings_variant_id 
ON printful_variant_mappings(printful_variant_id);

-- Add RLS policies
ALTER TABLE printful_variant_mappings ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage mappings
CREATE POLICY "Service role can manage variant mappings" ON printful_variant_mappings
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read mappings
CREATE POLICY "Authenticated users can read variant mappings" ON printful_variant_mappings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_printful_variant_mappings_updated_at 
    BEFORE UPDATE ON printful_variant_mappings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional - for testing)
-- You can uncomment and modify these if you want to add sample mappings

-- INSERT INTO printful_variant_mappings (product_id, size, color, printful_variant_id, printful_product_id)
-- VALUES 
--   ('your-product-id-here', 'S', 'BLACK', 12345, 67890),
--   ('your-product-id-here', 'M', 'BLACK', 12346, 67890),
--   ('your-product-id-here', 'L', 'BLACK', 12347, 67890),
--   ('your-product-id-here', 'S', 'WHITE', 12348, 67890),
--   ('your-product-id-here', 'M', 'WHITE', 12349, 67890);

-- Verify table creation
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'printful_variant_mappings'
ORDER BY ordinal_position;
