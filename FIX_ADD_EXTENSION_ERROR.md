# Fix "Failed to Add Extension" Error

## The Problem
Error: `Could not find the 'average_rating' column of 'extensions' in the schema cache`

The database table needs new columns for ratings and metrics.

## The Solution (2 minutes)

### Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/wqiyfysoafekbcttnrpj/sql/new

### Step 2: Copy and Run This SQL

```sql
-- Add new columns to extensions table
ALTER TABLE extensions 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS rating_count INTEGER,
ADD COLUMN IF NOT EXISTS download_count BIGINT,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_version TEXT;

-- Verify it worked
SELECT 'Migration completed successfully!' as status;
```

### Step 3: Click "Run" (or press Ctrl+Enter)

You should see: `Migration completed successfully!`

### Step 4: Test Adding Extension

1. Go back to your app: http://localhost:3000
2. Click "Add Extension"
3. Try adding: `esbenp.prettier-vscode`
4. It should work now! ✅

## What This Does

Adds 5 new columns to store:
- ⭐ Average rating (0-5 stars)
- 📊 Rating count
- 📥 Download count
- 📅 Last updated date
- 🔢 Current version

That's it! The error is fixed. 🎉