import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  createEmptySnapshotsFile,
  filterSnapshotsByDateRange,
  getHistoricalSnapshots,
  getStoredDependentRepos,
  parseSnapshotsFile,
  saveDailySnapshot,
  type HistoricalSnapshot,
  type SnapshotData,
  type StoredDependentRepos,
} from '../lib/snapshots';

const sampleSnapshotData: SnapshotData = {
  githubStars: 123,
  githubForks: 45,
  githubActiveForks: 9,
  githubContributors: 18,
  githubRepeatContributors: 6,
  githubDependentRepos: 14,
  npmDownloadsWeekly: null,
  pypiDownloadsWeekly: 600,
};

describe('snapshot storage helpers', () => {
  let tempDir: string;
  let snapshotsFilePath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'snapshot-tests-'));
    snapshotsFilePath = path.join(tempDir, 'snapshots.json');
    process.env.SNAPSHOTS_FILE_PATH = snapshotsFilePath;
  });

  afterEach(async () => {
    delete process.env.SNAPSHOTS_FILE_PATH;
    await rm(tempDir, { recursive: true, force: true });
  });

  it('parses an empty file into an empty snapshot collection', () => {
    expect(parseSnapshotsFile('')).toEqual(createEmptySnapshotsFile());
  });

  it('holds count and date for stored dependent repo metadata', () => {
    const result: StoredDependentRepos = { count: 42, date: '2026-03-18' };
    expect(result.count).toBe(42);
    expect(result.date).toBe('2026-03-18');
  });

  it('returns null stored dependents when no snapshot file exists', async () => {
    await expect(getStoredDependentRepos()).resolves.toEqual({ count: null, date: null });
  });

  it('creates a daily snapshot and stays idempotent when rerun with identical data', async () => {
    await expect(saveDailySnapshot(sampleSnapshotData, '2026-04-01')).resolves.toMatchObject({
      action: 'created',
      snapshot: { date: '2026-04-01', ...sampleSnapshotData },
    });

    await expect(saveDailySnapshot(sampleSnapshotData, '2026-04-01')).resolves.toMatchObject({
      action: 'unchanged',
      snapshot: { date: '2026-04-01', ...sampleSnapshotData },
    });

    const snapshots = await getHistoricalSnapshots();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].githubStars).toBe(123);
  });

  it('updates an existing snapshot for the same day when metric values change', async () => {
    await saveDailySnapshot(sampleSnapshotData, '2026-04-01');
    await expect(
      saveDailySnapshot({ ...sampleSnapshotData, githubStars: 150, githubDependentRepos: 20 }, '2026-04-01')
    ).resolves.toMatchObject({ action: 'updated' });

    const fileContents = await readFile(snapshotsFilePath, 'utf8');
    const parsed = parseSnapshotsFile(fileContents);
    expect(parsed.snapshots).toHaveLength(1);
    expect(parsed.snapshots[0].githubStars).toBe(150);
    expect(parsed.snapshots[0].githubDependentRepos).toBe(20);
  });

  it('filters snapshots by date range while preserving descending order', () => {
    const snapshots: HistoricalSnapshot[] = [
      { date: '2026-04-03', ...sampleSnapshotData },
      { date: '2026-04-02', ...sampleSnapshotData, githubStars: 122 },
      { date: '2026-03-30', ...sampleSnapshotData, githubStars: 120 },
    ];

    expect(filterSnapshotsByDateRange(snapshots, '2026-04-01', '2026-04-03')).toEqual([
      { date: '2026-04-03', ...sampleSnapshotData },
      { date: '2026-04-02', ...sampleSnapshotData, githubStars: 122 },
    ]);
  });

  it('always resolves stored dependent repo reads', async () => {
    await expect(getStoredDependentRepos()).resolves.toBeDefined();
  });

  it('reads the latest stored dependent repo count from snapshots', async () => {
    await writeFile(
      snapshotsFilePath,
      `${JSON.stringify(
        {
          ...createEmptySnapshotsFile(),
          generatedAt: '2026-04-01T00:00:00.000Z',
          snapshots: [
            { date: '2026-04-03', ...sampleSnapshotData, githubDependentRepos: 21 },
            { date: '2026-04-02', ...sampleSnapshotData, githubDependentRepos: 20 },
          ],
        },
        null,
        2
      )}\n`,
      'utf8'
    );

    await expect(getStoredDependentRepos()).resolves.toEqual({
      count: 21,
      date: '2026-04-03',
    });
  });
});
