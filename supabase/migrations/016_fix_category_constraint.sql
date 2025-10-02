-- Fix category constraint issue by handling existing data properly
-- Step 1: First, let's see what categories exist and fix them
-- Remove the constraint temporarily to fix data
ALTER TABLE products DROP CONSTRAINT IF EXISTS check_category;
ALTER TABLE products DROP CONSTRAINT IF EXISTS check_type;

-- Step 2: Fix any invalid category values
UPDATE products 
SET category = CASE 
  WHEN category IN ('T-Shirt', 'Hoodie', 'Sweatshirt', 'Jacket', 'Pants', 'Shorts') THEN 'Clothing'
  WHEN category IN ('Hat', 'Accessories') THEN 'Accessories'
  WHEN category = 'Shoes' THEN 'Hats'
  WHEN category = 'Other' THEN 'Others'
  WHEN category NOT IN ('Clothing', 'Accessories', 'Hats', 'Others') THEN 'Clothing' -- Default fallback
  ELSE category
END;

-- Step 3: Fix any invalid type values
UPDATE products 
SET type = CASE 
  WHEN type IN ('T-Shirt', 'Hoodie', 'Sweatshirt', 'Jacket', 'Pants', 'Shorts', 'Hat', 'Accessories', 'Shoes', 'Other') THEN type
  ELSE 'T-Shirt' -- Default fallback
END;

-- Step 4: Now add the constraints back
ALTER TABLE products 
ADD CONSTRAINT check_category 
CHECK (category IN ('Clothing', 'Accessories', 'Hats', 'Others'));

ALTER TABLE products 
ADD CONSTRAINT check_type 
CHECK (type IN (
  'T-Shirt', 'Hoodie', 'Sweatshirt', 'Jacket', 'Pants', 'Shorts',
  'Hat', 'Accessories', 'Shoes', 'Other'
));
