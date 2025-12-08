# Quick Setup Guide

## Step 1: Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Project Settings → API
4. Copy your project URL and anon/public key

## Step 2: Database Setup

1. In your Supabase project, go to SQL Editor
2. Run this SQL to create the tables:

```sql
-- Create extensions table
CREATE TABLE extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extension_id TEXT UNIQUE NOT NULL,
  publisher_name TEXT NOT NULL,
  extension_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  marketplace_url TEXT NOT NULL,
  icon_url TEXT,
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
```

## Step 3: Environment Variables

1. Copy `.env.local` file and update with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
```

## Step 4: Run the App

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Step 5: Add Your First Extension

1. Click "Add Extension" button
2. Enter a VS Code extension ID (format: `publisher.extension-name`)
   - Example: `esbenp.prettier-vscode`
   - Example: `dbaeumer.vscode-eslint`
   - Example: `ms-python.python`

3. The app will fetch the extension details from VS Code Marketplace
4. View statistics on the dashboard

## Finding Extension IDs

To find an extension ID:
1. Go to [VS Code Marketplace](https://marketplace.visualstudio.com/)
2. Search for an extension
3. The URL will be: `https://marketplace.visualstudio.com/items?itemName=PUBLISHER.EXTENSION`
4. Use `PUBLISHER.EXTENSION` as the extension ID

## Optional: Set Up Automatic Data Sync

To automatically fetch new statistics daily, you can set up a cron job using Vercel Cron or similar service to call your sync endpoint.

Create `app/api/cron/sync-stats/route.ts` for automatic syncing (implementation not included in this version).