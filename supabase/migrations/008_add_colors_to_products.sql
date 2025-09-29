-- Add colors column to products table
ALTER TABLE products ADD COLUMN colors TEXT[];

-- Set default empty array for existing products
UPDATE products SET colors = ARRAY[]::TEXT[] WHERE colors IS NULL;

-- Make colors NOT NULL with default empty array
ALTER TABLE products ALTER COLUMN colors SET NOT NULL;
ALTER TABLE products ALTER COLUMN colors SET DEFAULT ARRAY[]::TEXT[];
