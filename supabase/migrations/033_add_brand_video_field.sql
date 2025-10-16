-- Add background_video field to brands table
ALTER TABLE brands 
ADD COLUMN background_video TEXT;

-- Add comment to describe the new column
COMMENT ON COLUMN brands.background_video IS 'AI-generated background video URL for the brand';
