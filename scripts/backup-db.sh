#!/usr/bin/env bash
# Backs up the production database and the uploaded photos. Run it on the server before every deploy (and, if
# scheduled, once a day). Shared by AFA Olaine and FK Olaine; only the default data folder differs. See
# docs/hosting.md.
#
# - The SQLite database (and any -journal/-wal/-shm file next to it) is copied into BACKUP_DIR with the date and time
#   in each name, e.g. app.db.20261112-153045. The newest KEEP_DB_BACKUPS copies are kept (default 100).
# - The uploads folder is packed into BACKUP_DIR/uploads.<date-time>.tar.gz. The newest KEEP_UPLOADS_BACKUPS archives
#   are kept (default 10).
# The new copies are made first; only then are older ones removed, so a failed run never loses an existing backup.
# - The time stamp and the commands that restore this copy are written to .last-backup in the application folder
#   (LAST_BACKUP_FILE moves it); npm run build:hosting and npm run db:migrate read it (scripts/deploy-status.mjs).
# Override the locations with DATA_DIR, BACKUP_DIR and UPLOADS_SRC.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="${DATA_DIR:-$HOME/fk_olaine-data}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/fk_olaine-backups}"
UPLOADS_SRC="${UPLOADS_SRC:-$APP_DIR/public/uploads}"
KEEP_DB_BACKUPS="${KEEP_DB_BACKUPS:-100}"
KEEP_UPLOADS_BACKUPS="${KEEP_UPLOADS_BACKUPS:-10}"
LAST_BACKUP_FILE="${LAST_BACKUP_FILE:-$APP_DIR/.last-backup}"
TS="$(date +%Y%m%d-%H%M%S)"
STAMP='[0-9]{8}-[0-9]{6}'

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

UPLOADS_ARCHIVE=""
if [ -d "$UPLOADS_SRC" ]; then
  UPLOADS_ARCHIVE="$BACKUP_DIR/uploads.$TS.tar.gz"
  # -h stores the files a link points to, in case the uploads folder is a link to another place.
  tar -czhf "$UPLOADS_ARCHIVE" -C "$(dirname "$UPLOADS_SRC")" "$(basename "$UPLOADS_SRC")"
  source_files="$(find -L "$UPLOADS_SRC" -type f | wc -l | tr -d ' ')"
  archived_files="$(tar -tzf "$UPLOADS_ARCHIVE" | grep -cv '/$' || true)"
  if [ "$source_files" != "$archived_files" ]; then
    echo "Uploads archive has $archived_files files, the folder has $source_files: check $UPLOADS_ARCHIVE" >&2
    exit 1
  fi
else
  echo "No uploads folder at $UPLOADS_SRC; only the database was backed up." >&2
fi

# Older copies beyond the limits: whole sets by date-time, newest first.
for ts in $(ls "$BACKUP_DIR" | sed -nE "s/^app\.db\.($STAMP)$/\1/p" | sort -r | tail -n +"$((KEEP_DB_BACKUPS + 1))"); do
  rm -f "$BACKUP_DIR/app.db.$ts" "$BACKUP_DIR/app.db-journal.$ts" "$BACKUP_DIR/app.db-wal.$ts" "$BACKUP_DIR/app.db-shm.$ts"
done
for ts in $(ls "$BACKUP_DIR" | sed -nE "s/^uploads\.($STAMP)\.tar\.gz$/\1/p" | sort -r | tail -n +"$((KEEP_UPLOADS_BACKUPS + 1))"); do
  rm -f "$BACKUP_DIR/uploads.$ts.tar.gz"
done

# Restoring: the newer database's -journal/-wal/-shm files must go first, or SQLite would replay them onto the old copy.
RESTORE_DB="rm -f $DATA_DIR/app.db-journal $DATA_DIR/app.db-wal $DATA_DIR/app.db-shm && cp -p $BACKUP_DIR/app.db.$TS $DATA_DIR/app.db"
for f in app.db-journal app.db-wal app.db-shm; do
  if [ -e "$BACKUP_DIR/$f.$TS" ]; then
    RESTORE_DB="$RESTORE_DB && cp -p $BACKUP_DIR/$f.$TS $DATA_DIR/$f"
  fi
done
RESTORE_PHOTOS=""
if [ -n "$UPLOADS_ARCHIVE" ]; then
  RESTORE_PHOTOS="tar -xzf $UPLOADS_ARCHIVE -C $(dirname "$UPLOADS_SRC")"
fi
printf 'TS=%s\nDB_RESTORE=%s\nPHOTOS_RESTORE=%s\n' "$TS" "$RESTORE_DB" "$RESTORE_PHOTOS" > "$LAST_BACKUP_FILE"

echo "TS=$TS"
ls -l "$BACKUP_DIR" | grep "$TS"
[ -n "$UPLOADS_ARCHIVE" ] && echo "Uploads: $archived_files files in $(basename "$UPLOADS_ARCHIVE")"
echo "Kept: $(ls "$BACKUP_DIR" | grep -cE "^app\.db\.$STAMP$" || true) database copies (limit $KEEP_DB_BACKUPS), $(ls "$BACKUP_DIR" | grep -cE "^uploads\.$STAMP\.tar\.gz$" || true) uploads archives (limit $KEEP_UPLOADS_BACKUPS)."
echo "To roll back the database: stop the app in Setup Node.js App, run: $RESTORE_DB — then start the app."
if [ -n "$RESTORE_PHOTOS" ]; then
  echo "To restore the photos: $RESTORE_PHOTOS"
fi
echo "Recorded in $LAST_BACKUP_FILE; npm run build:hosting and npm run db:migrate accept a backup up to 2 hours old."
exit 0
