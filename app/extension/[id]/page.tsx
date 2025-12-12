'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsChart } from '@/components/stats-chart';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedStat } from '@/components/animated-stat';
import { TrendIndicator } from '@/components/trend-indicator';
import { ArrowLeft, ExternalLink, Trash2, Activity, TrendingUp, Star, Package } from 'lucide-react';
import { useState } from 'react';
import { TimeRange } from '@/lib/types';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function ExtensionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  const { data: extension, isLoading: extensionLoading } = useQuery({
    queryKey: ['extension', params.id],
    queryFn: async () => {
      const res = await fetch('/api/extensions');
      if (!res.ok) throw new Error('Failed to fetch extension');
      const data = await res.json();
      return data.find((ext: { id: string }) => ext.id === params.id);
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats', params.id, timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/stats/${params.id}?range=${timeRange}`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    enabled: !!params.id,
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
      toast.success('Extension deleted successfully');
      router.push('/');
    },
    onError: () => {
      toast.error('Failed to delete extension');
    },
  });

  // Find the baseline value from Dec 8, 2025
  const baselineDate = new Date('2025-12-08');
  
  // Find the stat closest to Dec 8, 2025
  const baselineStat = stats?.find((stat: { recorded_at: string }) => {
    const statDate = new Date(stat.recorded_at);
    const statDateStr = statDate.toISOString().split('T')[0]; // Get YYYY-MM-DD
    const baselineDateStr = baselineDate.toISOString().split('T')[0];
    return statDateStr === baselineDateStr;
  });
  
  // If no exact match, use the first stat on or after Dec 8
  const baselineInstalls = baselineStat 
    ? Number(baselineStat.install_count) 
    : (stats && stats.length > 0 ? Number(stats[0].install_count) : 0);

  console.log('Baseline date:', baselineDate.toISOString().split('T')[0]);
  console.log('Baseline stat found:', baselineStat ? 'Yes' : 'No');
  console.log('Baseline installs:', baselineInstalls);

  // Filter and group by date, keeping only the highest install count per date
  const filteredStats = stats
    ?.filter((stat: { recorded_at: string }) => {
      const statDate = new Date(stat.recorded_at);
      return statDate >= baselineDate;
    }) || [];

  // Group by date and get the max install count for each date
  const groupedByDate = filteredStats.reduce((acc: Record<string, number>, stat: { recorded_at: string; install_count: string | number }) => {
    const dateKey = new Date(stat.recorded_at).toISOString().split('T')[0]; // YYYY-MM-DD
    const installs = Number(stat.install_count);
    
    if (!acc[dateKey] || installs > acc[dateKey]) {
      acc[dateKey] = installs;
    }
    
    return acc;
  }, {});

  // Convert back to array format and sort by date
  const chartData = Object.entries(groupedByDate)
    .map(([date, installs]) => ({
      date,
      installs: installs as number,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  console.log('Chart data points:', chartData.length);
  if (chartData.length > 0) {
    console.log('First data point:', chartData[0]);
    console.log('Last data point:', chartData[chartData.length - 1]);
  }

  const currentInstalls = stats && stats.length > 0 
    ? Number(stats[stats.length - 1]?.install_count || 0) 
    : 0;

  const previousInstalls = stats && stats.length > 0 
    ? Number(stats[0]?.install_count || 0) 
    : 0;

  const growthRate = previousInstalls > 0
    ? ((currentInstalls - previousInstalls) / previousInstalls) * 100
    : 0;

  const growthValue = currentInstalls - previousInstalls;

  if (extensionLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Skeleton className="h-12 w-64 mb-8 rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!extension) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Extension not found</h2>
          <Button onClick={() => router.push('/')}>Go back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Breadcrumb */}
        <div className="mb-6 md:mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="-ml-2"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
            <span className="text-xs md:text-sm">Back to Extensions</span>
          </Button>
        </div>

        {/* Extension Info Card */}
        <div className="bg-card border-3 border-foreground p-4 md:p-6 brutal-shadow-lg mb-6 md:mb-8">
          {/* Header with Actions */}
          <div className="flex items-start justify-between gap-4 mb-4 md:mb-6">
            <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
              {extension.iconUrl ? (
                <Image
                  src={extension.iconUrl}
                  alt={extension.displayName}
                  width={80}
                  height={80}
                  className="w-16 h-16 md:w-20 md:h-20 border-3 border-foreground shrink-0"
                />
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 bg-primary border-3 border-foreground flex items-center justify-center shrink-0">
                  <Package className="h-8 w-8 md:h-10 md:w-10 text-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-foreground uppercase" title={extension.displayName}>
                  {extension.displayName}
                </h1>
                <p className="text-foreground font-bold mt-2 uppercase text-sm md:text-base tracking-wider">
                  by {extension.publisherName}
                </p>
                {extension.averageRating && (
                  <div className="flex items-center gap-2 mt-3">
                    <Star className="h-5 w-5 fill-warning text-warning" />
                    <span className="text-lg font-bold text-foreground">{extension.averageRating.toFixed(1)}</span>
                    {extension.ratingCount && (
                      <span className="text-sm text-foreground font-bold">
                        ({extension.ratingCount.toLocaleString()} ratings)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 shrink-0">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Extension</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &quot;{extension.displayName}&quot;? This will remove all historical data and cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate(extension.id)}
                      className="bg-destructive hover:bg-destructive text-white"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button asChild variant="secondary" size="sm">
                <a
                  href={extension.marketplaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Marketplace</span>
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-4 mb-8">
          <div className="bg-primary border-3 border-foreground p-4 md:p-6 brutal-shadow-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_#000000] transition-all">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <Activity className="h-6 w-6 md:h-8 md:w-8 text-foreground" />
            </div>
            <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">
              Total Installs
            </p>
            <p className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black text-foreground break-all">
              <AnimatedStat value={currentInstalls} />
            </p>
          </div>

          <div className="bg-secondary border-3 border-foreground p-4 md:p-6 brutal-shadow-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_#000000] transition-all">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <Star className="h-6 w-6 md:h-8 md:w-8 text-foreground fill-warning" />
            </div>
            <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">
              Average Rating
            </p>
            <p className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground break-all">
              <AnimatedStat value={extension.averageRating || 0} decimals={1} />
            </p>
            {extension.ratingCount && (
              <p className="text-xs font-bold text-foreground mt-2 uppercase tracking-wider">
                {extension.ratingCount.toLocaleString()} ratings
              </p>
            )}
          </div>

          <div className="bg-accent border-3 border-foreground p-4 md:p-6 brutal-shadow-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_#000000] transition-all">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-foreground" />
            </div>
            <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">
              Growth ({timeRange})
            </p>
            <p className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black text-foreground break-all">
              <AnimatedStat value={growthValue} prefix="+" />
            </p>
            <div className="mt-2">
              <TrendIndicator value={growthRate} />
            </div>
          </div>

          <div className="bg-card border-3 border-foreground p-4 md:p-6 brutal-shadow-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_#000000] transition-all">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-foreground" />
            </div>
            <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
              Growth Rate
            </p>
            <p className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground break-all">
              <AnimatedStat value={growthRate} decimals={1} suffix="%" />
            </p>
          </div>
        </div>

        {/* Time Range Selector */}
        <Tabs
          value={timeRange}
          onValueChange={(value) => setTimeRange(value as TimeRange)}
          className="mb-8"
        >
          <TabsList className="border-3 border-foreground p-1 bg-card">
            <TabsTrigger 
              value="day"
              className="data-[state=active]:bg-primary data-[state=active]:text-foreground font-bold uppercase text-xs"
            >
              Last 24 Hours
            </TabsTrigger>
            <TabsTrigger 
              value="week"
              className="data-[state=active]:bg-primary data-[state=active]:text-foreground font-bold uppercase text-xs"
            >
              Last Week
            </TabsTrigger>
            <TabsTrigger 
              value="month"
              className="data-[state=active]:bg-primary data-[state=active]:text-foreground font-bold uppercase text-xs"
            >
              Last Month
            </TabsTrigger>
            <TabsTrigger 
              value="all"
              className="data-[state=active]:bg-primary data-[state=active]:text-foreground font-bold uppercase text-xs"
            >
              All Time
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Chart */}
        <div className="bg-card rounded-2xl border-3 border-foreground p-6 brutal-shadow-lg">
          <h2 className="text-xl font-black text-foreground uppercase mb-6">Install Statistics</h2>
          <div>
            {statsLoading ? (
              <Skeleton className="h-96 w-full rounded-xl border-3 border-foreground" />
            ) : chartData.length > 0 ? (
              <StatsChart data={chartData} className="h-96 w-full" minValue={baselineInstalls} />
            ) : (
              <div className="h-96 flex flex-col items-center justify-center">
                <div className="bg-primary rounded-xl border-3 border-foreground p-6 mb-6">
                  <Activity className="h-16 w-16 text-foreground" />
                </div>
                <p className="font-bold uppercase text-foreground">No data available for this time range</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}