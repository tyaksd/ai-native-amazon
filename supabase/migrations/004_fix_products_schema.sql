-- Fix products table schema to match the new structure
-- First, check if the old image column exists and drop it
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image') THEN
        ALTER TABLE products DROP COLUMN image;
    END IF;
END $$;

-- Ensure images column exists and is properly configured
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'images') THEN
        ALTER TABLE products ADD COLUMN images TEXT[];
    END IF;
END $$;

-- Set default empty array for any null values
UPDATE products SET images = ARRAY[]::TEXT[] WHERE images IS NULL;

-- Make images column NOT NULL
ALTER TABLE products ALTER COLUMN images SET NOT NULL;
