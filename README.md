# OpenHands Dashboard

A one-time copy of `openhands/sdk-dashboard`, retargeted to track the `OpenHands/OpenHands` GitHub repository and the `openhands-ai` PyPI package. 

## What this dashboard tracks

- GitHub repository metrics for `OpenHands/OpenHands`
- PyPI download metrics for `openhands-ai`
- Daily historical snapshots stored in Postgres
- Daily dependent-repository counts based on GitHub code search
- Automated Neon backup artifacts via GitHub Actions

## Tech stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Postgres (Neon recommended) + Drizzle ORM
- **Charts:** Recharts
- **Deployment:** Vercel

## Local development

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Environment variables

Create a `.env.local` file for local development:

```env
DATABASE_URL=
GITHUB_TOKEN=
CRON_SECRET=
```

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Required for snapshots/backups | Postgres connection string. Neon is the recommended provider. |
| `GITHUB_TOKEN` | Optional but recommended | Raises GitHub API limits for repo metrics and code search. |
| `CRON_SECRET` | Required for cron/manual snapshot triggers | Bearer token used by `/api/cron/collect`. |

## Database setup

This project uses Drizzle ORM with Postgres. Neon is the intended hosted database.

```bash
npm run db:push
```

That creates the dashboard tables for the tracked repository and its daily snapshots.

Additional database commands:

```bash
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:studio
```

## Daily snapshot collection

The dashboard collects one snapshot per day using `POST /api/cron/collect`.

- **Schedule:** `0 6 * * *`
- **Configured in:** `vercel.json`
- **Behavior:** creates one snapshot per day and skips if a snapshot already exists

Manual trigger:

```bash
curl -X POST http://localhost:3000/api/cron/collect \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Neon backup workflow

This repository includes a lightweight Neon/Postgres backup flow:

- `scripts/backup-neon.sh` creates a compressed `pg_dump` backup
- `scripts/restore-neon.sh` restores a backup into a Postgres database
- `.github/workflows/neon-backup.yml` runs the backup on a schedule and on manual dispatch
- GitHub Actions uploads each backup as an artifact

### Local backup

Install the PostgreSQL client tools (`pg_dump` / `pg_restore`), then run:

```bash
DATABASE_URL=postgresql://... npm run backup:neon
```

By default the backup is written to `backups/openhands-dashboard-<timestamp>.dump`.

### Local restore

```bash
DATABASE_URL=postgresql://... npm run restore:neon -- backups/openhands-dashboard-<timestamp>.dump
```

### GitHub Actions backup setup

Add the following repository secret before enabling scheduled backups:

- `DATABASE_URL` — the Neon production database URL

The workflow installs `postgresql-client`, runs `scripts/backup-neon.sh`, and uploads the resulting dump as a workflow artifact.

## Deployment

1. Import the repository into Vercel.
2. Set `DATABASE_URL`, `GITHUB_TOKEN`, and `CRON_SECRET` in Vercel project settings.
3. Run `npm run db:push` against the production database.
4. Deploy.

## Validation checklist

After setup:

- Home page links point to `OpenHands/OpenHands` and `openhands-ai`
- `/api/cron/collect` creates or skips a snapshot successfully
- Historical charts render once at least two snapshots exist
- `npm run backup:neon` produces a `.dump` file locally
- GitHub Actions backup artifacts are generated when the backup workflow runs
