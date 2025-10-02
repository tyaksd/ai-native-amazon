-- Add gender column to products table
ALTER TABLE products 
ADD COLUMN gender VARCHAR(10) CHECK (gender IN ('Men', 'Women', 'Unisex', 'Null'));

-- Set default value for existing products
UPDATE products SET gender = 'Unisex' WHERE gender IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE products ALTER COLUMN gender SET NOT NULL;
