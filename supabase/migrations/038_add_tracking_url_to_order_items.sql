-- Add tracking URL field to order_items table
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS tracking_url TEXT;

COMMENT ON COLUMN order_items.tracking_url IS 'URL for tracking shipment (e.g., Track your shipment page)';

CREATE INDEX IF NOT EXISTS idx_order_items_tracking_url 
ON order_items(tracking_url) 
WHERE tracking_url IS NOT NULL;
