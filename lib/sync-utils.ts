/**
 * Utility functions for data syncing with retry logic and error handling
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

/**
 * Exponential backoff retry wrapper
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next attempt
      delay = Math.min(delay * backoffMultiplier, maxDelay);
      
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
    }
  }

  throw lastError!;
}

/**
 * Fetch extension data from VS Code Marketplace with retry
 */
export async function fetchMarketplaceData(extensionId: string) {
  return retryWithBackoff(async () => {
    const response = await fetch(
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
              criteria: [{ filterType: 7, value: extensionId }],
            },
          ],
          flags: 914,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Marketplace API returned ${response.status}`);
    }

    const data = await response.json();
    const extensionData = data.results?.[0]?.extensions?.[0];

    if (!extensionData) {
      throw new Error(`Extension not found: ${extensionId}`);
    }

    return extensionData;
  }, {
    maxRetries: 3,
    initialDelay: 1000,
  });
}

/**
 * Check if a sync is needed based on last sync time
 */
export function shouldSync(lastSyncTime: string | null): boolean {
  if (!lastSyncTime) return true;

  const lastSync = new Date(lastSyncTime);
  const now = new Date();
  const hoursSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

  // Sync if more than 20 hours since last sync (allows for some buffer)
  return hoursSinceLastSync >= 20;
}

/**
 * Validate that today's data exists for an extension
 */
export async function validateDailyData(
  supabase: any,
  extensionId: string
): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('install_stats')
    .select('id')
    .eq('extension_id', extensionId)
    .gte('recorded_at', today.toISOString())
    .limit(1);

  if (error) {
    console.error('Error validating daily data:', error);
    return false;
  }

  return data && data.length > 0;
}

/**
 * Detect and log data gaps
 */
export async function detectDataGaps(supabase: any): Promise<void> {
  try {
    // Call the Supabase function to detect gaps
    const { data: gaps, error } = await supabase.rpc('detect_data_gaps');

    if (error) {
      console.error('Error detecting data gaps:', error);
      return;
    }

    if (gaps && gaps.length > 0) {
      // Insert detected gaps into data_gaps table
      const gapRecords = gaps.map((gap: any) => ({
        extension_id: gap.extension_id,
        gap_date: gap.gap_date,
        detected: true,
        backfilled: false,
      }));

      const { error: insertError } = await supabase
        .from('data_gaps')
        .upsert(gapRecords, { onConflict: 'extension_id,gap_date' });

      if (insertError) {
        console.error('Error logging data gaps:', insertError);
      } else {
        console.log(`Detected ${gaps.length} data gaps`);
      }
    }
  } catch (error) {
    console.error('Error in detectDataGaps:', error);
  }
}

/**
 * Send notification for failed sync (webhook or email)
 */
export async function sendSyncAlert(
  status: 'failed' | 'partial',
  details: {
    successCount: number;
    failedCount: number;
    errors: string[];
    timestamp: string;
  }
): Promise<void> {
  const webhookUrl = process.env.SYNC_ALERT_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('No webhook URL configured for sync alerts');
    return;
  }

  try {
    const message = {
      status,
      title: `VS Code Extension Sync ${status === 'failed' ? 'Failed' : 'Partially Failed'}`,
      details: {
        successful: details.successCount,
        failed: details.failedCount,
        timestamp: details.timestamp,
        errors: details.errors.slice(0, 5), // Limit to first 5 errors
      },
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Failed to send sync alert:', error);
  }
}