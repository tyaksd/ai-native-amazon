-- Add Printful-related fields to orders table
ALTER TABLE orders 
ADD COLUMN printful_order_id VARCHAR(50),
ADD COLUMN printful_external_id VARCHAR(100);

-- Add comments to explain the columns
COMMENT ON COLUMN orders.printful_order_id IS 'Printful order ID returned from Printful API';
COMMENT ON COLUMN orders.printful_external_id IS 'External ID used to reference this order in Printful';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_printful_order_id ON orders(printful_order_id) WHERE printful_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_printful_external_id ON orders(printful_external_id) WHERE printful_external_id IS NOT NULL;
