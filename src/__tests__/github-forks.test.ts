import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  countActiveForks,
  getCacheEntry,
  setCacheEntry,
  clearCache,
  type ForkMetrics,
} from '../lib/github';

describe('countActiveForks', () => {
  it('returns 0 for an empty array', () => {
    expect(countActiveForks([])).toBe(0);
  });

  it('counts forks where pushed_at > created_at as active', () => {
    const forks = [
      { full_name: 'user1/repo', created_at: '2024-01-01T00:00:00Z', pushed_at: '2024-02-01T00:00:00Z' },
      { full_name: 'user2/repo', created_at: '2024-01-01T00:00:00Z', pushed_at: '2024-01-01T00:00:00Z' },
      { full_name: 'user3/repo', created_at: '2024-03-01T00:00:00Z', pushed_at: '2024-06-15T00:00:00Z' },
    ];
    expect(countActiveForks(forks)).toBe(2);
  });

  it('returns 0 when no forks have been pushed after creation', () => {
    const forks = [
      { full_name: 'a/repo', created_at: '2024-01-01T00:00:00Z', pushed_at: '2024-01-01T00:00:00Z' },
      { full_name: 'b/repo', created_at: '2024-05-10T12:00:00Z', pushed_at: '2024-05-10T12:00:00Z' },
    ];
    expect(countActiveForks(forks)).toBe(0);
  });

  it('counts all forks as active when every fork has new commits', () => {
    const forks = [
      { full_name: 'x/repo', created_at: '2024-01-01T00:00:00Z', pushed_at: '2024-01-02T00:00:00Z' },
      { full_name: 'y/repo', created_at: '2024-02-01T00:00:00Z', pushed_at: '2025-01-01T00:00:00Z' },
    ];
    expect(countActiveForks(forks)).toBe(2);
  });

  it('does not count forks where pushed_at < created_at', () => {
    // Edge case: pushed_at before created_at (unlikely but defensive)
    const forks = [
      { full_name: 'z/repo', created_at: '2024-06-01T00:00:00Z', pushed_at: '2024-05-01T00:00:00Z' },
    ];
    expect(countActiveForks(forks)).toBe(0);
  });
});

describe('cache utilities', () => {
  beforeEach(() => {
    clearCache();
  });

  it('returns null for a missing key', () => {
    expect(getCacheEntry('nonexistent')).toBeNull();
  });

  it('stores and retrieves a value', () => {
    const data: ForkMetrics = { totalForks: 10, activeForks: 3, sampled: false };
    setCacheEntry('test-key', data);
    expect(getCacheEntry<ForkMetrics>('test-key')).toEqual(data);
  });

  it('returns null for an expired entry', () => {
    vi.useFakeTimers();
    try {
      const data: ForkMetrics = { totalForks: 5, activeForks: 2, sampled: true };
      setCacheEntry('expired-key', data, 100);
      // Still valid
      expect(getCacheEntry<ForkMetrics>('expired-key')).toEqual(data);
      // Advance past TTL
      vi.advanceTimersByTime(200);
      expect(getCacheEntry<ForkMetrics>('expired-key')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears all entries', () => {
    setCacheEntry('a', 1);
    setCacheEntry('b', 2);
    clearCache();
    expect(getCacheEntry('a')).toBeNull();
    expect(getCacheEntry('b')).toBeNull();
  });

  it('respects per-key TTL', () => {
    vi.useFakeTimers();
    try {
      setCacheEntry('short', 'value', 1000);
      setCacheEntry('long', 'value', 60000);

      // Advance time by 1500ms
      vi.advanceTimersByTime(1500);

      expect(getCacheEntry('short')).toBeNull();
      expect(getCacheEntry('long')).toBe('value');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('ForkMetrics interface', () => {
  it('includes sampled field', () => {
    const metrics: ForkMetrics = { totalForks: 500, activeForks: 150, sampled: true };
    expect(metrics.sampled).toBe(true);
    expect(metrics.totalForks).toBe(500);
    expect(metrics.activeForks).toBe(150);
  });
});
