# Database Setup and Restore Guide

This dashboard stores daily snapshots in Postgres. Neon is the recommended provider.

## Create the schema

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL`
2. Run:

```bash
npm ci
npm run db:push
```

That creates the `sdks` and `metrics_snapshots` tables required by the dashboard.

## Verify the database connection

Start the app locally and trigger a snapshot manually:

```bash
curl -X POST http://localhost:3000/api/cron/collect \
  -H "Authorization: Bearer $CRON_SECRET"
```
Note: create CRON_SECRET with the command `openssl rand -base64 32`

## Create a backup

```bash
DATABASE_URL=postgresql://... npm run backup:neon
```

## Restore a backup

```bash
DATABASE_URL=postgresql://... npm run restore:neon -- backups/openhands-dashboard-<timestamp>.dump
```

## Tables

- `sdks` — tracked repository/package metadata
- `metrics_snapshots` — daily historical metrics
