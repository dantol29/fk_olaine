#!/usr/bin/env bash
# Copies the production SQLite database (and any -journal/-wal/-shm file next to it)
# into the backups folder, adding the date and time to each name,
# e.g. app.db.20261112-153045. Run it on the server before every deploy.
# Override the locations with DATA_DIR and BACKUP_DIR if they differ.
set -euo pipefail

DATA_DIR="${DATA_DIR:-/home3/afaolain/fk_olaine-data}"
BACKUP_DIR="${BACKUP_DIR:-/home3/afaolain/fk_olaine-backups}"
TS="$(date +%Y%m%d-%H%M%S)"

if [ ! -e "$DATA_DIR/app.db" ]; then
  echo "No database at $DATA_DIR/app.db" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
for f in app.db app.db-journal app.db-wal app.db-shm; do
  if [ -e "$DATA_DIR/$f" ]; then
    cp -p "$DATA_DIR/$f" "$BACKUP_DIR/$f.$TS"
  fi
done

echo "TS=$TS"
ls -l "$BACKUP_DIR" | grep "$TS"
echo "To roll back: stop the app, cp -p $BACKUP_DIR/app.db.$TS $DATA_DIR/app.db, start the app."
