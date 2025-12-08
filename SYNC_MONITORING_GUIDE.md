# Sync Monitoring & Data Integrity Guide

This guide explains the enhanced data syncing system with monitoring, error handling, and automatic recovery.

## Features Implemented

### 1. **Enhanced Cron Job with Retry Logic**
- ✅ Exponential backoff retry (3 attempts with increasing delays)
- ✅ Duplicate detection (skips if today's data already exists)
- ✅ Rate limiting protection (200ms delay between requests)
- ✅ Comprehensive error logging

### 2. **Sync Health Monitoring**
- ✅ Real-time sync status indicator in UI
- ✅ Tracks all sync operations (success/partial/failed)
- ✅ Detects overdue syncs (>25 hours)
- ✅ Shows last 24-hour metrics
- ✅ Overall success rate and performance metrics

### 3. **Data Gap Detection**
- ✅ Automatic detection of missing daily data
- ✅ Gap tracking in database
- ✅ Visual indicators for data quality issues

### 4. **Fallback Sync Mechanism**
- ✅ Client-side detection of failed cron jobs
- ✅ Automatic sync trigger on user visit if data is stale
- ✅ Prevents excessive API calls (once per session)

### 5. **Alert System** (Optional)
- ✅ Webhook support for failed syncs
- ✅ Configurable via environment variable
- ✅ Works with Discord, Slack, or custom webhooks

## Setup Instructions

### Step 1: Run Database Migration

Execute the SQL in `SUPABASE_SYNC_MONITORING_SETUP.sql` in your Supabase SQL Editor:

```sql
-- This creates:
-- 1. sync_logs table - tracks all sync operations
-- 2. data_gaps table - tracks missing data points
-- 3. detect_data_gaps() function - identifies gaps
-- 4. sync_health view - dashboard metrics
```

### Step 2: Configure Environment Variables

Add to your `.env.local`:

```bash
# Required - already configured
CRON_SECRET=your-secret-key

# Optional - for sync failure alerts
SYNC_ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/...
# or
SYNC_ALERT_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### Step 3: Verify Cron Job Setup

Ensure your `vercel.json` has the cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-stats",
      "schedule": "0 0 * * *"
    }
  ]
}
```

## How It Works

### Daily Sync Process

1. **Cron Trigger** (00:00 UTC daily)
   - Vercel cron job calls `/api/cron/sync-stats`
   - Authorization verified via `CRON_SECRET`

2. **Smart Sync Logic**
   ```
   For each extension:
     ├─ Check if today's data exists → Skip if yes
     ├─ Fetch from VS Code Marketplace (with retry)
     ├─ Validate data completeness
     ├─ Save to database
     └─ Log success/failure
   ```

3. **Post-Sync Actions**
   - Log sync operation to `sync_logs`
   - Detect and record data gaps
   - Send alert if sync failed/partial

4. **Fallback Mechanism**
   - User visits app → Check last sync time
   - If >25 hours → Trigger sync automatically
   - Prevents data staleness from cron failures

### Monitoring Dashboard

The sync health indicator shows:
- **Green (Healthy)**: Recent successful sync, no issues
- **Yellow (Warning)**: Sync overdue or some failures
- **Red (Critical)**: Multiple failures or complete sync failure

Click the indicator to see:
- Last sync timestamp and status
- Success/failure counts
- Duration metrics
- Data gap count
- 24-hour activity

## API Endpoints

### GET /api/sync-health
Returns comprehensive sync health metrics:
```json
{
  "health": {
    "status": "healthy|warning|critical",
    "lastSync": { ... },
    "syncOverdue": false,
    "metrics": { ... },
    "last24Hours": { ... }
  },
  "gaps": {
    "total": 0,
    "recent": []
  }
}
```

### POST /api/cron/sync-stats
Triggers manual sync (requires auth):
```bash
curl -X POST https://your-app.vercel.app/api/cron/sync-stats \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "X-Triggered-By: manual"
```

## Webhook Alert Format

When a sync fails, the webhook receives:
```json
{
  "status": "failed",
  "title": "VS Code Extension Sync Failed",
  "details": {
    "successful": 0,
    "failed": 5,
    "timestamp": "2025-12-08T10:00:00Z",
    "errors": [
      "Error syncing extension-1: Network timeout",
      "Error syncing extension-2: API rate limit"
    ]
  }
}
```

### Discord Webhook Setup
1. Go to Server Settings → Integrations → Webhooks
2. Create webhook, copy URL
3. Add to `.env.local` as `SYNC_ALERT_WEBHOOK_URL`

### Slack Webhook Setup
1. Create Slack app at api.slack.com
2. Enable Incoming Webhooks
3. Add to workspace, copy URL
4. Add to `.env.local` as `SYNC_ALERT_WEBHOOK_URL`

## Troubleshooting

### Sync Not Running
1. Check Vercel cron logs in dashboard
2. Verify `CRON_SECRET` matches in Vercel env vars
3. Check `vercel.json` cron configuration

### Data Gaps Detected
1. View gaps in sync health tooltip
2. Run manual sync to backfill
3. Check `data_gaps` table in Supabase

### High Failure Rate
1. Check VS Code Marketplace API status
2. Review error logs in `sync_logs` table
3. Verify network connectivity
4. Check rate limiting (may need to increase delays)

## Best Practices

1. **Monitor Regularly**: Check sync health indicator daily
2. **Set Up Alerts**: Configure webhook for immediate notification
3. **Manual Sync**: Use sync button if automatic sync fails
4. **Review Logs**: Periodically check `sync_logs` for patterns
5. **Data Validation**: Monitor gap count and backfill as needed

## Database Queries

### View Recent Sync History
```sql
SELECT * FROM sync_logs 
ORDER BY completed_at DESC 
LIMIT 10;
```

### Check Data Gaps
```sql
SELECT e.display_name, dg.gap_date, dg.backfilled
FROM data_gaps dg
JOIN extensions e ON dg.extension_id = e.id
WHERE dg.backfilled = false
ORDER BY dg.gap_date DESC;
```

### Sync Health Summary
```sql
SELECT * FROM sync_health
LIMIT 7;
```

## Performance Optimization

- **Rate Limiting**: 200ms delay between requests (adjustable)
- **Duplicate Prevention**: Checks existing data before fetching
- **Retry Logic**: 3 attempts with exponential backoff
- **Efficient Queries**: Indexed on key columns
- **Minimal Payload**: Only fetches required fields

## Future Enhancements

- [ ] Backfill functionality for historical gaps
- [ ] Email notifications (via Resend)
- [ ] Detailed analytics dashboard page
- [ ] Configurable sync frequency
- [ ] Multi-region sync for redundancy
- [ ] Data retention policies