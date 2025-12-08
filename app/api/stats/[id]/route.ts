import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { subDays, subMonths } from 'date-fns';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'week';

    let startDate: Date;
    switch (range) {
      case 'day':
        startDate = subDays(new Date(), 1);
        break;
      case 'week':
        startDate = subDays(new Date(), 7);
        break;
      case 'month':
        startDate = subMonths(new Date(), 1);
        break;
      default:
        startDate = subMonths(new Date(), 12);
    }

    const { data, error } = await supabase
      .from('install_stats')
      .select('*')
      .eq('extension_id', id)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}