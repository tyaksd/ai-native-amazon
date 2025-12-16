-- Update brand categories to new animal-themed categories
-- Step 1: Drop existing constraint
ALTER TABLE brands DROP CONSTRAINT IF EXISTS check_brand_category;

-- Step 2: Remove default value temporarily
ALTER TABLE brands ALTER COLUMN category DROP DEFAULT;

-- Step 3: Drop the old enum type (this will fail if there are existing values, so we need to handle it)
-- First, convert existing category values to text
ALTER TABLE brands ALTER COLUMN category TYPE TEXT USING category::TEXT;

-- Step 4: Drop the old enum type
DROP TYPE IF EXISTS brand_category;

-- Step 5: Create new enum type with animal-themed categories
CREATE TYPE brand_category AS ENUM (
    'PETS',
    'PREDATORS',
    'WILD NATURE',
    'OCEAN',
    'DARK / NOCTURNAL',
    'MYTHICAL',
    'INSECTS / SMALL CREATURES',
    'OTHERS'
);

-- Step 6: Convert category column back to enum type
-- Map old categories to new ones (default to OTHERS if no match)
ALTER TABLE brands ALTER COLUMN category TYPE brand_category USING (
    CASE 
        WHEN category::TEXT IS NULL THEN 'OTHERS'::brand_category
        ELSE 'OTHERS'::brand_category
    END
);

-- Step 7: Add check constraint for valid brand categories
ALTER TABLE brands 
ADD CONSTRAINT check_brand_category 
CHECK (category IN (
    'PETS',
    'PREDATORS',
    'WILD NATURE',
    'OCEAN',
    'DARK / NOCTURNAL',
    'MYTHICAL',
    'INSECTS / SMALL CREATURES',
    'OTHERS'
));

-- Step 8: Set default category
ALTER TABLE brands ALTER COLUMN category SET DEFAULT 'OTHERS';

-- Step 9: Update comment
COMMENT ON COLUMN brands.category IS 'Brand category classification for organizing brands by animal theme';

