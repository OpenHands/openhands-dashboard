import { MetricsCard } from '@/components/metrics-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function ChartSkeletonCard({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] animate-pulse rounded-lg bg-muted sm:h-[250px]" />
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-7xl space-y-3">
          <div className="h-8 w-56 animate-pulse rounded-md bg-white/25 sm:h-9 sm:w-72" />
          <div className="h-4 max-w-2xl animate-pulse rounded-md bg-white/15 sm:h-5" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-6">
                <div className="h-5 w-52 animate-pulse rounded-md bg-muted" />
                <div className="h-5 w-36 animate-pulse rounded-md bg-muted" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />
                <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="mb-4 text-lg font-semibold text-foreground">📊 GitHub Metrics</h2>
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <MetricsCard title="Stars" value="--" icon="⭐" loading />
          <MetricsCard title="Forks" value="--" icon="🍴" loading />
          <MetricsCard title="Active Forks" value="--" icon="🔥" subtitle="with commits" loading />
          <MetricsCard title="Contributors" value="--" icon="👥" subtitle="total" loading />
          <MetricsCard title="Repeat Contributors" value="--" icon="🔁" subtitle="2+ commits" loading />
          <MetricsCard title="Open Issues" value="--" icon="🐛" loading />
        </div>

        <h2 className="mb-4 text-lg font-semibold text-foreground">📦 Ecosystem &amp; Adoption</h2>
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricsCard title="Dependent Repos" value="--" icon="🔗" subtitle="updated daily via cron" loading />
        </div>

        <h2 className="mb-4 text-lg font-semibold text-foreground">🐍 PyPI Downloads</h2>
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricsCard title="Weekly Downloads" value="--" icon="📈" loading />
          <MetricsCard title="Daily Downloads" value="--" icon="📅" loading />
          <MetricsCard title="Last 30 Days" value="--" icon="📆" loading />
          <MetricsCard title="All Time" value="--" icon="🏆" loading />
        </div>

        <h2 className="mb-4 text-lg font-semibold text-foreground">📈 Trends Over Time</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="h-9 w-16 animate-pulse rounded-md bg-muted" />
            <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
            <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ChartSkeletonCard title="GitHub Stars Growth" />
            <ChartSkeletonCard title="Active Forks" />
            <ChartSkeletonCard title="PyPI Weekly Downloads" />
          </div>
        </div>
      </main>

      <footer className="mt-12 border-t py-6 text-center text-sm text-muted-foreground">
        OpenHands Dashboard • Data from GitHub &amp; PyPI APIs
      </footer>
    </div>
  );
}
