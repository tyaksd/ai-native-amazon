-- Add Printful shipment ID field to order_items table
-- This allows tracking individual shipment IDs from Printful

ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS printful_shipment_number VARCHAR(100);

-- Add comment to explain the column
COMMENT ON COLUMN order_items.printful_shipment_number IS 'Printful shipment number (e.g., Shipment #131302117-69317297)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_order_items_shipment_number ON order_items(printful_shipment_number) WHERE printful_shipment_number IS NOT NULL;
