# Linux VPS Memory File

## Connection Information

- **IP Address:** `185.252.233.186`
- **User:** `root`
- **SSH Key:** `~/.ssh/id_rsa` (Passwordless set up)

## System Overview

- **OS:** Ubuntu 24.04.3 LTS (Noble Numbat)
- **Kernel:** 6.8.0-90-generic
- **Docker Engine:** 29.1.5
- **Main Entry Point:** Nginx Proxy Manager (Docker container)

## Exposed Ports & Services

| Port | Service | Description |
| :--- | :--- | :--- |
| 80 | HTTP | Managed by Nginx Proxy Manager |
| 443 | HTTPS | Managed by Nginx Proxy Manager |
| 81 | NPM Admin | Nginx Proxy Manager Web UI |
| 8000/9443 | Portainer | Docker Management UI |
| 22 | SSH | Default System SSH |
| 2222 | SSH/Other | MainThread service |

### Internal Local-Mapped Ports

- `8086`: Marriage Bureau Web
- `8085`: StreamVault Web
- `8083`: Polytronx WordPress
- `8082`: Laravel App (Test)
- `8081`: Aims Academy WordPress
- `8080`: Amad Diagnostic Centre WordPress
- `9000`: Ovo WPP Web

### Global SMTP (Brevo/Sendinblue)

- **Host:** `smtp-relay.brevo.com`
- **User:** `8a2be7001@smtp-brevo.com`
- **API Key:** `xsmtpsib-829e4356e79618db21805414d5780cc36c453a8639549604edda6f3172e1d912-RpeL42Mq7IJ2Ai8Q`
- **Port:** `587` (TLS)
- **From Address:** `noreply@doctormarriagebureau.com.pk`
- **Note:** Migrated to Brevo on Feb 4, 2026 for reliable email delivery.

## Project Locations (CWDs)

- **MarriageBureau:** `/root/doctormarriagebureau`
- **Nginx Proxy Manager:** `/opt/docker/nginx-proxy-manager`
- **Ovo WPP:** `/var/www/ovo-wpp`
- **Soketi:** `/root/soketi`
- **Polytronx:** `/root/polytronx`
- **Aims Academy:** `/root/aimsacademy`
- **Amad Diagnostic:** `/opt/docker/wordpress/amaddiagnosticcentre`
- **Remnanode:** `/opt/remnanode`

## Running Docker Container Groups

1. **MarriageBureau:** `marriagebureau-web`, `marriagebureau-app`, `marriagebureau-db`
2. **Ovo WPP:** `ovo-wpp-web`, `ovo-wpp-app`, `ovo-wpp-db`
3. **StreamVault:** `streamvault-web`, `streamvault-app`, `streamvault-db`
4. **Soketi:** `soketi`, `soketi-redis`
5. **Nginx Proxy Manager:** `nginx-proxy-manager-app-1`
6. **Portainer:** `portainer`
7. **WordPress Sites:** Multiple MariaDB/WordPress instances.

---

## ⚠️ DEPLOYMENT STRATEGY (MANDATORY)

> **ALWAYS use Git-based deployment. NEVER use direct SCP/file copy to VPS.**

### Standard Deployment Workflow

#### Step 1: Local (Windows PC)

```powershell
cd c:\laragon\www\marriagebureau
git add -A
git commit -m "your commit message"
git push origin main
```

#### Step 2: VPS (SSH)

```bash
ssh -i "C:\Users\Admin\.ssh\id_rsa" root@185.252.233.186
cd /root/doctormarriagebureau
git pull origin main
docker exec marriagebureau-app php artisan optimize:clear
```

### GitHub Repository

- **URL:** <https://github.com/jerryboganda/DoctorMarriageBureauLaravel>
- **Branch:** `main`

### Why Git-Based Deployment?

1. Version control and rollback capability
2. Consistent codebase between local and production
3. Avoids path confusion (Docker bind mounts vs container paths)
4. Enables code review and collaboration
5. Automatic tracking of all changes

### Debugging on Production

1. Check logs: `docker exec marriagebureau-app tail -100 /var/www/html/storage/logs/laravel.log`
2. Clear cache: `docker exec marriagebureau-app php artisan optimize:clear`
3. Test API: `curl -X POST https://panel.doctormarriagebureau.com.pk/api/endpoint -H "Content-Type: application/json" -d '{"key":"value"}'`

### Maintenance History (February 3, 2026)

1. **Password Reset Fix**: Switched `AuthController` to use `EmailUtility::password_reset_email` to ensure robust production email delivery.
2. **Local Debug Bypass**: Added logic to `EmailUtility` to bypass hangs in local environments using `log` driver.
3. **SMTP Migration**: Updated production `.env` on VPS to use Google SMTP (`xhsjs5901@gmail.com`) instead of Brevo.
4. **Deployment Standardization**: Mandated Git-based deployment workflow (Local -> GitHub -> VPS) to replace direct file transfers.
5. **Process Stability**: Terminated orphaned background terminal processes and updated project rules in `GEMINI.md` to forbid background terminal use for file-writing operations.
