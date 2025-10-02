-- Create subscribers table for newsletter signup
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);

-- Create index for created_at for analytics
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON subscribers(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert new subscribers
CREATE POLICY "Allow public to insert subscribers" ON subscribers
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read subscribers (for admin purposes)
CREATE POLICY "Allow public to read subscribers" ON subscribers
  FOR SELECT USING (true);
