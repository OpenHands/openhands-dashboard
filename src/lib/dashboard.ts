export interface DashboardSourceState<T> {
  data: T | null;
  error: string | null;
  errorDetails: string | null;
}

export function getErrorDetails(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  return 'Unknown error';
}

export function resolveDashboardSource<T>(
  sourceLabel: string,
  result: PromiseSettledResult<T>
): DashboardSourceState<T> {
  if (result.status === 'fulfilled') {
    return {
      data: result.value,
      error: null,
      errorDetails: null,
    };
  }

  return {
    data: null,
    error: `${sourceLabel} metrics are temporarily unavailable. Available sections are still shown below, and the dashboard will retry automatically on the next refresh.`,
    errorDetails: getErrorDetails(result.reason),
  };
}
