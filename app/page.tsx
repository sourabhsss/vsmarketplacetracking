'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExtensionCard } from '@/components/extension-card';
import { AddExtensionDialog } from '@/components/add-extension-dialog';
import { SyncHealthIndicator } from '@/components/sync-health-indicator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AnimatedStat } from '@/components/animated-stat';
import { ExtensionWithStats } from '@/lib/types';
import { Activity, RefreshCw, Star, TrendingUp, Package } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useFallbackSync } from '@/lib/use-fallback-sync';
import { Particles } from '@/components/ui/particles';
import { BorderBeam } from '@/components/ui/border-beam';

export default function Home() {
  const queryClient = useQueryClient();
  
  // Enable fallback sync if cron fails
  useFallbackSync();

  const { data: extensions, isLoading } = useQuery<ExtensionWithStats[]>({
    queryKey: ['extensions'],
    queryFn: async () => {
      const res = await fetch('/api/extensions');
      if (!res.ok) throw new Error('Failed to fetch extensions');
      const data = await res.json();
      
      // Fetch stats for each extension
      const extensionsWithStats = await Promise.all(
        data.map(async (ext: { id: string }) => {
          const statsRes = await fetch(`/api/stats/${ext.id}?range=week`);
          const stats = await statsRes.json();
          
          const currentInstalls = stats[stats.length - 1]?.install_count || 0;
          const previousInstalls = stats[0]?.install_count || 0;
          const trend = previousInstalls
            ? ((currentInstalls - previousInstalls) / previousInstalls) * 100
            : 0;

          return {
            ...ext,
            currentInstalls,
            trend,
            stats,
          };
        })
      );

      return extensionsWithStats;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (extensionId: string) => {
      const res = await fetch('/api/extensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extensionId }),
      });
      if (!res.ok) throw new Error('Failed to add extension');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extensions'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/extensions/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete extension');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extensions'] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/cron/sync-stats', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to sync stats');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['extensions'] });
      toast.success(`Synced ${data.synced} extension(s) successfully!`);
    },
    onError: () => {
      toast.error('Failed to sync stats');
    },
  });

  const totalInstalls = extensions?.reduce(
    (sum, ext) => sum + ext.currentInstalls,
    0
  ) || 0;

  const averageRating = extensions?.length
    ? extensions.reduce((sum, ext) => sum + (ext.averageRating || 0), 0) / extensions.length
    : 0;

  const averageGrowth = extensions?.length
    ? extensions.reduce((sum, ext) => sum + ext.trend, 0) / extensions.length
    : 0;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated particles background */}
      <Particles variant="default" className="absolute inset-0 pointer-events-none" />
      
      <header className="border-b border-border/50 glass-strong sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                <Activity className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                  VS Code Extension Tracker
                </h1>
                <p className="text-sm text-muted-foreground">
                  Real-time analytics for your extensions
                </p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <SyncHealthIndicator />
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="border-border/50 hover:border-primary/50 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <RefreshCw className={`h-4 w-4 mr-2 relative z-10 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                <span className="relative z-10">{syncMutation.isPending ? 'Syncing...' : 'Sync Stats'}</span>
              </Button>
              <AddExtensionDialog onAdd={(id) => addMutation.mutateAsync(id)} />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-border/50 glass-effect p-6 card-hover group relative overflow-hidden">
            <BorderBeam lightColor="#6366f1" lightWidth={250} duration={10} className="absolute inset-0 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Package className="h-5 w-5 text-primary" />
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:glow-primary transition-all">
                  <Package className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Total Extensions
              </p>
              <p className="text-3xl font-bold gradient-text">
                <AnimatedStat value={extensions?.length || 0} />
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 glass-effect p-6 card-hover group relative overflow-hidden">
            <BorderBeam lightColor="#ec4899" lightWidth={250} duration={12} className="absolute inset-0 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Activity className="h-5 w-5 text-secondary" />
                <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:glow-secondary transition-all">
                  <Activity className="h-4 w-4 text-secondary" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Total Installs
              </p>
              <p className="text-3xl font-bold gradient-text">
                <AnimatedStat value={totalInstalls} />
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 glass-effect p-6 card-hover group relative overflow-hidden">
            <BorderBeam lightColor="#f59e0b" lightWidth={250} duration={14} className="absolute inset-0 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Star className="h-5 w-5 text-warning" />
                <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all">
                  <Star className="h-4 w-4 text-warning" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Average Rating
              </p>
              <p className="text-3xl font-bold gradient-text">
                <AnimatedStat value={averageRating} decimals={1} />
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 glass-effect p-6 card-hover group relative overflow-hidden">
            <BorderBeam lightColor="#10b981" lightWidth={250} duration={16} className="absolute inset-0 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <TrendingUp className="h-5 w-5 text-success" />
                <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center group-hover:glow-success transition-all">
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Average Growth
              </p>
              <p className="text-3xl font-bold gradient-text">
                <AnimatedStat value={averageGrowth} decimals={1} suffix="%" />
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="glass-effect border border-border/50"
            >
              All Extensions
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="glass-effect border border-border/50"
            >
              <Link href="/compare">Compare</Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : extensions && extensions.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {extensions.map((extension) => (
              <ExtensionCard
                key={extension.id}
                extension={extension}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Activity className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No extensions yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Start tracking your VS Code extensions by adding them using the button
              above.
            </p>
            <AddExtensionDialog onAdd={(id) => addMutation.mutateAsync(id)} />
          </div>
        )}
      </main>
    </div>
  );
}