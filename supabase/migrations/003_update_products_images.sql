-- Update products table to support multiple images
-- First, add the new images column (nullable initially)
ALTER TABLE products ADD COLUMN images TEXT[];

-- Migrate existing single image data to the new images array
UPDATE products SET images = ARRAY[image] WHERE image IS NOT NULL;

-- Set default empty array for any remaining null values
UPDATE products SET images = ARRAY[]::TEXT[] WHERE images IS NULL;

-- Now make images column NOT NULL
ALTER TABLE products ALTER COLUMN images SET NOT NULL;

-- Drop the old image column (only if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image') THEN
        ALTER TABLE products DROP COLUMN image;
    END IF;
END $$;
