-- Create brand_follows table to store user's followed brands
-- This is for logged-in users only (clerk_id required)
CREATE TABLE IF NOT EXISTS brand_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id TEXT NOT NULL, -- Clerk user ID (required - logged-in users only)
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clerk_id, brand_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_brand_follows_clerk_id ON brand_follows(clerk_id);
CREATE INDEX IF NOT EXISTS idx_brand_follows_brand_id ON brand_follows(brand_id);

-- Enable RLS (Row Level Security)
ALTER TABLE brand_follows ENABLE ROW LEVEL SECURITY;

-- Create policies for brand_follows
-- Allow SELECT (read) - users can see their own follows
CREATE POLICY "Allow users to read their own brand follows" ON brand_follows
  FOR SELECT USING (true);

-- Allow INSERT (create) - users can follow brands
CREATE POLICY "Allow users to follow brands" ON brand_follows
  FOR INSERT WITH CHECK (true);

-- Allow DELETE (remove) - users can unfollow brands
CREATE POLICY "Allow users to unfollow brands" ON brand_follows
  FOR DELETE USING (true);

