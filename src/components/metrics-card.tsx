import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  loading?: boolean;
  highlight?: boolean;
}

export function MetricsCard({
  title,
  value,
  subtitle,
  icon,
  loading = false,
  highlight = false,
}: MetricsCardProps) {
  return (
    <Card className={highlight ? 'bg-gradient-to-br from-green-50 to-background dark:from-green-950 dark:to-background' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon && <span>{icon}</span>}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
            {subtitle && <div className="h-3 w-32 animate-pulse rounded-md bg-muted/80" />}
          </div>
        ) : (
          <>
            <div className={`text-xl font-bold sm:text-2xl ${highlight ? 'text-green-600' : ''}`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
