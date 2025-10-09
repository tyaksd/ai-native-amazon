-- Manual Printful Variant Mapping Creation
-- This script creates sample mappings for testing

-- First, check if we have any products
SELECT id, name, gender FROM products LIMIT 5;

-- Create sample mappings (replace with actual product IDs)
-- You'll need to get the actual product IDs from your products table
-- and the actual Printful variant IDs from Printful API

-- Example mappings (replace with your actual data):
INSERT INTO printful_variant_mappings (
  product_id,
  size,
  color,
  printful_variant_id,
  printful_product_id
) VALUES 
  -- Replace 'your-product-id-1' with actual product ID from products table
  ('your-product-id-1', 'S', 'BLACK', 12345, 67890),
  ('your-product-id-1', 'M', 'BLACK', 12346, 67890),
  ('your-product-id-1', 'L', 'BLACK', 12347, 67890),
  ('your-product-id-1', 'S', 'WHITE', 12348, 67890),
  ('your-product-id-1', 'M', 'WHITE', 12349, 67890),
  ('your-product-id-1', 'L', 'WHITE', 12350, 67890)
ON CONFLICT (product_id, size, color) DO UPDATE SET
  printful_variant_id = EXCLUDED.printful_variant_id,
  printful_product_id = EXCLUDED.printful_product_id,
  updated_at = NOW();

-- Verify the mappings were created
SELECT * FROM printful_variant_mappings ORDER BY created_at DESC;
