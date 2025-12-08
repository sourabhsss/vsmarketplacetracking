# Complete Supabase Setup Guide (Step-by-Step)

## What is Supabase?
Supabase is a free, open-source alternative to Firebase. It provides a PostgreSQL database with a nice interface. The free tier is perfect for this project!

## Step 1: Create Supabase Account (5 minutes)

1. **Go to Supabase**
   - Visit: https://supabase.com
   - Click "Start your project" or "Sign Up"

2. **Sign up with GitHub** (recommended)
   - Click "Continue with GitHub"
   - Authorize Supabase
   
   OR sign up with email if you prefer

3. **You're in!** You should see the Supabase dashboard

## Step 2: Create a New Project (2 minutes)

1. **Click "New Project"**
   - You'll see a form

2. **Fill in the details:**
   - **Name**: `vscode-tracker` (or any name you like)
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to you (e.g., "US East" if in USA)
   - **Pricing Plan**: Select "Free" (it's already selected)

3. **Click "Create new project"**
   - Wait 1-2 minutes while Supabase sets up your database
   - You'll see a progress indicator

## Step 3: Get Your API Keys (1 minute)

1. **Go to Project Settings**
   - Click the gear icon ⚙️ in the left sidebar
   - Or click "Settings" at the bottom

2. **Click "API" in the left menu**

3. **Copy these two values:**
   - **Project URL**: Looks like `https://xxxxx.supabase.co`
   - **anon/public key**: Long string starting with `eyJ...`
   
   Keep these safe! You'll need them in a moment.

## Step 4: Create Database Tables (3 minutes)

1. **Go to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "+ New query"

2. **Copy and paste this SQL:**

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

-- Create index for better performance
CREATE INDEX idx_install_stats_extension_id 
ON install_stats(extension_id, recorded_at);

-- Enable Row Level Security (RLS) - allows public read/write for now
ALTER TABLE extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE install_stats ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on extensions" 
ON extensions FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on install_stats" 
ON install_stats FOR ALL 
USING (true) 
WITH CHECK (true);
```

3. **Click "Run" or press Ctrl+Enter**
   - You should see "Success. No rows returned"
   - This means your tables are created!

4. **Verify tables were created:**
   - Click "Table Editor" in the left sidebar
   - You should see `extensions` and `install_stats` tables

## Step 5: Configure Your App (2 minutes)

1. **Open your `.env.local` file** in the project

2. **Replace with your actual values:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-long-key-here
```

3. **Save the file**

4. **Restart your dev server:**
   - Stop the current server (Ctrl+C in terminal)
   - Run `pnpm dev` again

## Step 6: Test It! (1 minute)

1. **Open http://localhost:3000**

2. **Click "Add Extension"**

3. **Try adding a popular extension:**
   - Enter: `esbenp.prettier-vscode`
   - Click "Add Extension"

4. **Success!** You should see the extension card appear

## Troubleshooting

### Error: "Failed to add extension"
- Check your `.env.local` has correct values
- Make sure you restarted the dev server after adding env variables
- Check Supabase project is not paused (free tier pauses after 1 week of inactivity)

### Error: "Extension not found"
- Make sure the extension ID is correct (format: `publisher.extension-name`)
- Try a different extension from POPULAR_EXTENSIONS.md

### Can't see tables in Supabase
- Make sure the SQL ran successfully (check for error messages)
- Try refreshing the Table Editor page

### Still stuck?
- Check Supabase logs: Go to "Logs" in left sidebar
- Check browser console for errors (F12 → Console tab)

## What's Next?

Your app is now connected to a real database! 🎉

- Extensions you add will be saved
- Data persists even if you close the browser
- You can access your data from anywhere
- Free tier includes 500MB database (plenty for this app)

## Managing Your Data

You can view and edit data directly in Supabase:
1. Go to "Table Editor" in Supabase dashboard
2. Click on `extensions` or `install_stats` table
3. You can add, edit, or delete rows manually

## Free Tier Limits

- **Database**: 500MB (you'll use ~1MB for 100 extensions)
- **Bandwidth**: 2GB/month (plenty for personal use)
- **Pauses**: After 1 week of inactivity (just visit dashboard to wake it up)

That's it! You're all set up! 🚀