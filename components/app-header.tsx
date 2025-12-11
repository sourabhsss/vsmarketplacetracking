'use client';

import { Button } from '@/components/ui/button';
import { SyncHealthIndicator } from '@/components/sync-health-indicator';
import { Activity, RefreshCw, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function AppHeader() {
  const pathname = usePathname();
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ['sync-health'] });
      toast.success(`Synced ${data.synced} extension(s) successfully!`);
    },
    onError: () => {
      toast.error('Failed to sync stats');
    },
  });

  return (
    <header className="border-b-4 border-foreground bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary rounded-xl border-3 border-foreground flex items-center justify-center brutal-shadow">
              <Activity className="h-7 w-7 text-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight">
                VS Code Extension Tracker
              </h1>
              <p className="text-sm font-bold text-muted-foreground uppercase">
                Real-time analytics
              </p>
            </div>
          </Link>
          <div className="flex gap-3 items-center">
            <SyncHealthIndicator />
            {pathname !== '/monitoring' && (
              <Link href="/monitoring">
                <Button variant="secondary" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Monitoring
                </Button>
              </Link>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              {syncMutation.isPending ? 'Syncing...' : 'Sync Stats'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}