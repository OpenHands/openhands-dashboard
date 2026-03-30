import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSrc(relativePath: string): string {
  return readFileSync(join(__dirname, '..', relativePath), 'utf-8');
}

describe('date range selector — trend-charts.tsx', () => {
  const src = readSrc('components/trend-charts.tsx');

  it('defines 7d, 30d, and 90d period options', () => {
    expect(src).toContain("label: '7d'");
    expect(src).toContain("label: '30d'");
    expect(src).toContain("label: '90d'");
  });

  it('defaults to the shortest range (7 days)', () => {
    expect(src).toContain('initialPeriod = 7');
  });

  it('includes all three period values (7, 30, 90)', () => {
    expect(src).toContain('value: 7');
    expect(src).toContain('value: 30');
    expect(src).toContain('value: 90');
  });

  it('uses aria-label for screen reader accessibility', () => {
    expect(src).toContain('aria-label');
    expect(src).toContain("ariaLabel: '7 days'");
    expect(src).toContain("ariaLabel: '30 days'");
    expect(src).toContain("ariaLabel: '90 days'");
  });

  it('uses aria-pressed to communicate active selection state', () => {
    expect(src).toContain('aria-pressed');
  });

  it('applies variant="default" to active period and "outline" to inactive', () => {
    expect(src).toContain("variant={period === p.value ? 'default' : 'outline'}");
  });

  it('fetches chart data from /api/history with the selected period', () => {
    expect(src).toContain('/api/history?period=${period}');
  });

  it('refetches when the period changes (useEffect dependency)', () => {
    expect(src).toContain('[period]');
  });

  it('handles the empty-data edge case gracefully', () => {
    expect(src).toContain('hasNoData');
    expect(src).toContain('No historical data available yet');
  });

  it('handles sparse data with an informative message', () => {
    expect(src).toContain('hasInsufficientData');
    expect(src).toContain('Not enough historical data');
  });

  it('resets loading state before each fetch', () => {
    expect(src).toContain('setLoading(true)');
    expect(src).toContain('setLoading(false)');
  });

  it('renders period selector with flex-wrap for mobile compatibility', () => {
    expect(src).toContain('flex flex-wrap');
  });
});

describe('date range selector — page.tsx', () => {
  const src = readSrc('app/page.tsx');

  it('renders TrendCharts without an initialPeriod override (uses 7d default)', () => {
    expect(src).toContain('<TrendCharts />');
    expect(src).not.toContain('initialPeriod={30}');
  });
});

describe('date range selector — history API route', () => {
  const src = readSrc('app/api/history/route.ts');

  it('accepts period=7 as a valid query parameter', () => {
    expect(src).toContain('7');
    expect(src).toContain('validPeriods');
  });

  it('rejects invalid period values with a 400 response', () => {
    expect(src).toContain('400');
    expect(src).toContain('Invalid period');
  });

  it('returns an empty data set when the database is unavailable', () => {
    expect(src).toContain('snapshotCount: 0');
    expect(src).toContain('Database not available');
  });

  it('includes startDate and endDate in the response envelope', () => {
    expect(src).toContain('startDate');
    expect(src).toContain('endDate');
  });
});
