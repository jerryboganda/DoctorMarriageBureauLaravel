# Doctor Marriage Bureau — Modernized Stack Deployment & Rollback Runbook

## 1. Production VPS Overview
- **IP Address:** `185.252.233.186`
- **Reverse Proxy:** Nginx Proxy Manager (`nginx-proxy-manager-app-1`)
- **Domain Mappings:**
  - `doctormarriagebureau.com.pk` ➔ `dmb-astro-web:80` (Internal port 8089)
  - `panel.doctormarriagebureau.com.pk` ➔ `dmb-go-api:8080` (Internal port 8088/8080)

---

## 2. Deployment Procedure

### Step 1: Clone or Pull Modernized Stack on VPS
```bash
ssh root@185.252.233.186
cd /opt/docker/doctormarriagebureau
git pull origin main
```

### Step 2: Run Database ETL (if migrating from MySQL)
```bash
python Modernized-Platform/scripts/migration/migrate_mysql_to_postgres.py --batch-size 1000
python Modernized-Platform/scripts/migration/verify_data_integrity.py
```

### Step 3: Launch Modernized Services
```bash
docker compose -f Modernized-Platform/infra/docker/docker-compose.production.yml up -d --build
```

### Step 4: Health Check Verification Loop
```bash
curl -f http://localhost:8080/api/health
curl -f http://localhost:8081/health
curl -f http://localhost:8089/
```

---

## 3. Rollback Procedure
If any regression is detected:
```bash
# Instantly revert Nginx Proxy Manager target back to dmb-webapp container (Port 8088)
docker compose -f Modernized-Platform/infra/docker/docker-compose.production.yml stop api web compute
docker compose -f Web\ App/docker-compose.yml up -d
```
Zero data loss occurs because PostgreSQL was synchronized from MySQL and password hashes remain 100% compatible.
