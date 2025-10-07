-- Add brand categories to brands table
-- Step 1: Create enum type for brand categories
DO $$ BEGIN
    CREATE TYPE brand_category AS ENUM (
        'Streetwear',
        'Casual',
        'Mode / Avant-Garde',
        'Luxury / High-End',
        'Sports / Outdoor',
        'Traditional / Preppy',
        'Feminine / Girly',
        'Workwear / Military',
        'Sustainable / Ethical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add category column to brands table
ALTER TABLE brands ADD COLUMN category brand_category;

-- Step 3: Add check constraint for valid brand categories (only if it doesn't exist)
DO $$ BEGIN
    ALTER TABLE brands 
    ADD CONSTRAINT check_brand_category 
    CHECK (category IN (
        'Streetwear',
        'Casual',
        'Mode / Avant-Garde',
        'Luxury / High-End',
        'Sports / Outdoor',
        'Traditional / Preppy',
        'Feminine / Girly',
        'Workwear / Military',
        'Sustainable / Ethical'
    ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 4: Set default category (optional - you can remove this if you want to require explicit category)
ALTER TABLE brands ALTER COLUMN category SET DEFAULT 'Casual';

-- Step 5: Add comment to document the categories
COMMENT ON COLUMN brands.category IS 'Brand category classification for organizing brands by style and target market';
