const GITHUB_API_BASE = 'https://api.github.com';

/** Maximum number of forks to fetch before switching to sampling */
const FORK_SAMPLING_THRESHOLD = 200;
/** Number of forks to sample when total exceeds threshold */
const FORK_SAMPLE_SIZE = 100;
/** Cache TTL in milliseconds (10 minutes) */
const CACHE_TTL_MS = 10 * 60 * 1000;
/** Cache TTL for dependent repos count (1 hour – changes infrequently) */
const DEPENDENT_REPOS_CACHE_TTL_MS = 60 * 60 * 1000;
/** Delay between search-API pages to stay under rate limit (ms) */
const SEARCH_PAGE_DELAY_MS = 250;

interface GitHubRepoInfo {
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  subscribers_count: number;
}

interface GitHubContributor {
  login: string;
  contributions: number;
}

interface GitHubFork {
  full_name: string;
  pushed_at: string;
  created_at: string;
}

export interface GitHubSearchItem {
  repository: {
    id: number;
    full_name: string;
  };
}

interface GitHubSearchResult<T> {
  total_count: number;
  incomplete_results: boolean;
  items: T[];
}

export interface RepoMetrics {
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
}

export interface ContributorMetrics {
  totalContributors: number;
  repeatContributors: number; // Contributors with 2+ contributions
  oneTimeContributors: number; // Contributors with exactly 1 contribution
  repeatContributorRatio: number; // Ratio of repeat contributors (0-1)
}

export interface ForkMetrics {
  totalForks: number;
  activeForks: number; // Forks with commits after fork creation
  sampled: boolean;    // Whether the result was estimated via sampling
}

export interface DependentReposMetrics {
  dependentRepos: number;
}

// --- In-memory cache for expensive API results ---
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

export function getCacheEntry<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCacheEntry<T>(key: string, data: T, ttlMs: number = CACHE_TTL_MS): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function clearCache(): void {
  cache.clear();
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'OpenHands-Dashboard',
  };
  
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  
  return headers;
}

async function fetchWithRateLimit<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: getHeaders() });
  
  if (response.status === 403) {
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
    const rateLimitReset = response.headers.get('X-RateLimit-Reset');
    
    if (rateLimitRemaining === '0') {
      const resetDate = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000) : null;
      throw new Error(`GitHub API rate limit exceeded. Resets at: ${resetDate?.toISOString()}`);
    }
  }
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

async function fetchAllPages<T>(baseUrl: string, perPage = 100): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  
  while (true) {
    const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}per_page=${perPage}&page=${page}`;
    const data = await fetchWithRateLimit<T[]>(url);
    
    if (data.length === 0) break;
    
    results.push(...data);
    
    if (data.length < perPage) break;
    
    page++;
  }
  
  return results;
}

/**
 * Count active forks from a list of fork objects.
 * A fork is "active" if pushed_at > created_at (has commits beyond the fork point).
 */
export function countActiveForks(forks: GitHubFork[]): number {
  return forks.filter(fork => {
    const pushedAt = new Date(fork.pushed_at);
    const createdAt = new Date(fork.created_at);
    return pushedAt > createdAt;
  }).length;
}

/**
 * Fetch basic repository metrics (stars, forks, issues, watchers)
 */
export async function getRepoMetrics(owner: string, repo: string): Promise<RepoMetrics> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;
  const data = await fetchWithRateLimit<GitHubRepoInfo>(url);
  
  return {
    stars: data.stargazers_count,
    forks: data.forks_count,
    openIssues: data.open_issues_count,
    watchers: data.subscribers_count,
  };
}

/**
 * Compute contributor metrics from a list of contributors.
 * Pure function – no API calls – for easy testing.
 */
export function computeContributorMetrics(contributors: GitHubContributor[]): ContributorMetrics {
  const total = contributors.length;
  const repeat = contributors.filter(c => c.contributions >= 2).length;
  const oneTime = total - repeat;

  return {
    totalContributors: total,
    repeatContributors: repeat,
    oneTimeContributors: oneTime,
    repeatContributorRatio: total > 0 ? repeat / total : 0,
  };
}

/**
 * Fetch contributor metrics
 */
export async function getContributorMetrics(owner: string, repo: string): Promise<ContributorMetrics> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contributors`;
  const contributors = await fetchAllPages<GitHubContributor>(url);

  return computeContributorMetrics(contributors);
}

/**
 * Fetch fork metrics including active forks (forks with commits after creation).
 *
 * For repos with many forks (> FORK_SAMPLING_THRESHOLD), fetches only the first
 * FORK_SAMPLE_SIZE forks (sorted newest-first) and extrapolates the active ratio
 * to estimate the total active fork count. This avoids exhausting API rate limits
 * on popular repositories.
 *
 * Results are cached in memory for CACHE_TTL_MS to further reduce API calls.
 */
export async function getForkMetrics(owner: string, repo: string): Promise<ForkMetrics> {
  const cacheKey = `forks:${owner}/${repo}`;
  const cached = getCacheEntry<ForkMetrics>(cacheKey);
  if (cached) return cached;

  // First, get the total fork count from the repo endpoint (cheap: 1 API call)
  const repoUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;
  const repoData = await fetchWithRateLimit<GitHubRepoInfo>(repoUrl);
  const totalForks = repoData.forks_count;

  let activeForks: number;
  let sampled = false;

  if (totalForks <= FORK_SAMPLING_THRESHOLD) {
    // Small enough to enumerate all forks
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/forks?sort=newest`;
    const forks = await fetchAllPages<GitHubFork>(url);
    activeForks = countActiveForks(forks);
  } else {
    // Sample the most recent forks and extrapolate
    sampled = true;
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/forks?sort=newest&per_page=${FORK_SAMPLE_SIZE}`;
    const sampleForks = await fetchWithRateLimit<GitHubFork[]>(url);
    const sampleActive = countActiveForks(sampleForks);

    if (sampleForks.length === 0) {
      activeForks = 0;
    } else {
      const activeRatio = sampleActive / sampleForks.length;
      activeForks = Math.round(activeRatio * totalForks);
    }
  }

  const result: ForkMetrics = { totalForks, activeForks, sampled };
  setCacheEntry(cacheKey, result);
  return result;
}

/**
 * Fetch all pages from the GitHub code search API.
 * The search API returns results wrapped in {total_count, items}, unlike
 * the list endpoints which return plain arrays.
 */
async function fetchSearchPages<T>(baseUrl: string): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `${baseUrl}&per_page=${perPage}&page=${page}`;
    const data = await fetchWithRateLimit<GitHubSearchResult<T>>(url);

    results.push(...data.items);

    // Stop when we've received all items or hit GitHub's 1000-result cap
    if (data.items.length < perPage || results.length >= data.total_count || page >= 10) break;

    page++;
    // Brief delay to stay within the Search API rate limit (30 req/min)
    await new Promise(resolve => setTimeout(resolve, SEARCH_PAGE_DELAY_MS));
  }

  return results;
}

/**
 * Count unique repositories from a list of GitHub code-search result items.
 * Pure function – no API calls – for easy testing.
 */
export function countUniqueDependentRepos(items: GitHubSearchItem[]): number {
  const repoIds = new Set(items.map(item => item.repository.id));
  return repoIds.size;
}

/**
 * Fetch the number of public repositories that reference OpenHands,
 * using one or more raw GitHub code-search query strings.
 *
 * Results from all queries are combined and deduplicated by repository ID
 * before counting, so a repo that matches multiple queries is only counted once.
 *
 * Results are cached for DEPENDENT_REPOS_CACHE_TTL_MS (1 hour) to stay well
 * within the Search API's 30 req/min rate limit.
 *
 * @param queries - GitHub code-search query strings exactly as you would type
 *                  them in the GitHub search box (e.g.
 *                  '"openhands-ai" filename:pyproject.toml -org:OpenHands').
 *                  Pass an empty array to skip the fetch and return 0.
 */
export async function getDependentReposCount(queries: string[]): Promise<number> {
  if (queries.length === 0) return 0;

  // Sort queries for a stable, order-independent cache key
  const cacheKey = `dependents:${[...queries].sort().join('|')}`;
  const cached = getCacheEntry<number>(cacheKey);
  if (cached !== null) return cached;

  const allItems: GitHubSearchItem[] = [];

  for (const query of queries) {
    const q = encodeURIComponent(query);
    const items = await fetchSearchPages<GitHubSearchItem>(
      `${GITHUB_API_BASE}/search/code?q=${q}`
    );
    allItems.push(...items);
  }

  const count = countUniqueDependentRepos(allItems);
  setCacheEntry(cacheKey, count, DEPENDENT_REPOS_CACHE_TTL_MS);
  return count;
}

/**
 * Fetch all GitHub metrics for a repository
 */
export async function getAllGitHubMetrics(owner: string, repo: string) {
  const [repoMetrics, contributorMetrics, forkMetrics] = await Promise.all([
    getRepoMetrics(owner, repo),
    getContributorMetrics(owner, repo),
    getForkMetrics(owner, repo),
  ]);
  
  return {
    stars: repoMetrics.stars,
    forks: repoMetrics.forks,
    openIssues: repoMetrics.openIssues,
    watchers: repoMetrics.watchers,
    totalContributors: contributorMetrics.totalContributors,
    repeatContributors: contributorMetrics.repeatContributors,
    oneTimeContributors: contributorMetrics.oneTimeContributors,
    repeatContributorRatio: contributorMetrics.repeatContributorRatio,
    activeForks: forkMetrics.activeForks,
  };
}
