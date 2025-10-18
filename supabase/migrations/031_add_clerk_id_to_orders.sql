-- Add clerk_id column to orders table for Clerk authentication
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS clerk_id TEXT;

-- Add clerk_id column to order_items table for Clerk authentication
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS clerk_id TEXT;

-- Add comments to explain the columns
COMMENT ON COLUMN orders.clerk_id IS 'Clerk user ID for authenticated users, NULL for guest purchases';
COMMENT ON COLUMN order_items.clerk_id IS 'Clerk user ID for authenticated users, NULL for guest purchases';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_clerk_id ON orders(clerk_id) WHERE clerk_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_clerk_id ON order_items(clerk_id) WHERE clerk_id IS NOT NULL;

-- Create a composite index for orders by clerk_id and created_at for user order history
CREATE INDEX IF NOT EXISTS idx_orders_clerk_created ON orders(clerk_id, created_at DESC) WHERE clerk_id IS NOT NULL;
