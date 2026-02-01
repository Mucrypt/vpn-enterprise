# 🚀 Deployment Guide

## Quick Deploy to Production

Deploy your changes to the live server with a single command:

```bash
npm run deploy
```

This will:
1. ✅ Check your current branch and uncommitted changes
2. 📝 Commit and push your changes to GitHub
3. 🔄 Trigger the CI/CD pipeline automatically
4. 🚀 Deploy to live server (157.180.123.240)
5. ✅ Verify the deployment with health checks

## What Happens During Deployment

### Step 1: Pre-flight Checks
- Verifies GitHub CLI is installed
- Checks current branch (switches to `main` if needed)
- Validates environment

### Step 2: Commit & Push
- Prompts for commit message
- Stages all changes (`git add .`)
- Commits and pushes to GitHub
- Triggers CI automatically on push

### Step 3: CI/CD Pipeline
- Runs linting (API, Web, Python)
- Runs tests (non-blocking)
- Runs security scans (non-blocking)
- Builds Docker images
- All workflows run in parallel

### Step 4: Deploy to Live Server
- Triggers `deploy-hetzner.yml` workflow
- SSHs to server at 157.180.123.240
- Pulls latest code
- Rebuilds containers with `docker compose`
- Reloads nginx configuration

### Step 5: Verification
- Checks container health
- Verifies service endpoints:
  - API: https://chatbuilds.com/api/health
  - Web: https://chatbuilds.com/
  - Python API: https://python-api.chatbuilds.com/health
  - NexusAI: https://chatbuilds.com/nexusai/

## Interactive Prompts

The script will ask you:

1. **"Enter commit message"** - Type your message or `skip` to deploy without committing
2. **"Wait for CI to complete?"** - Watch CI progress in real-time
3. **"Deploy to production?"** - Trigger immediate deployment or wait for auto-deploy
4. **"Watch deployment progress?"** - Monitor the deployment live
5. **"Check server status?"** - Verify health after deployment

## Alternative Deploy Commands

```bash
# Manual workflow trigger only (no commit/push)
gh workflow run deploy-hetzner.yml

# Check deployment status
npm run hetzner:status

# View server logs
npm run hetzner:logs

# SSH into server
ssh root@157.180.123.240
```

## Deployment Workflow

```
Local Changes
     ↓
npm run deploy
     ↓
Commit & Push → GitHub
     ↓
CI Pipeline (Auto-triggered)
  ├─ Lint
  ├─ Test  
  ├─ Security Scan
  └─ Build
     ↓
Deploy Workflow
     ↓
Hetzner Server (157.180.123.240)
  ├─ git pull
  ├─ docker compose up --build
  └─ nginx reload
     ↓
✅ Live at chatbuilds.com
```

## Environment Variables

Set these in your environment for automatic configuration:

```bash
export HETZNER_HOST="157.180.123.240"
export HETZNER_USER="root"
```

Or they default to:
- Host: 157.180.123.240
- User: root

## GitHub Actions Workflows

The deployment triggers these workflows automatically:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push to main | Lint, test, build |
| `security-scan.yml` | Push to main | Security checks (non-blocking) |
| `deploy-hetzner.yml` | Manual/CI success | Deploy to live server |

## Rollback

If deployment fails:

```bash
# SSH into server
ssh root@157.180.123.240

# Check container status
docker ps -a

# View logs
docker logs vpn-api
docker logs vpn-web
docker logs vpn-python-api

# Restart a service
cd /opt/vpn-enterprise/infrastructure/docker
docker compose -f docker-compose.prod.yml restart api

# Full rebuild
docker compose -f docker-compose.prod.yml up -d --build
```

## Monitoring

After deployment, monitor your services:

```bash
# Container health
ssh root@157.180.123.240 "docker ps"

# Live logs
npm run hetzner:logs

# Check all endpoints
curl https://chatbuilds.com/api/health
curl https://chatbuilds.com/
curl https://python-api.chatbuilds.com/health
curl https://chatbuilds.com/nexusai/
```

## Troubleshooting

### "GitHub CLI not found"
```bash
sudo apt install gh
gh auth login
```

### "Could not connect to server"
```bash
# Test SSH connection
ssh root@157.180.123.240

# If fails, check SSH key
ls -la ~/.ssh/id_ed25519
```

### "CI/CD failing"
- Check: https://github.com/Mucrypt/vpn-enterprise/actions
- Security scans are non-blocking - deployment continues even if they fail
- Tests are non-blocking - deployment continues even if tests fail

### "Deployment stuck"
```bash
# Check deployment status
gh run list --workflow=deploy-hetzner.yml --limit 5

# View specific run
gh run view <run-id> --log
```

## Production-Ready Features

✅ **One-command deployment** - `npm run deploy`  
✅ **Automatic CI/CD** - Triggered on every push  
✅ **Non-blocking security** - Scans run but don't block deploys  
✅ **Health verification** - Automatic checks after deployment  
✅ **Interactive prompts** - Control each step  
✅ **Rollback support** - Quick recovery options  
✅ **Real-time monitoring** - Watch progress live  

## Best Practices

1. **Always test locally first** with `npm run dev`
2. **Review changes** before deploying
3. **Use meaningful commit messages**
4. **Wait for CI to complete** before deploying
5. **Verify health checks** after deployment
6. **Monitor logs** for first few minutes post-deploy

---

**Quick Reference:**
```bash
npm run deploy              # Full deployment pipeline
npm run hetzner:status      # Check server status
npm run hetzner:logs        # View live logs
gh run list                 # View all workflow runs
```
