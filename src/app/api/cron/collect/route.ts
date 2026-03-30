import { NextResponse } from 'next/server';
import { collectAndSaveSnapshot } from '@/lib/snapshots';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Handle cron collection - shared logic for both GET and POST
 */
async function handleCronCollection(source: 'scheduled' | 'manual'): Promise<NextResponse> {
  try {
    console.log(`[Cron] Starting daily metrics collection (${source}) at ${new Date().toISOString()}`);
    
    const result = await collectAndSaveSnapshot();

    if (result.skipped) {
      console.log(`[Cron] Snapshot already exists for ${result.date} - skipped`);
      return NextResponse.json({
        success: true,
        message: `Snapshot already exists for ${result.date} - skipped`,
        date: result.date,
        skipped: true,
      });
    }

    console.log(`[Cron] Successfully created snapshot for ${result.date} (ID: ${result.snapshotId})`);
    
    return NextResponse.json({
      success: true,
      message: `Daily snapshot created for ${result.date}`,
      snapshotId: result.snapshotId,
      date: result.date,
      skipped: false,
    });
  } catch (error) {
    console.error('[Cron] Failed to collect metrics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to collect metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/collect - Vercel Cron handler
 * 
 * Called by Vercel Cron once per day at 6:00 AM UTC.
 * Collects metrics from GitHub/PyPI and stores a daily snapshot.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('Unauthorized cron request - invalid or missing authorization');
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return handleCronCollection('scheduled');
}

/**
 * POST /api/cron/collect - Manual trigger
 * 
 * Allows manual triggering of metrics collection from Vercel dashboard.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('Unauthorized cron request - invalid or missing authorization');
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return handleCronCollection('manual');
}
