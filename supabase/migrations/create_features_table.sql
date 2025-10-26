-- Create features table for hero carousel management
CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL DEFAULT '/explore',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on display_order for efficient sorting
CREATE INDEX IF NOT EXISTS idx_features_display_order ON features(display_order);

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_features_is_active ON features(is_active);

-- Add RLS policies
ALTER TABLE features ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active features
CREATE POLICY "Allow public read access to active features"
  ON features
  FOR SELECT
  USING (is_active = true);

-- Allow authenticated users to read all features
CREATE POLICY "Allow authenticated read access to all features"
  ON features
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert features
CREATE POLICY "Allow authenticated insert access to features"
  ON features
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update features
CREATE POLICY "Allow authenticated update access to features"
  ON features
  FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete features
CREATE POLICY "Allow authenticated delete access to features"
  ON features
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert default sample data
INSERT INTO features (title, subtitle, image_url, link_url, display_order, is_active) VALUES
  ('ホリデーコレクション', 'メタリックパープルの限定パッケージが登場', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80', '/explore', 1, true),
  ('タイムセール開催中！', 'MAX50%オフ！10月26日(日)26時まで', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80', '/explore', 2, true),
  ('Paul Smith、DUFFERなど', 'ラグジュアリーブランドがクーポン等の特別企画開催', 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=1200&q=80', '/brands', 3, true);

COMMENT ON TABLE features IS 'Hero carousel features for homepage';
COMMENT ON COLUMN features.title IS 'Main title displayed on the feature';
COMMENT ON COLUMN features.subtitle IS 'Subtitle or description';
COMMENT ON COLUMN features.image_url IS 'URL of the feature image';
COMMENT ON COLUMN features.link_url IS 'URL to navigate when feature is clicked';
COMMENT ON COLUMN features.display_order IS 'Order in which features should be displayed';
COMMENT ON COLUMN features.is_active IS 'Whether the feature is currently active/visible';

