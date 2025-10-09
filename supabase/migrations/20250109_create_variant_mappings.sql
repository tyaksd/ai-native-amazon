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
