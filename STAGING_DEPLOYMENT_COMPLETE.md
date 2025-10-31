# Staging Deployment - COMPLETE ✅

**Date Completed:** 2025-10-31
**Status:** LIVE and Operational
**URL:** https://onboarding-staging.override.health

---

## Deployment Summary

The Healthie Intake application has been successfully deployed to the staging environment and is fully operational.

### Infrastructure
- **EC2 Instance:** `i-06f782773ea0fdafb` (t3.micro)
- **IP Address:** 18.119.3.99
- **Domain:** onboarding-staging.override.health
- **Database:** `healthie_intake_staging` on RDS (override-web-staging-postgres-encrypted)
- **Security Group:** `sg-09fc077a21b72a3a0`

### Software Stack
- **OS:** Amazon Linux 2023
- **Web Server:** nginx 1.28.0
- **Backend:** Python 3.11.14 + FastAPI + Uvicorn
- **Process Manager:** PM2 6.0.13
- **Frontend:** React 19.0.0 (built with Vite)
- **SSL:** Let's Encrypt (Certbot 2.6.0)

---

## Step-by-Step Deployment Process (What Was Done)

### 1. Software Installation

```bash
# Connect to server
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@18.119.3.99

# Update system
sudo dnf update -y

# Install nginx
sudo dnf install -y nginx
nginx -v  # Verified: 1.28.0

# Install Python 3.11
sudo dnf install -y python3.11 python3.11-pip
python3.11 --version  # Verified: 3.11.14

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs
node --version  # Verified: 18.20.8
npm --version   # Verified: 10.8.2

# Install PM2 globally
sudo npm install -g pm2
pm2 --version  # Verified: 6.0.13

# Install Certbot
sudo dnf install -y certbot python3-certbot-nginx
certbot --version  # Verified: 2.6.0
```

### 2. Repository Clone

```bash
# Create application directory
sudo mkdir -p /var/www/healthie-intake
sudo chown ec2-user:ec2-user /var/www/healthie-intake

# Clone repository
cd /var/www
git clone https://github.com/override-health/healthie-intake.git
cd healthie-intake

# Verify clone
git branch  # On db_cache branch
git log -1  # Latest commit
```

### 3. Backend Configuration

```bash
cd /var/www/healthie-intake/HealthieIntake.Api.Py

# Create .env file
cat > .env << 'EOF'
# Healthie API Configuration
HEALTHIE_API_URL=https://staging-api.gethealthie.com/graphql
HEALTHIE_API_KEY=gh_sbox_M5NFMUJfUhP3ug5a5TPJPss1pBvtkEgqqHeEsDk3PZwxvM6Spn2K9Up4Q5Ff1Luq

# Server Configuration
HOST=0.0.0.0
PORT=5096

# PostgreSQL Configuration
DATABASE_URL=postgresql+asyncpg://override:Ektrz3WqGaaDJTbVntzedeuUz5nJdH9S@override-web-staging-postgres-encrypted.cfks4awdzxod.us-east-2.rds.amazonaws.com:5432/healthie_intake_staging

# CORS Configuration
CORS_ORIGINS=["https://onboarding-staging.override.health"]
EOF

# Install Python dependencies
pip3.11 install -r requirements.txt
```

### 4. Frontend Configuration & Build

```bash
cd /var/www/healthie-intake/HealthieIntake.UI.React

# Create .env file for Vite build
cat > .env << 'EOF'
VITE_MAPBOX_TOKEN=pk.eyJ1IjoiY29yZXlvdmVycmlkZSIsImEiOiJjbWdzM3lmbmMycmM1MmpweGhzcTJlbG1tIn0.nafads8dlSX4h0CxdFlMMA
EOF

# Update config.js to point to production domain
cat > src/config.js << 'EOF'
// API Configuration
export const API_BASE_URL = 'https://onboarding-staging.override.health';

// Healthie Form Configuration
export const PATIENT_ID = '3642270';
export const FORM_ID = '2215494';

// Mapbox Configuration
export const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN_HERE';
EOF

# Install dependencies and build
npm install
npm run build

# Verify build output
ls -la dist/  # Should contain index.html and assets/
```

### 5. Start Backend with PM2

```bash
cd /var/www/healthie-intake/HealthieIntake.Api.Py

# Start backend with PM2
pm2 start "uvicorn main:app --host 0.0.0.0 --port 5096" --name healthie-api-staging

# Verify running
pm2 status
pm2 logs healthie-api-staging --lines 20

# Test backend locally
curl http://localhost:5096/health
# Response: {"status":"healthy","database":{"type":"postgresql","status":"connected (0 intakes)"}}

# Save PM2 configuration
pm2 save

# Enable auto-start on reboot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
```

### 6. Configure nginx

```bash
# Create nginx configuration
sudo tee /etc/nginx/conf.d/healthie-intake-staging.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name onboarding-staging.override.health;

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
    access_log /var/log/nginx/healthie-intake-staging-access.log;
    error_log /var/log/nginx/healthie-intake-staging-error.log;
}
EOF

# Test nginx configuration
sudo nginx -t

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx

# Test locally
curl -I http://localhost
```

### 7. Set Up SSL with Let's Encrypt

```bash
# Request and install certificate
sudo certbot --nginx -d onboarding-staging.override.health --non-interactive --agree-tos --email corey@override.health --redirect

# Output:
# Successfully received certificate.
# Certificate is saved at: /etc/letsencrypt/live/onboarding-staging.override.health/fullchain.pem
# Key is saved at: /etc/letsencrypt/live/onboarding-staging.override.health/privkey.pem
# This certificate expires on 2026-01-29.
# Certbot has set up a scheduled task to automatically renew this certificate in the background.

# Test HTTPS
curl -I https://onboarding-staging.override.health

# Test auto-redirect from HTTP
curl -I http://onboarding-staging.override.health
# Should get: HTTP/1.1 301 Moved Permanently
```

---

## Verification & Testing

### Health Checks Performed ✅

```bash
# Backend health
curl https://onboarding-staging.override.health/health
# {"status":"healthy","database":{"type":"postgresql","status":"connected (0 intakes)"},"healthie_api":{"url":"https://staging-api.gethealthie.com/graphql","configured":true}}

# API endpoint
curl https://onboarding-staging.override.health/api/intake/list
# {"total_count":0,"returned_count":0,"intakes":[]}

# Frontend
curl -I https://onboarding-staging.override.health
# HTTP/1.1 200 OK

# HTTP redirect
curl -I http://onboarding-staging.override.health
# HTTP/1.1 301 Moved Permanently (redirects to HTTPS)
```

### Services Status ✅

```bash
# PM2 processes
pm2 status
# healthie-api-staging | online | 0

# nginx status
sudo systemctl status nginx
# active (running)

# SSL certificate
sudo certbot certificates
# Certificate Name: onboarding-staging.override.health
# Expiry Date: 2026-01-29
```

---

## Access Information

### URLs
- **Application:** https://onboarding-staging.override.health
- **Admin Dashboard:** https://onboarding-staging.override.health/admin
- **Health Check:** https://onboarding-staging.override.health/health
- **API Docs:** https://onboarding-staging.override.health/docs

### Credentials
- **Admin Username:** `overrideadmin`
- **Admin Password:** `$Override3887`

### SSH Access
```bash
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@18.119.3.99
```

### Database Connection
```
postgresql://override:Ektrz3WqGaaDJTbVntzedeuUz5nJdH9S@override-web-staging-postgres-encrypted.cfks4awdzxod.us-east-2.rds.amazonaws.com:5432/healthie_intake_staging
```

---

## Maintenance Commands

### View Logs
```bash
# Backend logs
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@18.119.3.99 'pm2 logs healthie-api-staging'

# nginx access logs
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@18.119.3.99 'sudo tail -f /var/log/nginx/healthie-intake-staging-access.log'

# nginx error logs
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@18.119.3.99 'sudo tail -f /var/log/nginx/healthie-intake-staging-error.log'
```

### Restart Services
```bash
# Restart backend
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@18.119.3.99 'pm2 restart healthie-api-staging'

# Restart nginx
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@18.119.3.99 'sudo systemctl restart nginx'
```

### Update Code
```bash
# Pull latest code
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@18.119.3.99 'cd /var/www/healthie-intake && git pull'

# Rebuild frontend
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@18.119.3.99 'cd /var/www/healthie-intake/HealthieIntake.UI.React && npm run build'

# Restart backend
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@18.119.3.99 'pm2 restart healthie-api-staging'
```

---

## File Locations

### Application Files
- **Repository:** `/var/www/healthie-intake/`
- **React Build:** `/var/www/healthie-intake/HealthieIntake.UI.React/dist/`
- **Backend Code:** `/var/www/healthie-intake/HealthieIntake.Api.Py/`
- **Backend .env:** `/var/www/healthie-intake/HealthieIntake.Api.Py/.env`
- **Frontend .env:** `/var/www/healthie-intake/HealthieIntake.UI.React/.env`

### Configuration Files
- **nginx Config:** `/etc/nginx/conf.d/healthie-intake-staging.conf`
- **SSL Certificate:** `/etc/letsencrypt/live/onboarding-staging.override.health/`
- **PM2 Config:** `/home/ec2-user/.pm2/`

### Logs
- **nginx Access:** `/var/log/nginx/healthie-intake-staging-access.log`
- **nginx Error:** `/var/log/nginx/healthie-intake-staging-error.log`
- **PM2 Logs:** `/home/ec2-user/.pm2/logs/healthie-api-staging-*.log`

---

## Known Issues / Notes

1. **Form API:** Some Healthie form IDs may return 404 if the staging API key doesn't have access to production forms. This is expected behavior.

2. **Database:** Currently shows 0 intakes - expected for fresh deployment.

3. **Auto-Start:** Both PM2 and nginx are configured to auto-start on server reboot.

4. **SSL Renewal:** Certbot auto-renewal is configured via systemd timer. Certificate will auto-renew before expiration.

---

## Cost Information

**Monthly Cost for Staging:**
- EC2 t3.micro: ~$8/month
- RDS: $0 (shared with existing database)
- Elastic IP: $0 (while attached)
- SSL: $0 (Let's Encrypt)

**Total: ~$8/month**

---

**Deployment Status:** ✅ COMPLETE AND OPERATIONAL
**Next Steps:** Test form submissions, verify admin dashboard, prepare for production deployment
