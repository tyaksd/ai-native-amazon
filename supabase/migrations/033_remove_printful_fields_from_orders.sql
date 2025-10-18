-- Remove Printful fields from orders table since they should be in order_items
-- Each order item needs its own Printful tracking information

-- Drop indexes first
DROP INDEX IF EXISTS idx_orders_printful_order_id;
DROP INDEX IF EXISTS idx_orders_printful_external_id;

-- Remove the columns
ALTER TABLE orders 
DROP COLUMN IF EXISTS printful_order_id,
DROP COLUMN IF EXISTS printful_external_id;

-- Add a comment explaining the change
COMMENT ON TABLE orders IS 'Orders table - Printful tracking is now handled at the order_items level for better granularity';
