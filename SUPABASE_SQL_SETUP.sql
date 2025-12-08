-- VS Code Extension Tracker - Database Setup
-- Copy and paste this entire file into Supabase SQL Editor and run it

-- Drop existing tables if they exist (careful - this deletes data!)
DROP TABLE IF EXISTS install_stats CASCADE;
DROP TABLE IF EXISTS extensions CASCADE;

-- Create extensions table
CREATE TABLE extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extension_id TEXT UNIQUE NOT NULL,
  publisher_name TEXT NOT NULL,
  extension_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  marketplace_url TEXT NOT NULL,
  icon_url TEXT,
  average_rating DECIMAL(3,2),
  rating_count INTEGER,
  download_count BIGINT,
  last_updated TIMESTAMPTZ,
  current_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create install_stats table
CREATE TABLE install_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extension_id UUID REFERENCES extensions(id) ON DELETE CASCADE,
  install_count BIGINT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX idx_install_stats_extension_id ON install_stats(extension_id, recorded_at);

-- Enable Row Level Security (RLS)
ALTER TABLE extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE install_stats ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (public access)
-- Note: In production, you should restrict these policies
CREATE POLICY "Allow all operations on extensions" 
ON extensions FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on install_stats" 
ON install_stats FOR ALL 
USING (true) 
WITH CHECK (true);

-- Verify tables were created
SELECT 'Tables created successfully!' as status;