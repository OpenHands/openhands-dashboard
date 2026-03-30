import { describe, it, expect, beforeEach } from 'vitest';
import {
  countUniqueDependentRepos,
  getCacheEntry,
  setCacheEntry,
  clearCache,
  type GitHubSearchItem,
  type DependentReposMetrics,
} from '../lib/github';

// Helper to build a fake GitHubSearchItem for a given repo
function makeItem(repoId: number, fullName: string): GitHubSearchItem {
  return { repository: { id: repoId, full_name: fullName } };
}

describe('countUniqueDependentRepos', () => {
  it('returns 0 for an empty list', () => {
    expect(countUniqueDependentRepos([])).toBe(0);
  });

  it('counts a single item as one repo', () => {
    const items = [makeItem(1, 'user/repo')];
    expect(countUniqueDependentRepos(items)).toBe(1);
  });

  it('counts two items from different repos as two', () => {
    const items = [
      makeItem(1, 'alice/project'),
      makeItem(2, 'bob/project'),
    ];
    expect(countUniqueDependentRepos(items)).toBe(2);
  });

  it('deduplicates items from the same repository', () => {
    // Same repo appearing twice (e.g. once from requirements.txt and once from pyproject.toml)
    const items = [
      makeItem(42, 'user/repo'),
      makeItem(42, 'user/repo'),
    ];
    expect(countUniqueDependentRepos(items)).toBe(1);
  });

  it('deduplicates across multiple matches for the same repo', () => {
    // Repo 1 appears 3 times, repo 2 appears once
    const items = [
      makeItem(1, 'alice/a'),
      makeItem(2, 'bob/b'),
      makeItem(1, 'alice/a'),
      makeItem(1, 'alice/a'),
    ];
    expect(countUniqueDependentRepos(items)).toBe(2);
  });

  it('uses repository id (not full_name) for deduplication', () => {
    // Same id, different full_name — should still count as one repo
    const items = [
      makeItem(99, 'user/name-before-rename'),
      makeItem(99, 'user/name-after-rename'),
    ];
    expect(countUniqueDependentRepos(items)).toBe(1);
  });

  it('counts many unique repos correctly', () => {
    const items = Array.from({ length: 50 }, (_, i) => makeItem(i + 1, `user${i}/repo`));
    expect(countUniqueDependentRepos(items)).toBe(50);
  });

  it('handles a mix of duplicates and unique repos', () => {
    const items = [
      makeItem(1, 'a/repo'), // unique
      makeItem(2, 'b/repo'), // unique
      makeItem(3, 'c/repo'), // appears twice
      makeItem(3, 'c/repo'),
      makeItem(4, 'd/repo'), // unique
    ];
    expect(countUniqueDependentRepos(items)).toBe(4);
  });
});

describe('DependentReposMetrics interface', () => {
  it('holds a dependentRepos count', () => {
    const metrics: DependentReposMetrics = { dependentRepos: 42 };
    expect(metrics.dependentRepos).toBe(42);
  });

  it('accepts zero as a valid count', () => {
    const metrics: DependentReposMetrics = { dependentRepos: 0 };
    expect(metrics.dependentRepos).toBe(0);
  });
});

describe('dependent repos cache integration', () => {
  beforeEach(() => {
    clearCache();
  });

  it('stores and retrieves a dependent repos count under the query-based key', () => {
    // Mirrors the key format getDependentReposCount uses internally:
    // sorted queries joined with '|'
    const queries = [
      '"openhands-ai" filename:pyproject.toml -org:OpenHands',
      '"github.com/OpenHands/OpenHands" filename:requirements.txt -org:OpenHands',
    ];
    const cacheKey = `dependents:${[...queries].sort().join('|')}`;
    setCacheEntry(cacheKey, 42);
    expect(getCacheEntry<number>(cacheKey)).toBe(42);
  });

  it('returns null for a missing dependent repos cache entry', () => {
    expect(getCacheEntry('dependents:"no-such-query"')).toBeNull();
  });

  it('returns 0 as a cached value (falsy but valid)', () => {
    // getDependentReposCount uses strict !== null check so 0 must round-trip
    const cacheKey = 'dependents:"new-package"';
    setCacheEntry(cacheKey, 0);
    expect(getCacheEntry<number>(cacheKey)).toBe(0);
  });

  it('produces the same cache key regardless of query order', () => {
    const q1 = '"openhands-ai" filename:requirements.txt -org:OpenHands';
    const q2 = '"github.com/OpenHands/OpenHands" filename:pyproject.toml -org:OpenHands';
    // Both orderings must produce the same sorted key
    const key1 = `dependents:${[q1, q2].sort().join('|')}`;
    const key2 = `dependents:${[q2, q1].sort().join('|')}`;
    expect(key1).toBe(key2);
  });
});
