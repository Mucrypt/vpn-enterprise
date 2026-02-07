# 🚀 CI/CD Pipeline Improvements & Implementation Plan

## Executive Summary

This document outlines the complete plan to unify and optimize your CI/CD pipeline for the live Hetzner deployment.

---

## 1. CURRENT PROBLEMS 🔴

### A. Multiple Conflicting Workflows

**Issue:** Three workflows doing similar things:

- `ci.yml` - Simple CI with lint/test/build
- `main-ci-cd.yml` - Comprehensive CI/CD (605 lines, complex)
- `deploy-hetzner.yml` - Specialized Hetzner deployment

**Problem:**

- `ci.yml` triggers on push to main → triggers `deploy-hetzner.yml` via `workflow_run`
- `main-ci-cd.yml` ALSO triggers on push to main → has its own deploy job
- **Result:** Two deployments attempt to run simultaneously! 🚨

### B. Missing GitHub Secrets

Required but not configured:

```
HETZNER_HOST                   # Your server IP: 157.180.123.240
HETZNER_USER                   # SSH user: root
HETZNER_SSH_PRIVATE_KEY        # SSH key for authentication
HETZNER_APP_DIR                # Default: /opt/vpn-enterprise
ENV_PRODUCTION                 # Contents of .env.production
SECRET_DB_PASSWORD             # PostgreSQL password
SECRET_REDIS_PASSWORD          # Redis password
SECRET_N8N_ENCRYPTION_KEY      # N8N encryption key
SECRET_API_KEY                 # API authentication key
SECRET_STRIPE_SECRET_KEY       # Stripe secret key
SECRET_STRIPE_WEBHOOK_SECRET   # Stripe webhook secret
SLACK_WEBHOOK                  # Optional: Slack notifications
```

### C. Docker Secrets Permission Issues

**Problem:** Some containers (n8n) run as non-root users but secrets are mounted root-only

**Current Setup:**

```yaml
# In docker-compose.prod.yml
secrets:
  - db_password # Mounted as root:root 400 by default
```

**n8n container:**

```yaml
n8n:
  user: node # Non-root user
  environment:
    - N8N_ENCRYPTION_KEY_FILE=/run/secrets/n8n_encryption_key # Can't read!
```

### D. Incomplete Build Process

**Issue:** Dockerfiles have build args that aren't passed consistently

**Example:**

```dockerfile
# Dockerfile.web
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

But in `docker-compose.prod.yml`:

```yaml
build:
  args:
    - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} # Where does this come from?
```

**Problem:** These values need to be in `.env.production` but might be missing.

---

## 2. RECOMMENDED SOLUTION 🟢

### A. Unified Workflow Strategy

**OPTION 1: Keep Simple (RECOMMENDED for you)**

```
┌─────────────────────────────────────────┐
│  ci.yml                                  │
│  - Runs on: push to main                │
│  - Jobs: lint → test → build images     │
│  - Triggers: deploy-hetzner.yml         │
└─────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│  deploy-hetzner.yml                      │
│  - When: workflow_run (ci success)      │
│  - Or: manual workflow_dispatch         │
│  - Does: SSH deploy to Hetzner server   │
└─────────────────────────────────────────┘
```

**Actions:**

- ✅ Keep `ci.yml` and `deploy-hetzner.yml`
- 🗑️ Disable/archive `main-ci-cd.yml` (too complex, Vercel-focused)
- ✅ Fix deploy-hetzner.yml to use proper secrets

**OPTION 2: All-in-One (if you want comprehensive pipeline)**

```
┌─────────────────────────────────────────┐
│  main-ci-cd.yml (improved)               │
│  - Runs on: push to main                │
│  - Jobs: lint → test → build → deploy   │
│  - Target: Hetzner via SSH              │
└─────────────────────────────────────────┘
```

**Actions:**

- 🗑️ Delete `ci.yml` and `deploy-hetzner.yml`
- ✅ Keep only `main-ci-cd.yml` but simplify it
- ✅ Remove Vercel deployment (you're using Hetzner)
- ✅ Remove multi-environment (you only have production)

**MY RECOMMENDATION:** Option 1 (simpler, works now, easier to debug)

### B. GitHub Secrets Configuration

**Step-by-step setup:**

```bash
# 1. Go to GitHub repo
https://github.com/Mucrypt/vpn-enterprise/settings/secrets/actions

# 2. Add these secrets (click "New repository secret"):

# Server access
HETZNER_HOST = 157.180.123.240
HETZNER_USER = root
HETZNER_APP_DIR = /opt/vpn-enterprise

# SSH key (get from local machine)
# Run: cat ~/.ssh/id_ed25519
HETZNER_SSH_PRIVATE_KEY = <paste entire private key>

# Environment file (get from server or local)
# Run: cat .env.production
ENV_PRODUCTION = <paste entire .env.production contents>

# Individual secrets (from infrastructure/docker/secrets/)
SECRET_DB_PASSWORD = <from secrets/db_password>
SECRET_REDIS_PASSWORD = <from secrets/redis_password>
SECRET_N8N_ENCRYPTION_KEY = <from secrets/n8n_encryption_key>
SECRET_API_KEY = <from secrets/api_key>
SECRET_STRIPE_SECRET_KEY = <from secrets/stripe_secret_key>
SECRET_STRIPE_WEBHOOK_SECRET = <from secrets/stripe_webhook_secret>

# Optional
SLACK_WEBHOOK = <your slack webhook URL or leave empty>
```

### C. Docker Secrets Fix

**Problem:** n8n needs to read secrets as non-root user

**Solution in `docker-compose.prod.yml`:**

```yaml
# Option 1: Use bind mounts (already done for API)
n8n:
  volumes:
    - ./secrets/n8n_encryption_key:/run/secrets/n8n_encryption_key:ro
  # The file needs chmod 644 on host so 'node' user can read it
```

**Or on host:**

```bash
# Make n8n secret readable by container user
cd infrastructure/docker/secrets
chmod 644 n8n_encryption_key  # Readable by all (container user can access)
chmod 600 db_password redis_password api_key  # Keep others restricted
```

### D. Environment Variables Checklist

**Required in `.env.production`:**

```bash
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://platform_admin:password@vpn-postgres:5432/platform_db

# API
API_URL=https://chatbuilds.com/api
INTERNAL_API_URL=http://api:5000
JWT_SECRET=your-jwt-secret
API_KEY=your-api-key

# Frontend build-time variables
NEXT_PUBLIC_API_URL=https://chatbuilds.com/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Python API
PYTHON_API_URL=http://python-api:5001
OPENAI_API_KEY=your-openai-key

# N8N
N8N_HOST=n8n.chatbuilds.com
N8N_PROTOCOL=https
N8N_PORT=443
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your-strong-password

# NexusAI
NEXUSAI_URL=https://chatbuilds.com/nexusai
NEXUSAI_API_URL=http://nexusai:3001

# Redis
REDIS_HOST=vpn-redis
REDIS_PORT=6379

# Docker/Host
DOCKER_HOST=unix:///var/run/docker.sock
```

---

## 3. IMPLEMENTATION STEPS 🛠️

### Phase 1: Prepare Secrets (5 minutes)

```bash
# On your local machine / Hetzner server

# 1. Collect all secret values
cd infrastructure/docker/secrets
ls -la

# 2. Get your SSH key
cat ~/.ssh/id_ed25519

# 3. Verify .env.production is complete
cat .env.production | wc -l  # Should have 30-40 lines

# 4. Test secrets permissions
ls -la secrets/
# Expected:
# -rw-r--r-- n8n_encryption_key  (644)
# -rw------- db_password         (600)
# -rw------- redis_password      (600)
# -rw------- api_key             (600)
```

### Phase 2: Configure GitHub Secrets (10 minutes)

```bash
# Easiest way: Use gh CLI
gh auth login
gh secret set HETZNER_HOST -b "157.180.123.240" -R Mucrypt/vpn-enterprise
gh secret set HETZNER_USER -b "root" -R Mucrypt/vpn-enterprise
gh secret set HETZNER_APP_DIR -b "/opt/vpn-enterprise" -R Mucrypt/vpn-enterprise

# SSH key (from file)
gh secret set HETZNER_SSH_PRIVATE_KEY < ~/.ssh/id_ed25519 -R Mucrypt/vpn-enterprise

# Environment file
gh secret set ENV_PRODUCTION < .env.production -R Mucrypt/vpn-enterprise

# Individual secrets
gh secret set SECRET_DB_PASSWORD < infrastructure/docker/secrets/db_password -R Mucrypt/vpn-enterprise
gh secret set SECRET_REDIS_PASSWORD < infrastructure/docker/secrets/redis_password -R Mucrypt/vpn-enterprise
gh secret set SECRET_N8N_ENCRYPTION_KEY < infrastructure/docker/secrets/n8n_encryption_key -R Mucrypt/vpn-enterprise
gh secret set SECRET_API_KEY < infrastructure/docker/secrets/api_key -R Mucrypt/vpn-enterprise
gh secret set SECRET_STRIPE_SECRET_KEY < infrastructure/docker/secrets/stripe_secret_key -R Mucrypt/vpn-enterprise
gh secret set SECRET_STRIPE_WEBHOOK_SECRET < infrastructure/docker/secrets/stripe_webhook_secret -R Mucrypt/vpn-enterprise

# Verify
gh secret list -R Mucrypt/vpn-enterprise
```

**Or manually:** Go to https://github.com/Mucrypt/vpn-enterprise/settings/secrets/actions

### Phase 3: Fix Workflow Files (5 minutes)

**A. Disable conflicting workflow:**

```bash
# Rename to disable
mv .github/workflows/main-ci-cd.yml .github/workflows/main-ci-cd.yml.disabled

# Or delete
rm .github/workflows/main-ci-cd.yml
```

**B. Keep these active:**

- `.github/workflows/ci.yml` ✅
- `.github/workflows/deploy-hetzner.yml` ✅
- `.github/workflows/security-scan.yml` ✅ (optional)

### Phase 4: Test Deployment (10 minutes)

```bash
# 1. Trigger manually first (safer)
gh workflow run deploy-hetzner.yml --ref main

# 2. Watch the run
gh run watch

# 3. If successful, commit changes to test automatic trigger
git add .github/workflows/
git commit -m "fix: unify CI/CD workflows, add GitHub secrets"
git push origin main

# 4. CI will run, then deploy-hetzner will trigger automatically
gh run list
```

### Phase 5: Verify Production (5 minutes)

```bash
# Check services are running
ssh root@157.180.123.240 "cd /opt/vpn-enterprise && docker compose ps"

# Check health endpoints
curl -f https://chatbuilds.com/api/health
curl -f https://chatbuilds.com/
curl -f https://chatbuilds.com/nexusai/

# Check logs if issues
ssh root@157.180.123.240 "cd /opt/vpn-enterprise && docker compose logs --tail=50 api web"
```

---

## 4. WORKFLOW DIAGRAM (RECOMMENDED) 📊

```
Developer pushes to main branch
              │
              ↓
┌─────────────────────────────────┐
│  .github/workflows/ci.yml        │
├─────────────────────────────────┤
│  1. Checkout code               │
│  2. Lint (API, Web, Python)     │
│  3. Test (with Postgres/Redis)  │
│  4. Build Docker images          │
│  5. Push to GHCR                │
└─────────────────────────────────┘
              │
              ↓ (on success)
┌──────────────────────────────────────┐
│  .github/workflows/deploy-hetzner.yml │
├──────────────────────────────────────┤
│  1. SSH to Hetzner server            │
│  2. Git pull latest code             │
│  3. Upload .env.production           │
│  4. Upload secrets files             │
│  5. Docker compose up --build        │
│  6. Health check                     │
└──────────────────────────────────────┘
              │
              ↓
     🎉 Live at chatbuilds.com
```

---

## 5. EMERGENCY ROLLBACK 🔙

If deployment breaks production:

```bash
# Option 1: SSH and rollback manually (FASTEST)
ssh root@157.180.123.240
cd /opt/vpn-enterprise
git log --oneline -5  # Find previous good commit
git checkout <previous-commit-hash>
cd infrastructure/docker
docker compose -f docker-compose.prod.yml up -d --build

# Option 2: Trigger workflow with previous commit
gh workflow run deploy-hetzner.yml --ref <previous-commit-hash>

# Option 3: Revert commit and push
git revert HEAD
git push origin main  # Will trigger new deployment with old code
```

---

## 6. MONITORING & ALERTS 📈

### Add Health Check Monitoring

**In `ci.yml` (post-deploy):**

```yaml
- name: Health Check After Deploy
  run: |
    sleep 30  # Wait for services to stabilize

    # Check all critical services
    curl -f https://chatbuilds.com/api/health || exit 1
    curl -f https://chatbuilds.com/ || exit 1
    curl -f https://chatbuilds.com/nexusai/ || exit 1

    echo "✅ All services healthy"
```

### Add Slack Notifications (Optional)

**If you want Slack alerts:**

```yaml
- name: Notify Deployment Status
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: |
      🚀 Deployment ${{ job.status }}
      Commit: ${{ github.event.head_commit.message }}
      URL: https://chatbuilds.com
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 7. PRODUCTION CHECKLIST ✅

Before going live with new CI/CD:

- [ ] All GitHub secrets configured
- [ ] `.env.production` complete on server
- [ ] Docker secrets files exist with correct permissions
- [ ] SSH key works: `ssh root@157.180.123.240 "echo success"`
- [ ] Repository exists at: `/opt/vpn-enterprise` on server
- [ ] Docker and docker compose installed on server
- [ ] Nginx configured and running
- [ ] SSL certificates valid
- [ ] Database initialized and running
- [ ] Conflicting workflows disabled
- [ ] Test deployment run successful
- [ ] Health checks passing
- [ ] Rollback plan documented
- [ ] Team notified of deployment process

---

## 8. MAINTENANCE COMMANDS 🔧

### Check CI/CD Status

```bash
# List recent workflow runs
gh run list --limit 10

# Watch current run
gh run watch

# View specific run
gh run view <run-id>

# Re-run failed workflow
gh run rerun <run-id>
```

### Check Production Status

```bash
# Full status
npm run hetzner:status

# View logs
npm run hetzner:logs

# Restart service
ssh root@157.180.123.240 "cd /opt/vpn-enterprise/infrastructure/docker && docker compose restart api"
```

### Manual Deploy (bypass CI)

```bash
# Direct deploy (if CI fails)
npm run hetzner:deploy --build

# Or via script with pull
./scripts/hetzner/deploy-prod.sh --pull --build
```

---

## 9. COST OPTIMIZATION 💰

**Current:** Every push to main triggers full CI + deploy (~15 minutes)

**Optimization:**

```yaml
# In ci.yml - add path filters
on:
  push:
    branches: [main]
    paths:
      - 'packages/**'
      - 'apps/**'
      - 'infrastructure/**'
      - 'flask/**'
      # Ignore docs changes
      - '!docs/**'
      - '!*.md'
```

**Result:** Documentation updates won't trigger expensive CI runs

---

## 10. NEXT STEPS 🎯

1. **Immediate:** Fix GitHub secrets (Phase 2)
2. **Short term:** Disable conflicting workflows (Phase 3)
3. **Medium term:** Add comprehensive health checks
4. **Long term:** Consider staging environment
5. **Future:** Add automated database backups before deploy

---

## Questions or Issues?

Common problems and solutions:

**Q: Deployment fails with "permission denied"**
A: Check SSH key is correct in GitHub secrets, test manually: `ssh root@157.180.123.240`

**Q: Docker build fails on server**
A: Check disk space: `ssh root@157.180.123.240 "df -h"` - may need to prune images

**Q: Services don't start after deploy**
A: Check logs: `npm run hetzner:logs` - usually environment variable issues

**Q: Can I deploy without running tests?**
A: Yes, manually trigger: `gh workflow run deploy-hetzner.yml --ref main`

---

**Ready to implement?** Start with Phase 1 and follow steps sequentially! 🚀
