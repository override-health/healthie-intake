# Deployment Status

**Last Updated:** 2025-10-31 (End of Day)
**Current Status:** ✅ Staging LIVE + CI/CD Fully Operational + Delete Feature Added

---

## ✅ Completed

### Infrastructure (All Environments)
- Production EC2: `i-005f0d6aa8f516cb6` @ `onboarding.override.health` (3.22.163.3)
- Staging EC2: `i-06f782773ea0fdafb` @ `onboarding-staging.override.health` (18.119.3.99)
- Production DB: `healthie_intake_production` on RDS
- Staging DB: `healthie_intake_staging` on RDS
- DNS records configured
- Security groups configured
- Network ACLs updated

### Staging Software Stack
- ✅ nginx 1.28.0 (running, auto-start enabled)
- ✅ Python 3.11.14
- ✅ Node.js 18.20.8
- ✅ npm 10.8.2
- ✅ PM2 6.0.13 (healthie-api-staging process running, auto-start enabled)
- ✅ Certbot 2.6.0 (SSL certificate installed, auto-renewal configured)
- ✅ git installed

### Staging Deployment
- ✅ Repository cloned to /var/www/healthie-intake
- ✅ React app built and deployed to nginx (dist/)
- ✅ FastAPI backend running on port 5096 (managed by PM2)
- ✅ nginx reverse proxy configured (/api → backend)
- ✅ SSL certificate installed (expires 2026-01-29)
- ✅ HTTP → HTTPS redirect enabled
- ✅ Database connected (1 intake)
- ✅ Environment variables properly configured for staging domain

### CI/CD (GitHub Actions)
- ✅ Test & Build workflow (runs on every push/PR)
- ✅ Deploy to Staging workflow (auto-deploys on push to main)
- ✅ GitHub secrets configured (STAGING_SSH_KEY, VITE_MAPBOX_TOKEN)
- ✅ Successfully tested with 3 deployments (all successful)
- ✅ Average deployment time: ~40-45 seconds

### Features Added Today
- ✅ Delete button on admin dashboard
  - DELETE /api/intake/{intake_id} endpoint
  - Confirmation dialog before deletion
  - Works for both drafts and completed intakes
  - Auto-refreshes list after deletion
- ✅ Environment variable configuration
  - VITE_API_BASE_URL for proper staging/production URLs
  - Fixed CORS issues
  - Maintains localhost for local development

### Code
- ✅ Admin credentials updated: `overrideadmin` / `$Override3887`
- ✅ All code committed to main branch

---

## 🔄 Next Steps

### Staging Testing & Configuration
1. ✅ Staging environment is live at https://onboarding-staging.override.health
2. Test form submission with staging Healthie account
3. Verify admin dashboard access (credentials: overrideadmin / $Override3887)
4. Confirm form data properly saves to staging database
5. Test draft functionality

### Production Deployment (When Ready)
1. Repeat deployment process on production EC2 (3.22.163.3)
2. Use production database credentials
3. Configure production Healthie API key
4. Set up SSL certificate for onboarding.override.health
5. Test production environment thoroughly

### CI/CD Setup (Optional - After Production Launch)
1. Create GitHub Actions workflows
2. Automate deployments on push to main
3. Add automated testing

---

## Environment Variables Needed

### Staging
```bash
# Backend .env
DATABASE_URL=postgresql://override:Ektrz3WqGaaDJTbVntzedeuUz5nJdH9S@override-web-staging-postgres-encrypted.cfks4awdzxod.us-east-2.rds.amazonaws.com:5432/healthie_intake_staging
HEALTHIE_API_URL=https://api.gethealthie.com/graphql
HEALTHIE_API_KEY=<your_key_here>
CORS_ORIGINS=["https://onboarding-staging.override.health"]
HOST=0.0.0.0
PORT=5096

# Frontend (build time)
VITE_API_BASE_URL=https://onboarding-staging.override.health
VITE_FORM_ID=<your_form_id>
VITE_MAPBOX_TOKEN=<your_token>
```

### Production
```bash
# Backend .env
DATABASE_URL=postgresql://override:NGP8RBy7HjT2fE6PnB87dXSmeAHECHQV@override-web-postgres-encrypted.cfks4awdzxod.us-east-2.rds.amazonaws.com:5432/healthie_intake_production
HEALTHIE_API_URL=https://api.gethealthie.com/graphql
HEALTHIE_API_KEY=<your_key_here>
CORS_ORIGINS=["https://onboarding.override.health"]
HOST=0.0.0.0
PORT=5096

# Frontend (build time)
VITE_API_BASE_URL=https://onboarding.override.health
VITE_FORM_ID=<your_form_id>
VITE_MAPBOX_TOKEN=<your_token>
```

---

## Quick Access

**Staging SSH:**
```bash
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@18.119.3.99
```

**Production SSH:**
```bash
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@3.22.163.3
```

**GitHub Repository:**
https://github.com/override-health/healthie-intake
