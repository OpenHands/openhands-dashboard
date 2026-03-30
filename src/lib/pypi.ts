const PYPISTATS_API_BASE = 'https://pypistats.org/api';

interface PyPIStatsResponse {
  data: {
    last_day: number;
    last_week: number;
    last_month: number;
  };
  package: string;
  type: string;
}

interface PyPIOverallResponse {
  data: Array<{
    category: string;
    date: string;
    downloads: number;
  }>;
  package: string;
  type: string;
}

export interface PyPIMetrics {
  weeklyDownloads: number;
  dailyDownloads: number;
  monthlyDownloads: number;
  allTimeDownloads: number;
  package: string;
}

/**
 * Fetch download counts for a PyPI package
 */
export async function getPyPIDownloads(packageName: string): Promise<PyPIMetrics> {
  const [recentResponse, overallResponse] = await Promise.all([
    fetch(`${PYPISTATS_API_BASE}/packages/${encodeURIComponent(packageName)}/recent`, {
      headers: { 'Accept': 'application/json' },
    }),
    fetch(`${PYPISTATS_API_BASE}/packages/${encodeURIComponent(packageName)}/overall`, {
      headers: { 'Accept': 'application/json' },
    }),
  ]);
  
  if (recentResponse.status === 404) {
    throw new Error(`PyPI package not found: ${packageName}`);
  }
  
  if (!recentResponse.ok) {
    throw new Error(`PyPI API error: ${recentResponse.status} ${recentResponse.statusText}`);
  }
  
  const recentData: PyPIStatsResponse = await recentResponse.json();
  
  // Calculate all-time downloads (without mirrors to avoid double counting)
  let allTimeDownloads = 0;
  if (overallResponse.ok) {
    const overallData: PyPIOverallResponse = await overallResponse.json();
    allTimeDownloads = overallData.data
      .filter(d => d.category === 'without_mirrors')
      .reduce((sum, d) => sum + d.downloads, 0);
  }
  
  return {
    weeklyDownloads: recentData.data.last_week,
    dailyDownloads: recentData.data.last_day,
    monthlyDownloads: recentData.data.last_month,
    allTimeDownloads,
    package: recentData.package,
  };
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
