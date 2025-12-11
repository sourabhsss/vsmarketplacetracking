'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { ArrowLeft, Activity, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface SyncLog {
  id: string;
  status: 'success' | 'partial' | 'failed' | 'running';
  total_extensions: number;
  success_count: number;
  failed_count: number;
  errors: string | null;
  duration: number;
  triggered_by: string;
  started_at: string;
  completed_at: string;
}

interface SyncHealth {
  health: {
    status: 'healthy' | 'warning' | 'critical';
    lastSync: {
      timestamp: string;
      status: string;
      successCount: number;
      failedCount: number;
      duration: number;
    } | null;
    syncOverdue: boolean;
    metrics: {
      totalSyncs: number;
      successfulSyncs: number;
      failedSyncs: number;
      partialSyncs: number;
      successRate: string;
      avgDuration: number;
    };
    last24Hours: {
      syncs: number;
      successful: number;
      failed: number;
    };
  };
  gaps: {
    total: number;
    recent: Array<Record<string, unknown>>;
  };
  recentLogs: SyncLog[];
}

export default function MonitoringPage() {
  const { data: health, isLoading } = useQuery<SyncHealth>({
    queryKey: ['sync-health'],
    queryFn: async () => {
      const res = await fetch('/api/sync-health');
      if (!res.ok) throw new Error('Failed to fetch sync health');
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      success: { variant: 'default' as const, icon: CheckCircle2, className: 'bg-green-500/10 text-green-500 border-green-500/20' },
      partial: { variant: 'secondary' as const, icon: AlertCircle, className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
      failed: { variant: 'destructive' as const, icon: XCircle, className: 'bg-red-500/10 text-red-500 border-red-500/20' },
      running: { variant: 'outline' as const, icon: Clock, className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    };

    const config = variants[status as keyof typeof variants] || variants.failed;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const { metrics, last24Hours } = health?.health || {};

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Activity className="h-8 w-8" />
                  Sync Monitoring
                </h1>
                <p className="text-muted-foreground mt-1">
                  Track and monitor all sync operations
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Syncs (30d)</CardDescription>
              <CardTitle className="text-3xl">{metrics?.totalSyncs || 0}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Success Rate</CardDescription>
              <CardTitle className="text-3xl text-green-500">
                {metrics?.successRate || 0}%
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Duration</CardDescription>
              <CardTitle className="text-3xl">
                {formatDuration(metrics?.avgDuration || 0)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Last 24 Hours</CardDescription>
              <CardTitle className="text-3xl">{last24Hours?.syncs || 0}</CardTitle>
              <div className="flex gap-2 text-sm mt-2">
                <span className="text-green-500">{last24Hours?.successful || 0} ✓</span>
                <span className="text-red-500">{last24Hours?.failed || 0} ✗</span>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Sync Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sync History</CardTitle>
            <CardDescription>
              Last 30 days of sync operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sync Type</TableHead>
                    <TableHead className="text-right">Extensions</TableHead>
                    <TableHead className="text-right">Success</TableHead>
                    <TableHead className="text-right">Failed</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {health?.recentLogs && health.recentLogs.length > 0 ? (
                    health.recentLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          <div>{format(new Date(log.completed_at), 'MMM dd, yyyy')}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(log.completed_at), 'HH:mm:ss')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.completed_at), { addSuffix: true })}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              log.triggered_by === 'cron' 
                                ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                                : 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                            }
                          >
                            {log.triggered_by === 'cron' ? '🤖 Auto' : '👤 Manual'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{log.total_extensions}</TableCell>
                        <TableCell className="text-right text-green-500">
                          {log.success_count}
                        </TableCell>
                        <TableCell className="text-right text-red-500">
                          {log.failed_count}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatDuration(log.duration)}
                        </TableCell>
                        <TableCell>
                          {log.errors ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                if (!log.errors) return;
                                try {
                                  const errors = JSON.parse(log.errors);
                                  alert(Array.isArray(errors) ? errors.join('\n') : log.errors);
                                } catch {
                                  alert(log.errors);
                                }
                              }}
                            >
                              View Errors
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No sync logs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>About Sync Monitoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Automatic syncs run daily at midnight UTC via Vercel Cron</p>
            <p>• Manual syncs can be triggered from the main dashboard</p>
            <p>• Success rate is calculated over the last 30 days</p>
            <p>• Duration measures the time taken to sync all extensions</p>
            <p>• Errors are logged and can be viewed by clicking &quot;View Errors&quot;</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}