#!/bin/sh
# Restaurează o arhivă creată de backup-db.sh în baza de date PGDATABASE.
# ATENȚIE: înlocuiește obiectele existente. Cere confirmare explicită.
#
# Utilizare: restore-db.sh --yes /backups/hssa-db-YYYYMMDDTHHMMSSZ.dump[.enc]
# Variabile: PGHOST PGUSER PGPASSWORD PGDATABASE, BACKUP_ENCRYPTION_PASSPHRASE
#   (doar pentru arhive .enc).
set -eu

if [ "${1:-}" != "--yes" ] || [ -z "${2:-}" ]; then
  echo "Utilizare: $0 --yes <fisier.dump[.enc]>" >&2
  echo "Aceasta înlocuiește conținutul bazei '${PGDATABASE:-?}'." >&2
  exit 2
fi
FILE="$2"
[ -f "$FILE" ] || { echo "Fișier inexistent: $FILE" >&2; exit 1; }

WORK="$(mktemp)"
trap 'rm -f "$WORK"' EXIT
case "$FILE" in
  *.enc)
    [ -n "${BACKUP_ENCRYPTION_PASSPHRASE:-}" ] || { echo "Lipsește BACKUP_ENCRYPTION_PASSPHRASE" >&2; exit 1; }
    openssl enc -d -aes-256-cbc -pbkdf2 -pass env:BACKUP_ENCRYPTION_PASSPHRASE -in "$FILE" -out "$WORK"
    ;;
  *) cp "$FILE" "$WORK" ;;
esac

pg_restore --list "$WORK" >/dev/null
pg_restore --clean --if-exists --no-owner --exit-on-error --dbname="${PGDATABASE:?set PGDATABASE}" "$WORK"
echo "restore complet în '$PGDATABASE' din $FILE"
