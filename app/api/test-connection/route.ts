import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test 1: Check if Supabase client is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Supabase environment variables not configured',
        details: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        }
      }, { status: 500 });
    }

    // Test 2: Try to query the extensions table
    const { error, count } = await supabase
      .from('extensions')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Database query failed',
        details: {
          message: error.message,
          code: error.code,
          hint: error.hint,
          details: error.details,
        },
        suggestion: error.code === '42P01' 
          ? 'Table does not exist. Please run the SQL setup script in Supabase SQL Editor.'
          : error.code === '42501'
          ? 'Permission denied. Please check Row Level Security policies.'
          : 'Check the error details above.'
      }, { status: 500 });
    }

    // Test 3: Success!
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful!',
      details: {
        tableExists: true,
        rowCount: count,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      }
    }, { status: 500 });
  }
}