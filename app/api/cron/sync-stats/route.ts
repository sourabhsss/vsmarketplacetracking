import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  fetchMarketplaceData,
  validateDailyData,
  detectDataGaps,
  sendSyncAlert,
} from '@/lib/sync-utils';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const triggeredBy = request.headers.get('x-triggered-by') || 'cron';

  try {
    // Verify this is called by Vercel Cron (security check)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Starting automatic stats sync (triggered by: ${triggeredBy})...`);

    // Fetch all extensions
    const { data: extensions, error: fetchError } = await supabase
      .from('extensions')
      .select('id, extension_id');

    if (fetchError) throw fetchError;

    if (!extensions || extensions.length === 0) {
      // Log empty sync
      await supabase.from('sync_logs').insert({
        status: 'success',
        total_extensions: 0,
        success_count: 0,
        failed_count: 0,
        triggered_by: triggeredBy,
        started_at: new Date(startTime).toISOString(),
        duration: Date.now() - startTime,
      });

      return NextResponse.json({
        success: true,
        message: 'No extensions to sync',
        synced: 0,
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const syncedExtensions: string[] = [];

    // Sync stats for each extension with retry logic
    for (const extension of extensions) {
      try {
        // Check if today's data already exists
        const hasData = await validateDailyData(supabase, extension.id);
        if (hasData) {
          console.log(`Skipping ${extension.extension_id} - data already exists for today`);
          successCount++;
          syncedExtensions.push(extension.extension_id);
          continue;
        }

        // Fetch latest stats from VS Code Marketplace with retry
        const extensionData = await fetchMarketplaceData(extension.extension_id);

        // Extract all statistics
        const installStat = extensionData.statistics?.find(
          (stat: { statisticName: string; value: string }) => stat.statisticName === 'install'
        );
        
        const averageRatingStat = extensionData.statistics?.find(
          (stat: { statisticName: string; value: string }) => stat.statisticName === 'averagerating'
        );
        
        const ratingCountStat = extensionData.statistics?.find(
          (stat: { statisticName: string; value: string }) => stat.statisticName === 'ratingcount'
        );
        
        const downloadStat = extensionData.statistics?.find(
          (stat: { statisticName: string; value: string }) => stat.statisticName === 'onpremDownloads'
        );

        // Update extension with latest metrics
        const { error: updateError } = await supabase
          .from('extensions')
          .update({
            average_rating: averageRatingStat ? parseFloat(averageRatingStat.value).toFixed(2) : null,
            rating_count: ratingCountStat ? parseInt(ratingCountStat.value) : null,
            download_count: downloadStat ? parseInt(downloadStat.value) : null,
            last_updated: extensionData.lastUpdated,
            current_version: extensionData.versions?.[0]?.version,
            updated_at: new Date().toISOString(),
          })
          .eq('id', extension.id);

        if (updateError) {
          errors.push(`Failed to update extension ${extension.extension_id}: ${updateError.message}`);
        }

        if (installStat) {
          // Insert new install stat record
          const { error: insertError } = await supabase
            .from('install_stats')
            .insert([
              {
                extension_id: extension.id,
                install_count: installStat.value,
                recorded_at: new Date().toISOString(),
              },
            ]);

          if (insertError) {
            errors.push(`Failed to save stats for ${extension.extension_id}: ${insertError.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        } else {
          errors.push(`No install stats found for ${extension.extension_id}`);
          errorCount++;
        }

        // Validate data before saving
        if (installStat) {
          syncedExtensions.push(extension.extension_id);
        }

        // Add delay to avoid rate limiting (200ms between requests)
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        const errorMsg = `Error syncing ${extension.extension_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        errorCount++;
      }
    }

    const duration = Date.now() - startTime;
    const status = errorCount === 0 ? 'success' : (successCount > 0 ? 'partial' : 'failed');
    const timestamp = new Date().toISOString();

    console.log(`Stats sync completed: ${successCount} successful, ${errorCount} failed (${duration}ms)`);

    // Log sync operation
    await supabase.from('sync_logs').insert({
      status,
      total_extensions: extensions.length,
      success_count: successCount,
      failed_count: errorCount,
      errors: errors.length > 0 ? JSON.stringify(errors) : null,
      duration,
      triggered_by: triggeredBy,
      started_at: new Date(startTime).toISOString(),
    });

    // Detect data gaps after sync
    await detectDataGaps(supabase);

    // Send alert if sync failed or partially failed
    if (status === 'failed' || (status === 'partial' && errorCount > successCount)) {
      await sendSyncAlert(status, {
        successCount,
        failedCount: errorCount,
        errors,
        timestamp,
      });
    }

    return NextResponse.json({
      success: status !== 'failed',
      status,
      message: `Stats sync ${status}`,
      synced: successCount,
      failed: errorCount,
      total: extensions.length,
      duration,
      errors: errors.length > 0 ? errors : undefined,
      timestamp,
    });

  } catch (error) {
    console.error('Stats sync failed:', error);
    
    // Log failed sync
    try {
      await supabase.from('sync_logs').insert({
        status: 'failed',
        total_extensions: 0,
        success_count: 0,
        failed_count: 0,
        errors: JSON.stringify([error instanceof Error ? error.message : 'Unknown error']),
        duration: Date.now() - startTime,
        triggered_by: triggeredBy,
        started_at: new Date(startTime).toISOString(),
      });
    } catch (logError) {
      console.error('Failed to log sync error:', logError);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Stats sync failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Allow manual trigger without auth in development
export async function POST() {
  if (process.env.NODE_ENV === 'development') {
    const request = new NextRequest('http://localhost:3000/api/cron/sync-stats');
    request.headers.set('authorization', `Bearer ${process.env.CRON_SECRET || 'dev'}`);
    return GET(request);
  }
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}