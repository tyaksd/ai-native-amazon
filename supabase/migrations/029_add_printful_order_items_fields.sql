-- Add Printful-related fields to order_items table
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS i_sent_to_printful BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS printful_sent BOOLEAN DEFAULT FALSE;

-- Add comments to explain the columns
COMMENT ON COLUMN order_items.i_sent_to_printful IS 'Flag indicating if this order item has been sent to Printful for processing';
COMMENT ON COLUMN order_items.printful_sent IS 'Flag indicating if Printful has confirmed sending this item';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_order_items_i_sent_to_printful ON order_items(i_sent_to_printful) WHERE i_sent_to_printful = TRUE;
CREATE INDEX IF NOT EXISTS idx_order_items_printful_sent ON order_items(printful_sent) WHERE printful_sent = TRUE;
