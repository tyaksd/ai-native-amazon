-- Restructure categories: separate category (main) and type (sub)
-- Step 1: Add type column
ALTER TABLE products ADD COLUMN type TEXT;

-- Step 2: Migrate existing data
-- Move current category values to type column
UPDATE products SET type = category;

-- Step 3: Update category column to use main categories
UPDATE products 
SET category = CASE 
  WHEN type IN ('T-Shirt', 'Hoodie', 'Sweatshirt', 'Jacket', 'Pants', 'Shorts') THEN 'Clothing'
  WHEN type IN ('Hat', 'Accessories') THEN 'Accessories'
  WHEN type = 'Shoes' THEN 'Hats'
  WHEN type = 'Other' THEN 'Others'
  ELSE 'Clothing' -- Default fallback
END;

-- Step 4: Make type column NOT NULL
ALTER TABLE products ALTER COLUMN type SET NOT NULL;

-- Step 5: Add check constraints for category (only if it doesn't exist)
DO $$ BEGIN
    ALTER TABLE products 
    ADD CONSTRAINT check_category 
    CHECK (category IN ('Clothing', 'Accessories', 'Hats', 'Others'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 6: Add check constraints for type (only if it doesn't exist)
DO $$ BEGIN
    ALTER TABLE products 
    ADD CONSTRAINT check_type 
    CHECK (type IN (
      'T-Shirt', 'Hoodie', 'Sweatshirt', 'Jacket', 'Pants', 'Shorts',
      'Hat', 'Accessories', 'Shoes', 'Other'
    ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 7: Update default values
ALTER TABLE products ALTER COLUMN category SET DEFAULT 'Clothing';
ALTER TABLE products ALTER COLUMN type SET DEFAULT 'T-Shirt';
