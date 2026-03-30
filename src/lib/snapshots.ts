import { getDb } from './db';
import { trackedRepositories, metricsSnapshots } from './schema';
import { eq, and, desc } from 'drizzle-orm';
import { getAllGitHubMetrics, getDependentReposCount } from './github';
import { getPyPIDownloads } from './pypi';
import { TARGET_CONFIG } from './target-config';

export interface SnapshotData {
  githubStars: number;
  githubForks: number;
  githubActiveForks: number;
  githubContributors: number;
  githubRepeatContributors: number;
  githubDependentRepos: number | null;
  npmDownloadsWeekly: number | null;
  pypiDownloadsWeekly: number;
}

export async function getOrCreateTrackedRepository(): Promise<number> {
  const db = getDb();
  if (!db) throw new Error('Database not available');

  const existing = await db
    .select()
    .from(trackedRepositories)
    .where(eq(trackedRepositories.githubRepo, `${TARGET_CONFIG.github.owner}/${TARGET_CONFIG.github.repo}`))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const result = await db
    .insert(trackedRepositories)
    .values({
      name: TARGET_CONFIG.name,
      githubRepo: `${TARGET_CONFIG.github.owner}/${TARGET_CONFIG.github.repo}`,
      npmPackage: null,
      pypiPackage: TARGET_CONFIG.pypi.package,
    })
    .returning({ id: trackedRepositories.id });

  return result[0].id;
}

export async function collectCurrentMetrics(): Promise<SnapshotData> {
  const [github, pypi, dependentRepos] = await Promise.all([
    getAllGitHubMetrics(TARGET_CONFIG.github.owner, TARGET_CONFIG.github.repo),
    getPyPIDownloads(TARGET_CONFIG.pypi.package),
    getDependentReposCount([...TARGET_CONFIG.dependencySearches]).catch(() => null),
  ]);

  return {
    githubStars: github.stars,
    githubForks: github.forks,
    githubActiveForks: github.activeForks,
    githubContributors: github.totalContributors,
    githubRepeatContributors: github.repeatContributors,
    githubDependentRepos: dependentRepos,
    npmDownloadsWeekly: null,
    pypiDownloadsWeekly: pypi.weeklyDownloads,
  };
}

export async function hasSnapshotForToday(repositoryId: number): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  const today = new Date().toISOString().split('T')[0];
  const existing = await db
    .select({ id: metricsSnapshots.id })
    .from(metricsSnapshots)
    .where(
      and(
        eq(metricsSnapshots.repositoryId, repositoryId),
        eq(metricsSnapshots.date, today)
      )
    )
    .limit(1);

  return existing.length > 0;
}

export async function saveDailySnapshot(
  repositoryId: number,
  data: SnapshotData,
  date?: Date
): Promise<{ isNew: boolean; snapshotId: number | null; skipped: boolean }> {
  const db = getDb();
  if (!db) throw new Error('Database not available');

  const snapshotDate = date || new Date();
  const dateString = snapshotDate.toISOString().split('T')[0];
  const existing = await db
    .select({ id: metricsSnapshots.id })
    .from(metricsSnapshots)
    .where(
      and(
        eq(metricsSnapshots.repositoryId, repositoryId),
        eq(metricsSnapshots.date, dateString)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return { isNew: false, snapshotId: existing[0].id, skipped: true };
  }

  const result = await db
    .insert(metricsSnapshots)
    .values({
      repositoryId,
      date: dateString,
      githubStars: data.githubStars,
      githubForks: data.githubForks,
      githubActiveForks: data.githubActiveForks,
      githubContributors: data.githubContributors,
      githubRepeatContributors: data.githubRepeatContributors,
      githubDependentRepos: data.githubDependentRepos,
      npmDownloadsWeekly: data.npmDownloadsWeekly,
      pypiDownloadsWeekly: data.pypiDownloadsWeekly,
    })
    .returning({ id: metricsSnapshots.id });

  return { isNew: true, snapshotId: result[0].id, skipped: false };
}

export async function collectAndSaveSnapshot(): Promise<{
  success: boolean;
  isNew: boolean;
  skipped: boolean;
  snapshotId: number | null;
  date: string;
}> {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];

  const repositoryId = await getOrCreateTrackedRepository();
  const alreadyExists = await hasSnapshotForToday(repositoryId);
  if (alreadyExists) {
    return {
      success: true,
      isNew: false,
      skipped: true,
      snapshotId: null,
      date: dateString,
    };
  }

  const metrics = await collectCurrentMetrics();
  const { isNew, snapshotId, skipped } = await saveDailySnapshot(repositoryId, metrics, today);

  return {
    success: true,
    isNew,
    skipped,
    snapshotId,
    date: dateString,
  };
}

export async function getHistoricalSnapshots(
  repositoryId: number,
  days: number = 30
): Promise<typeof metricsSnapshots.$inferSelect[]> {
  const db = getDb();
  if (!db) return [];

  return db
    .select()
    .from(metricsSnapshots)
    .where(eq(metricsSnapshots.repositoryId, repositoryId))
    .orderBy(desc(metricsSnapshots.date))
    .limit(days);
}

export async function getLatestSnapshot(
  repositoryId: number
): Promise<typeof metricsSnapshots.$inferSelect | null> {
  const db = getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(metricsSnapshots)
    .where(eq(metricsSnapshots.repositoryId, repositoryId))
    .orderBy(desc(metricsSnapshots.date))
    .limit(1);

  return result[0] || null;
}

export interface StoredDependentRepos {
  count: number | null;
  date: string | null;
}

export async function getStoredDependentRepos(): Promise<StoredDependentRepos> {
  try {
    const repositoryId = await getOrCreateTrackedRepository();
    const snapshot = await getLatestSnapshot(repositoryId);
    return {
      count: snapshot?.githubDependentRepos ?? null,
      date: snapshot?.date ?? null,
    };
  } catch {
    return { count: null, date: null };
  }
}
