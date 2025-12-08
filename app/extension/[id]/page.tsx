'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const chartData =
    stats?.map((stat: { recorded_at: string; install_count: string | number }) => ({
      date: stat.recorded_at,
      installs: Number(stat.install_count),
    })) || [];

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
        <Skeleton className="h-12 w-64 mb-8" />
        <Skeleton className="h-96 w-full" />
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
      <header className="border-b border-border/50 glass-strong sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4 glass-effect"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {extension.iconUrl ? (
                <Image
                  src={extension.iconUrl}
                  alt={extension.displayName}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-xl ring-2 ring-primary/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-2 ring-primary/20">
                  <Package className="h-10 w-10 text-primary" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                  {extension.displayName}
                </h1>
                <p className="text-muted-foreground mt-1">
                  by {extension.publisherName}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {extension.averageRating && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="font-medium">{extension.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="glass-effect border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass-strong border-border/50">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Extension</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &quot;{extension.displayName}&quot;? This will remove all historical data and cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="glass-effect">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate(extension.id)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button asChild className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                <a
                  href={extension.marketplaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Marketplace
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="glass-effect border-border/50 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Installs
              </CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold gradient-text">
                <AnimatedStat value={currentInstalls} />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/50 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Rating
              </CardTitle>
              <Star className="h-4 w-4 text-warning fill-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold gradient-text">
                <AnimatedStat value={extension.averageRating || 0} decimals={1} />
              </div>
              {extension.ratingCount && (
                <p className="text-xs text-muted-foreground mt-1">
                  {extension.ratingCount.toLocaleString()} ratings
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/50 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Growth ({timeRange})
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold gradient-text">
                <AnimatedStat value={growthValue} prefix="+" />
              </div>
              <div className="mt-1">
                <TrendIndicator value={growthRate} />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/50 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Growth Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold gradient-text">
                <AnimatedStat value={growthRate} decimals={1} suffix="%" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Range Selector */}
        <Tabs
          value={timeRange}
          onValueChange={(value) => setTimeRange(value as TimeRange)}
          className="mb-8"
        >
          <TabsList className="glass-effect border border-border/50">
            <TabsTrigger value="day">Last 24 Hours</TabsTrigger>
            <TabsTrigger value="week">Last Week</TabsTrigger>
            <TabsTrigger value="month">Last Month</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Chart */}
        <Card className="glass-effect border-border/50">
          <CardHeader>
            <CardTitle>Install Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-96 w-full shimmer" />
            ) : chartData.length > 0 ? (
              <StatsChart data={chartData} className="h-96 w-full" />
            ) : (
              <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
                <Activity className="h-16 w-16 mb-4 opacity-50" />
                <p>No data available for this time range</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}