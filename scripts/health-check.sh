#!/bin/sh
# Verificare de stare pentru cron/systemd/Uptime Kuma. Exit 0 = sănătos.
# Utilizare: health-check.sh [https://domeniu]   (implicit http://localhost:3000)
set -eu

BASE="${1:-http://localhost:3000}"
STATUS="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$BASE/api/v1/health/readiness" || echo 000)"
if [ "$STATUS" != "200" ]; then
  echo "UNHEALTHY: readiness a răspuns $STATUS" >&2
  exit 1
fi
echo "OK"
