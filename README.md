# VS Code Extension Tracker

A modern, real-time analytics dashboard for tracking VS Code extension statistics with beautiful 3D card effects and comprehensive monitoring.

## Features

- 🎨 **Beautiful UI** - Comet Card 3D tilt effects from Aceternity UI
- 📊 **Real-time Analytics** - Track installs, ratings, and growth trends
- 🔄 **Automated Sync** - Daily cron jobs with retry logic and fallback mechanisms
- 📈 **Data Visualization** - Interactive charts powered by Recharts
- 🔔 **Smart Monitoring** - Sync health dashboard with gap detection
- ⚡ **Performance** - Built with Next.js 15, Tailwind v4, and optimized images

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

### 1. Clone the repository

```bash
git clone https://github.com/sourabhsss/vsmarketplacetracking.git
cd vsmarketplacetracking
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL setup scripts in order:
   - `SUPABASE_SQL_SETUP.sql` - Creates base tables
   - `SUPABASE_ADD_RATING_COLUMNS.sql` - Adds rating columns
   - `SUPABASE_SYNC_MONITORING_SETUP.sql` - Adds monitoring tables

### 4. Configure environment variables

Create a `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Cron Secret (generate a random string)
CRON_SECRET=your-random-secret-key

# Optional: Webhook for sync alerts
SYNC_ALERT_WEBHOOK_URL=your-webhook-url
```

### 5. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Deployment on Vercel

### 1. Push to GitHub

```bash
git push origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `CRON_SECRET`
   - `SYNC_ALERT_WEBHOOK_URL` (optional)

### 3. Deploy

Vercel will automatically deploy on every push to main.

## Documentation

- [Setup Guide](./SETUP.md) - Detailed setup instructions
- [Simple Setup](./SIMPLE_SETUP.md) - Quick start guide
- [Automatic Sync Setup](./AUTOMATIC_SYNC_SETUP.md) - Cron job configuration
- [Sync Monitoring Guide](./SYNC_MONITORING_GUIDE.md) - Monitoring and alerts
- [Supabase Setup](./SUPABASE_SETUP_GUIDE.md) - Database configuration

## Key Features Explained

### Comet Card 3D Effects
Extension cards feature mouse-tracked 3D tilt effects for an engaging user experience.

### Sync Health Monitoring
- Real-time sync status indicator
- Data gap detection
- Webhook alerts for failures
- Fallback sync on user visit

### Automated Daily Sync
- Runs at 00:00 UTC daily via Vercel Cron
- Retry logic with exponential backoff
- Duplicate detection
- Rate limiting protection

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── extension/[id]/   # Extension detail page
│   ├── compare/          # Comparison page
│   └── page.tsx          # Dashboard
├── components/
│   ├── ui/               # shadcn components
│   └── *.tsx             # Custom components
├── lib/
│   ├── supabase.ts       # Supabase client
│   ├── sync-utils.ts     # Sync utilities
│   └── types.ts          # TypeScript types
└── prisma/
    └── schema.prisma     # Database schema
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues and questions, please open an issue on GitHub.