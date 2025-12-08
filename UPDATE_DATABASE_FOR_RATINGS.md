# Update Database to Support Ratings

## Quick Update (If you already have extensions)

1. **Go to Supabase SQL Editor**: https://supabase.com/dashboard/project/wqiyfysoafekbcttnrpj/sql/new

2. **Run this SQL**:
```sql
-- Add new columns to extensions table
ALTER TABLE extensions 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS rating_count INTEGER,
ADD COLUMN IF NOT EXISTS download_count BIGINT,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_version TEXT;
```

3. **Click Run** (or Ctrl+Enter)

4. **Refresh your app** and click "Sync Stats" button to fetch ratings for existing extensions

## What This Adds

- **average_rating**: Star rating (0-5) from VS Code Marketplace
- **rating_count**: Number of ratings
- **download_count**: Total downloads
- **last_updated**: When the extension was last updated
- **current_version**: Current version number

## Testing

1. Add a new extension (e.g., `esbenp.prettier-vscode`)
2. You should now see the star rating on the card and detail page
3. Click "Sync Stats" to update ratings for all extensions

That's it! Your database now supports ratings and additional metrics. 🌟