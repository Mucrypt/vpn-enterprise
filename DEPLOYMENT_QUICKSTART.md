# 🚀 Deployment Quick Start

## Deploy New Features to Production

### Basic Usage

```bash
# Option 1: Interactive (asks for commit message)
npm run deploy

# Option 2: With commit message
npm run deploy "feat: add new dashboard widget"

# Option 3: Auto mode (no prompts, watches everything)
npm run deploy:auto "fix: update API endpoint"
```

---

## How It Works

```
┌────────────────────────────────────────────┐
│  npm run deploy "your feature message"    │
└────────────────────────────────────────────┘
                    │
                    ↓
┌────────────────────────────────────────────┐
│  1. Commits & pushes your changes         │
└────────────────────────────────────────────┘
                    │
                    ↓
┌────────────────────────────────────────────┐
│  2. Watches CI (lint → test → build)      │
└────────────────────────────────────────────┘
                    │
                    ↓
┌────────────────────────────────────────────┐
│  3. Watches deployment to Hetzner          │
└────────────────────────────────────────────┘
                    │
                    ↓
┌────────────────────────────────────────────┐
│  4. Runs health checks                     │
└────────────────────────────────────────────┘
                    │
                    ↓
          ✅ Feature Live!
```

---

## Examples

### 1. New Feature

```bash
# Make your changes
vim apps/web-dashboard/components/NewFeature.tsx

# Deploy
npm run deploy "feat: add new feature widget"
```

**What happens:**
- ✅ Commits all changes
- ✅ Pushes to GitHub
- ✅ Waits for CI to pass
- ✅ Waits for deployment to complete
- ✅ Runs health checks
- ✅ Shows live URL

### 2. Bug Fix

```bash
# Fix the bug
vim packages/api/src/routes/users.ts

# Quick deploy
npm run deploy "fix: correct user validation logic"
```

### 3. Multiple Changes

```bash
# Made several changes
git status
# ... lots of modified files

# Deploy with descriptive message
npm run deploy "feat: complete user dashboard redesign"
```

### 4. Auto Mode (No Questions)

```bash
# For fast iterations
npm run deploy:auto "test: trying new approach"
```

**Auto mode:**
- ✅ Automatically watches CI
- ✅ Automatically watches deployment
- ✅ Automatically runs health checks
- ✅ No prompts (perfect for scripts)

---

## Command Options

### `npm run deploy [message]`

**Interactive mode** - asks for confirmation at each step

**Example:**
```bash
npm run deploy "feat: new dashboard"
```

**Prompts:**
- Watch CI progress? (Y/n)
- Watch deployment? (Y/n)
- Run health checks? (Y/n)

---

### `npm run deploy:auto [message]`

**Auto mode** - no prompts, watches everything automatically

**Example:**
```bash
npm run deploy:auto "fix: API endpoint"
```

**No prompts - fully automated!**

---

## What Gets Deployed

The deployment includes:

- ✅ **API** (Node.js/Express)
- ✅ **Web Dashboard** (Next.js)
- ✅ **Python API** (FastAPI)
- ✅ **NexusAI** (React/Vite)
- ✅ **All services** (PostgreSQL, Redis, N8N, etc.)

---

## Deployment Flow Details

### 1. Pre-flight Checks
- Verifies GitHub CLI installed
- Checks current branch
- Auto-switches to main if needed

### 2. Commit & Push
- Shows uncommitted changes
- Commits with your message
- Pushes to GitHub

### 3. CI Pipeline (3-4 min)
- **Lint:** ESLint for all services
- **Test:** Unit tests for API, Web, Python
- **Build:** Docker images pushed to GHCR

### 4. Deployment (1-2 min)
- SSH to Hetzner server
- Pull latest code
- Rebuild Docker containers
- Rolling restart (zero downtime)

### 5. Health Checks
- API: https://chatbuilds.com/api/health
- Web: https://chatbuilds.com/
- NexusAI: https://chatbuilds.com/nexusai/

---

## Monitoring Deployments

### Watch Live

```bash
# The deploy script shows GitHub Actions URLs
# Click to watch in browser, or:

# Watch CI
gh run watch <run-id>

# Watch deployment
gh run list --limit 5
```

### Check Status

```bash
# Server status
npm run hetzner:status

# View logs
npm run hetzner:logs

# Check specific service
npm run hetzner:logs api
npm run hetzner:logs web
```

### Health Checks

```bash
# Manual health check
curl https://chatbuilds.com/api/health
curl https://chatbuilds.com/

# Or via browser
open https://chatbuilds.com
```

---

## Troubleshooting

### CI Failed

```bash
# View failed step
gh run view <run-id> --log-failed

# Common fixes:
# - Lint errors: npm run lint:web or npm run lint:api
# - Test failures: Check test output
# - Build errors: Check Dockerfile
```

### Deployment Failed

```bash
# View deployment logs
gh run view <deployment-id> --log-failed

# SSH to server
ssh root@157.180.123.240

# Check container status
cd /opt/vpn-enterprise/infrastructure/docker
docker compose ps
docker compose logs --tail=100
```

### Health Check Failed

```bash
# Check server logs
npm run hetzner:logs

# Restart specific service
ssh root@157.180.123.240 "cd /opt/vpn-enterprise/infrastructure/docker && docker compose restart api"

# Rebuild everything
ssh root@157.180.123.240 "cd /opt/vpn-enterprise/infrastructure/docker && docker compose down && docker compose up -d --build"
```

---

## Rollback

If deployment breaks production:

```bash
# SSH to server
ssh root@157.180.123.240

# View recent commits
cd /opt/vpn-enterprise
git log --oneline -5

# Rollback to previous commit
git checkout <previous-commit-hash>
cd infrastructure/docker
docker compose -f docker-compose.prod.yml up -d --build

# Or revert locally and redeploy
git revert HEAD
npm run deploy "revert: rollback breaking change"
```

---

## Best Practices

### 1. Commit Message Format

Use conventional commits:

```bash
npm run deploy "feat: add new feature"      # New feature
npm run deploy "fix: resolve bug"           # Bug fix
npm run deploy "docs: update README"        # Documentation
npm run deploy "style: format code"         # Code style
npm run deploy "refactor: restructure"      # Refactoring
npm run deploy "test: add tests"            # Tests
npm run deploy "chore: update deps"         # Maintenance
```

### 2. Test Locally First

```bash
# Test locally
npm run dev

# Then deploy
npm run deploy "feat: tested feature"
```

### 3. Small, Frequent Deploys

✅ Deploy small changes frequently  
❌ Avoid large monolithic deployments

```bash
# Good
npm run deploy "feat: add user avatar"
npm run deploy "feat: add avatar upload"
npm run deploy "feat: add avatar cropping"

# Avoid
npm run deploy "feat: complete user profile system"
```

### 4. Monitor After Deploy

Always check:
- ✅ CI passed
- ✅ Deployment succeeded
- ✅ Health checks green
- ✅ No errors in logs

```bash
# After deploy completes
npm run hetzner:logs
```

---

## Advanced Usage

### Deploy from Feature Branch

```bash
# Switch to feature branch
git checkout feature/new-dashboard

# Deploy (will be prompted to switch to main)
npm run deploy
# Select 'n' to deploy from current branch
```

### Deploy Without Watching

```bash
# Start deploy and continue working
npm run deploy "feat: background feature"
# Press 'n' when asked to watch CI/deployment
```

### Skip Commit (Already Committed)

```bash
# Already committed changes
git add . && git commit -m "feat: my feature"

# Just push and deploy
npm run deploy
# Type 'skip' when asked for commit message
```

---

## CI/CD Architecture

```
GitHub Push
     │
     ├─► CI Workflow (ci.yml)
     │    ├─ Lint (API, Web, Python)
     │    ├─ Test (API, Web, Python)
     │    └─ Build (Docker images → GHCR)
     │
     └─► On CI Success
          │
          └─► Deploy Workflow (deploy-hetzner.yml)
               ├─ SSH to 157.180.123.240
               ├─ Git pull latest
               ├─ Upload secrets
               └─ Docker compose up --build
                    │
                    └─► Live: https://chatbuilds.com
```

---

## Quick Reference

```bash
# Standard deploy
npm run deploy "feat: my feature"

# Quick deploy (auto mode)
npm run deploy:auto "fix: quick patch"

# Check deployment status
gh run list --limit 5

# View logs
npm run hetzner:logs

# Check server status
npm run hetzner:status

# Manual deploy (bypass CI)
npm run hetzner:deploy --build
```

---

## Support

**Issues?**
- Check GitHub Actions: https://github.com/Mucrypt/vpn-enterprise/actions
- View server logs: `npm run hetzner:logs`
- SSH to server: `ssh root@157.180.123.240`

**Emergency?**
- Rollback: See [Rollback section](#rollback)
- Direct SSH: `ssh root@157.180.123.240`

---

**Now go build and deploy features!** 🚀
