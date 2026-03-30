const PYPI_CLICKHOUSE_URL = 'https://sql-clickhouse.clickhouse.com/?user=demo';

interface PyPIDownloadsSummaryRow {
  last_day: string | number;
  last_week: string | number;
  last_month: string | number;
  total: string | number;
  rows: string | number;
}

export interface PyPIMetrics {
  weeklyDownloads: number;
  dailyDownloads: number;
  monthlyDownloads: number;
  allTimeDownloads: number;
  package: string;
}

function escapeClickHouseString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export function buildPyPIDownloadsQuery(packageName: string): string {
  const escapedPackageName = escapeClickHouseString(packageName);

  return `
      SELECT
        sumIf(count, date = yesterday()) AS last_day,
        sumIf(count, date >= yesterday() - 6 AND date <= yesterday()) AS last_week,
        sumIf(count, date >= yesterday() - 29 AND date <= yesterday()) AS last_month,
        sum(count) AS total,
        count() AS rows
      FROM pypi.pypi_downloads_per_day
      WHERE project = '${escapedPackageName}'
      FORMAT JSONEachRow
    `;
}

export function parsePyPIDownloadsSummary(summaryText: string, packageName: string): PyPIMetrics {
  const trimmedSummary = summaryText.trim();

  if (!trimmedSummary) {
    throw new Error('PyPI ClickHouse returned an empty response');
  }

  const summary = JSON.parse(trimmedSummary) as PyPIDownloadsSummaryRow;

  if (parseInt(String(summary.rows), 10) === 0) {
    throw new Error(`PyPI package not found: ${packageName}`);
  }

  return {
    weeklyDownloads: parseInt(String(summary.last_week), 10),
    dailyDownloads: parseInt(String(summary.last_day), 10),
    monthlyDownloads: parseInt(String(summary.last_month), 10),
    allTimeDownloads: parseInt(String(summary.total), 10),
    package: packageName,
  };
}

/**
 * Fetch download counts for a PyPI package from ClickHouse.
 */
export async function getPyPIDownloads(packageName: string): Promise<PyPIMetrics> {
  const response = await fetch(PYPI_CLICKHOUSE_URL, {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
    body: buildPyPIDownloadsQuery(packageName),
  });

  if (!response.ok) {
    throw new Error(`PyPI ClickHouse error: ${response.status} ${response.statusText}`);
  }

  const summaryText = await response.text();
  return parsePyPIDownloadsSummary(summaryText, packageName);
}

/**
 * Fetch downloads, returns null if package doesn't exist
 */
export async function getPyPIDownloadsSafe(packageName: string): Promise<PyPIMetrics | null> {
  try {
    return await getPyPIDownloads(packageName);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return null;
    }
    throw error;
  }
}
