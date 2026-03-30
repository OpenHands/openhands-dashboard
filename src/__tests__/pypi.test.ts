import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildPyPIDownloadsQuery,
  getPyPIDownloads,
  getPyPIDownloadsSafe,
  parsePyPIDownloadsSummary,
} from '../lib/pypi';

describe('buildPyPIDownloadsQuery', () => {
  it('targets the ClickHouse PyPI downloads table', () => {
    const query = buildPyPIDownloadsQuery('openhands-ai');

    expect(query).toContain('FROM pypi.pypi_downloads_per_day');
    expect(query).toContain("WHERE project = 'openhands-ai'");
    expect(query).toContain('FORMAT JSONEachRow');
  });

  it('escapes package names before embedding them in SQL', () => {
    const query = buildPyPIDownloadsQuery("open'hands\\ai");

    expect(query).toContain("WHERE project = 'open\\'hands\\\\ai'");
  });
});

describe('parsePyPIDownloadsSummary', () => {
  it('parses ClickHouse JSONEachRow responses into dashboard metrics', () => {
    const metrics = parsePyPIDownloadsSummary(
      '{"last_day":"85969","last_week":"618931","last_month":"1385663","total":"4105119","rows":"604"}',
      'openhands-ai'
    );

    expect(metrics).toEqual({
      dailyDownloads: 85969,
      weeklyDownloads: 618931,
      monthlyDownloads: 1385663,
      allTimeDownloads: 4105119,
      package: 'openhands-ai',
    });
  });

  it('throws a not found error when ClickHouse has no rows for the package', () => {
    expect(() =>
      parsePyPIDownloadsSummary(
        '{"last_day":"0","last_week":"0","last_month":"0","total":"0","rows":"0"}',
        'missing-package'
      )
    ).toThrow('PyPI package not found: missing-package');
  });
});

describe('getPyPIDownloads', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('queries ClickHouse and returns parsed download totals', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        '{"last_day":"85969","last_week":"618931","last_month":"1385663","total":"4105119","rows":"604"}',
        { status: 200, statusText: 'OK' }
      )
    );

    vi.stubGlobal('fetch', fetchMock);

    await expect(getPyPIDownloads('openhands-ai')).resolves.toEqual({
      dailyDownloads: 85969,
      weeklyDownloads: 618931,
      monthlyDownloads: 1385663,
      allTimeDownloads: 4105119,
      package: 'openhands-ai',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://sql-clickhouse.clickhouse.com/?user=demo',
      expect.objectContaining({
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: expect.stringContaining("WHERE project = 'openhands-ai'"),
      })
    );
  });

  it('returns null from the safe helper when the package is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          '{"last_day":"0","last_week":"0","last_month":"0","total":"0","rows":"0"}',
          { status: 200, statusText: 'OK' }
        )
      )
    );

    await expect(getPyPIDownloadsSafe('missing-package')).resolves.toBeNull();
  });
});
