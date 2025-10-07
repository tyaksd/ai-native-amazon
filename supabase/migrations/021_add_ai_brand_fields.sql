-- Add AI brand fields to brands table
ALTER TABLE brands 
ADD COLUMN design_concept TEXT,
ADD COLUMN target_audience TEXT,
ADD COLUMN logo_design TEXT;

-- Add comments to describe the new columns
COMMENT ON COLUMN brands.design_concept IS 'AI-generated design concept for the brand';
COMMENT ON COLUMN brands.target_audience IS 'AI-identified target audience for the brand';
COMMENT ON COLUMN brands.logo_design IS 'AI-generated logo design description or URL';
