'use client';

import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Fallback sync hook - triggers sync if cron failed
 * Only runs once per session to avoid excessive API calls
 */
export function useFallbackSync() {
  const queryClient = useQueryClient();
  const hasTriggeredRef = useRef(false);

  const { data: health } = useQuery({
    queryKey: ['sync-health'],
    queryFn: async () => {
      const res = await fetch('/api/sync-health');
      if (!res.ok) throw new Error('Failed to fetch sync health');
      return res.json();
    },
    refetchInterval: 60000, // Check every minute
  });

  useEffect(() => {
    // Only trigger once per session
    if (hasTriggeredRef.current) return;

    const syncOverdue = health?.health?.syncOverdue;
    
    if (syncOverdue) {
      console.log('Sync overdue detected - triggering fallback sync');
      hasTriggeredRef.current = true;

      // Trigger sync with fallback flag
      fetch('/api/cron/sync-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'fallback'}`,
          'X-Triggered-By': 'fallback',
        },
      })
        .then(async (res) => {
          if (res.ok) {
            console.log('Fallback sync completed successfully');
            // Refresh data
            queryClient.invalidateQueries({ queryKey: ['extensions'] });
            queryClient.invalidateQueries({ queryKey: ['sync-health'] });
          } else {
            console.error('Fallback sync failed:', await res.text());
          }
        })
        .catch((error) => {
          console.error('Fallback sync error:', error);
        });
    }
  }, [health, queryClient]);
}