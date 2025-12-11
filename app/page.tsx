'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExtensionCard } from '@/components/extension-card';
import { AddExtensionDialog } from '@/components/add-extension-dialog';
import { AppHeader } from '@/components/app-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AnimatedStat } from '@/components/animated-stat';
import { ExtensionWithStats } from '@/lib/types';
import { Activity, Star, TrendingUp, Package } from 'lucide-react';
import Link from 'next/link';
import { useFallbackSync } from '@/lib/use-fallback-sync';

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
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-end">
          <AddExtensionDialog onAdd={(id) => addMutation.mutateAsync(id)} />
        </div>
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <div className="bg-card rounded-2xl border-3 border-foreground p-6 brutal-shadow-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_#000000] transition-all">
            <div className="flex items-center justify-between mb-4">
              <Package className="h-8 w-8 text-foreground" />
            </div>
            <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
              Total Extensions
            </p>
            <p className="text-4xl font-black text-foreground">
              <AnimatedStat value={extensions?.length || 0} />
            </p>
          </div>

          <div className="bg-primary rounded-2xl border-3 border-foreground p-6 brutal-shadow-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_#000000] transition-all">
            <div className="flex items-center justify-between mb-4">
              <Activity className="h-8 w-8 text-foreground" />
            </div>
            <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">
              Total Installs
            </p>
            <p className="text-4xl font-black text-foreground">
              <AnimatedStat value={totalInstalls} />
            </p>
          </div>

          <div className="bg-secondary rounded-2xl border-3 border-foreground p-6 brutal-shadow-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_#000000] transition-all">
            <div className="flex items-center justify-between mb-4">
              <Star className="h-8 w-8 text-foreground" />
            </div>
            <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">
              Average Rating
            </p>
            <p className="text-4xl font-black text-foreground">
              <AnimatedStat value={averageRating} decimals={1} />
            </p>
          </div>

          <div className="bg-accent rounded-2xl border-3 border-foreground p-6 brutal-shadow-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_#000000] transition-all">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-foreground" />
            </div>
            <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">
              Average Growth
            </p>
            <p className="text-4xl font-black text-foreground">
              <AnimatedStat value={averageGrowth} decimals={1} suffix="%" />
            </p>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-3">
            <Button
              variant="default"
              size="sm"
            >
              All Extensions
            </Button>
            <Button
              asChild
              variant="secondary"
              size="sm"
            >
              <Link href="/compare">Compare</Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl border-3 border-foreground" />
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
          <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-2xl border-3 border-foreground brutal-shadow-lg p-12">
            <div className="bg-primary rounded-xl border-3 border-foreground p-6 mb-6">
              <Activity className="h-16 w-16 text-foreground" />
            </div>
            <h3 className="text-2xl font-black mb-3 uppercase">No extensions yet</h3>
            <p className="text-muted-foreground font-bold mb-8 max-w-md uppercase text-sm">
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