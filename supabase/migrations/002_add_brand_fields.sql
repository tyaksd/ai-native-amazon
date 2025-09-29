-- Add background image and description fields to brands table
ALTER TABLE brands 
ADD COLUMN background_image TEXT,
ADD COLUMN description TEXT;
