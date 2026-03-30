'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface RefreshCountdownProps {
  lastUpdated: string;
  refreshInterval: number; // in seconds
}

export function RefreshCountdown({ lastUpdated, refreshInterval }: RefreshCountdownProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(refreshInterval);

  useEffect(() => {
    const lastUpdateTime = new Date(lastUpdated).getTime();
    const nextRefreshTime = lastUpdateTime + refreshInterval * 1000;
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((nextRefreshTime - now) / 1000));
    setSecondsUntilRefresh(remaining);

    const interval = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          startTransition(() => {
            router.refresh();
          });
          return refreshInterval;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated, refreshInterval, router, startTransition]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <span>Updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
      <span className="rounded-full bg-muted px-2 py-1 text-xs">
        {isPending ? '↻ Refreshing…' : `↻ ${formatTime(secondsUntilRefresh)}`}
      </span>
    </div>
  );
}
