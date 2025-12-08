-- Add badge column to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS badge TEXT;

-- Add check constraint to ensure badge is one of the allowed values
ALTER TABLE products 
  ADD CONSTRAINT products_badge_check CHECK (
    badge IS NULL OR badge IN ('NEW', 'HOT', 'SALE', 'SECRET', 'JACK', 'TODAY', 'LAST', 'COLLAB', 'PICK')
  );

-- Set NEW badge for existing products created within the last 30 days
UPDATE products 
SET badge = 'NEW' 
WHERE created_at >= NOW() - INTERVAL '30 days' 
  AND badge IS NULL;

-- Function to set NEW badge on product creation
CREATE OR REPLACE FUNCTION set_new_badge_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Set badge to NEW when product is created (if badge is not already set)
  IF NEW.badge IS NULL THEN
    NEW.badge := 'NEW';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set NEW badge on insert
DROP TRIGGER IF EXISTS trigger_set_new_badge_on_insert ON products;
CREATE TRIGGER trigger_set_new_badge_on_insert
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_new_badge_on_insert();

-- Function to update NEW badge to NULL after 30 days
CREATE OR REPLACE FUNCTION update_new_badge_to_null()
RETURNS void AS $$
BEGIN
  -- Update products where badge is NEW and created_at is more than 30 days ago
  UPDATE products
  SET badge = NULL
  WHERE badge = 'NEW'
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run the update function daily (if pg_cron is available)
-- Note: This requires pg_cron extension. If not available, you can use a cron job or scheduled task.
-- To enable pg_cron, run: CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Then schedule the job: SELECT cron.schedule('update-new-badges', '0 0 * * *', 'SELECT update_new_badge_to_null();');

-- Alternative: Use Supabase Edge Functions or external cron job to call update_new_badge_to_null() daily

-- Comment explaining the badge system
COMMENT ON COLUMN products.badge IS 'Product badge: NULL, NEW (auto-set on creation, expires after 30 days), HOT, SALE, SECRET, JACK, TODAY, LAST, COLLAB, PICK';

