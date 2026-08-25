# Production VPS Deployment Guide (185.252.233.186)

This document describes the production architecture, setup, and deployment procedure for the **Doctor Marriage Bureau Web Application** on the Production VPS (`185.252.233.186`).

---

## 🏛️ System Architecture Overview

- **Web Application Domain**: `https://panel.doctormarriagebureau.com.pk`
- **Server IP**: `185.252.233.186`
- **Deployment Location**: `/opt/docker/doctormarriagebureau`
- **Deployment Method**: **Single Container & Shared Resources** via Docker Compose
  - Container `dmb-webapp`: Bundles PHP 8.3 FPM, Nginx, Laravel Queue Worker (`php artisan queue:work`), and Laravel Cron Scheduler (`php artisan schedule:run`) managed by Supervisord.
  - Container `dmb-mysql`: Isolated MySQL 8.0 database container for Laravel data persistence.
- **Reverse Proxy**: Nginx Proxy Manager (`nginx-proxy-manager-app-1`) running on ports 80/443, connected via internal Docker network `nginx-proxy-manager_default`.
- **WordPress Marketing Website**: Remains hosted on Hostinger shared hosting at `https://doctormarriagebureau.com.pk`. The 15 daily rotating blurred proposals are served dynamically via the public API `https://panel.doctormarriagebureau.com.pk/api/public/proposals`.

---

## 📁 Directory Structure on VPS

```
/opt/docker/doctormarriagebureau/
├── docker-compose.yml
├── .env
├── docker/
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── nginx.conf
│   └── supervisord.conf
├── storage/            (Host bind-mounted volume for logs, framework sessions, cache)
└── public/uploads/     (Host bind-mounted volume for user/member uploaded images & documents)
```

---

## 🚀 CI/CD Automated Deployment

Every push to the `main` branch triggers `.github/workflows/deploy.yml` (`Production VPS Deploy`):

1. **SSH Connection**: Connects to `185.252.233.186` using `VPS_SSH_KEY`.
2. **Git Pull & Reset**: Fetches latest commit on `main` inside `/opt/docker/doctormarriagebureau`.
3. **Single Container Build**: Runs `docker compose up -d --build --remove-orphans`.
4. **Health Check Verification**: Polls `https://panel.doctormarriagebureau.com.pk/api/health` until HTTP 200 is confirmed.

---

## 🔧 Manual Emergency Commands (SSH into 185.252.233.186)

```bash
# Connect to VPS
ssh root@185.252.233.186

# Navigate to project directory
cd /opt/docker/doctormarriagebureau

# Check container status
docker compose ps

# View live application logs
docker compose logs -f app

# Run Artisan commands manually inside app container
docker exec -it dmb-webapp php artisan migrate --force
docker exec -it dmb-webapp php artisan config:clear
docker exec -it dmb-webapp php artisan cache:clear

# Restart web application
docker compose restart app
```
