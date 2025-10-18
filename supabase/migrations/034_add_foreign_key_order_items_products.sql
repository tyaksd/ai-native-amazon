-- Add foreign key relationship between order_items and products
-- This allows Supabase to understand the relationship for JOINs

-- First, ensure the product_id column exists and is the correct type
ALTER TABLE order_items 
ALTER COLUMN product_id TYPE UUID USING product_id::UUID;

-- Add foreign key constraint
ALTER TABLE order_items 
ADD CONSTRAINT fk_order_items_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- Add comment to explain the relationship
COMMENT ON COLUMN order_items.product_id IS 'Reference to products table, can be NULL for legacy items';
