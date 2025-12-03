-- Rename style 'Culture/Character/Anime' to 'Culture/Anime'
-- NOTE: Run these in two separate transactions in Supabase SQL Editor

-- STEP 1: Run this first
ALTER TYPE brand_style ADD VALUE IF NOT EXISTS 'Culture/Anime';

-- STEP 2: Run this after STEP 1 is complete
-- UPDATE brands SET style = 'Culture/Anime' WHERE style = 'Culture/Character/Anime';
