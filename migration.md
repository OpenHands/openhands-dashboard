# Snapshot Data Workflow

This dashboard no longer uses Postgres or Neon for historical data. Historical metrics now live in the committed `data/snapshots.json` file.

## Local workflow

1. Copy `.env.example` to `.env.local`.
2. Optionally set `GITHUB_TOKEN` for higher GitHub API limits.
3. Run:

```bash
npm ci
npm run snapshots:update
```

That command fetches live metrics and upserts the current day in `data/snapshots.json`.

## Daily automation

GitHub Actions updates the snapshot file on a daily schedule and through `workflow_dispatch`.

- Workflow: `.github/workflows/update-snapshots.yml`
- Schedule: `0 6 * * *`
- Output: a commit containing the updated `data/snapshots.json` file when metrics changed

## Preview verification

Before merging a branch, manually dispatch the workflow on that branch and confirm:

- the workflow succeeds
- `data/snapshots.json` is updated or intentionally left unchanged
- the Vercel preview shows the expected chart history
