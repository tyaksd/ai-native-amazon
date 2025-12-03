-- Add is_hot and is_new flags to brands table
ALTER TABLE brands 
ADD COLUMN is_hot BOOLEAN DEFAULT FALSE,
ADD COLUMN is_new BOOLEAN DEFAULT FALSE;

-- Add comments to describe the new columns
COMMENT ON COLUMN brands.is_hot IS 'Flag to mark brands as Hot Drop for featured display';
COMMENT ON COLUMN brands.is_new IS 'Flag to mark brands as New Drop for featured display';

