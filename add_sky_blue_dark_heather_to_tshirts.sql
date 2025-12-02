-- Add SKY BLUE and DARK HEATHER colors to all T-Shirt products
-- This script adds these colors to the colors array if they don't already exist

-- First, let's see what T-Shirt products we have
SELECT 
  id,
  name,
  type,
  colors
FROM products
WHERE LOWER(type) LIKE '%t-shirt%' 
   OR LOWER(type) LIKE '%tshirt%' 
   OR LOWER(type) LIKE '%shirt%'
ORDER BY name;

-- Update T-Shirt products to add SKY BLUE and DARK HEATHER colors
-- This will add the colors only if they don't already exist in the array
UPDATE products
SET colors = (
  SELECT array_agg(DISTINCT color ORDER BY color)
  FROM (
    -- Keep existing colors
    SELECT unnest(colors) AS color
    UNION ALL
    -- Add SKY BLUE if not present
    SELECT 'SKY BLUE' WHERE NOT ('SKY BLUE' = ANY(colors))
    UNION ALL
    -- Add DARK HEATHER if not present
    SELECT 'DARK HEATHER' WHERE NOT ('DARK HEATHER' = ANY(colors))
  ) AS all_colors
)
WHERE (LOWER(type) LIKE '%t-shirt%' 
   OR LOWER(type) LIKE '%tshirt%' 
   OR LOWER(type) LIKE '%shirt%')
   AND colors IS NOT NULL;

-- Verify the update - check that SKY BLUE and DARK HEATHER were added
SELECT 
  id,
  name,
  type,
  colors,
  array_length(colors, 1) as color_count,
  CASE 
    WHEN 'SKY BLUE' = ANY(colors) THEN 'Yes' 
    ELSE 'No' 
  END as has_sky_blue,
  CASE 
    WHEN 'DARK HEATHER' = ANY(colors) THEN 'Yes' 
    ELSE 'No' 
  END as has_dark_heather
FROM products
WHERE LOWER(type) LIKE '%t-shirt%' 
   OR LOWER(type) LIKE '%tshirt%' 
   OR LOWER(type) LIKE '%shirt%'
ORDER BY name;

