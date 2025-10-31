# Production Deployment Guide

**Target Environment:** Production
**Status:** Infrastructure Ready, Deployment Pending
**URL:** https://onboarding.override.health

---

## Pre-Deployment Checklist

Before starting production deployment, ensure you have:

- [ ] **Production Healthie API Key** - Currently only have staging key
- [ ] **Tested staging environment** - Verify all functionality works
- [ ] **Database backup plan** - RDS automated backups are enabled
- [ ] **Rollback plan** - Document how to revert if needed
- [ ] **Monitoring setup** (optional) - CloudWatch, uptimerobot, etc.

---

## Production Infrastructure (Already Provisioned) ✅

### EC2 Instance
- **Instance ID:** `i-005f0d6aa8f516cb6`
- **Type:** t3.small (2 vCPU, 2GB RAM)
- **Elastic IP:** `3.22.163.3`
- **Domain:** `onboarding.override.health` (DNS configured)
- **Security Group:** `sg-0a3976efbf4f2a6f7` (SSH, HTTP, HTTPS enabled)
- **VPC:** `vpc-0d5f1e060aa0af076`
- **Subnet:** `subnet-01e337149483cdbbc` (us-east-2a)

### Database
- **RDS Instance:** `override-web-postgres-encrypted`
- **Type:** db.t3.medium, PostgreSQL 13.20
- **Database Name:** `healthie_intake_production`
- **User:** `override`
- **Endpoint:** `override-web-postgres-encrypted.cfks4awdzxod.us-east-2.rds.amazonaws.com:5432`
- **Password:** `NGP8RBy7HjT2fE6PnB87dXSmeAHECHQV`

### Network
- **SSH Access:** Working (Network ACL rule 100 for port 22)
- **HTTP/HTTPS Access:** Configured (Network ACL rules 105, 110)
- **DNS Record:** `onboarding.override.health` → `3.22.163.3` (configured in Route53)

---

## Step-by-Step Production Deployment

### Step 1: Connect to Production Server

```bash
# SSH to production EC2
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@3.22.163.3

# Verify connectivity
hostname
uname -a
```

### Step 2: Install Software Stack

```bash
# Update system
sudo dnf update -y

# Install nginx
sudo dnf install -y nginx
nginx -v  # Should show 1.28.0 or newer

# Install Python 3.11
sudo dnf install -y python3.11 python3.11-pip
python3.11 --version

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs
node --version  # Should show 18.x
npm --version   # Should show 10.x

# Install PM2 globally
sudo npm install -g pm2
pm2 --version

# Install Certbot for SSL
sudo dnf install -y certbot python3-certbot-nginx
certbot --version

# Install git (if not already installed)
sudo dnf install -y git
git --version
```

### Step 3: Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www/healthie-intake
sudo chown ec2-user:ec2-user /var/www/healthie-intake

# Clone repository
cd /var/www
git clone https://github.com/override-health/healthie-intake.git
cd healthie-intake

# Checkout main branch (or appropriate branch)
git checkout main
git pull origin main

# Verify
pwd  # Should be /var/www/healthie-intake
ls -la
```

### Step 4: Configure Backend

```bash
cd /var/www/healthie-intake/HealthieIntake.Api.Py

# Create .env file with PRODUCTION credentials
cat > .env << 'EOF'
# Healthie API Configuration
HEALTHIE_API_URL=https://api.gethealthie.com/graphql
HEALTHIE_API_KEY=YOUR_PRODUCTION_HEALTHIE_API_KEY_HERE

# Server Configuration
HOST=0.0.0.0
PORT=5096

# PostgreSQL Configuration
DATABASE_URL=postgresql+asyncpg://override:NGP8RBy7HjT2fE6PnB87dXSmeAHECHQV@override-web-postgres-encrypted.cfks4awdzxod.us-east-2.rds.amazonaws.com:5432/healthie_intake_production

# CORS Configuration
CORS_ORIGINS=["https://onboarding.override.health"]
EOF

# ⚠️ IMPORTANT: Replace YOUR_PRODUCTION_HEALTHIE_API_KEY_HERE with actual production key

# Install Python dependencies
pip3.11 install -r requirements.txt

# Verify installation
pip3.11 list | grep -i fastapi
pip3.11 list | grep -i uvicorn
pip3.11 list | grep -i sqlalchemy
```

### Step 5: Configure and Build Frontend

```bash
cd /var/www/healthie-intake/HealthieIntake.UI.React

# Create .env file with production tokens
cat > .env << 'EOF'
VITE_MAPBOX_TOKEN=pk.eyJ1IjoiY29yZXlvdmVycmlkZSIsImEiOiJjbWdzM3lmbmMycmM1MmpweGhzcTJlbG1tIn0.nafads8dlSX4h0CxdFlMMA
EOF

# Update config.js to point to PRODUCTION domain
cat > src/config.js << 'EOF'
// API Configuration
export const API_BASE_URL = 'https://onboarding.override.health';

// Healthie Form Configuration
export const PATIENT_ID = '3642270';  // Update if different in production
export const FORM_ID = '2215494';      // Update if different in production

// Mapbox Configuration
export const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN_HERE';
EOF

# Install dependencies
npm install

# Build production bundle
npm run build

# Verify build
ls -la dist/
# Should contain: index.html, assets/, and other static files
du -sh dist/
```

### Step 6: Start Backend with PM2

```bash
cd /var/www/healthie-intake/HealthieIntake.Api.Py

# Start backend with PM2
pm2 start "uvicorn main:app --host 0.0.0.0 --port 5096" --name healthie-api-production

# Check status
pm2 status

# View logs to ensure it started correctly
pm2 logs healthie-api-production --lines 30

# Test backend locally
curl http://localhost:5096/health

# Expected response:
# {"status":"healthy","database":{"type":"postgresql","status":"connected (0 intakes)"},"healthie_api":{"url":"https://api.gethealthie.com/graphql","configured":true}}

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
```

### Step 7: Configure nginx

```bash
# Create nginx configuration for PRODUCTION
sudo tee /etc/nginx/conf.d/healthie-intake-production.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name onboarding.override.health;

    # React app static files
    root /var/www/healthie-intake/HealthieIntake.UI.React/dist;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to FastAPI backend
    location /api {
        proxy_pass http://localhost:5096;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5096;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Access and error logs
    access_log /var/log/nginx/healthie-intake-production-access.log;
    error_log /var/log/nginx/healthie-intake-production-error.log;
}
EOF

# Test nginx configuration
sudo nginx -t

# Start nginx
sudo systemctl start nginx

# Enable nginx to start on boot
sudo systemctl enable nginx

# Check nginx status
sudo systemctl status nginx

# Test locally
curl -I http://localhost
```

### Step 8: Set Up SSL Certificate

```bash
# Request SSL certificate from Let's Encrypt
sudo certbot --nginx -d onboarding.override.health --non-interactive --agree-tos --email corey@override.health --redirect

# Expected output:
# Successfully received certificate.
# Certificate is saved at: /etc/letsencrypt/live/onboarding.override.health/fullchain.pem
# Key is saved at: /etc/letsencrypt/live/onboarding.override.health/privkey.pem
# This certificate expires on [DATE]
# Certbot has set up a scheduled task to automatically renew this certificate in the background.

# Verify SSL certificate
sudo certbot certificates

# Test HTTPS
curl -I https://onboarding.override.health

# Test HTTP redirect
curl -I http://onboarding.override.health
# Should get: 301 Moved Permanently → https://onboarding.override.health
```

---

## Post-Deployment Verification

### 1. Health Checks

```bash
# From local machine
curl https://onboarding.override.health/health

# Expected response:
# {"status":"healthy","database":{"type":"postgresql","status":"connected (0 intakes)"},"healthie_api":{"url":"https://api.gethealthie.com/graphql","configured":true}}

# Test API endpoint
curl https://onboarding.override.health/api/intake/list

# Expected response:
# {"total_count":0,"returned_count":0,"intakes":[]}
```

### 2. Frontend Verification

```bash
# Check main page loads
curl -I https://onboarding.override.health

# Should return: HTTP/1.1 200 OK
```

### 3. Manual Browser Testing

- [ ] Open https://onboarding.override.health
- [ ] Verify page loads correctly
- [ ] Test patient lookup (if you have test account)
- [ ] Try form submission
- [ ] Test admin dashboard at https://onboarding.override.health/admin
  - Username: `overrideadmin`
  - Password: `$Override3887`
- [ ] Verify draft saving functionality
- [ ] Check signature component works

### 4. Service Status Checks

```bash
# SSH to server
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@3.22.163.3

# Check PM2
pm2 status
pm2 logs healthie-api-production --lines 50

# Check nginx
sudo systemctl status nginx

# Check SSL certificate
sudo certbot certificates

# Check nginx logs
sudo tail -100 /var/log/nginx/healthie-intake-production-access.log
sudo tail -100 /var/log/nginx/healthie-intake-production-error.log
```

---

## Production URLs & Access

### URLs
- **Application:** https://onboarding.override.health
- **Admin Dashboard:** https://onboarding.override.health/admin
- **Health Check:** https://onboarding.override.health/health
- **API Documentation:** https://onboarding.override.health/docs

### Credentials
- **Admin Username:** `overrideadmin`
- **Admin Password:** `$Override3887`

### SSH Access
```bash
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@3.22.163.3
```

### Database Connection
```
postgresql://override:NGP8RBy7HjT2fE6PnB87dXSmeAHECHQV@override-web-postgres-encrypted.cfks4awdzxod.us-east-2.rds.amazonaws.com:5432/healthie_intake_production
```

---

## Maintenance & Operations

### View Logs
```bash
# Backend logs (real-time)
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@3.22.163.3 'pm2 logs healthie-api-production'

# nginx access logs
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@3.22.163.3 'sudo tail -f /var/log/nginx/healthie-intake-production-access.log'

# nginx error logs
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@3.22.163.3 'sudo tail -f /var/log/nginx/healthie-intake-production-error.log'
```

### Restart Services
```bash
# Restart backend only
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@3.22.163.3 'pm2 restart healthie-api-production'

# Restart nginx
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@3.22.163.3 'sudo systemctl restart nginx'

# Restart both
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@3.22.163.3 'pm2 restart healthie-api-production && sudo systemctl restart nginx'
```

### Deploy Code Updates
```bash
# SSH to server
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@3.22.163.3

# Pull latest code
cd /var/www/healthie-intake
git fetch origin
git pull origin main

# Update backend (if backend changed)
cd HealthieIntake.Api.Py
pip3.11 install -r requirements.txt  # If requirements changed
pm2 restart healthie-api-production

# Update frontend (if frontend changed)
cd ../HealthieIntake.UI.React
npm install  # If package.json changed
npm run build
# No nginx restart needed for static file changes
```

### Database Backup (Manual)
```bash
# Connect to production database from EC2
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@3.22.163.3

# Create backup
pg_dump "postgresql://override:NGP8RBy7HjT2fE6PnB87dXSmeAHECHQV@override-web-postgres-encrypted.cfks4awdzxod.us-east-2.rds.amazonaws.com:5432/healthie_intake_production" > backup_$(date +%Y%m%d_%H%M%S).sql

# Download backup to local machine
exit
scp -i ~/.ssh/provider-creds-key.pem ec2-user@3.22.163.3:backup_*.sql ./

# Note: RDS automated backups are already enabled
```

---

## Rollback Plan

If something goes wrong during deployment:

### 1. Backend Issues
```bash
# Check logs
pm2 logs healthie-api-production --lines 100

# Stop backend
pm2 stop healthie-api-production

# Fix issue (update .env, pull different code, etc.)

# Restart
pm2 restart healthie-api-production
```

### 2. Frontend Issues
```bash
# Frontend is just static files, rebuild from known good commit
cd /var/www/healthie-intake
git log  # Find last known good commit

git checkout <commit-hash>
cd HealthieIntake.UI.React
npm run build
# nginx will immediately serve the updated dist/ files
```

### 3. Complete Rollback
```bash
# Pull staging database backup if needed
# Restore to production database

# Checkout previous git commit
cd /var/www/healthie-intake
git checkout <previous-commit>

# Rebuild frontend
cd HealthieIntake.UI.React
npm run build

# Restart backend
pm2 restart healthie-api-production
```

---

## Monitoring & Alerts (Recommended)

### CloudWatch Alarms (Optional)
- CPU Utilization > 80% for 5 minutes
- Memory Utilization > 80% for 5 minutes
- StatusCheckFailed for EC2 instance
- RDS CPU/Memory/Storage alerts

### Uptime Monitoring (Optional)
- Use Uptime Robot, Pingdom, or similar
- Monitor: https://onboarding.override.health/health
- Alert if down for > 5 minutes

### Log Monitoring (Optional)
- CloudWatch Logs for nginx and application logs
- Set up log groups and streams
- Create metric filters for errors

---

## Cost Estimate

**Monthly Production Costs:**
- EC2 t3.small: ~$15/month
- RDS: $0 (shared with existing database)
- Elastic IP: $0 (while attached to running instance)
- Data Transfer: ~$1-2/month
- SSL Certificate: $0 (Let's Encrypt)

**Total: ~$16-17/month**

---

## Differences from Staging

| Aspect | Staging | Production |
|--------|---------|------------|
| **Domain** | onboarding-staging.override.health | onboarding.override.health |
| **EC2 Instance** | t3.micro (1GB RAM) | t3.small (2GB RAM) |
| **IP Address** | 18.119.3.99 | 3.22.163.3 |
| **Database** | healthie_intake_staging | healthie_intake_production |
| **DB Password** | Ektrz3WqGaaDJTbVntzedeuUz5nJdH9S | NGP8RBy7HjT2fE6PnB87dXSmeAHECHQV |
| **Healthie API** | https://staging-api.gethealthie.com/graphql | https://api.gethealthie.com/graphql |
| **API Key** | gh_sbox_M5NFMUJfUhP3... (sandbox) | [PRODUCTION KEY NEEDED] |
| **PM2 Process** | healthie-api-staging | healthie-api-production |
| **nginx Config** | healthie-intake-staging.conf | healthie-intake-production.conf |

---

## Security Checklist

Before going live:

- [ ] Production Healthie API key is set (not staging sandbox key)
- [ ] Database credentials are secure (not committed to git)
- [ ] `.env` files have proper permissions (600)
- [ ] Admin password is strong (current: `$Override3887`)
- [ ] HTTPS is enforced (HTTP redirects to HTTPS)
- [ ] CORS is configured correctly (only production domain)
- [ ] Security group only allows necessary ports (SSH, HTTP, HTTPS)
- [ ] SSH key is secure and backed up
- [ ] Database backups are enabled (RDS automated backups)
- [ ] Consider: Rate limiting for API endpoints
- [ ] Consider: Web Application Firewall (AWS WAF)

---

## Troubleshooting

### Issue: Backend won't start
```bash
# Check logs
pm2 logs healthie-api-production --lines 100

# Common causes:
# - Wrong database credentials
# - Missing Python dependencies
# - Port 5096 already in use
# - .env file missing or malformed

# Fix and restart
pm2 restart healthie-api-production
```

### Issue: 502 Bad Gateway
```bash
# Backend is down or not responding
pm2 status
pm2 restart healthie-api-production

# Check if port 5096 is listening
ss -tlnp | grep 5096
```

### Issue: 404 Not Found
```bash
# nginx can't find static files
ls -la /var/www/healthie-intake/HealthieIntake.UI.React/dist/

# If dist/ is empty, rebuild
cd /var/www/healthie-intake/HealthieIntake.UI.React
npm run build
```

### Issue: SSL Certificate not renewing
```bash
# Test renewal
sudo certbot renew --dry-run

# Force renewal if needed
sudo certbot renew --force-renewal

# Check renewal timer
sudo systemctl status certbot.timer
```

---

## Production Deployment Status

**Status:** ❌ Not Yet Deployed

**Blockers:**
1. Need production Healthie API key
2. Need to test staging environment thoroughly first

**Ready When:**
- [ ] Staging has been tested and verified
- [ ] Production Healthie API key obtained
- [ ] Final approval to proceed with production deployment

---

**Last Updated:** 2025-10-31
**Next Action:** Test staging, obtain production Healthie API key, then execute deployment steps above
