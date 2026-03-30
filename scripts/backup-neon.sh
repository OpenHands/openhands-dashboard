#!/usr/bin/env bash

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

OUTPUT_DIR="${BACKUP_OUTPUT_DIR:-backups}"
TIMESTAMP="${BACKUP_TIMESTAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
PREFIX="${BACKUP_PREFIX:-openhands-dashboard}"
OUTPUT_FILE="${OUTPUT_DIR}/${PREFIX}-${TIMESTAMP}.dump"

mkdir -p "$OUTPUT_DIR"

echo "Creating backup: $OUTPUT_FILE"
pg_dump \
  --dbname="$DATABASE_URL" \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  --file="$OUTPUT_FILE"
STATUS=$?

if [ "$STATUS" -ne 0 ]; then
  echo "Backup failed" >&2
  exit "$STATUS"
fi

echo "Backup complete: $OUTPUT_FILE"
printf '%s\n' "$OUTPUT_FILE"
