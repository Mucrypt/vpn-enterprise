# 🚀 Quick Deploy Guide

## Your New Workflow (Simple!)

### ✅ Option 1: Auto-Deploy (Recommended)

```bash
git add .
git commit -m "feat: your amazing feature"
git push
```

**That's it!** GitHub Actions automatically deploys to your Hetzner server.

---

### ⚡ Option 2: Use the Deploy Script

```bash
./scripts/deploy.sh
```

This interactive script will:

- Commit and push your changes
- Ask if you want to trigger deployment
- Watch the deployment progress

---

### 🎯 Option 3: Quick Aliases

Add these to your `~/.bashrc` or `~/.zshrc`:

```bash
# Source the aliases
source ~/vpn-enterprise/scripts/aliases.sh
```

Then use:

```bash
vpn-deploy    # Run the deploy script
vpn-push      # Quick commit & push
vpn-trigger   # Manually trigger deployment
vpn-watch     # Watch deployment progress
vpn-status    # Check deployment status
vpn-ssh       # SSH to production server
vpn-logs      # View container logs
vpn-ps        # Check container status
```

---

## Comparison with Your Old Workflow

### 🔴 Before (Manual - 8 steps):

```bash
# Step 1-3: Local
git add .
git commit -m "message"
git push

# Step 4-8: SSH to server
ssh root@157.180.123.240
cd /opt/vpn-enterprise
git pull
cd infrastructure/docker
docker compose -f docker-compose.prod.yml up -d --build
```

### 🟢 After (Auto - 3 steps):

```bash
git add .
git commit -m "message"
git push
# ✨ Auto-deploys via GitHub Actions
```

### 🚀 After with script (1 step):

```bash
./scripts/deploy.sh
# Interactive - handles everything
```

### ⚡ After with alias (1 command):

```bash
vpn-deploy
# Or even simpler:
vpn-push  # Commits and pushes (auto-deploys)
```

---

## How Auto-Deploy Works

1. You push to `main` branch
2. **CI Workflow** runs tests and builds
3. **Deploy Workflow** automatically triggers when CI passes
4. Deployment happens on your Hetzner server:
   - Pulls latest code
   - Updates secrets/config
   - Rebuilds Docker images
   - Restarts services with zero downtime

### Monitor Deployment

**Option A: Command Line**

```bash
# Watch latest deployment
gh run watch --repo Mucrypt/vpn-enterprise

# Check status
gh run list --repo Mucrypt/vpn-enterprise --limit 5
```

**Option B: Web Browser**
Visit: https://github.com/Mucrypt/vpn-enterprise/actions

---

## Manual Deployment Trigger

If you want to deploy without pushing code:

```bash
gh workflow run "Deploy to Hetzner (Docker Compose)" \
  --repo Mucrypt/vpn-enterprise \
  --ref main \
  -f ref=main \
  -f rebuild=true
```

Or use the alias:

```bash
vpn-trigger
```

---

## Quick Reference Commands

### Deployment

```bash
# View deployments
gh run list --workflow=deploy-hetzner.yml --limit 5

# Watch active deployment
gh run watch --repo Mucrypt/vpn-enterprise

# View deployment logs
gh run view <run-id> --log

# Cancel deployment
gh run cancel <run-id>
```

### Server Management

```bash
# SSH to server
ssh root@157.180.123.240

# Check containers
ssh root@157.180.123.240 "docker ps"

# View logs
ssh root@157.180.123.240 "cd /opt/vpn-enterprise/infrastructure/docker && \
  docker compose -f docker-compose.prod.yml logs -f"

# Restart a service
ssh root@157.180.123.240 "docker restart vpn-api"
```

---

## Troubleshooting

### Deployment Fails?

```bash
# View failed run
gh run list --workflow=deploy-hetzner.yml --limit 1

# Get run ID, then view logs
gh run view <run-id> --log-failed

# Re-trigger deployment
gh workflow run "Deploy to Hetzner (Docker Compose)" \
  --ref main -f ref=main -f rebuild=true
```

### Service Not Starting?

```bash
# SSH to server
vpn-ssh

# Check service status
cd /opt/vpn-enterprise/infrastructure/docker
docker compose -f docker-compose.prod.yml ps

# View specific service logs
docker logs vpn-api --tail=100

# Restart service
docker restart vpn-api
```

### Need to Roll Back?

```bash
# On server
ssh root@157.180.123.240
cd /opt/vpn-enterprise
git log --oneline -5  # Find previous commit
git checkout <commit-hash>
cd infrastructure/docker
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Setup Instructions

### 1. Install Aliases (Optional but Recommended)

```bash
# Add to your shell config
echo 'source ~/vpn-enterprise/scripts/aliases.sh' >> ~/.bashrc

# Reload shell
source ~/.bashrc
```

### 2. Test Your Setup

```bash
# Make a small change
echo "# Test" >> README.md

# Use the deploy script
./scripts/deploy.sh

# Or use aliases
vpn-deploy
```

### 3. Verify Deployment

```bash
# Watch deployment
vpn-watch

# Or check status
vpn-status

# Verify on server
curl https://chatbuilds.com/health
```

---

## Best Practices

### 1. Always Push to Main for Auto-Deploy

```bash
git checkout main
git pull origin main
# Make changes
git add .
git commit -m "feat: descriptive message"
git push
```

### 2. Use Feature Branches for WIP

```bash
git checkout -b feature/my-feature
# Work on feature
git commit -m "wip: working on feature"
git push origin feature/my-feature

# When ready, merge to main (triggers deploy)
git checkout main
git merge feature/my-feature
git push
```

### 3. Monitor Deployments

- Check GitHub Actions page regularly
- Watch for failed deployments
- Review deployment logs

### 4. Test Locally First

```bash
# Test in dev environment
cd infrastructure/docker
docker compose -f docker-compose.dev.yml up --build

# If OK, push to production
git push
```

---

## Summary

| Method            | Commands              | Auto-Deploy | Effort   |
| ----------------- | --------------------- | ----------- | -------- |
| **Old Way**       | 8 steps (local + SSH) | ❌ No       | High     |
| **Git Push**      | 3 commands            | ✅ Yes      | Low      |
| **Deploy Script** | 1 command             | ✅ Yes      | Very Low |
| **Alias**         | 1 word                | ✅ Yes      | Minimal  |

**Recommended:** Use `vpn-deploy` alias or just `git push` for auto-deployment.

---

## Need Help?

- **Deployment Docs**: `.github/workflows/DEPLOYMENT_SETUP.md`
- **Server Config**: `.github/workflows/HETZNER_SERVER_CONFIG.md`
- **Infrastructure**: `.github/workflows/INFRASTRUCTURE_ALIGNMENT.md`
- **GitHub Actions**: https://github.com/Mucrypt/vpn-enterprise/actions
