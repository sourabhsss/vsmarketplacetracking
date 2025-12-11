-- Add monitoring tables for sync health and data gaps
-- Run this in your Supabase SQL Editor

-- Create sync_logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'partial', 'failed')),
  total_extensions INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL,
  failed_count INTEGER NOT NU-- Allow 'running' status and make total_extensions have a default
ALTER TABLE sync_logs 
  DROP CONSTRAINT IF EXISTS sync_logs_status_check;

ALTER TABLE sync_logs 
  ADD CONSTRAINT sync_logs_status_check 
  CHECK (status IN ('running', 'success', 'partial', 'failed'));

ALTER TABLE sync_logs 
  ALTER COLUMN total_extensions SET DEFAULT 0;LL,
  errors TEXT,
  duration INTEGER,
  triggered_by TEXT NOT NULL DEFAULT 'cron',
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_logs_completed_at ON sync_logs(completed_at DESC);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);

-- Create data_gaps table
CREATE TABLE IF NOT EXISTS data_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extension_id UUID NOT NULL REFERENCES extensions(id) ON DELETE CASCADE,
  gap_date DATE NOT NULL,
  detected BOOLEAN NOT NULL DEFAULT true,
  backfilled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(extension_id, gap_date)
);

CREATE INDEX idx_data_gaps_detection ON data_gaps(detected, backfilled);

-- Function to detect data gaps (run daily)
CREATE OR REPLACE FUNCTION detect_data_gaps()
RETURNS TABLE(extension_id UUID, gap_date DATE, days_missing INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT 
      e.id as ext_id,
      generate_series(
        DATE_TRUNC('day', MIN(s.recorded_at)),
        CURRENT_DATE - INTERVAL '1 day',
        INTERVAL '1 day'
      )::DATE as expected_date
    FROM extensions e
    LEFT JOIN install_stats s ON e.id = s.extension_id
    GROUP BY e.id
  ),
  actual_dates AS (
    SELECT 
      extension_id,
      DATE_TRUNC('day', recorded_at)::DATE as actual_date
    FROM install_stats
  )
  SELECT 
    ds.ext_id as extension_id,
    ds.expected_date as gap_date,
    COUNT(*) OVER (PARTITION BY ds.ext_id) as days_missing
  FROM date_series ds
  LEFT JOIN actual_dates ad 
    ON ds.ext_id = ad.extension_id 
    AND ds.expected_date = ad.actual_date
  WHERE ad.actual_date IS NULL
    AND ds.expected_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- View for sync health dashboard
CREATE OR REPLACE VIEW sync_health AS
SELECT 
  DATE_TRUNC('day', completed_at) as sync_date,
  COUNT(*) as total_syncs,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_syncs,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_syncs,
  AVG(duration) as avg_duration_ms,
  MAX(completed_at) as last_sync_time
FROM sync_logs
GROUP BY DATE_TRUNC('day', completed_at)
ORDER BY sync_date DESC;

COMMENT ON TABLE sync_logs IS 'Tracks all sync operations for monitoring and debugging';
COMMENT ON TABLE data_gaps IS 'Tracks missing daily data points for extensions';
COMMENT ON FUNCTION detect_data_gaps IS 'Identifies dates where daily stats are missing';