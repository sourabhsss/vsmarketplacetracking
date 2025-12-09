# Vercel Deployment Setup Guide

## Fix "Sync Stats Failed" Error

The sync stats button fails because the `CRON_SECRET` environment variable is missing in Vercel.

### Step 1: Generate a Secret Key

Go to: https://generate-secret.vercel.app/32

Copy the generated secret (it should look like: `a1b2c3d4e5f6...`)

### Step 2: Add Environment Variable in Vercel

1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your project: **vsmarketplacetracking**
3. Click **Settings** (top navigation)
4. Click **Environment Variables** (left sidebar)
5. Click **Add New**
6. Fill in:
   - **Key**: `CRON_SECRET`
   - **Value**: (paste the secret you generated)
   - **Environments**: Check all (Production, Preview, Development)
7. Click **Save**

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

### Step 4: Test

1. Go to your site: https://vsmarketplacetracking.vercel.app/
2. Click **"Sync Stats"** button
3. Should show success message! ✅

## Other Environment Variables to Check

Make sure these are also set in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `CRON_SECRET` - The secret you just added

## Automatic Daily Sync

The cron job (`vercel.json`) will automatically sync stats every day at midnight UTC. No manual action needed after setup!

## Troubleshooting

If sync still fails:
1. Check Vercel logs: Deployments → Click deployment → Functions → `/api/cron/sync-stats`
2. Verify all environment variables are set
3. Check Supabase is accessible from Vercel
4. Ensure database has the new columns (average_rating, etc.)

That's it! Your production app should now sync stats automatically. 🎉