-- Add problem column to order_items table
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS problem TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN order_items.problem IS 'Text field to record any problems or issues with this order item';

-- Create index for better query performance when filtering by problems
CREATE INDEX IF NOT EXISTS idx_order_items_problem ON order_items(problem) WHERE problem IS NOT NULL;
