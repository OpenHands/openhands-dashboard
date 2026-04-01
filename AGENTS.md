# openhands-dashboard — Agent Guide

## Project Overview
Next.js 14 + TypeScript dashboard for OpenHands metrics sourced from GitHub, PyPI, and daily snapshots committed to the repository.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS + shadcn/ui components
- **Historical Storage**: `data/snapshots.json` committed to git
- **Testing**: Vitest
- **Linting**: ESLint 8 via `eslint . --ext .ts,.tsx`

## Key Commands
```bash
npm ci
npm run dev
npm run build
npm run lint
npm test
npm run snapshots:update
```

## Notes
- Path alias `@/*` maps to `src/*`.
- The dashboard targets `OpenHands/OpenHands` on GitHub and `openhands-ai` on PyPI.
- PyPI download metrics are fetched from ClickHouse (`https://sql-clickhouse.clickhouse.com/?user=demo`) against `pypi.pypi_downloads_per_day`, using yesterday-based rolling 1/7/30-day windows to avoid PyPI Stats rate limits.
- Historical metrics and stored dependent-repo counts are read from `data/snapshots.json`; runtime writes were removed.
- The scheduled writer is `.github/workflows/update-snapshots.yml`, which runs `npm run snapshots:update` and commits `data/snapshots.json` only when it changes.
- `SNAPSHOTS_FILE_PATH` can override the default snapshot file path for tests or scripts.
- `next.config.mjs` includes `data/snapshots.json` in output file tracing for deployments.
- Dashboard data fetching should prefer partial-failure handling (`Promise.allSettled`) so one upstream API outage does not blank the whole page.
- CI should run `npm run lint` and `npm test` on pull requests and pushes to `main`.
