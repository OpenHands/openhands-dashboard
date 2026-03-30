# openhands-dashboard — Agent Guide

## Project Overview
Next.js 14 + TypeScript dashboard for OpenHands metrics sourced from GitHub, PyPI, and daily stored snapshots.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Postgres + Drizzle ORM (Neon recommended)
- **Testing**: Vitest
- **Linting**: ESLint 8 via `eslint . --ext .ts,.tsx`

## Key Commands
```bash
npm ci               # Install dependencies from lockfile
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint on .ts/.tsx files
npm run lint:fix     # Auto-fix ESLint issues
npm test             # Run Vitest suite
npm run backup:neon  # Create a local Postgres dump using DATABASE_URL
```

## Notes
- Path alias `@/*` maps to `src/*`.
- `DATABASE_URL` is optional for local test runs; snapshot fallback tests pass without it.
- The dashboard targets `OpenHands/OpenHands` on GitHub and `openhands-ai` on PyPI.
- Backup scripts live in `scripts/backup-neon.sh` and `scripts/restore-neon.sh`.
- Dashboard data fetching should prefer partial-failure handling (`Promise.allSettled`) so one upstream API outage does not blank the whole page.
- CI should run `npm run lint` and `npm test` on pull requests and pushes to `main`.
