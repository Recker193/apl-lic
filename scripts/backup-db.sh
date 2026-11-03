#!/bin/sh
# Backup PostgreSQL (pg_dump format custom, comprimat) + fișierele încărcate.
# Rotație după BACKUP_RETENTION_DAYS; criptare AES-256 opțională.
#
# Variabile: PGHOST PGUSER PGPASSWORD PGDATABASE (standard libpq),
#   BACKUP_DIR (implicit /backups), UPLOADS_DIR (opțional),
#   BACKUP_RETENTION_DAYS (implicit 14), BACKUP_ENCRYPTION_PASSPHRASE (opțional).
set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "$BACKUP_DIR"
umask 077

encrypt() {
  # $1 = fișier de intrare, $2 = fișier de ieșire
  openssl enc -aes-256-cbc -pbkdf2 -salt \
    -pass env:BACKUP_ENCRYPTION_PASSPHRASE -in "$1" -out "$2"
}

finish() {
  # $1 = fișier temporar, $2 = nume final fără sufix de criptare
  if [ -n "${BACKUP_ENCRYPTION_PASSPHRASE:-}" ]; then
    encrypt "$1" "$2.enc.tmp"
    rm -f "$1"
    mv "$2.enc.tmp" "$2.enc"
  else
    mv "$1" "$2"
  fi
}

DUMP_FINAL="$BACKUP_DIR/hssa-db-$STAMP.dump"
DUMP_TMP="$DUMP_FINAL.tmp"
trap 'rm -f "$DUMP_TMP" "$DUMP_FINAL.enc.tmp"' EXIT

pg_dump --format=custom --compress=6 --no-owner --file="$DUMP_TMP"
# Verifică că arhiva se poate citi înainte să o păstrăm.
pg_restore --list "$DUMP_TMP" >/dev/null
finish "$DUMP_TMP" "$DUMP_FINAL"
echo "backup db: $DUMP_FINAL$([ -n "${BACKUP_ENCRYPTION_PASSPHRASE:-}" ] && echo .enc)"

if [ -n "${UPLOADS_DIR:-}" ] && [ -d "$UPLOADS_DIR" ]; then
  FILES_FINAL="$BACKUP_DIR/hssa-uploads-$STAMP.tar.gz"
  FILES_TMP="$FILES_FINAL.tmp"
  trap 'rm -f "$DUMP_TMP" "$DUMP_FINAL.enc.tmp" "$FILES_TMP" "$FILES_FINAL.enc.tmp"' EXIT
  tar -czf "$FILES_TMP" -C "$UPLOADS_DIR" .
  finish "$FILES_TMP" "$FILES_FINAL"
  echo "backup uploads: $FILES_FINAL$([ -n "${BACKUP_ENCRYPTION_PASSPHRASE:-}" ] && echo .enc)"
fi

find "$BACKUP_DIR" -maxdepth 1 -type f -name 'hssa-*' -mtime "+$RETENTION_DAYS" -print -delete
