-- Add category column to products table
ALTER TABLE products ADD COLUMN category TEXT;

-- Set default category for existing products
UPDATE products SET category = 'All' WHERE category IS NULL;

-- Make category NOT NULL with default value
ALTER TABLE products ALTER COLUMN category SET NOT NULL;
ALTER TABLE products ALTER COLUMN category SET DEFAULT 'All';
