#!/bin/sh
# Verifică ultimul backup: îl restaurează într-o bază temporară, compară
# numărul de tabele și de înregistrări cu baza live, apoi șterge baza temporară.
# Nu modifică baza de producție. Rulează periodic (ex. săptămânal).
#
# Variabile: PGHOST PGUSER PGPASSWORD PGDATABASE, BACKUP_DIR (implicit /backups),
#   BACKUP_ENCRYPTION_PASSPHRASE (dacă backup-urile sunt criptate).
set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
LIVE_DB="${PGDATABASE:?set PGDATABASE}"
CHECK_DB="${LIVE_DB}_restore_check"

LATEST="$(ls -1t "$BACKUP_DIR"/hssa-db-*.dump* 2>/dev/null | head -n 1 || true)"
[ -n "$LATEST" ] || { echo "FAIL: niciun backup în $BACKUP_DIR" >&2; exit 1; }
echo "verific $LATEST"

WORK="$(mktemp)"
cleanup() {
  rm -f "$WORK"
  PGDATABASE=postgres psql -qc "DROP DATABASE IF EXISTS \"$CHECK_DB\"" >/dev/null 2>&1 || true
}
trap cleanup EXIT

case "$LATEST" in
  *.enc) openssl enc -d -aes-256-cbc -pbkdf2 -pass env:BACKUP_ENCRYPTION_PASSPHRASE -in "$LATEST" -out "$WORK" ;;
  *) cp "$LATEST" "$WORK" ;;
esac

PGDATABASE=postgres psql -qc "DROP DATABASE IF EXISTS \"$CHECK_DB\""
PGDATABASE=postgres psql -qc "CREATE DATABASE \"$CHECK_DB\""
pg_restore --no-owner --exit-on-error --dbname="$CHECK_DB" "$WORK"

count_tables() {
  PGDATABASE="$1" psql -Atc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'"
}
count_users() {
  PGDATABASE="$1" psql -Atc 'SELECT count(*) FROM "User"'
}

TABLES_LIVE="$(count_tables "$LIVE_DB")"
TABLES_RESTORED="$(count_tables "$CHECK_DB")"
USERS_RESTORED="$(count_users "$CHECK_DB")"
echo "tabele: live=$TABLES_LIVE restaurat=$TABLES_RESTORED, utilizatori restaurați=$USERS_RESTORED"

if [ "$TABLES_LIVE" != "$TABLES_RESTORED" ]; then
  echo "FAIL: numărul de tabele diferă" >&2
  exit 1
fi
echo "OK: backup-ul se restaurează complet"
