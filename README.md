# VS Code Extension Analytics Tracker

A modern analytics dashboard for tracking VS Code Marketplace extension statistics over time. Built with Next.js 15, shadcn/ui, and Supabase.

## Features

- 📊 Track multiple VS Code extensions
- 📈 View daily, weekly, monthly, and all-time statistics
- 🎨 Beautiful charts powered by Recharts
- 🔄 Real-time data synchronization
- 🎯 Trend indicators and growth metrics
- 📱 Fully responsive design

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: shadcn/ui + Tailwind CSS v4
- **Charts**: Recharts
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm (recommended) or npm
- Supabase account (free tier)

### Installation

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key

3. Configure environment variables:

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_supabase_postgres_url
```

4. Set up the database:

Run the following SQL in your Supabase SQL editor:

```sql
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

CREATE TABLE install_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extension_id UUID REFERENCES extensions(id) ON DELETE CASCADE,
  install_count BIGINT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_install_stats_extension_id ON install_stats(extension_id, recorded_at);
```

5. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Usage

1. **Add an Extension**: Click "Add Extension" and enter the extension ID (e.g., `esbenp.prettier-vscode`)
2. **View Dashboard**: See all tracked extensions with current install counts and trends
3. **View Details**: Click "View Details" on any extension card to see detailed statistics
4. **Time Ranges**: Switch between day, week, month, and all-time views

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy

### Manual Deployment

```bash
pnpm build
pnpm start
```

## Free Tier Limits

- **Vercel**: 100GB bandwidth/month
- **Supabase**: 500MB database, 2GB bandwidth/month
- **VS Code API**: Rate limited (handled with caching)

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── extension/        # Extension detail pages
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Dashboard page
├── components/
│   ├── ui/               # shadcn components
│   ├── extension-card.tsx
│   ├── stats-chart.tsx
│   └── add-extension-dialog.tsx
├── lib/
│   ├── supabase.ts       # Supabase client
│   ├── store.ts          # Zustand store
│   └── types.ts          # TypeScript types
└── prisma/
    └── schema.prisma     # Database schema
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT