import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import { NextRequest } from 'next/server';
import { GET } from '../app/api/history/route';
import { createEmptySnapshotsFile, type HistoricalSnapshot } from '../lib/snapshots';

function isoDateDaysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().split('T')[0];
}

async function writeSnapshotsFile(filePath: string, snapshots: HistoricalSnapshot[]) {
  await writeFile(
    filePath,
    `${JSON.stringify({
      ...createEmptySnapshotsFile(),
      generatedAt: '2026-04-01T00:00:00.000Z',
      snapshots,
    }, null, 2)}\n`,
    'utf8'
  );
}

describe('/api/history', () => {
  let tempDir: string;
  let snapshotsFilePath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'history-route-'));
    snapshotsFilePath = path.join(tempDir, 'snapshots.json');
    process.env.SNAPSHOTS_FILE_PATH = snapshotsFilePath;
  });

  afterEach(async () => {
    delete process.env.SNAPSHOTS_FILE_PATH;
    await rm(tempDir, { recursive: true, force: true });
  });

  it('returns empty history messaging when no snapshots exist yet', async () => {
    await writeFile(snapshotsFilePath, `${JSON.stringify(createEmptySnapshotsFile(), null, 2)}\n`, 'utf8');

    const response = await GET(new NextRequest('http://localhost/api/history?period=30'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.snapshotCount).toBe(0);
    expect(payload.message).toContain('daily GitHub Actions workflow');
  });

  it('filters snapshots by the requested period', async () => {
    await writeSnapshotsFile(snapshotsFilePath, [
      {
        date: isoDateDaysAgo(1),
        githubStars: 120,
        githubForks: 30,
        githubActiveForks: 8,
        githubContributors: 18,
        githubRepeatContributors: 6,
        githubDependentRepos: 14,
        npmDownloadsWeekly: null,
        pypiDownloadsWeekly: 500,
      },
      {
        date: isoDateDaysAgo(15),
        githubStars: 100,
        githubForks: 25,
        githubActiveForks: 6,
        githubContributors: 16,
        githubRepeatContributors: 5,
        githubDependentRepos: 12,
        npmDownloadsWeekly: null,
        pypiDownloadsWeekly: 450,
      },
      {
        date: isoDateDaysAgo(45),
        githubStars: 80,
        githubForks: 20,
        githubActiveForks: 4,
        githubContributors: 14,
        githubRepeatContributors: 4,
        githubDependentRepos: 10,
        npmDownloadsWeekly: null,
        pypiDownloadsWeekly: 400,
      },
    ]);

    const response = await GET(new NextRequest('http://localhost/api/history?period=30'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.snapshotCount).toBe(2);
    expect(payload.data.githubStars).toEqual([
      { date: isoDateDaysAgo(1), value: 120 },
      { date: isoDateDaysAgo(15), value: 100 },
    ]);
  });

  it('rejects unsupported periods', async () => {
    const response = await GET(new NextRequest('http://localhost/api/history?period=14'));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('Invalid period');
  });
});
