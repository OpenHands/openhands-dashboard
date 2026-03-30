import { describe, it, expect } from 'vitest';
import { getStoredDependentRepos, type StoredDependentRepos } from '../lib/snapshots';

describe('StoredDependentRepos interface', () => {
  it('holds count and date', () => {
    const result: StoredDependentRepos = { count: 42, date: '2026-03-18' };
    expect(result.count).toBe(42);
    expect(result.date).toBe('2026-03-18');
  });

  it('allows null count and date for the no-snapshot case', () => {
    const result: StoredDependentRepos = { count: null, date: null };
    expect(result.count).toBeNull();
    expect(result.date).toBeNull();
  });
});

describe('getStoredDependentRepos', () => {
  it('returns { count: null, date: null } when the dashboard cannot read snapshots', async () => {
    const result = await getStoredDependentRepos();
    expect(result).toEqual({ count: null, date: null });
  });

  it('always resolves (never rejects), even without a ready database', async () => {
    await expect(getStoredDependentRepos()).resolves.toBeDefined();
  });
});
