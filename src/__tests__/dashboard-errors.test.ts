import { describe, expect, it } from 'vitest';
import {
  getErrorDetails,
  resolveDashboardSource,
  type DashboardSourceState,
} from '../lib/dashboard';

describe('getErrorDetails', () => {
  it('returns the error message for Error instances', () => {
    expect(getErrorDetails(new Error('boom'))).toBe('boom');
  });

  it('returns string rejections as-is', () => {
    expect(getErrorDetails('plain failure')).toBe('plain failure');
  });

  it('falls back for unknown rejection types', () => {
    expect(getErrorDetails({ code: 500 })).toBe('Unknown error');
  });
});

describe('resolveDashboardSource', () => {
  it('returns data without an error for fulfilled results', () => {
    const result = resolveDashboardSource('GitHub', {
      status: 'fulfilled',
      value: { stars: 123 },
    });

    expect(result).toEqual<DashboardSourceState<{ stars: number }>>({
      data: { stars: 123 },
      error: null,
      errorDetails: null,
    });
  });

  it('returns a user-facing error and details for rejected results', () => {
    const result = resolveDashboardSource('PyPI', {
      status: 'rejected',
      reason: new Error('timeout contacting pypistats'),
    });

    expect(result.data).toBeNull();
    expect(result.error).toContain('PyPI metrics are temporarily unavailable');
    expect(result.error).toContain('retry automatically on the next refresh');
    expect(result.errorDetails).toBe('timeout contacting pypistats');
  });
});
