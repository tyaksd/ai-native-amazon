-- Add brand_name column to products table
-- This column will store the brand name from brands table based on brand_id

-- Step 1: Add brand_name column to products table (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'brand_name'
  ) THEN
    ALTER TABLE products ADD COLUMN brand_name TEXT;
  END IF;
END $$;

-- Step 2: Update existing products with brand names from brands table
UPDATE products p
SET brand_name = b.name
FROM brands b
WHERE p.brand_id = b.id;

-- Step 3: Add comment to explain the column purpose
COMMENT ON COLUMN products.brand_name IS 'Brand name fetched from brands table based on brand_id';

-- Step 4: Create an index for better query performance (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_products_brand_name ON products(brand_name);

-- Step 5: Create a trigger function to automatically update brand_name when brand_id changes
CREATE OR REPLACE FUNCTION update_product_brand_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.brand_id IS NOT NULL THEN
    SELECT name INTO NEW.brand_name
    FROM brands
    WHERE id = NEW.brand_id;
  ELSE
    NEW.brand_name := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to automatically update brand_name on INSERT or UPDATE
DROP TRIGGER IF EXISTS trigger_update_product_brand_name ON products;
CREATE TRIGGER trigger_update_product_brand_name
  BEFORE INSERT OR UPDATE OF brand_id
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_brand_name();

-- Step 7: Create trigger function to update products.brand_name when brands.name changes
CREATE OR REPLACE FUNCTION update_products_on_brand_name_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name != OLD.name THEN
    UPDATE products
    SET brand_name = NEW.name
    WHERE brand_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger to sync brand_name when brand name is updated
DROP TRIGGER IF EXISTS trigger_sync_brand_name ON brands;
CREATE TRIGGER trigger_sync_brand_name
  AFTER UPDATE OF name
  ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_products_on_brand_name_change();

