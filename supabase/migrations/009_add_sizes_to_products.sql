-- Add sizes column to products table
ALTER TABLE products ADD COLUMN sizes TEXT[];
UPDATE products SET sizes = ARRAY[]::TEXT[] WHERE sizes IS NULL;
ALTER TABLE products ALTER COLUMN sizes SET NOT NULL;
ALTER TABLE products ALTER COLUMN sizes SET DEFAULT ARRAY[]::TEXT[];
