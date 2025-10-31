# Healthie Intake - Deployment Plan

**Project:** Healthie Intake Form System
**Date Started:** 2025-10-31
**Status:** Planning Phase

---

## Current Application Architecture

### Technology Stack
- **Frontend:** React 19.0.0 + Vite
  - Location: `HealthieIntake.UI.React/`
  - Port: 5173 (dev)
  - Features: Multi-step intake form, draft saving, admin dashboard

- **Backend:** Python FastAPI
  - Location: `HealthieIntake.Api.Py/`
  - Port: 5096 (dev)
  - Features: Healthie API integration, draft management, intake storage

- **Database:** PostgreSQL
  - Type: Relational database
  - Features: Intake records, draft support, form data storage

- **External Integration:** Healthie API
  - GraphQL API for patient data, form submissions
  - Module ID: 19056501 (signature field)

### Application Features
1. **Patient Intake Form**
   - Multi-step form with progress tracking
   - Draft autosave functionality
   - Medication management with autocomplete
   - Address validation with Mapbox
   - Typed signature component
   - Duplicate submission prevention

2. **Admin Dashboard**
   - Login/authentication
   - Intake list with search/filter
   - Human-readable form viewer
   - Patient consent & signature viewing
   - Raw JSON debug view

### Current Development Setup
- **Frontend:** Vite dev server (HMR enabled)
- **Backend:** Docker container (`healthie-api-py`)
  - Image: `healthie-api-py`
  - Container: Running on port 5096
  - Logs: Monitoring via `docker logs --follow`
- **Database:** PostgreSQL (connection details in `.env`)
- **Environment Variables:**
  - Backend: `.env` file in `HealthieIntake.Api.Py/`
  - Frontend: `src/config.js` with API_BASE_URL

---

## AWS Account Information

**Account Details:**
- **Account ID:** `232373755958`
- **IAM User:** `cli-access`
- **Region:** `us-east-2` (Ohio)
- **Domain:** `override.health` (Route53 hosted zone)

**Available Services:**
- EC2 (compute)
- RDS (managed PostgreSQL)
- S3 (static hosting)
- CloudFront (CDN)
- Route53 (DNS)
- Lambda (serverless)
- ECS/Fargate (containers)
- API Gateway
- Certificate Manager (SSL/TLS)
- Elastic Beanstalk
- Amplify

---

## Previous Deployment Experience

**Provider Credentialing Project:**
- Architecture: EC2 t3.small + nginx + Node.js + PM2
- SSL: Let's Encrypt (auto-renewal)
- URL: https://providers.override.health
- Cost: ~$16-26/month
- Deployment: Manual SSH deployment
- **Lessons Learned:** Works well, but manual process

---

## New Deployment Approach

### Goals
*(To be defined)*

### Architecture
*(To be defined)*

### Infrastructure Components
*(To be defined)*

### CI/CD Pipeline
**Decision:** GitHub Actions (can switch to CircleCI later if needed)

**Why GitHub Actions:**
- Already integrated with GitHub repo
- No external service to manage
- Simpler setup (just commit workflow files)
- Native secrets management
- Free for current usage

**Workflows to Create:**
1. **Build & Test** (`.github/workflows/build-test.yml`)
   - Trigger: Pull requests, push to feature branches
   - Steps: Install deps, run tests, build frontend/backend
   - Status checks before merge

2. **Deploy to Production** (`.github/workflows/deploy.yml`)
   - Trigger: Push to `main` branch
   - Steps: Build, test, deploy to AWS
   - Auto-deployment on successful merge

**Required GitHub Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (us-east-2)
- `HEALTHIE_API_KEY`
- `DATABASE_URL`
- Other environment-specific secrets

### Deployment Process
*(To be defined)*

### Cost Estimation
*(To be defined)*

### Timeline
*(To be defined)*

---

## Deployment Requirements

### Domain/SSL Requirements
- Subdomain under `override.health`
- SSL/TLS certificate
- HTTPS enforcement

### Environment Variables (Backend)
- `HEALTHIE_API_URL`
- `HEALTHIE_API_KEY`
- `DATABASE_URL` (PostgreSQL connection string)
- `CORS_ORIGINS`
- `HOST` / `PORT`

### Environment Variables (Frontend)
- `API_BASE_URL` (backend API endpoint)
- `FORM_ID` (Healthie form ID)
- `MAPBOX_TOKEN` (address autocomplete)

### Database Requirements
- PostgreSQL database
- Schema: `intakes` table with JSON form_data column
- Migration: `init_db()` on startup

### Security Considerations
- Healthie API key protection
- Admin authentication:
  - **Current:** Simple username/password (admin/admin123)
  - **Future Enhancement (Post-Launch):** Google OAuth 2.0 with @override.health domain restriction
    - Option 1: Domain-based (all @override.health users)
    - Option 2: Allowlist-based (specific emails)
    - Option 3: Google Groups API (manage via Workspace admin)
    - Estimated effort: 3-5 hours for Options 1/2, 6-8 hours for Option 3
    - Pattern already proven in provider credentialing project (HubSpot OAuth)
  - **Decision:** Deploy with current simple auth, may change password before launch, implement OAuth later
- CORS configuration
- Database credentials security
- HTTPS enforcement

---

## Open Questions

1. What subdomain should we use? (e.g., `intake.override.health`)
2. Should admin authentication be enhanced before deployment?
3. Do we need staging environment?
4. What's the expected traffic/scale?
5. Backup strategy for PostgreSQL?
6. Monitoring and alerting requirements?

---

## Next Steps

1. [ ] Define new deployment architecture
2. [ ] Document infrastructure components
3. [ ] Create deployment scripts/IaC
4. [ ] Set up domain and SSL certificate
5. [ ] Configure production environment variables
6. [ ] Deploy database
7. [ ] Deploy backend API
8. [ ] Deploy frontend
9. [ ] Test end-to-end
10. [ ] Configure monitoring

---

## Notes

- Current branch: `main` (just merged `admin_tool`)
- All local changes committed and pushed
- Development servers running and functional
- Docker API container operational
- Ready for deployment planning
