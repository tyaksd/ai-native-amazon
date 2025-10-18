-- Add manual estimated delivery field to order_items
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS manual_estimated_delivery VARCHAR(100);

COMMENT ON COLUMN order_items.manual_estimated_delivery IS 'Manually entered estimated delivery date (e.g., October 18–23)';

CREATE INDEX IF NOT EXISTS idx_order_items_manual_estimated_delivery 
ON order_items(manual_estimated_delivery) 
WHERE manual_estimated_delivery IS NOT NULL;
