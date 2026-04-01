# OpenHands Dashboard

A one-time copy of `openhands/sdk-dashboard`, retargeted to track the `OpenHands/OpenHands` GitHub repository and the `openhands-ai` PyPI package.

## What this dashboard tracks

- Live GitHub repository metrics for `OpenHands/OpenHands`
- Live PyPI download metrics for `openhands-ai`
- Historical daily snapshots stored in `data/snapshots.json`
- Daily dependent-repository counts based on GitHub code search
- Automated snapshot updates via GitHub Actions

## Tech stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Historical storage:** Git-tracked JSON file
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
GITHUB_TOKEN=
```

| Variable | Required | Description |
| --- | --- | --- |
| `GITHUB_TOKEN` | Optional but recommended | Raises GitHub API limits for repo metrics and the snapshot update workflow. |
| `SNAPSHOTS_FILE_PATH` | Optional for tests/scripts | Overrides the default `data/snapshots.json` path. |

## Snapshot storage

Historical data lives in the committed `data/snapshots.json` file. The dashboard reads that file at runtime for:

- trend charts from `/api/history`
- the stored dependent-repository count shown on the home page
- the `/api/snapshots` JSON endpoint

The file shape is:

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-04-01T00:00:00.000Z",
  "snapshots": [
    {
      "date": "2026-04-01",
      "githubStars": 0,
      "githubForks": 0,
      "githubActiveForks": 0,
      "githubContributors": 0,
      "githubRepeatContributors": 0,
      "githubDependentRepos": 0,
      "npmDownloadsWeekly": null,
      "pypiDownloadsWeekly": 0
    }
  ]
}
```

## Updating snapshots

Run the writer locally with:

```bash
npm run snapshots:update
```

The script fetches the current GitHub and PyPI metrics, upserts the current day in `data/snapshots.json`, and exits without touching the file when nothing changed.

A manual verification flow looks like this:

```bash
npm run snapshots:update
npm run snapshots:update
```

The second run should log that nothing changed for today.

## Scheduled GitHub Actions workflow

`.github/workflows/update-snapshots.yml` is the only automated writer for historical data.

- **Schedule:** `0 6 * * *`
- **Triggers:** scheduled run and `workflow_dispatch`
- **Behavior:** runs `npm run snapshots:update`, commits `data/snapshots.json` only when it changed, and pushes the update back to the branch that triggered the workflow

### Pre-merge verification

1. Push your feature branch.
2. Run **Update Snapshots** with `workflow_dispatch` against that branch.
3. Confirm the workflow updates `data/snapshots.json` or reports that no changes were needed.
4. Verify the branch's Vercel preview renders the JSON-backed history correctly.

## Deployment

1. Import the repository into Vercel.
2. Set `GITHUB_TOKEN` in Vercel project settings if you want higher GitHub API limits for live metrics.
3. Deploy.

Vercel now serves committed snapshot history from `data/snapshots.json`; there is no runtime database write path or Vercel cron dependency.

## Validation checklist

After setup:

- Home page links point to `OpenHands/OpenHands` and `openhands-ai`
- `npm run snapshots:update` creates or updates the current day's snapshot
- A second `npm run snapshots:update` run is idempotent when metrics have not changed
- Historical charts render once at least two snapshots exist in `data/snapshots.json`
- The **Update Snapshots** workflow commits `data/snapshots.json` only when the file changed
