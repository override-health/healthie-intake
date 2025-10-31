# Deployment Status

**Last Updated:** 2025-10-31
**Current Status:** Infrastructure Complete, Staging Software Installed

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
- ✅ nginx 1.28.0
- ✅ Python 3.11.14
- ✅ Node.js 18.20.8
- ✅ npm 10.8.2
- ✅ PM2 6.0.13
- ✅ Certbot 2.6.0
- ✅ git installed

### Code
- ✅ Admin credentials updated: `overrideadmin` / `$Override3887`
- ✅ All code committed to main branch

---

## 🔄 Next Steps

### Staging Deployment (Next Session)
1. Clone repository to /var/www/healthie-intake
2. Build React frontend with staging config
3. Set up Python backend with staging database
4. Configure nginx reverse proxy
5. Set up SSL certificate (Let's Encrypt)
6. Test staging environment

### Production Deployment (After Staging Verified)
1. Repeat process on production EC2
2. Use production database credentials
3. Test production environment

### CI/CD Setup (Final Step)
1. Create GitHub Actions workflows
2. Automate deployments on push to main

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
