# Setup Guide

Complete setup instructions for the VS Code Extension Tracker.

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Supabase account
- Vercel account (for deployment)

## Local Development Setup

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd vsmarketplacetracking
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Supabase Setup

#### Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for database to be ready

#### Run SQL Scripts

In Supabase Dashboard → SQL Editor, run these scripts in order:

1. **SUPABASE_SQL_SETUP.sql** - Creates base tables
   ```sql
   -- Creates: extensions, install_stats tables
   ```

2. **SUPABASE_ADD_RATING_COLUMNS.sql** - Adds rating columns
   ```sql
   -- Adds: average_rating, rating_count, download_count columns
   ```

3. **SUPABASE_SYNC_MONITORING_SETUP.sql** - Adds monitoring
   ```sql
   -- Creates: sync_logs table for monitoring
   ```

#### Get API Credentials

1. Go to Project Settings → API
2. Copy:
   - Project URL
   - `anon` `public` key

### 4. Environment Variables

Create `.env.local` in project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Cron Secret (generate random string)
CRON_SECRET=your-random-secret-key
```

**Generate secure CRON_SECRET:**
```bash
openssl rand -base64 32
```

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Add Extensions

1. Click "Add Extension" button
2. Enter VS Code Marketplace extension ID
   - Example: `ms-python.python`
   - Find ID in marketplace URL: `https://marketplace.visualstudio.com/items?itemName=ms-python.python`

## Production Deployment

### 1. Prepare Repository

```bash
# Ensure .env.local is in .gitignore
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Vercel

#### Import Project

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Framework Preset: Next.js (auto-detected)

#### Configure Environment Variables

Add in Vercel Dashboard → Settings → Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
CRON_SECRET=your-random-secret-key
```

**Important**: Use the same values from `.env.local`

#### Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Visit your deployment URL

### 3. Verify Cron Job

The cron job is configured in `vercel.json`:

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

This runs daily at 00:00 UTC.

**Verify:**
1. Wait 24 hours or trigger manually
2. Visit `your-app.vercel.app/monitoring`
3. Check sync logs

### 4. Manual Sync Trigger

```bash
curl -X POST https://your-app.vercel.app/api/cron/sync-stats \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Database Configuration

### Optional: Row Level Security (RLS)

For additional security, enable RLS in Supabase:

```sql
-- Enable RLS
ALTER TABLE extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE install_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read" ON extensions FOR SELECT USING (true);
CREATE POLICY "Public read" ON install_stats FOR SELECT USING (true);
CREATE POLICY "Public read" ON sync_logs FOR SELECT USING (true);
```

See [SECURITY.md](./SECURITY.md) for complete RLS setup.

## Troubleshooting

### Cron Job Not Running

1. Check Vercel Dashboard → Deployments → Functions
2. Verify `CRON_SECRET` is set correctly
3. Check `/monitoring` page for errors
4. Try manual trigger to test

### Database Connection Issues

1. Verify Supabase URL and key
2. Check Supabase project status
3. Ensure RLS policies allow access
4. Check network/firewall settings

### Build Failures

1. Check Node.js version (18+)
2. Clear `.next` folder: `rm -rf .next`
3. Reinstall dependencies: `pnpm install`
4. Check for TypeScript errors: `pnpm build`

### Extension Not Syncing

1. Verify extension ID is correct
2. Check marketplace availability
3. Review sync logs in database
4. Check rate limiting (100ms delay between requests)

## Monitoring

### Sync Health Dashboard

Visit `/monitoring` to view:
- Last sync time
- Success/failure status
- Total extensions tracked
- Data gaps (if any)
- Recent sync logs

### Database Queries

Check sync status directly:

```sql
-- Recent sync logs
SELECT * FROM sync_logs 
ORDER BY completed_at DESC 
LIMIT 10;

-- Extensions without recent data
SELECT e.display_name, MAX(s.recorded_at) as last_sync
FROM extensions e
LEFT JOIN install_stats s ON e.id = s.extension_id
GROUP BY e.id, e.display_name
HAVING MAX(s.recorded_at) < NOW() - INTERVAL '2 days';
```

## Maintenance

### Regular Tasks

**Daily**: Check sync status in `/monitoring`

**Weekly**: Review error logs in sync_logs table

**Monthly**: 
- Update dependencies: `pnpm update`
- Review Supabase usage
- Check Vercel function logs

**Quarterly**:
- Rotate `CRON_SECRET`
- Review and update RLS policies
- Audit database performance

## Next Steps

1. ✅ Complete local setup
2. ✅ Add your first extension
3. ✅ Deploy to Vercel
4. ✅ Verify cron job runs
5. ✅ Enable RLS (optional)
6. ✅ Set up monitoring alerts

## Support

- Check [README.md](./README.md) for overview
- Review [SECURITY.md](./SECURITY.md) for security best practices
- Open GitHub issue for bugs or questions