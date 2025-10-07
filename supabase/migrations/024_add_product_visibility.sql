-- Add is_visible column to products table
ALTER TABLE products ADD COLUMN is_visible BOOLEAN DEFAULT true;

-- Update existing products to be visible by default
UPDATE products SET is_visible = true WHERE is_visible IS NULL;

-- Make is_visible NOT NULL with default true
ALTER TABLE products ALTER COLUMN is_visible SET NOT NULL;
ALTER TABLE products ALTER COLUMN is_visible SET DEFAULT true;

-- Add comment to explain the column purpose
COMMENT ON COLUMN products.is_visible IS 'Controls whether the product is visible to customers (true = visible, false = hidden)';
