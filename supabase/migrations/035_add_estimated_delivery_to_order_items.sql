-- Add estimated delivery date fields to order_items table
-- This allows tracking Printful's estimated delivery dates

ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS printful_estimated_delivery_date DATE,
ADD COLUMN IF NOT EXISTS printful_estimated_delivery_timestamp TIMESTAMP WITH TIME ZONE;

-- Add comments to explain the columns
COMMENT ON COLUMN order_items.printful_estimated_delivery_date IS 'Estimated delivery date from Printful (date only)';
COMMENT ON COLUMN order_items.printful_estimated_delivery_timestamp IS 'Estimated delivery timestamp from Printful (full datetime)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_order_items_estimated_delivery ON order_items(printful_estimated_delivery_date) WHERE printful_estimated_delivery_date IS NOT NULL;
