const NPM_API_BASE = 'https://api.npmjs.org';

interface NpmDownloadsResponse {
  downloads: number;
  start: string;
  end: string;
  package: string;
}

export interface NpmMetrics {
  weeklyDownloads: number;
  package: string;
  periodStart: string;
  periodEnd: string;
}

/**
 * Fetch weekly download counts for an npm package
 */
export async function getNpmDownloads(packageName: string): Promise<NpmMetrics> {
  const url = `${NPM_API_BASE}/downloads/point/last-week/${encodeURIComponent(packageName)}`;
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });
  
  if (response.status === 404) {
    throw new Error(`npm package not found: ${packageName}`);
  }
  
  if (!response.ok) {
    throw new Error(`npm API error: ${response.status} ${response.statusText}`);
  }
  
  const data: NpmDownloadsResponse = await response.json();
  
  return {
    weeklyDownloads: data.downloads,
    package: data.package,
    periodStart: data.start,
    periodEnd: data.end,
  };
}

/**
 * Fetch weekly downloads, returns null if package doesn't exist
 */
export async function getNpmDownloadsSafe(packageName: string): Promise<NpmMetrics | null> {
  try {
    return await getNpmDownloads(packageName);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return null;
    }
    throw error;
  }
}
