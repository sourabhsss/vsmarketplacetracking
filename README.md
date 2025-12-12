# VS Code Extension Tracker

A modern, real-time analytics dashboard for tracking VS Code extension statistics with beautiful neubrutalism design.

## Features

- 🎨 **Beautiful UI** - Neubrutalism design with bold colors and shadows
- 📊 **Real-time Analytics** - Track installs, ratings, and growth trends
- 🔄 **Automated Sync** - Daily cron jobs with monitoring
- 📈 **Data Visualization** - Interactive charts powered by Recharts
- 🔔 **Smart Monitoring** - Sync health dashboard with gap detection
- ⚡ **Performance** - Built with Next.js 15 and Tailwind v4

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Package Manager**: pnpm

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd vsmarketplacetracking
pnpm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL setup scripts in the Supabase SQL Editor:
   - `SUPABASE_SQL_SETUP.sql` - Creates base tables
   - `SUPABASE_ADD_RATING_COLUMNS.sql` - Adds rating columns
   - `SUPABASE_SYNC_MONITORING_SETUP.sql` - Adds monitoring tables

### 3. Configure Environment Variables

Create a `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Cron Secret (generate a secure random string)
CRON_SECRET=your-random-secret-key
```

**Security Note**: Never commit `.env.local` to version control. Use a strong random string for `CRON_SECRET`.

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment on Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and import your repository
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `CRON_SECRET`

3. Deploy - Vercel will automatically deploy on every push

### 3. Verify Cron Job

The cron job runs daily at 00:00 UTC. Check `/monitoring` page for sync status.

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── cron/         # Cron job endpoints
│   │   ├── extensions/   # Extension CRUD
│   │   └── stats/        # Statistics endpoints
│   ├── extension/[id]/   # Extension detail page
│   ├── compare/          # Comparison page
│   ├── monitoring/       # Sync monitoring page
│   └── page.tsx          # Dashboard
├── components/
│   ├── ui/               # shadcn components
│   └── *.tsx             # Custom components
├── lib/
│   ├── supabase.ts       # Supabase client
│   ├── sync-utils.ts     # Sync utilities
│   ├── store.ts          # Zustand store
│   └── types.ts          # TypeScript types
└── public/               # Static assets
```

## Key Features

### Automated Daily Sync
- Runs at 00:00 UTC via Vercel Cron
- Fetches latest stats from VS Code Marketplace
- Prevents duplicate entries
- Includes retry logic and error handling

### Sync Health Monitoring
- Real-time sync status indicator
- Data gap detection
- Manual sync trigger
- Detailed sync logs

### Extension Management
- Add/remove extensions
- Track install counts, ratings, and downloads
- Compare multiple extensions
- View historical trends

## Security Checklist

✅ Environment variables properly configured
✅ No hardcoded secrets in code
✅ Cron endpoints protected with authorization
✅ `.env.local` in `.gitignore`
✅ Supabase RLS policies recommended (configure in Supabase dashboard)

## Database Setup Files

- `SUPABASE_SQL_SETUP.sql` - Initial database schema
- `SUPABASE_ADD_RATING_COLUMNS.sql` - Rating columns migration
- `SUPABASE_SYNC_MONITORING_SETUP.sql` - Monitoring tables

## API Endpoints

- `GET /api/extensions` - List all extensions
- `POST /api/extensions` - Add new extension
- `DELETE /api/extensions/[id]` - Remove extension
- `GET /api/stats/[id]` - Get extension statistics
- `GET /api/cron/sync-stats` - Sync job (protected)
- `GET /api/sync-health` - Check sync status

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.