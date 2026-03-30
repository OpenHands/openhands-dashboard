import { NextRequest, NextResponse } from 'next/server';
import { getAllGitHubMetrics, getDependentReposCount } from '@/lib/github';
import { getNpmDownloadsSafe } from '@/lib/npm';
import { getPyPIDownloadsSafe } from '@/lib/pypi';

interface GitHubMetricsResponse {
  stars: number;
  forks: number;
  activeForks: number;
  contributors: number;
  repeatContributors: number;
  oneTimeContributors: number;
  repeatContributorRatio: number;
  openIssues: number;
  watchers: number;
  dependentRepos: number | null;
}

interface NpmMetricsResponse {
  weeklyDownloads: number;
}

interface PyPIMetricsResponse {
  weeklyDownloads: number;
  dailyDownloads: number;
  monthlyDownloads: number;
}

interface MetricsResponse {
  github?: GitHubMetricsResponse | { error: string };
  npm?: NpmMetricsResponse | { error: string };
  pypi?: PyPIMetricsResponse | { error: string };
  fetchedAt: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const githubRepo = searchParams.get('github');
  const npmPackage = searchParams.get('npm');
  const pypiPackage = searchParams.get('pypi');

  if (!githubRepo && !npmPackage && !pypiPackage) {
    return NextResponse.json(
      { error: 'At least one of github, npm, or pypi parameter is required' },
      { status: 400 }
    );
  }

  const response: MetricsResponse = {
    fetchedAt: new Date().toISOString(),
  };

  const promises: Promise<void>[] = [];

  // Fetch GitHub metrics
  if (githubRepo) {
    const [owner, repo] = githubRepo.split('/');
    if (owner && repo) {
      // Build generic search queries from whatever package params are provided.
      // Callers that want the curated dashboard-specific searches should use the
      // dashboard directly; this endpoint stays package-agnostic.
      const dependencyQueries: string[] = [];
      if (pypiPackage) dependencyQueries.push(`"${pypiPackage}"`);
      if (npmPackage) dependencyQueries.push(`"${npmPackage}" filename:package.json`);

      promises.push(
        Promise.all([
          getAllGitHubMetrics(owner, repo),
          getDependentReposCount(dependencyQueries).catch(() => null),
        ])
          .then(([metrics, dependentRepos]) => {
            response.github = {
              stars: metrics.stars,
              forks: metrics.forks,
              activeForks: metrics.activeForks,
              contributors: metrics.totalContributors,
              repeatContributors: metrics.repeatContributors,
              oneTimeContributors: metrics.oneTimeContributors,
              repeatContributorRatio: metrics.repeatContributorRatio,
              openIssues: metrics.openIssues,
              watchers: metrics.watchers,
              dependentRepos,
            };
          })
          .catch((error) => {
            response.github = { error: error.message };
          })
      );
    } else {
      response.github = { error: 'Invalid github format. Use owner/repo' };
    }
  }

  // Fetch npm metrics
  if (npmPackage) {
    promises.push(
      getNpmDownloadsSafe(npmPackage)
        .then((metrics) => {
          if (metrics) {
            response.npm = {
              weeklyDownloads: metrics.weeklyDownloads,
            };
          } else {
            response.npm = { error: 'Package not found' };
          }
        })
        .catch((error) => {
          response.npm = { error: error.message };
        })
    );
  }

  // Fetch PyPI metrics
  if (pypiPackage) {
    promises.push(
      getPyPIDownloadsSafe(pypiPackage)
        .then((metrics) => {
          if (metrics) {
            response.pypi = {
              weeklyDownloads: metrics.weeklyDownloads,
              dailyDownloads: metrics.dailyDownloads,
              monthlyDownloads: metrics.monthlyDownloads,
            };
          } else {
            response.pypi = { error: 'Package not found' };
          }
        })
        .catch((error) => {
          response.pypi = { error: error.message };
        })
    );
  }

  await Promise.all(promises);

  return NextResponse.json(response);
}
