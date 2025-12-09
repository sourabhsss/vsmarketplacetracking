import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Verify this is called by Vercel Cron (security check)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting automatic stats sync...');

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

    console.log(`Stats sync completed: ${successCount} successful, ${errorCount} failed`);

    return NextResponse.json({
      success: true,
      message: 'Stats sync completed',
      synced: successCount,
      failed: errorCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Stats sync failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Stats sync failed',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Allow manual trigger
export async function POST(request: NextRequest) {
  // Create a new request with authorization header for manual triggers
  const url = new URL(request.url);
  const newRequest = new NextRequest(url.toString());
  newRequest.headers.set('authorization', `Bearer ${process.env.CRON_SECRET || 'dev'}`);
  return GET(newRequest);
}