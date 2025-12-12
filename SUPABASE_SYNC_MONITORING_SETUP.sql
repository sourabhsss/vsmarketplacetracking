-- Check sync logs
SELECT * FROM sync_logs ORDER BY completed_at DESC LIMIT 5;

-- Check install stats
SELECT 
  e.display_name,
  COUNT(*) as data_points,
  MAX(s.install_count) as latest_count,
  MAX(s.recorded_at) as last_recorded
FROM extensions e
LEFT JOIN install_stats s ON e.id = s.extension_id
GROUP BY e.id, e.display_name;