import { mkdir, readFile, rename, writeFile } from 'fs/promises';
import path from 'path';
import { getAllGitHubMetrics, getDependentReposCount } from './github';
import { getPyPIDownloads } from './pypi';
import { TARGET_CONFIG } from './target-config';

const SNAPSHOTS_SCHEMA_VERSION = 1;

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

export interface HistoricalSnapshot extends SnapshotData {
  date: string;
}

export interface SnapshotsFile {
  schemaVersion: number;
  generatedAt: string | null;
  snapshots: HistoricalSnapshot[];
}

export interface StoredDependentRepos {
  count: number | null;
  date: string | null;
}

export type SaveSnapshotAction = 'created' | 'updated' | 'unchanged';

export function getSnapshotsFilePath(): string {
  return process.env.SNAPSHOTS_FILE_PATH || path.join(process.cwd(), 'data', 'snapshots.json');
}

export function normalizeSnapshotDate(date: Date | string): string {
  if (typeof date === 'string') {
    return date;
  }

  return date.toISOString().split('T')[0];
}

function assertNumberField(name: string, value: unknown, nullable = false): number | null {
  if (nullable && value === null) {
    return null;
  }

  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Invalid snapshot field: ${name}`);
  }

  return value;
}

function parseHistoricalSnapshot(value: unknown): HistoricalSnapshot {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid snapshot entry');
  }

  const snapshot = value as Record<string, unknown>;

  if (typeof snapshot.date !== 'string' || snapshot.date.length === 0) {
    throw new Error('Invalid snapshot field: date');
  }

  return {
    date: snapshot.date,
    githubStars: assertNumberField('githubStars', snapshot.githubStars) ?? 0,
    githubForks: assertNumberField('githubForks', snapshot.githubForks) ?? 0,
    githubActiveForks: assertNumberField('githubActiveForks', snapshot.githubActiveForks) ?? 0,
    githubContributors: assertNumberField('githubContributors', snapshot.githubContributors) ?? 0,
    githubRepeatContributors: assertNumberField(
      'githubRepeatContributors',
      snapshot.githubRepeatContributors
    ) ?? 0,
    githubDependentRepos: assertNumberField(
      'githubDependentRepos',
      snapshot.githubDependentRepos,
      true
    ),
    npmDownloadsWeekly: assertNumberField('npmDownloadsWeekly', snapshot.npmDownloadsWeekly, true),
    pypiDownloadsWeekly: assertNumberField('pypiDownloadsWeekly', snapshot.pypiDownloadsWeekly) ?? 0,
  };
}

export function sortSnapshotsDescending(snapshots: HistoricalSnapshot[]): HistoricalSnapshot[] {
  return [...snapshots].sort((left, right) => right.date.localeCompare(left.date));
}

export function createEmptySnapshotsFile(): SnapshotsFile {
  return {
    schemaVersion: SNAPSHOTS_SCHEMA_VERSION,
    generatedAt: null,
    snapshots: [],
  };
}

export function parseSnapshotsFile(fileContents: string): SnapshotsFile {
  if (fileContents.trim().length === 0) {
    return createEmptySnapshotsFile();
  }

  const parsed = JSON.parse(fileContents) as Partial<SnapshotsFile>;

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid snapshots file');
  }

  const snapshots = Array.isArray(parsed.snapshots)
    ? parsed.snapshots.map((snapshot) => parseHistoricalSnapshot(snapshot))
    : [];

  return {
    schemaVersion: SNAPSHOTS_SCHEMA_VERSION,
    generatedAt: typeof parsed.generatedAt === 'string' ? parsed.generatedAt : null,
    snapshots: sortSnapshotsDescending(snapshots),
  };
}

export async function readSnapshotsFile(): Promise<SnapshotsFile> {
  try {
    const fileContents = await readFile(getSnapshotsFilePath(), 'utf8');
    return parseSnapshotsFile(fileContents);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return createEmptySnapshotsFile();
    }

    throw error;
  }
}

async function writeSnapshotsFile(file: SnapshotsFile): Promise<void> {
  const filePath = getSnapshotsFilePath();
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  const contents = `${JSON.stringify(file, null, 2)}\n`;
  await writeFile(tempPath, contents, 'utf8');
  await rename(tempPath, filePath);
}

export function upsertSnapshot(
  snapshots: HistoricalSnapshot[],
  snapshot: HistoricalSnapshot
): { action: SaveSnapshotAction; snapshots: HistoricalSnapshot[] } {
  const existingIndex = snapshots.findIndex((entry) => entry.date === snapshot.date);

  if (existingIndex === -1) {
    return {
      action: 'created',
      snapshots: sortSnapshotsDescending([...snapshots, snapshot]),
    };
  }

  const existingSnapshot = snapshots[existingIndex];
  if (JSON.stringify(existingSnapshot) === JSON.stringify(snapshot)) {
    return {
      action: 'unchanged',
      snapshots,
    };
  }

  const nextSnapshots = [...snapshots];
  nextSnapshots[existingIndex] = snapshot;

  return {
    action: 'updated',
    snapshots: sortSnapshotsDescending(nextSnapshots),
  };
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

export async function saveDailySnapshot(
  data: SnapshotData,
  date: Date | string = new Date()
): Promise<{ action: SaveSnapshotAction; snapshot: HistoricalSnapshot }> {
  const snapshot: HistoricalSnapshot = {
    date: normalizeSnapshotDate(date),
    ...data,
  };

  const currentFile = await readSnapshotsFile();
  const result = upsertSnapshot(currentFile.snapshots, snapshot);

  if (result.action !== 'unchanged') {
    await writeSnapshotsFile({
      schemaVersion: SNAPSHOTS_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      snapshots: result.snapshots,
    });
  }

  return {
    action: result.action,
    snapshot,
  };
}

export async function collectAndSaveSnapshot(
  date: Date | string = new Date()
): Promise<{ action: SaveSnapshotAction; date: string; snapshot: HistoricalSnapshot }> {
  const metrics = await collectCurrentMetrics();
  const result = await saveDailySnapshot(metrics, date);

  return {
    action: result.action,
    date: result.snapshot.date,
    snapshot: result.snapshot,
  };
}

export async function getHistoricalSnapshots(days = 30): Promise<HistoricalSnapshot[]> {
  const { snapshots } = await readSnapshotsFile();
  const normalizedDays = Number.isFinite(days) ? Math.max(0, Math.floor(days)) : 30;
  return snapshots.slice(0, normalizedDays);
}

export function filterSnapshotsByDateRange(
  snapshots: HistoricalSnapshot[],
  startDate: string,
  endDate: string
): HistoricalSnapshot[] {
  return snapshots.filter((snapshot) => snapshot.date >= startDate && snapshot.date <= endDate);
}

export async function getHistoricalSnapshotsInRange(
  startDate: string,
  endDate: string
): Promise<HistoricalSnapshot[]> {
  const { snapshots } = await readSnapshotsFile();
  return filterSnapshotsByDateRange(snapshots, startDate, endDate);
}

export async function getLatestSnapshot(): Promise<HistoricalSnapshot | null> {
  const { snapshots } = await readSnapshotsFile();
  return snapshots[0] ?? null;
}

export async function getStoredDependentRepos(): Promise<StoredDependentRepos> {
  try {
    const snapshot = await getLatestSnapshot();
    return {
      count: snapshot?.githubDependentRepos ?? null,
      date: snapshot?.date ?? null,
    };
  } catch {
    return { count: null, date: null };
  }
}
