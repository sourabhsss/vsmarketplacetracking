# Automatic Stats Sync Setup

Your VS Code Extension Tracker now has **automatic daily stats syncing**! 🎉

## How It Works

- **Cron Job**: Runs automatically every day at midnight (UTC)
- **What it does**: Fetches latest install counts for all your tracked extensions
- **Where**: Saves snapshots to your Supabase database
- **Result**: Builds historical data for daily/weekly/monthly charts

## Setup Steps

### 1. Update Environment Variables

Add this to your `.env.local`:

```env
CRON_SECRET=your-random-secret-here-change-this
```

**Generate a random secret:**
- Go to: https://generate-secret.vercel.app/32
- Copy the generated string
- Replace `your-random-secret-here-change-this` with it

### 2. Test Locally (Optional)

Test the sync manually before deploying:

```bash
# Click the "Sync Stats" button in the app
# OR visit: http://localhost:3000/api/cron/sync-stats
```

### 3. Deploy to Vercel

```bash
git add .
git commit -m "Add automatic stats sync"
git push
```

### 4. Configure Vercel Environment Variable

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add: `CRON_SECRET` = (your generated secret)
4. Click **Save**
5. Redeploy your app

### 5. Verify It's Working

After deployment:
1. Go to Vercel dashboard → **Deployments** → Your latest deployment
2. Click **Functions** tab
3. You should see `/api/cron/sync-stats` listed
4. After 24 hours, check the **Logs** to see it running

## Cron Schedule

Current schedule: `0 0 * * *` (Every day at midnight UTC)

Want to change it? Edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-stats",
      "schedule": "0 */6 * * *"  // Every 6 hours
    }
  ]
}
```

### Common Schedules:
- `0 * * * *` - Every hour
- `0 */6 * * *` - Every 6 hours
- `0 0 * * *` - Daily at midnight
- `0 0 * * 0` - Weekly on Sunday

## Manual Sync

You can also manually sync anytime by clicking the **"Sync Stats"** button in the dashboard header!

## Monitoring

Check sync logs in Vercel:
1. Go to your project dashboard
2. Click **Logs**
3. Filter by `/api/cron/sync-stats`

## Troubleshooting

### Cron not running?
- Make sure you're on Vercel (crons don't work locally)
- Check that `vercel.json` is in your repo root
- Verify `CRON_SECRET` is set in Vercel environment variables

### Getting 401 errors?
- Make sure `CRON_SECRET` matches in both `.env.local` and Vercel

### Extensions not syncing?
- Check Vercel logs for error messages
- Verify your Supabase connection is working
- Try the manual "Sync Stats" button first

## What Gets Saved

Each sync creates a new record in `install_stats` table:
- `extension_id`: Which extension
- `install_count`: Current install count
- `recorded_at`: When the snapshot was taken
- `created_at`: Database timestamp

Over time, this builds your historical data for charts! 📊