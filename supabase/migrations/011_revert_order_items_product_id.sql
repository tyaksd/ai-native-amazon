-- Revert order_items table product_id column type back to UUID
-- This reverts the previous change to maintain original schema

ALTER TABLE order_items 
ALTER COLUMN product_id TYPE UUID USING product_id::UUID;
