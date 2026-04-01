import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalSnapshotsInRange } from '@/lib/snapshots';

export const dynamic = 'force-dynamic';

const validPeriods = [7, 30, 90, 180, 365];

function emptyHistoryResponse(period: number, startDate: string, endDate: string, message: string) {
  return NextResponse.json({
    period,
    data: {
      githubStars: [],
      githubForks: [],
      githubActiveForks: [],
      pypiDownloads: [],
    },
    snapshotCount: 0,
    startDate,
    endDate,
    message,
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = parseInt(searchParams.get('period') || '30', 10);

    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: `Invalid period. Valid values: ${validPeriods.join(', ')}` },
        { status: 400 }
      );
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];
    const snapshots = await getHistoricalSnapshotsInRange(startDateString, endDateString);

    if (snapshots.length === 0) {
      return emptyHistoryResponse(
        period,
        startDateString,
        endDateString,
        'No historical snapshots available yet. The daily GitHub Actions workflow will add data after its first successful run.'
      );
    }

    return NextResponse.json({
      period,
      data: {
        githubStars: snapshots.map((snapshot) => ({ date: snapshot.date, value: snapshot.githubStars })),
        githubForks: snapshots.map((snapshot) => ({ date: snapshot.date, value: snapshot.githubForks })),
        githubActiveForks: snapshots.map((snapshot) => ({ date: snapshot.date, value: snapshot.githubActiveForks })),
        pypiDownloads: snapshots.map((snapshot) => ({ date: snapshot.date, value: snapshot.pypiDownloadsWeekly })),
      },
      snapshotCount: snapshots.length,
      startDate: startDateString,
      endDate: endDateString,
    });
  } catch (error) {
    console.error('Failed to fetch historical data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}
