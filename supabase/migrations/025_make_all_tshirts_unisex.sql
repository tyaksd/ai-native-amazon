-- Update all existing products to be unisex
UPDATE products SET gender = 'Unisex' WHERE type ILIKE '%t-shirt%' OR type ILIKE '%tshirt%';

-- Update the gender constraint to allow only 'Unisex' for t-shirts
-- First, drop the existing constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_gender_check;

-- Add a new constraint that allows only 'Unisex' for t-shirts
ALTER TABLE products ADD CONSTRAINT products_gender_check 
CHECK (
  (type ILIKE '%t-shirt%' OR type ILIKE '%tshirt%') AND gender = 'Unisex'
  OR 
  (type NOT ILIKE '%t-shirt%' AND type NOT ILIKE '%tshirt%') AND gender IN ('Men', 'Women', 'Unisex', 'Null')
);
