#!/usr/bin/env bash

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: scripts/restore-neon.sh <backup-file>" >&2
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

echo "Restoring backup from $BACKUP_FILE"
pg_restore \
  --dbname="$DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  "$BACKUP_FILE"
STATUS=$?

if [ "$STATUS" -ne 0 ]; then
  echo "Restore failed" >&2
  exit "$STATUS"
fi

echo "Restore complete"
