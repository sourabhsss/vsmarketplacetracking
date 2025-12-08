import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('extensions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform snake_case to camelCase
    const transformedData = data?.map((ext: any) => ({
      id: ext.id,
      extensionId: ext.extension_id,
      publisherName: ext.publisher_name,
      extensionName: ext.extension_name,
      displayName: ext.display_name,
      marketplaceUrl: ext.marketplace_url,
      iconUrl: ext.icon_url,
      averageRating: ext.average_rating ? parseFloat(ext.average_rating) : null,
      ratingCount: ext.rating_count,
      downloadCount: ext.download_count,
      lastUpdated: ext.last_updated,
      currentVersion: ext.current_version,
      createdAt: ext.created_at,
      updatedAt: ext.updated_at,
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching extensions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch extensions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { extensionId } = body;

    // Fetch extension details from VS Code Marketplace
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
              criteria: [{ filterType: 7, value: extensionId }],
            },
          ],
          flags: 914,
        }),
      }
    );

    const marketplaceData = await marketplaceResponse.json();
    const extension = marketplaceData.results?.[0]?.extensions?.[0];

    if (!extension) {
      return NextResponse.json(
        { error: 'Extension not found' },
        { status: 404 }
      );
    }

    // Extract statistics
    const installStat = extension.statistics?.find(
      (stat: any) => stat.statisticName === 'install'
    );
    
    const downloadStat = extension.statistics?.find(
      (stat: any) => stat.statisticName === 'onpremDownloads'
    );
    
    const averageRatingStat = extension.statistics?.find(
      (stat: any) => stat.statisticName === 'averagerating'
    );
    
    const ratingCountStat = extension.statistics?.find(
      (stat: any) => stat.statisticName === 'ratingcount'
    );

    const newExtension = {
      extension_id: extensionId,
      publisher_name: extension.publisher.publisherName,
      extension_name: extension.extensionName,
      display_name: extension.displayName,
      marketplace_url: `https://marketplace.visualstudio.com/items?itemName=${extensionId}`,
      icon_url: extension.versions?.[0]?.files?.find(
        (f: any) => f.assetType === 'Microsoft.VisualStudio.Services.Icons.Default'
      )?.source,
      average_rating: averageRatingStat ? parseFloat(averageRatingStat.value).toFixed(2) : null,
      rating_count: ratingCountStat ? parseInt(ratingCountStat.value) : null,
      download_count: downloadStat ? parseInt(downloadStat.value) : null,
      last_updated: extension.lastUpdated,
      current_version: extension.versions?.[0]?.version,
    };

    const { data, error } = await supabase
      .from('extensions')
      .insert([newExtension])
      .select()
      .single();

    if (error) throw error;

    // Add initial stat
    if (installStat) {
      await supabase.from('install_stats').insert([
        {
          extension_id: data.id,
          install_count: installStat.value,
          recorded_at: new Date().toISOString(),
        },
      ]);
    }

    // Transform response to camelCase
    const transformedData = {
      id: data.id,
      extensionId: data.extension_id,
      publisherName: data.publisher_name,
      extensionName: data.extension_name,
      displayName: data.display_name,
      marketplaceUrl: data.marketplace_url,
      iconUrl: data.icon_url,
      averageRating: data.average_rating ? parseFloat(data.average_rating) : null,
      ratingCount: data.rating_count,
      downloadCount: data.download_count,
      lastUpdated: data.last_updated,
      currentVersion: data.current_version,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error adding extension:', error);
    return NextResponse.json(
      { error: 'Failed to add extension' },
      { status: 500 }
    );
  }
}