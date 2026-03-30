import { describe, it, expect } from 'vitest';
import {
  computeContributorMetrics,
  type ContributorMetrics,
} from '../lib/github';

describe('computeContributorMetrics', () => {
  it('returns zeros for an empty contributor list', () => {
    const result = computeContributorMetrics([]);
    expect(result).toEqual<ContributorMetrics>({
      totalContributors: 0,
      repeatContributors: 0,
      oneTimeContributors: 0,
      repeatContributorRatio: 0,
    });
  });

  it('counts contributors with exactly 1 contribution as one-time', () => {
    const contributors = [
      { login: 'alice', contributions: 1 },
      { login: 'bob', contributions: 1 },
    ];
    const result = computeContributorMetrics(contributors);
    expect(result.totalContributors).toBe(2);
    expect(result.oneTimeContributors).toBe(2);
    expect(result.repeatContributors).toBe(0);
    expect(result.repeatContributorRatio).toBe(0);
  });

  it('counts contributors with 2+ contributions as repeat', () => {
    const contributors = [
      { login: 'alice', contributions: 5 },
      { login: 'bob', contributions: 2 },
      { login: 'charlie', contributions: 1 },
    ];
    const result = computeContributorMetrics(contributors);
    expect(result.totalContributors).toBe(3);
    expect(result.repeatContributors).toBe(2);
    expect(result.oneTimeContributors).toBe(1);
  });

  it('computes ratio correctly', () => {
    const contributors = [
      { login: 'a', contributions: 10 },
      { login: 'b', contributions: 3 },
      { login: 'c', contributions: 1 },
      { login: 'd', contributions: 1 },
    ];
    const result = computeContributorMetrics(contributors);
    expect(result.repeatContributorRatio).toBe(0.5); // 2 out of 4
  });

  it('returns ratio of 1 when all contributors are repeat', () => {
    const contributors = [
      { login: 'a', contributions: 42 },
      { login: 'b', contributions: 7 },
    ];
    const result = computeContributorMetrics(contributors);
    expect(result.repeatContributorRatio).toBe(1);
    expect(result.oneTimeContributors).toBe(0);
  });

  it('handles a single contributor correctly', () => {
    const oneTime = computeContributorMetrics([{ login: 'solo', contributions: 1 }]);
    expect(oneTime.repeatContributors).toBe(0);
    expect(oneTime.repeatContributorRatio).toBe(0);

    const repeat = computeContributorMetrics([{ login: 'solo', contributions: 2 }]);
    expect(repeat.repeatContributors).toBe(1);
    expect(repeat.repeatContributorRatio).toBe(1);
  });

  it('ensures oneTimeContributors + repeatContributors === totalContributors', () => {
    const contributors = Array.from({ length: 50 }, (_, i) => ({
      login: `user${i}`,
      contributions: i + 1, // 1..50
    }));
    const result = computeContributorMetrics(contributors);
    expect(result.oneTimeContributors + result.repeatContributors).toBe(result.totalContributors);
    // Only user0 (contributions=1) is one-time
    expect(result.oneTimeContributors).toBe(1);
    expect(result.repeatContributors).toBe(49);
  });
});
