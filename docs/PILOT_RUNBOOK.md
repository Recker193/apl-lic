# Pilot runbook (administrator de sistem)

Ghid pentru instalarea și operarea aplicației pe un server Linux curat (VPS, 2 vCPU / 2 GB RAM sunt suficiente pentru pilot).

## 1. Cerințe

- Server Linux cu Docker Engine și Docker Compose v2.
- Un nume de domeniu (ex. `hssa.liceu.ro`) cu înregistrare DNS A/AAAA către IP-ul serverului.
- Porturile 80 și 443 (TCP și UDP) deschise în firewall. Nimic altceva nu trebuie expus: Postgres și backend rămân în rețeaua internă Docker.
- Un cont SMTP pentru e-mailuri (invitații, resetare parolă).

## 2. Instalare

```bash
git clone <repository> hssa && cd hssa
cp .env.prod.example .env.prod
```

Completează `.env.prod`:

| Variabilă | Valoare |
| --- | --- |
| `DOMAIN` | domeniul public |
| `ACME_EMAIL` | e-mail pentru Let's Encrypt |
| `POSTGRES_PASSWORD` | `openssl rand -base64 32` |
| `SESSION_SECRET` | `openssl rand -base64 48` |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_FROM`, `MAIL_USER`, `MAIL_PASSWORD` | datele SMTP (465 = TLS direct, 587 = STARTTLS) |
| `BACKUP_ENCRYPTION_PASSPHRASE` | parolă pentru backup-uri; păstreaz-o separat de server |

Restrânge accesul la fișier: `chmod 600 .env.prod`. Nu îl comite în Git.

## 3. Pornire

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
```

La prima pornire backend-ul rulează automat migrările bazei de date, iar Caddy obține certificatul HTTPS (necesită DNS corect și porturile 80/443 deschise). Verificare:

```bash
./scripts/health-check.sh https://hssa.liceu.ro
```

## 4. Primul administrator

Setează în `.env.prod`: `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` (minim 10 caractere), `BOOTSTRAP_SCHOOL_NAME`. Apoi:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml run --rm backend node dist/scripts/bootstrap-admin.js
```

Comanda refuză să ruleze dacă există deja un administrator. **După rulare, șterge `BOOTSTRAP_ADMIN_PASSWORD` din `.env.prod`**, apoi conectează-te și schimbă parola.

Din panoul de administrare creezi clase și materii și trimiți invitații profesorilor și elevilor. Contul nou se poate conecta doar după verificarea adresei de e-mail.

## 5. Operare zilnică

- **Loguri** (JSON, fără cookie-uri sau tokenuri): `docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f backend`
- **Stare**: `/api/v1/health/liveness` (proces) și `/api/v1/health/readiness` (bază de date, stocare, memorie). Rulează `scripts/health-check.sh` din cron sau Uptime Kuma. Metricile (`/api/v1/health/metrics`) sunt blocate din exterior; se citesc din rețeaua internă (`http://backend:3000/api/v1/health/metrics`).
- **Actualizare**: `git pull && docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build`. Fă un backup înainte.
- **Oprire**: `docker compose ... down` (păstrează datele). Nu folosi `down -v`: șterge volumele cu date.

## 6. Backup și restaurare

Containerul `backup` rulează `scripts/backup-db.sh` la fiecare `BACKUP_INTERVAL_SECONDS` (implicit 24 h). Produce în volumul `backups`:

- `hssa-db-<data>.dump[.enc]` (pg_dump, comprimat);
- `hssa-uploads-<data>.tar.gz[.enc]` (fișierele încărcate).

Backup-urile mai vechi de `BACKUP_RETENTION_DAYS` (14) se șterg. **Copiază periodic backup-urile în afara serverului** (alt server, stocare obiect); un backup doar pe același disc nu protejează la defectarea discului.

Verificare (săptămânal): restaurează ultimul backup într-o bază temporară și compară cu cea live, fără să modifice producția:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml exec backup /scripts/restore-check.sh
```

Restaurare reală (înlocuiește conținutul bazei; oprește backend-ul întâi):

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml stop backend caddy
docker compose --env-file .env.prod -f docker-compose.prod.yml exec backup ls /backups
docker compose --env-file .env.prod -f docker-compose.prod.yml exec backup /scripts/restore-db.sh --yes /backups/<fisier>.dump.enc
docker compose --env-file .env.prod -f docker-compose.prod.yml start backend caddy
```

Fișierele încărcate: dezarhivează `hssa-uploads-*.tar.gz` (după decriptare cu `openssl enc -d -aes-256-cbc -pbkdf2`) în volumul `uploads`.

## 7. Proceduri de urgență

| Situație | Acțiune |
| --- | --- |
| Site indisponibil | `ps` și `logs` pentru `caddy` și `backend`; `./scripts/health-check.sh`. Reîncearcă cu `up -d`. |
| Readiness 503 | Răspunsul indică ce verificare a eșuat (`database`, `storage`, `memory`). Bază: verifică `postgres` și spațiul pe disc. Stocare: spațiul pe disc și permisiunile volumului `uploads`. |
| Certificat HTTPS nu se emite | Verifică DNS-ul și porturile 80/443; `logs caddy`. |
| Cont compromis | Dezactivează contul din administrare; resetează parola. Schimbarea `SESSION_SECRET` și repornirea backend-ului invalidează toate sesiunile. |
| Date corupte / ștergere accidentală | Restaurare din ultimul backup bun (secțiunea 6). |
| Disc plin | Șterge backup-uri vechi din volum, mărește discul; verifică `docker system df`. |
| Pierdere `BACKUP_ENCRYPTION_PASSPHRASE` | Backup-urile criptate nu mai pot fi citite. Păstrează parola într-un manager de parole. |

## 8. Securitate și date personale

- Conturile aparțin în mare parte minorilor: stabilește cu liceul retenția datelor, responsabilul GDPR și acordul părinților înainte de utilizare reală (vezi `docs/MVP_DECISIONS.md`).
- Fișierele sunt scrise pe disc fără drept de execuție și servite doar ca atașament, cu `nosniff`. Volumul `uploads` nu este montat `noexec` (limitare Docker volume); aplicația nu execută niciodată fișierele încărcate.
- Swagger este dezactivat în producție (`ENABLE_SWAGGER=false`).
