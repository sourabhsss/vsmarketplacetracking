import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  // Check if this is a manual trigger (needs to be outside try block for catch access)
  const isManualTrigger = request.headers.get('x-manual-trigger') === 'true';

  try {
    // Verify this is called by Vercel Cron (security check)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Vercel automatically adds the CRON_SECRET as Bearer token
    // Check if request has valid authorization
    const isAuthorized = 
      authHeader === `Bearer ${cronSecret}` ||
      // Fallback for development/testing
      (process.env.NODE_ENV === 'development' && !cronSecret);
    
    if (!isAuthorized) {
      console.error('Unauthorized cron request', {
        hasAuthHeader: !!authHeader,
        hasCronSecret: !!cronSecret,
        authMatch: authHeader === `Bearer ${cronSecret}`,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Starting ${isManualTrigger ? 'manual' : 'automatic'} stats sync...`);

    // Fetch all extensions
    const { data: extensions, error: fetchError } = await supabase
      .from('extensions')
      .select('id, extension_id');

    if (fetchError) throw fetchError;

    if (!extensions || extensions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No extensions to sync',
        synced: 0,
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Sync stats for each extension
    for (const extension of extensions) {
      try {
        // Fetch latest stats from VS Code Marketplace
        const marketplaceResponse = await fetch(
          'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json;api-version=3.0-preview.1',
            },
            body: JSON.stringify({
              filters: [
                {
                  criteria: [{ filterType: 7, value: extension.extension_id }],
                },
              ],
              flags: 914,
            }),
          }
        );

        const marketplaceData = await marketplaceResponse.json();
        const extensionData = marketplaceData.results?.[0]?.extensions?.[0];

        if (!extensionData) {
          errors.push(`Extension not found: ${extension.extension_id}`);
          errorCount++;
          continue;
        }

        // Extract all statistics
        interface Statistic {
          statisticName: string;
          value: string;
        }
        
        const installStat = extensionData.statistics?.find(
          (stat: Statistic) => stat.statisticName === 'install'
        );
        
        const averageRatingStat = extensionData.statistics?.find(
          (stat: Statistic) => stat.statisticName === 'averagerating'
        );
        
        const ratingCountStat = extensionData.statistics?.find(
          (stat: Statistic) => stat.statisticName === 'ratingcount'
        );
        
        const downloadStat = extensionData.statistics?.find(
          (stat: Statistic) => stat.statisticName === 'onpremDownloads'
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
          const newInstallCount = parseInt(installStat.value);
          
          // Fetch the latest install count to ensure we only insert higher values
          const { data: latestStat, error: fetchError } = await supabase
            .from('install_stats')
            .select('install_count')
            .eq('extension_id', extension.id)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single();

          // Determine if we should insert the new value
          let shouldInsert = true;
          let skipReason = '';

          if (!fetchError && latestStat) {
            const latestInstallCount = parseInt(latestStat.install_count);
            
            if (newInstallCount <= latestInstallCount) {
              shouldInsert = false;
              skipReason = `Skipped: new value (${newInstallCount}) not higher than latest (${latestInstallCount})`;
              console.log(`[${extension.extension_id}] ${skipReason}`);
            }
          }

          if (shouldInsert) {
            // Insert new install stat record only if value is higher
            const { error: insertError } = await supabase
              .from('install_stats')
              .insert([
                {
                  extension_id: extension.id,
                  install_count: newInstallCount,
                  recorded_at: new Date().toISOString(),
                },
              ]);

            if (insertError) {
              errors.push(`Failed to save stats for ${extension.extension_id}: ${insertError.message}`);
              errorCount++;
            } else {
              successCount++;
              console.log(`[${extension.extension_id}] Inserted new install count: ${newInstallCount}`);
            }
          } else {
            // Count as success but note it was skipped
            successCount++;
            console.log(`[${extension.extension_id}] ${skipReason}`);
          }
        } else {
          errors.push(`No install stats found for ${extension.extension_id}`);
          errorCount++;
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error syncing ${extension.extension_id}: ${errorMessage}`);
        errorCount++;
      }
    }

    const duration = Date.now() - startTime;
    const syncStatus = errorCount === 0 ? 'success' : (successCount > 0 ? 'partial' : 'failed');
    const totalExtensions = extensions?.length || 0;

    // Insert sync log with completion status
    await supabase
      .from('sync_logs')
      .insert([
        {
          status: syncStatus,
          total_extensions: totalExtensions,
          success_count: successCount,
          failed_count: errorCount,
          duration,
          errors: errors.length > 0 ? JSON.stringify(errors) : null,
          triggered_by: isManualTrigger ? 'manual' : 'cron',
          started_at: new Date(startTime).toISOString(),
          completed_at: new Date().toISOString(),
        },
      ]);

    const result = {
      success: true,
      message: 'Stats sync completed',
      synced: successCount,
      failed: errorCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
      duration,
    };
    
    console.log('Stats sync completed:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Stats sync failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const duration = Date.now() - startTime;

    // Insert sync log with error status
    await supabase
      .from('sync_logs')
      .insert([
        {
          status: 'failed',
          total_extensions: 0,
          success_count: 0,
          failed_count: 1,
          duration,
          errors: JSON.stringify([errorMessage]),
          triggered_by: isManualTrigger ? 'manual' : 'cron',
          started_at: new Date(startTime).toISOString(),
          completed_at: new Date().toISOString(),
        },
      ]);

    const errorResult = {
      success: false,
      error: 'Stats sync failed',
      details: errorMessage,
      timestamp: new Date().toISOString(),
      duration,
    };
    
    console.error('Sync error details:', errorResult);
    
    return NextResponse.json(errorResult, { status: 500 });
  }
}

// Allow manual trigger
export async function POST(request: NextRequest) {
  console.log('Manual sync trigger received');
  // Create a new request with authorization header for manual triggers
  const url = new URL(request.url);
  const newRequest = new NextRequest(url.toString(), {
    headers: {
      ...Object.fromEntries(request.headers.entries()),
      'authorization': `Bearer ${process.env.CRON_SECRET || 'dev'}`,
      'x-manual-trigger': 'true',
    },
  });
  return GET(newRequest);
}