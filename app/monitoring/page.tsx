'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { Activity, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
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
      success: { variant: 'default' as const, icon: CheckCircle2, className: 'bg-success text-foreground border-foreground' },
      partial: { variant: 'secondary' as const, icon: AlertCircle, className: 'bg-warning text-foreground border-foreground' },
      failed: { variant: 'destructive' as const, icon: XCircle, className: 'bg-destructive text-white border-foreground' },
      running: { variant: 'outline' as const, icon: Clock, className: 'bg-secondary text-foreground border-foreground' },
    };

    const config = variants[status as keyof typeof variants] || variants.failed;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
          <Skeleton className="h-12 w-64 rounded-xl border-3 border-foreground" />
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl border-3 border-foreground" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl border-3 border-foreground" />
        </div>
      </div>
    );
  }

  const { metrics, last24Hours } = health?.health || {};

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-4">
          <div className="bg-primary border-3 border-foreground p-4 md:p-6 brutal-shadow-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_#000000] transition-all">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <Activity className="h-6 w-6 md:h-8 md:w-8 text-foreground" />
            </div>
            <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">
              Total Syncs (30d)
            </p>
            <p className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground break-all">{metrics?.totalSyncs || 0}</p>
          </div>

          <div className="bg-success border-3 border-foreground p-4 md:p-6 brutal-shadow-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_#000000] transition-all">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <CheckCircle2 className="h-6 w-6 md:h-8 md:w-8 text-foreground" />
            </div>
            <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">
              Success Rate
            </p>
            <p className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground break-all">
              {metrics?.successRate || 0}%
            </p>
          </div>

          <div className="bg-secondary border-3 border-foreground p-4 md:p-6 brutal-shadow-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_#000000] transition-all">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <Clock className="h-6 w-6 md:h-8 md:w-8 text-foreground" />
            </div>
            <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">
              Avg Duration
            </p>
            <p className="text-xl md:text-2xl lg:text-3xl font-black text-foreground break-all">
              {formatDuration(metrics?.avgDuration || 0)}
            </p>
          </div>

          <div className="bg-accent border-3 border-foreground p-4 md:p-6 brutal-shadow-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_#000000] transition-all">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <Activity className="h-6 w-6 md:h-8 md:w-8 text-foreground" />
            </div>
            <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">
              Last 24 Hours
            </p>
            <p className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground break-all">{last24Hours?.syncs || 0}</p>
            <div className="flex gap-3 text-sm mt-2 font-bold uppercase">
              <span className="text-foreground">{last24Hours?.successful || 0} ✓</span>
              <span className="text-foreground">{last24Hours?.failed || 0} ✗</span>
            </div>
          </div>
        </div>

        {/* Sync Logs Table */}
        <div className="bg-card border-3 border-foreground p-4 md:p-6 brutal-shadow-lg">
          <h2 className="text-xl font-black text-foreground uppercase mb-2">Recent Sync History</h2>
          <p className="text-sm font-bold text-muted-foreground uppercase mb-6">
            Last 30 days of sync operations
          </p>
          <div>
            <div className="rounded-xl border-3 border-foreground overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="font-black uppercase text-xs">Timestamp</TableHead>
                    <TableHead className="font-black uppercase text-xs">Status</TableHead>
                    <TableHead className="font-black uppercase text-xs">Sync Type</TableHead>
                    <TableHead className="text-right font-black uppercase text-xs">Extensions</TableHead>
                    <TableHead className="text-right font-black uppercase text-xs">Success</TableHead>
                    <TableHead className="text-right font-black uppercase text-xs">Failed</TableHead>
                    <TableHead className="text-right font-black uppercase text-xs">Duration</TableHead>
                    <TableHead className="font-black uppercase text-xs">Errors</TableHead>
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
                                ? 'bg-secondary text-foreground border-foreground' 
                                : 'bg-accent text-foreground border-foreground'
                            }
                          >
                            {log.triggered_by === 'cron' ? '🤖 AUTO' : '👤 MANUAL'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{log.total_extensions}</TableCell>
                        <TableCell className="text-right font-bold text-success">
                          {log.success_count}
                        </TableCell>
                        <TableCell className="text-right font-bold text-destructive">
                          {log.failed_count}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatDuration(log.duration)}
                        </TableCell>
                        <TableCell>
                          {log.errors ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs font-bold uppercase"
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
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-card border-3 border-foreground p-4 md:p-6 brutal-shadow-lg">
          <h2 className="text-xl font-black text-foreground uppercase mb-4">About Sync Monitoring</h2>
          <div className="space-y-2 text-sm font-bold text-muted-foreground uppercase">
            <p>• Automatic syncs run daily at midnight UTC via Vercel Cron</p>
            <p>• Manual syncs can be triggered from the main dashboard</p>
            <p>• Success rate is calculated over the last 30 days</p>
            <p>• Duration measures the time taken to sync all extensions</p>
            <p>• Errors are logged and can be viewed by clicking &quot;View Errors&quot;</p>
          </div>
        </div>
      </div>
    </div>
  );
}