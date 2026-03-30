import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { trackedRepositories, metricsSnapshots } from '@/lib/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { TARGET_CONFIG } from '@/lib/target-config';

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

async function findTrackedRepositoryId(db: NonNullable<ReturnType<typeof getDb>>, githubRepo: string) {
  const result = await db
    .select({ id: trackedRepositories.id })
    .from(trackedRepositories)
    .where(eq(trackedRepositories.githubRepo, githubRepo))
    .limit(1);

  return result[0]?.id;
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

    const db = getDb();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];

    if (!db) {
      return emptyHistoryResponse(period, startDateString, endDateString, 'Database not available. Please configure DATABASE_URL.');
    }

    const repoParam = searchParams.get('repo') ?? searchParams.get('sdk');
    const githubRepo = repoParam || `${TARGET_CONFIG.github.owner}/${TARGET_CONFIG.github.repo}`;

    let repositoryId: number | undefined;
    try {
      repositoryId = await findTrackedRepositoryId(db, githubRepo);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return emptyHistoryResponse(period, startDateString, endDateString, 'Database unavailable or empty.');
    }

    if (!repositoryId) {
      return emptyHistoryResponse(
        period,
        startDateString,
        endDateString,
        'No tracked repository found in the database. Run the cron job to collect the initial snapshot.'
      );
    }

    const snapshots = await db
      .select()
      .from(metricsSnapshots)
      .where(
        and(
          eq(metricsSnapshots.repositoryId, repositoryId),
          gte(metricsSnapshots.date, startDateString)
        )
      )
      .orderBy(desc(metricsSnapshots.date));

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
