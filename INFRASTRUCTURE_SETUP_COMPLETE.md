# Infrastructure Setup Complete ✅

**Date:** 2025-10-31
**Project:** Healthie Intake Form System
**Status:** Infrastructure Ready for Deployment

---

## Summary

All AWS infrastructure for the Healthie Intake application has been successfully provisioned and configured. The application is ready for code deployment.

---

## Infrastructure Components

### Production Environment

**EC2 Instance:**
- Instance ID: `i-005f0d6aa8f516cb6`
- Type: t3.small (2 vCPU, 2GB RAM)
- AMI: Amazon Linux 2023
- Elastic IP: `3.22.163.3`
- Domain: `onboarding.override.health` (DNS configured)
- Security Group: `sg-0a3976efbf4f2a6f7` (SSH, HTTP, HTTPS)
- VPC: `vpc-0d5f1e060aa0af076`
- Subnet: `subnet-01e337149483cdbbc` (us-east-2a)

**Database:**
- RDS Instance: `override-web-postgres-encrypted`
- Type: db.t3.medium, PostgreSQL 13.20
- Database Name: `healthie_intake_production`
- User: `override`
- Endpoint: `override-web-postgres-encrypted.cfks4awdzxod.us-east-2.rds.amazonaws.com:5432`

**SSH Access:**
```bash
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@3.22.163.3
```

**Database Connection String:**
```
postgresql://override:PASSWORD@override-web-postgres-encrypted.cfks4awdzxod.us-east-2.rds.amazonaws.com:5432/healthie_intake_production
```

---

### Staging Environment

**EC2 Instance:**
- Instance ID: `i-06f782773ea0fdafb`
- Type: t3.micro (2 vCPU, 1GB RAM)
- AMI: Amazon Linux 2023
- Elastic IP: `18.119.3.99`
- Domain: `onboarding-staging.override.health` (DNS configured)
- Security Group: `sg-09fc077a21b72a3a0` (SSH, HTTP, HTTPS)
- VPC: `vpc-02b3c1810947bc010`
- Subnet: `subnet-0b1c278ed1d1e22c8` (us-east-2a)

**Database:**
- RDS Instance: `override-web-staging-postgres-encrypted`
- Type: db.t3.micro, PostgreSQL 13.20
- Database Name: `healthie_intake_staging`
- User: `override`
- Endpoint: `override-web-staging-postgres-encrypted.cfks4awdzxod.us-east-2.rds.amazonaws.com:5432`

**SSH Access:**
```bash
ssh -i ~/.ssh/provider-creds-key.pem ec2-user@18.119.3.99
```

**Database Connection String:**
```
postgresql://override:PASSWORD@override-web-staging-postgres-encrypted.cfks4awdzxod.us-east-2.rds.amazonaws.com:5432/healthie_intake_staging
```

---

## Network Configuration

### Security Groups

**Production EC2 Security Group** (`sg-0a3976efbf4f2a6f7`):
- Inbound: SSH (22), HTTP (80), HTTPS (443) from 0.0.0.0/0
- Outbound: All traffic

**Staging EC2 Security Group** (`sg-09fc077a21b72a3a0`):
- Inbound: SSH (22), HTTP (80), HTTPS (443) from 0.0.0.0/0
- Outbound: All traffic

**RDS Access:**
- Production RDS: Allows PostgreSQL (5432) from `sg-0a3976efbf4f2a6f7`
- Staging RDS: Allows PostgreSQL (5432) from `sg-09fc077a21b72a3a0`

### Network ACLs

**Production VPC** (`acl-06e6f2b05a29a97e6`):
- Rule 100: Allow SSH (port 22) inbound
- Rule 105: Allow HTTP (port 80) inbound
- Rule 110: Allow HTTPS (port 443) inbound
- Rule 115: Allow ephemeral ports (1024-65535) inbound

**Staging VPC** (`acl-00acdffd8408fb6ea`):
- Rule 100: Allow SSH (port 22) inbound
- Rule 105: Allow HTTP (port 80) inbound
- Rule 110: Allow HTTPS (port 443) inbound
- Rule 115: Allow ephemeral ports (1024-65535) inbound

### DNS Records (Route53)

**Hosted Zone:** `override.health` (`Z05456472ZFKUOC2KWIZP`)

**Records Created:**
- `onboarding.override.health` → A record → `3.22.163.3` (TTL: 300)
- `onboarding-staging.override.health` → A record → `18.119.3.99` (TTL: 300)

---

## Installed Software

Both EC2 instances have PostgreSQL 15 client installed:
```bash
psql (PostgreSQL) 15.14
```

---

## Cost Estimate

**Monthly Costs:**
- Production EC2 (t3.small): ~$15/month
- Staging EC2 (t3.micro): ~$8/month
- Elastic IPs (2): $0 (while attached to running instances)
- RDS Databases: $0 (using existing instances)
- Route53 DNS: ~$0.50/month (existing hosted zone)

**Total: ~$23-25/month**

---

## Next Steps

1. **Install Application Stack on EC2:**
   - nginx
   - Python 3.11+
   - Node.js 18+ (for building React app)
   - PM2 (process manager)
   - Certbot (SSL certificates)

2. **Configure SSL Certificates:**
   - Request Let's Encrypt certificates for both domains
   - Set up auto-renewal via cron

3. **Deploy Application:**
   - Build React frontend
   - Deploy FastAPI backend
   - Configure nginx reverse proxy
   - Set up environment variables

4. **Set Up CI/CD:**
   - Create GitHub Actions workflows
   - Configure deployment scripts
   - Add GitHub secrets for AWS credentials

5. **Test & Launch:**
   - End-to-end testing
   - SSL verification
   - Performance testing
   - Go live!

---

## Environment Variables Required

### Production

```bash
# Backend (.env)
DATABASE_URL=postgresql://override:PASSWORD@override-web-postgres-encrypted.cfks4awdzxod.us-east-2.rds.amazonaws.com:5432/healthie_intake_production
HEALTHIE_API_URL=https://api.gethealthie.com/graphql
HEALTHIE_API_KEY=your_healthie_api_key
CORS_ORIGINS=["https://onboarding.override.health"]
HOST=0.0.0.0
PORT=5096

# Frontend (built into app)
API_BASE_URL=https://onboarding.override.health
FORM_ID=your_healthie_form_id
MAPBOX_TOKEN=your_mapbox_token
```

### Staging

```bash
# Backend (.env)
DATABASE_URL=postgresql://override:PASSWORD@override-web-staging-postgres-encrypted.cfks4awdzxod.us-east-2.rds.amazonaws.com:5432/healthie_intake_staging
HEALTHIE_API_URL=https://api.gethealthie.com/graphql
HEALTHIE_API_KEY=your_healthie_api_key
CORS_ORIGINS=["https://onboarding-staging.override.health"]
HOST=0.0.0.0
PORT=5096

# Frontend (built into app)
API_BASE_URL=https://onboarding-staging.override.health
FORM_ID=your_healthie_form_id
MAPBOX_TOKEN=your_mapbox_token
```

---

## Access Credentials

**SSH Key:** `~/.ssh/provider-creds-key.pem`

**RDS Passwords:**
- Production: `NGP8RBy7HjT2fE6PnB87dXSmeAHECHQV`
- Staging: `Ektrz3WqGaaDJTbVntzedeuUz5nJdH9S`

**AWS Account:** `232373755958` (us-east-2)

---

## Troubleshooting

### Cannot SSH to instance
- Check security group allows SSH (port 22)
- Verify Network ACL allows SSH (rule 100)
- Ensure Elastic IP is attached
- Verify SSH key permissions: `chmod 400 ~/.ssh/provider-creds-key.pem`

### Cannot connect to RDS
- Verify security group allows PostgreSQL (5432) from EC2 security group
- Test connection from EC2 instance
- Check credentials and endpoint

### DNS not resolving
- Wait for DNS propagation (up to 5 minutes)
- Verify Route53 A records are correct
- Test with `dig onboarding.override.health`

---

**Infrastructure Status:** ✅ Complete and Ready
**Date Completed:** 2025-10-31
