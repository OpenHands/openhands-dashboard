'use client';

import { useState, useEffect } from 'react';
import { TrendChart } from '@/components/trend-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TrendData {
  date: string;
  value: number | null;
}

interface HistoryResponse {
  period: number;
  data: {
    githubStars: TrendData[];
    githubForks: TrendData[];
    githubActiveForks: TrendData[];
    pypiDownloads: TrendData[];
  };
  snapshotCount: number;
}

interface TrendChartsProps {
  initialPeriod?: number;
}

const PERIODS = [
  { value: 7, label: '7d', ariaLabel: '7 days' },
  { value: 30, label: '30d', ariaLabel: '30 days' },
  { value: 90, label: '90d', ariaLabel: '90 days' },
];

export function TrendCharts({ initialPeriod = 7 }: TrendChartsProps) {
  const [period, setPeriod] = useState(initialPeriod);
  const [historyData, setHistoryData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/history?period=${period}`);
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            payload?.error ?? payload?.message ?? 'Historical charts are temporarily unavailable.'
          );
        }

        setHistoryData(payload);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Historical charts are temporarily unavailable.'
        );
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [period]);

  const hasInsufficientData = historyData && historyData.snapshotCount < 2;
  const hasNoData = !historyData || historyData.snapshotCount === 0;

  return (
    <div className="space-y-4">
      {/* Time Period Selector */}
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Button
            key={p.value}
            variant={period === p.value ? 'default' : 'outline'}
            size="sm"
            aria-label={p.ariaLabel}
            aria-pressed={period === p.value}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-6">
            <p className="font-medium text-amber-950">Historical charts are temporarily unavailable.</p>
            <p className="mt-2 text-sm text-amber-900">{error}</p>
            <p className="mt-2 text-sm text-amber-900">
              The rest of the dashboard is still available, and charts will retry on the next refresh.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">GitHub Stars Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] animate-pulse rounded-lg bg-muted sm:h-[250px]" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Forks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] animate-pulse rounded-lg bg-muted sm:h-[250px]" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">PyPI Weekly Downloads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] animate-pulse rounded-lg bg-muted sm:h-[250px]" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insufficient Data State */}
      {!loading && hasNoData && (
        <Card>
          <CardContent className="pt-6">
            <div className="h-32 bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground">
              📈 No historical data available yet. Historical snapshots are collected daily via cron job.
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && hasInsufficientData && (
        <Card>
          <CardContent className="pt-6">
            <div className="h-32 bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground">
              📊 Not enough historical data for {period} days view. Only {historyData?.snapshotCount} snapshot(s) available.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {!loading && historyData && !hasInsufficientData && !hasNoData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">GitHub Stars Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart
                data={historyData.data.githubStars.map(d => ({ ...d, github_stars: d.value }))}
                dataKey="github_stars"
                chartType="area"
                color="#6366f1"
                formatValue={(v) => `${v.toLocaleString()} ⭐`}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Forks</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart
                data={historyData.data.githubActiveForks.map(d => ({ ...d, active_forks: d.value }))}
                dataKey="active_forks"
                chartType="area"
                color="#f59e0b"
                formatValue={(v) => `${v.toLocaleString()} 🔥`}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">PyPI Weekly Downloads</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart
                data={historyData.data.pypiDownloads.map(d => ({ ...d, pypi_downloads: d.value }))}
                dataKey="pypi_downloads"
                chartType="bar"
                color="#10b981"
                formatValue={(v) => `${v.toLocaleString()} 📦`}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
