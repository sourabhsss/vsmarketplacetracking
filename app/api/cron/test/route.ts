import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  return NextResponse.json({
    message: 'Cron test endpoint',
    hasAuthHeader: !!authHeader,
    authHeaderValue: authHeader ? 'Bearer ***' : null,
    hasCronSecret: !!cronSecret,
    cronSecretLength: cronSecret?.length || 0,
    isAuthorized: authHeader === `Bearer ${cronSecret}`,
    allHeaders: Object.fromEntries(request.headers.entries()),
    timestamp: new Date().toISOString(),
  });
}