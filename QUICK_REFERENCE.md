# Quick Reference Guide

**Last Updated:** 2025-10-31

---

## Staging Environment

### URLs
- **Application:** https://onboarding-staging.override.health
- **Admin Dashboard:** https://onboarding-staging.override.health/admin
- **Health Check:** https://onboarding-staging.override.health/health
- **API Docs:** https://onboarding-staging.override.health/docs

### Credentials
- **Admin User:** `overrideadmin`
- **Admin Pass:** `$Override3887`

### Server Access
```bash
# SSH to staging
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@18.119.3.99

# View backend logs
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@18.119.3.99 'pm2 logs healthie-api-staging'

# Restart backend
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@18.119.3.99 'pm2 restart healthie-api-staging'

# Check status
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@18.119.3.99 'pm2 status && sudo systemctl status nginx'
```

---

## Production Environment (Not Yet Deployed)

### URLs (When Deployed)
- **Application:** https://onboarding.override.health
- **Admin Dashboard:** https://onboarding.override.health/admin

### Server Access
```bash
# SSH to production
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@3.22.163.3
```

### Deployment
See: `PRODUCTION_DEPLOYMENT_GUIDE.md`

---

## Common Commands

### Deploy Code Update (Manual)
```bash
# SSH to server
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@18.119.3.99

# Pull latest code
cd /var/www/healthie-intake
git pull origin main

# Rebuild frontend
cd HealthieIntake.UI.React
npm run build

# Restart backend
pm2 restart healthie-api-staging
```

### View Logs
```bash
# Backend logs (live)
pm2 logs healthie-api-staging

# Backend logs (last 100 lines)
pm2 logs healthie-api-staging --lines 100

# nginx access logs
sudo tail -f /var/log/nginx/healthie-intake-staging-access.log

# nginx error logs
sudo tail -f /var/log/nginx/healthie-intake-staging-error.log
```

### Check Health
```bash
# From local machine
curl https://onboarding-staging.override.health/health

# From server
curl http://localhost:5096/health
```

### Restart Services
```bash
# Restart backend
pm2 restart healthie-api-staging

# Restart nginx
sudo systemctl restart nginx

# Restart both
pm2 restart healthie-api-staging && sudo systemctl restart nginx
```

---

## Database

### Staging Database
```
Host: override-web-staging-postgres-encrypted.cfks4awdzxod.us-east-2.rds.amazonaws.com
Port: 5432
Database: healthie_intake_staging
User: override
Password: Ektrz3WqGaaDJTbVntzedeuUz5nJdH9S
```

### Production Database
```
Host: override-web-postgres-encrypted.cfks4awdzxod.us-east-2.rds.amazonaws.com
Port: 5432
Database: healthie_intake_production
User: override
Password: NGP8RBy7HjT2fE6PnB87dXSmeAHECHQV
```

### Connect from Server
```bash
# From staging EC2
psql "postgresql://override:Ektrz3WqGaaDJTbVntzedeuUz5nJdH9S@override-web-staging-postgres-encrypted.cfks4awdzxod.us-east-2.rds.amazonaws.com:5432/healthie_intake_staging"

# From production EC2
psql "postgresql://override:NGP8RBy7HjT2fE6PnB87dXSmeAHECHQV@override-web-postgres-encrypted.cfks4awdzxod.us-east-2.rds.amazonaws.com:5432/healthie_intake_production"
```

### Query Database
```sql
-- List all intakes
SELECT id, first_name, last_name, email, status, submitted_at
FROM intakes
ORDER BY submitted_at DESC
LIMIT 10;

-- Count intakes by status
SELECT status, COUNT(*)
FROM intakes
GROUP BY status;

-- Get recent submissions
SELECT *
FROM intakes
WHERE status = 'completed'
ORDER BY submitted_at DESC
LIMIT 5;
```

---

## CI/CD

### GitHub Actions Workflows
- **Test & Build:** Runs on every push/PR
- **Deploy to Staging:** Runs on push to `main`

### View Workflow Status
https://github.com/override-health/healthie-intake/actions

### Required Secrets (Not Yet Configured)
1. `STAGING_SSH_KEY` - SSH private key for staging server
2. `VITE_MAPBOX_TOKEN` - Mapbox API token

### Manual Deploy via GitHub
1. Go to Actions tab
2. Select "Deploy to Staging"
3. Click "Run workflow"
4. Select `main` branch
5. Click green "Run workflow" button

---

## File Locations

### On Server
```
/var/www/healthie-intake/                        # Application root
├── HealthieIntake.UI.React/
│   ├── dist/                                    # Built React app (served by nginx)
│   ├── src/                                     # React source code
│   └── .env                                     # Frontend build-time env vars
└── HealthieIntake.Api.Py/
    ├── main.py                                  # FastAPI entry point
    ├── .env                                     # Backend secrets (DO NOT COMMIT)
    └── requirements.txt                         # Python dependencies

/etc/nginx/conf.d/healthie-intake-staging.conf   # nginx configuration
/etc/letsencrypt/live/onboarding-staging.override.health/  # SSL certificates
/var/log/nginx/healthie-intake-staging-*.log     # nginx logs
/home/ec2-user/.pm2/logs/                        # PM2 logs
```

### On Local Machine
```
~/source/repos/healthie-intake/                  # Local repository
~/.ssh/provider-creds-key.pem                   # SSH key for servers
```

---

## Troubleshooting

### Site Not Loading
```bash
# Check if nginx is running
sudo systemctl status nginx

# Check nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Check nginx error logs
sudo tail -100 /var/log/nginx/healthie-intake-staging-error.log
```

### Backend API Not Responding
```bash
# Check if backend is running
pm2 status

# Check backend logs for errors
pm2 logs healthie-api-staging --lines 100

# Restart backend
pm2 restart healthie-api-staging

# Check if port 5096 is listening
ss -tlnp | grep 5096
```

### 502 Bad Gateway
- Backend is down or not responding on port 5096
- Check PM2 status and logs
- Restart backend with `pm2 restart healthie-api-staging`

### 404 Not Found for React Routes
- nginx not configured to serve React SPA properly
- Check nginx config has `try_files $uri $uri/ /index.html;`
- Restart nginx after config changes

### Database Connection Error
- Check .env file has correct DATABASE_URL
- Verify RDS security group allows connection from EC2
- Test connection: `curl http://localhost:5096/health`

---

## Important Notes

### DO NOT Commit to Git:
- `.env` files (contain secrets)
- `node_modules/` directories
- `dist/` build directories
- `__pycache__/` Python cache
- SSH private keys
- Database credentials

### Backup Important Files:
- SSH key: `~/.ssh/provider-creds-key.pem`
- Server `.env` files (keep securely)
- Database backups (RDS automated backups enabled)

### Before Making Changes:
- Test locally first
- Check staging before production
- Have rollback plan ready
- Keep SSH key accessible

---

## Support & Documentation

- **Staging Deployment:** `STAGING_DEPLOYMENT_COMPLETE.md`
- **Production Guide:** `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Infrastructure:** `INFRASTRUCTURE_SETUP_COMPLETE.md`
- **CI/CD Setup:** `CI_CD_SETUP.md`
- **Deployment Plan:** `DEPLOYMENT_PLAN.md`

---

**For Emergency Issues:**
1. Check server status and logs
2. Review recent git commits
3. Check GitHub Actions for failed deployments
4. SSH to server and investigate
5. Rollback if needed: `git checkout <previous-commit> && npm run build && pm2 restart healthie-api-staging`
