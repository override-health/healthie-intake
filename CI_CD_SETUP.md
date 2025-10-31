# CI/CD Setup Documentation

**Status:** ✅ GitHub Actions workflows created for staging
**Date:** 2025-10-31

---

## Overview

This project uses GitHub Actions for continuous integration and continuous deployment (CI/CD).

### Workflows Created

1. **Test & Build** (`.github/workflows/test.yml`)
   - Runs on: Every push and pull request
   - Purpose: Validate code quality and ensure builds succeed
   - Jobs:
     - Backend: Python lint, type check, syntax verification
     - Frontend: Install deps, lint, test, build
   - Status checks required before merging

2. **Deploy to Staging** (`.github/workflows/deploy-staging.yml`)
   - Runs on: Push to `main` branch or manual trigger
   - Purpose: Automatically deploy to staging environment
   - Jobs:
     - Build React frontend
     - Deploy frontend and backend to staging server
     - Restart backend service
     - Verify deployment health

---

## Required GitHub Secrets

To enable CI/CD, you need to configure these secrets in GitHub:

**Repository Settings → Secrets and variables → Actions → New repository secret**

### Secrets to Add:

1. **`STAGING_SSH_KEY`**
   - Description: SSH private key for staging server access
   - Value: Contents of `~/.ssh/provider-creds-key.pem`
   - How to get it:
     ```bash
     cat ~/.ssh/provider-creds-key.pem
     ```
   - Copy entire contents including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`

2. **`VITE_MAPBOX_TOKEN`**
   - Description: Mapbox API token for address autocomplete
   - Value: `pk.eyJ1IjoiY29yZXlvdmVycmlkZSIsImEiOiJjbWdzM3lmbmMycmM1MmpweGhzcTJlbG1tIn0.nafads8dlSX4h0CxdFlMMA`
   - Used at build time by Vite

### Optional Secrets (for future production deployment):

3. **`PRODUCTION_SSH_KEY`** - SSH key for production server
4. **`PRODUCTION_HEALTHIE_API_KEY`** - Production Healthie API key
5. **`SLACK_WEBHOOK_URL`** - For deployment notifications (optional)

---

## How to Add GitHub Secrets

### Step-by-Step:

1. Go to GitHub repository: https://github.com/override-health/healthie-intake

2. Click **Settings** (top right)

3. In left sidebar, click **Secrets and variables** → **Actions**

4. Click **New repository secret**

5. Add each secret:
   - **Name:** `STAGING_SSH_KEY`
   - **Value:** (paste SSH private key)
   - Click **Add secret**

6. Repeat for `VITE_MAPBOX_TOKEN`

7. Verify secrets are listed (values will be hidden)

---

## How CI/CD Works

### On Every Push/PR:

```mermaid
graph LR
    A[Push Code] --> B[Test & Build Workflow]
    B --> C[Test Backend]
    B --> D[Test Frontend]
    C --> E{All Tests Pass?}
    D --> E
    E -->|Yes| F[✅ Ready to Merge]
    E -->|No| G[❌ Fix Issues]
```

1. Developer pushes code or creates pull request
2. GitHub Actions runs test workflow
3. Backend and frontend are tested in parallel
4. Build verification ensures code compiles
5. PR can only be merged if tests pass

### On Push to Main:

```mermaid
graph LR
    A[Push to main] --> B[Deploy to Staging]
    B --> C[Build Frontend]
    C --> D[Deploy to Server]
    D --> E[Restart Backend]
    E --> F[Health Check]
    F --> G{Healthy?}
    G -->|Yes| H[✅ Deployed]
    G -->|No| I[❌ Rollback]
```

1. Code is pushed to `main` branch
2. Deploy to Staging workflow triggers automatically
3. React app is built
4. Files are synced to staging server via rsync
5. Backend is restarted with PM2
6. Health checks verify deployment
7. If any step fails, deployment stops and reports error

---

## Manual Deployment

You can also trigger deployments manually:

1. Go to **Actions** tab in GitHub
2. Select **Deploy to Staging** workflow
3. Click **Run workflow** dropdown
4. Select branch (usually `main`)
5. Click **Run workflow** button

---

## Viewing Workflow Runs

### Check Status:
1. Go to **Actions** tab in GitHub
2. See all workflow runs
3. Click on a run to see details
4. Click on a job to see logs

### Workflow Badges:
Add to README.md:
```markdown
[![Deploy to Staging](https://github.com/override-health/healthie-intake/actions/workflows/deploy-staging.yml/badge.svg)](https://github.com/override-health/healthie-intake/actions/workflows/deploy-staging.yml)

[![Test & Build](https://github.com/override-health/healthie-intake/actions/workflows/test.yml/badge.svg)](https://github.com/override-health/healthie-intake/actions/workflows/test.yml)
```

---

## Workflow Files Location

```
.github/
└── workflows/
    ├── test.yml              # Run tests on every push/PR
    └── deploy-staging.yml    # Deploy to staging on push to main
```

---

## Current Deployment Flow

### Manual Deployment (Current):
```
Local Machine → SSH → Staging Server
```

### Automated Deployment (New with CI/CD):
```
Local Machine → Git Push → GitHub → GitHub Actions → Staging Server
```

**Benefit:** No need to SSH and run commands manually. Just push to `main` and it deploys automatically.

---

## Staging Deployment Process (Automated)

When you push to `main`, the workflow automatically:

1. ✅ Checks out code
2. ✅ Installs Node.js 18 and Python 3.11
3. ✅ Builds React app with production config
4. ✅ Connects to staging server via SSH
5. ✅ Syncs frontend `dist/` folder
6. ✅ Syncs backend Python code (excluding .env)
7. ✅ Installs Python dependencies
8. ✅ Restarts `healthie-api-staging` with PM2
9. ✅ Verifies health endpoint responds
10. ✅ Checks PM2 process is running
11. ✅ Tests public HTTPS endpoint

If any step fails, deployment stops and you get notified.

---

## Environment Variables on Server

**Important:** The workflow does NOT overwrite `.env` files on the server.

Environment-specific configs remain on the server:
- `/var/www/healthie-intake/HealthieIntake.Api.Py/.env` (staging secrets)

The workflow deploys code but preserves server-specific configuration.

---

## Testing the CI/CD Pipeline

### Test 1: Test Workflow
```bash
# Make a small change
echo "# Test CI/CD" >> README.md
git add README.md
git commit -m "test: Trigger CI/CD test workflow"
git push origin main

# Watch workflow run in GitHub Actions tab
```

### Test 2: Deploy Workflow
```bash
# Make a small change to trigger deployment
# Change is detected, build runs, deploys to staging
git push origin main

# Watch deployment in GitHub Actions
# Verify at https://onboarding-staging.override.health
```

---

## Troubleshooting CI/CD

### Issue: SSH Connection Failed
**Cause:** `STAGING_SSH_KEY` secret is missing or incorrect

**Fix:**
1. Verify secret exists in GitHub Settings → Secrets
2. Ensure entire private key is copied (including BEGIN/END lines)
3. Check key has correct line breaks (not all on one line)

### Issue: Build Failed
**Cause:** Dependencies or code syntax error

**Fix:**
1. Check workflow logs in Actions tab
2. Run build locally to reproduce:
   ```bash
   cd HealthieIntake.UI.React
   npm install
   npm run build
   ```
3. Fix errors and push again

### Issue: Deployment Health Check Failed
**Cause:** Backend didn't start properly

**Fix:**
1. SSH to staging server manually
2. Check logs: `pm2 logs healthie-api-staging`
3. Check if process is running: `pm2 status`
4. Restart manually: `pm2 restart healthie-api-staging`

### Issue: Permission Denied
**Cause:** SSH key doesn't have access to server

**Fix:**
1. Verify the SSH key in GitHub secrets matches the one authorized on server
2. Check server's `~/.ssh/authorized_keys`

---

## Adding Production Deployment (Future)

When ready to deploy to production, create:

`.github/workflows/deploy-production.yml`

Similar to staging workflow but:
- Trigger: Manual only (or tag-based)
- Target: `3.22.163.3` (production server)
- Domain: `onboarding.override.health`
- Secrets: `PRODUCTION_SSH_KEY`, `PRODUCTION_HEALTHIE_API_KEY`
- Add extra safety checks (confirmation step, backup first, etc.)

---

## Cost

**GitHub Actions:**
- Free tier: 2,000 minutes/month
- Our workflows: ~5 minutes per deployment
- Estimated usage: ~40 deployments/month = 200 minutes
- Cost: **$0** (well within free tier)

---

## Best Practices

1. **Always test locally first** before pushing to trigger deployment
2. **Use feature branches** for development, merge to `main` when ready
3. **Monitor Actions tab** after pushing to see if deployment succeeded
4. **Check staging site** after auto-deployment completes
5. **Keep secrets secure** - never commit credentials to git

---

## Next Steps

### To Enable CI/CD:

1. ✅ Workflows created (already done)
2. ⬜ Add GitHub secrets (see "Required GitHub Secrets" section above)
3. ⬜ Test by pushing to `main` branch
4. ⬜ Verify deployment completes successfully
5. ⬜ Monitor first few deployments to ensure stability

### Optional Enhancements:

- Add Slack/Discord notifications on deployment
- Add rollback workflow
- Add production deployment workflow
- Add automated tests (unit tests, integration tests)
- Add code coverage reporting
- Add security scanning (Dependabot, CodeQL)

---

**Status:** Workflows created, pending GitHub secrets configuration
**Last Updated:** 2025-10-31
