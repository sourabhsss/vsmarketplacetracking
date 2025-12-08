'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

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
    recent: any[];
  };
}

export function SyncHealthIndicator() {
  const { data: health, isLoading } = useQuery<SyncHealth>({
    queryKey: ['sync-health'],
    queryFn: async () => {
      const res = await fetch('/api/sync-health');
      if (!res.ok) throw new Error('Failed to fetch sync health');
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading || !health) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4 animate-spin" />
        <span>Checking sync status...</span>
      </div>
    );
  }

  const { status, lastSync, syncOverdue, metrics, last24Hours } = health.health;
  const { total: gapCount } = health.gaps;

  const statusConfig = {
    healthy: {
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
      label: 'Healthy',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      label: 'Warning',
    },
    critical: {
      icon: AlertCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      label: 'Critical',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${config.bgColor} hover:${config.bgColor}`}
          >
            <Icon className={`h-4 w-4 ${config.color}`} />
            <span className="text-sm font-medium">{config.label}</span>
            {gapCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {gapCount} gaps
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-80">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold mb-2">Sync Health Status</h4>
              {lastSync ? (
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    Last sync: {formatDistanceToNow(new Date(lastSync.timestamp), { addSuffix: true })}
                  </p>
                  <p className="text-muted-foreground">
                    Status: <span className={lastSync.status === 'success' ? 'text-success' : 'text-warning'}>
                      {lastSync.status}
                    </span> ({lastSync.successCount} success, {lastSync.failedCount} failed)
                  </p>
                  <p className="text-muted-foreground">
                    Duration: {lastSync.duration}ms
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No sync data available</p>
              )}
            </div>

            {syncOverdue && (
              <div className="p-2 rounded bg-warning/10 border border-warning/20">
                <p className="text-sm text-warning flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Sync overdue - data may be stale
                </p>
              </div>
            )}

            <div className="border-t pt-2">
              <h5 className="text-sm font-medium mb-1">Last 24 Hours</h5>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold">{last24Hours.syncs}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Success</p>
                  <p className="font-semibold text-success">{last24Hours.successful}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Failed</p>
                  <p className="font-semibold text-destructive">{last24Hours.failed}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-2">
              <h5 className="text-sm font-medium mb-1">Overall Metrics</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Success Rate</p>
                  <p className="font-semibold">{metrics.successRate}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Duration</p>
                  <p className="font-semibold">{metrics.avgDuration}ms</p>
                </div>
              </div>
            </div>

            {gapCount > 0 && (
              <div className="border-t pt-2">
                <p className="text-sm text-destructive">
                  {gapCount} missing data point{gapCount !== 1 ? 's' : ''} detected
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}