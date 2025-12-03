-- Add style column to brands table
-- Step 1: Create enum type for brand styles
DO $$ BEGIN
    CREATE TYPE brand_style AS ENUM (
        'Core Street',
        'Hip-Hop/Urban',
        'Sports/Athleisure',
        'Retro/Vintage/Y2K',
        'Techwear/Futuristic',
        'Luxury/Mode Street',
        'Grunge/Punk/Rock',
        'Minimal/Normcore',
        'Art/Graphic Driven',
        'Culture/Character/Anime'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add style column to brands table
ALTER TABLE brands ADD COLUMN style brand_style;

-- Step 3: Add comment to document the column
COMMENT ON COLUMN brands.style IS 'Brand style classification for organizing brands by streetwear sub-style';

