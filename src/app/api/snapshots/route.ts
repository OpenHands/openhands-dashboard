import { NextResponse } from 'next/server';
import { collectAndSaveSnapshot, getOrCreateTrackedRepository, getHistoricalSnapshots } from '@/lib/snapshots';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    const repositoryId = await getOrCreateTrackedRepository();
    const snapshots = await getHistoricalSnapshots(repositoryId, days);

    return NextResponse.json({
      success: true,
      count: snapshots.length,
      snapshots,
    });
  } catch (error) {
    console.error('Failed to fetch snapshots:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch snapshots' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await collectAndSaveSnapshot();

    if (result.skipped) {
      return NextResponse.json({
        success: true,
        message: `Snapshot already exists for ${result.date} - skipped`,
        date: result.date,
        skipped: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: `New snapshot created for ${result.date}`,
      snapshotId: result.snapshotId,
      date: result.date,
      skipped: false,
    });
  } catch (error) {
    console.error('Failed to save snapshot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save snapshot' },
      { status: 500 }
    );
  }
}
