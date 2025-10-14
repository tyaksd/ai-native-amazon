-- Add design_description column to products table
-- This column will store the detailed 150-character design description
-- used for image generation and design analysis

ALTER TABLE products 
ADD COLUMN design_description TEXT;

-- Add comment to explain the column purpose
COMMENT ON COLUMN products.design_description IS 'Detailed design description (150 chars) used for image generation and design analysis. Separate from SEO description.';

-- Optional: Create an index for better query performance if needed
-- CREATE INDEX idx_products_design_description ON products(design_description);
