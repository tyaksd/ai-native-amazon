-- Update category options to include specific product types
-- First, let's add a check constraint to ensure only valid categories are allowed

-- Create an enum type for categories (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE product_category AS ENUM (
      'T-Shirt',
      'Hoodie', 
      'Sweatshirt',
      'Jacket',
      'Pants',
      'Shorts',
      'Hat',
      'Accessories',
      'Shoes',
      'Other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update existing products to use the new category format
UPDATE products 
SET category = 'T-Shirt' 
WHERE LOWER(category) IN ('all', 'men', 'women', 'hot') 
   OR category IS NULL;

-- Add a check constraint to ensure only valid categories (only if it doesn't exist)
DO $$ BEGIN
    ALTER TABLE products 
    ADD CONSTRAINT check_category 
    CHECK (category IN (
      'T-Shirt',
      'Hoodie', 
      'Sweatshirt',
      'Jacket',
      'Pants',
      'Shorts',
      'Hat',
      'Accessories',
      'Shoes',
      'Other'
    ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the default value
ALTER TABLE products ALTER COLUMN category SET DEFAULT 'T-Shirt';
