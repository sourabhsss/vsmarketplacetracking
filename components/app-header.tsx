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
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Sync failed:', errorText);
        throw new Error('Failed to sync stats');
      }
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
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
            <div className="h-10 w-10 md:h-12 md:w-12 bg-primary border-3 border-foreground flex items-center justify-center brutal-shadow shrink-0">
              <Activity className="h-5 w-5 md:h-7 md:w-7 text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-black uppercase tracking-tight truncate">
                VS Code Extension Tracker
              </h1>
              <p className="text-xs md:text-sm font-bold text-muted-foreground uppercase">
                Real-time analytics
              </p>
            </div>
          </Link>
          <div className="flex gap-2 md:gap-3 items-center shrink-0">
            <SyncHealthIndicator />
            {pathname !== '/monitoring' && (
              <Link href="/monitoring">
                <Button variant="secondary" size="sm">
                  <BarChart3 className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Monitoring</span>
                </Button>
              </Link>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 md:mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{syncMutation.isPending ? 'Syncing...' : 'Sync Stats'}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}