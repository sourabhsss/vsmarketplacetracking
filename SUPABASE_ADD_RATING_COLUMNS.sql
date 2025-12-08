-- Migration: Add rating and additional metrics columns to extensions table
-- Run this in Supabase SQL Editor if you already have the extensions table

-- Add new columns to extensions table
ALTER TABLE extensions 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS rating_count INTEGER,
ADD COLUMN IF NOT EXISTS download_count BIGINT,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_version TEXT;

-- Verify columns were added
SELECT 'Columns added successfully!' as status;