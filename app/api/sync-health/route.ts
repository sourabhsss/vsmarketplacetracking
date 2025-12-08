import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get last 30 days of sync logs
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: syncLogs, error: logsError } = await supabase
      .from('sync_logs')
      .select('*')
      .gte('completed_at', thirtyDaysAgo.toISOString())
      .order('completed_at', { ascending: false });

    if (logsError) throw logsError;

    // Get data gaps
    const { data: gaps, error: gapsError } = await supabase
      .from('data_gaps')
      .select('*')
      .eq('backfilled', false)
      .order('gap_date', { ascending: false })
      .limit(100);

    if (gapsError) throw gapsError;

    // Calculate health metrics
    const last24Hours = syncLogs?.filter(log => {
      const logTime = new Date(log.completed_at);
      const dayAgo = new Date();
      dayAgo.setHours(dayAgo.getHours() - 24);
      return logTime >= dayAgo;
    }) || [];

    const lastSync = syncLogs?.[0];
    const totalSyncs = syncLogs?.length || 0;
    const successfulSyncs = syncLogs?.filter(log => log.status === 'success').length || 0;
    const failedSyncs = syncLogs?.filter(log => log.status === 'failed').length || 0;
    const partialSyncs = syncLogs?.filter(log => log.status === 'partial').length || 0;

    // Check if sync is overdue (should run daily)
    const syncOverdue = lastSync 
      ? (Date.now() - new Date(lastSync.completed_at).getTime()) > (25 * 60 * 60 * 1000) // 25 hours
      : true;

    return NextResponse.json({
      health: {
        status: syncOverdue ? 'warning' : (failedSyncs > successfulSyncs ? 'critical' : 'healthy'),
        lastSync: lastSync ? {
          timestamp: lastSync.completed_at,
          status: lastSync.status,
          successCount: lastSync.success_count,
          failedCount: lastSync.failed_count,
          duration: lastSync.duration,
        } : null,
        syncOverdue,
        metrics: {
          totalSyncs,
          successfulSyncs,
          failedSyncs,
          partialSyncs,
          successRate: totalSyncs > 0 ? (successfulSyncs / totalSyncs * 100).toFixed(1) : 0,
          avgDuration: syncLogs?.length 
            ? Math.round(syncLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / syncLogs.length)
            : 0,
        },
        last24Hours: {
          syncs: last24Hours.length,
          successful: last24Hours.filter(log => log.status === 'success').length,
          failed: last24Hours.filter(log => log.status === 'failed').length,
        },
      },
      gaps: {
        total: gaps?.length || 0,
        recent: gaps?.slice(0, 10) || [],
      },
      recentLogs: syncLogs?.slice(0, 10) || [],
    });
  } catch (error: any) {
    console.error('Error fetching sync health:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync health', details: error.message },
      { status: 500 }
    );
  }
}