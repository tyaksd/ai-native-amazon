-- Add comprehensive Printful-related fields to order_items table
-- This allows tracking each individual item's Printful status and IDs

ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS printful_item_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS printful_variant_id INTEGER,
ADD COLUMN IF NOT EXISTS printful_product_id INTEGER,
ADD COLUMN IF NOT EXISTS printful_tracking_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS printful_shipment_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS printful_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS printful_fulfillment_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS printful_error_message TEXT,
ADD COLUMN IF NOT EXISTS printful_retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS printful_last_updated TIMESTAMP WITH TIME ZONE;

-- Add comments to explain the columns
COMMENT ON COLUMN order_items.printful_item_id IS 'Printful item ID for this specific order item';
COMMENT ON COLUMN order_items.printful_variant_id IS 'Printful variant ID for this specific item';
COMMENT ON COLUMN order_items.printful_product_id IS 'Printful product ID for this specific item';
COMMENT ON COLUMN order_items.printful_tracking_number IS 'Tracking number for this specific item shipment';
COMMENT ON COLUMN order_items.printful_shipment_id IS 'Printful shipment ID for this specific item';
COMMENT ON COLUMN order_items.printful_status IS 'Current Printful status for this item (pending, inprocess, fulfilled, etc.)';
COMMENT ON COLUMN order_items.printful_fulfillment_status IS 'Fulfillment status for this item (pending, shipped, delivered, etc.)';
COMMENT ON COLUMN order_items.printful_error_message IS 'Error message if Printful processing failed for this item';
COMMENT ON COLUMN order_items.printful_retry_count IS 'Number of retry attempts for this item';
COMMENT ON COLUMN order_items.printful_last_updated IS 'Last time this item was updated from Printful';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_order_items_printful_item_id ON order_items(printful_item_id) WHERE printful_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_printful_variant_id ON order_items(printful_variant_id) WHERE printful_variant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_printful_status ON order_items(printful_status) WHERE printful_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_printful_fulfillment_status ON order_items(printful_fulfillment_status) WHERE printful_fulfillment_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_printful_tracking ON order_items(printful_tracking_number) WHERE printful_tracking_number IS NOT NULL;
