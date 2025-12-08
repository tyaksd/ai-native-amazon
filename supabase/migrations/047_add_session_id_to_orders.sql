-- Add session_id column to orders table for non-logged-in users
-- This allows tracking orders by session_id similar to cart_items and favorites
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Add session_id column to order_items table for non-logged-in users
ALTER TABLE order_items 
  ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_session_id ON order_items(session_id) WHERE session_id IS NOT NULL;

-- Add comments to explain the columns
COMMENT ON COLUMN orders.session_id IS 'Session ID for non-logged-in users, NULL for logged-in users';
COMMENT ON COLUMN order_items.session_id IS 'Session ID for non-logged-in users, NULL for logged-in users';

-- Note: Either clerk_id or session_id should be set, but not both
-- This matches the pattern used in cart_items and favorites tables

