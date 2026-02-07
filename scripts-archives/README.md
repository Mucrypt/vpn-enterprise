# Archived Scripts

This folder contains old deployment and test scripts that are **NO LONGER ACTIVELY USED**. They have been archived for reference only.

## ⚠️ Important Notice

**DO NOT USE THESE SCRIPTS FOR PRODUCTION DEPLOYMENTS**

For current, working scripts, please use:
- **Production Deployment**: `npm run deploy` or `npm run deploy:auto` (uses `./scripts/deploy-production.sh`)
- **Active Scripts**: Located in the `./scripts/` directory

## Archived Scripts Inventory

### Deployment Scripts (Old/One-time fixes)
- **deploy-billing-fix.sh** - One-time billing system fix (Feb 4, 2026)
- **deploy-env-to-production.sh** - Old environment deployment script (Feb 4, 2026)
- **deploy-nexusai-fix.sh** - One-time NexusAI integration fix (Feb 6, 2026)
- **full-production-deploy.sh** - Old full deployment script (Feb 4, 2026)
  - **Superseded by**: `scripts/deploy-production.sh` (actively maintained)

### Fix Scripts (One-time use)
- **fix-nexusai-422-error.sh** - Specific error fix for NexusAI 422 issues (Feb 6, 2026)

### Setup Scripts (One-time configuration)
- **set-openai-key.sh** - OpenAI API key setup script (Feb 6, 2026)

### Test Scripts
- **test-webhook-purchase.sh** - Stripe webhook purchase testing (Feb 6, 2026)
- **test-signup.js** - User signup endpoint testing

## Current Active Scripts

All active, maintained scripts are located in the `./scripts/` directory:

```bash
scripts/
├── deploy-production.sh    # Main production deployment (use: npm run deploy)
├── start-dev.sh           # Start development stack (use: npm run dev)
├── start-database-platform.sh  # Start DB platform (use: npm run db:platform)
├── setup-secrets.sh       # Setup Docker secrets (use: npm run secrets:setup)
├── quick-fix-workflows.sh # Fix CI/CD workflows (use: npm run cicd:fix)
└── hetzner/              # Hetzner server management scripts
    ├── deploy-prod.sh
    ├── setup-env-production.sh
    ├── status.sh
    └── logs.sh
```

## Quick Commands (Current)

### Deployment
```bash
npm run deploy "feat: your feature description"  # Interactive deployment
npm run deploy:auto "feat: description"          # Automated deployment
```

### Development
```bash
npm run dev              # Start dev environment
npm run db:platform      # Start database platform
npm run hetzner:status   # Check production server status
npm run hetzner:logs     # View production logs
```

### CI/CD
```bash
npm run cicd:fix         # Fix workflow conflicts
npm run cicd:status      # Check CI/CD status
```

## Why Were These Scripts Archived?

- **Superseded**: Replaced by better, more robust versions in `./scripts/`
- **One-time fixes**: Specific issue fixes that are no longer needed
- **Outdated**: Deployment patterns have evolved; current scripts use GitHub Actions + Docker
- **Not referenced**: Not used in `package.json`, `Makefile`, or CI/CD workflows

## Need to Deploy?

**Always use**:
```bash
npm run deploy "your commit message"
```

This uses the actively maintained `scripts/deploy-production.sh` which:
- ✅ Commits and pushes changes
- ✅ Monitors CI pipeline
- ✅ Watches deployment to Hetzner
- ✅ Runs health checks
- ✅ Provides detailed status updates

---

**Last Updated**: February 7, 2026  
**Archive Reason**: Root directory cleanup - moved non-working/old scripts for better organization
