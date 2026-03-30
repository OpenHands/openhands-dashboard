# OpenHands Dashboard — Reference Plan

## Overview

This repository is a one-time copy of `openhands/sdk-dashboard`, retargeted to the `OpenHands/OpenHands` GitHub repository and the `openhands-ai` PyPI package.

## Tracked metrics

- GitHub stars
- GitHub forks
- Active forks
- Total contributors
- Repeat contributors
- Open issues
- Dependent repositories (GitHub code search)
- PyPI downloads
- Daily historical snapshots

## Runtime architecture

- **Frontend:** Next.js 14 App Router + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Postgres via Drizzle ORM
- **Charts:** Recharts
- **Scheduling:** Vercel cron hitting `/api/cron/collect`
- **Backups:** `pg_dump`/`pg_restore` scripts plus a scheduled GitHub Actions workflow

## Data model

The current database schema retains the upstream table names for compatibility:

- `sdks` stores the tracked repository/package metadata
- `metrics_snapshots` stores daily snapshots

In application code, these records are treated as tracked repositories rather than package-specific entities.

## Operational workflow

1. The dashboard reads live GitHub and PyPI data for the current view.
2. The cron route stores at most one snapshot per day.
3. Historical charts read from stored snapshots.
4. `scripts/backup-neon.sh` creates compressed Postgres dump files.
5. `.github/workflows/neon-backup.yml` can produce scheduled backup artifacts.

## Validation commands

```bash
npm ci
npm run lint
npm test
npm run build
npm run backup:neon
```

## Notes

- `repo` is the preferred query parameter for repository-specific history lookups; `sdk` remains accepted for backwards compatibility.
- The app intentionally stays close to the upstream dashboard structure while using OpenHands-specific terminology where practical.
