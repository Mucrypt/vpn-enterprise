# Scripts — VPN Enterprise

This folder provides focused helper scripts to build, deploy and manage the project. The goal is to make it easy to push
changes locally or from CI to Vercel (API and Web), while still supporting on-prem / Docker-based workflows.

> **Note**: Scripts have been cleaned up (Dec 2024). Unused/redundant scripts moved to `archive/` folder. See `archive/README.md` for details.

## 🚀 TL;DR (Essential Commands)

### Database Development

```bash
./scripts/start-db-dev.sh                    # Start PostgreSQL + pgAdmin (primary setup)
./scripts/test-api.sh                        # Test API functionality
```

### Deployment

```bash
./scripts/auto-deploy.sh                     # Push + deploy (interactive)
./scripts/auto-deploy.sh "My release: fix X"  # Push + deploy (with message)
./scripts/deploy-vercel.sh --skip-api-build   # Deploy only (no commit)
```

### Hetzner (Production)

```bash
./scripts/release-hetzner.sh "Release: my change"   # Push to main; CI deploys to Hetzner

# On the Hetzner host:
./scripts/setup-secrets.sh
./scripts/hetzner/setup-env-production.sh
./scripts/hetzner/deploy-prod.sh --pull --build
```

Prerequisites

- Node.js & npm
- Docker (only needed for the Docker deployment scripts)
- Vercel CLI (optional locally): `npm i -g vercel` or use `npx vercel`
- A Git remote named `origin` and permission to push to `main`

## 📋 Active Scripts

### Database Development Scripts

- **`start-db-dev.sh`** - Start PostgreSQL + pgAdmin + Adminer (primary database setup)
- **`start-database-platform.sh`** - Start full database platform stack
- **`stop-database-platform.sh`** - Stop database platform stack

### Development Environment Scripts

- **`start-dev.sh`** - Start development environment (API + Web + Redis)
- **`stop-dev.sh`** - Stop development environment
- **`quick-start.sh`** - Project initialization and setup guide

### Deployment & CI Scripts

- **`auto-deploy.sh`** - Complete deployment workflow (git push + Vercel deploy)
- **`deploy-vercel.sh`** - Vercel deployment (used by auto-deploy)
- **`build-api-vercel.sh`** - Build API for Vercel deployment
- **`release-hetzner.sh`** - Push to main; GitHub Actions deploys to Hetzner
- **`hetzner/*`** - Hetzner host-side helpers (env/secrets/deploy/logs)

### Testing Scripts

- **`test-api.sh`** - Test API functionality and database connections

### Git Operations

- **`git/push.sh`** - Git operations helper

## 🔧 Environment & Secrets

- `.env` — local environment variables (see `quick-start.sh` for setup)
- `VERCEL_TOKEN` — CI secret for automated Vercel deployments

## 📖 Script Details

- `scripts/build-api-vercel.sh`
  - Builds workspace packages and prepares `packages/api/dist` for Vercel.
  - Copies built outputs into `packages/api/dist/lib/` to keep the API bundle self-contained for Vercel.
  - Swaps `packages/api/package.json` with `package.vercel.json` (backs up the original to `package.json.backup`).

- `scripts/deploy-vercel.sh` (main deploy helper)
  - Default behavior: runs the API build helper, then deploys API and Web Dashboard to Vercel using the CLI.
  - Options:
    - `--skip-api-build` — skip the API build step
    - `--api-project <slug>` — pass a Vercel project slug for the API deploy
    - `--web-project <slug>` — pass a Vercel project slug for the Web deploy
    - `--vercel-args '<extra args>'` — pass extra arguments to the vercel CLI
  - The script restores `packages/api/package.json` automatically if a backup exists.

- `scripts/git/push.sh`
  - Stages all changes, asks for (or accepts) a commit message, commits and pushes to `origin/main`.

  # scripts/README — VPN Enterprise

  This document explains the helper scripts in `./scripts/` and the recommended local and CI workflows so you (or any teammate) can pick the project back up later and know exactly how to build and deploy it.

  ## Summary (quick commands)
  - One-command interactive push + deploy (recommended):
    - `./scripts/auto-deploy.sh`
  - Non-interactive push + deploy with message:
    - `./scripts/auto-deploy.sh "My release: fix X"`
  - Deploy only (no commit):
    - `./scripts/deploy-vercel.sh --skip-api-build`
  - Makefile short-hands (repo root):
    - `make deploy` # runs `./scripts/deploy-vercel.sh`
    - `make deploy-skip-api`
    - `make auto-deploy`

  ## Prerequisites
  - Node.js & npm (v16+/v18+ recommended)
  - Git with a remote named `origin` and permission to push to `main`
  - Optional: Docker (only if you intend to use the Docker deployment scripts)
  - Optional: Vercel CLI for local testing: `npm i -g vercel` or use `npx vercel`

  ## Why these scripts exist

  The repo is a monorepo (apps/ + packages/). Deploying to Vercel or running production-like builds requires: building TypeScript packages, producing a self-contained `packages/api/dist` for the serverless target, and calling Vercel from the appropriate subdirectory. The scripts automate these steps so you don't need to remember the exact sequence later.

  ## What changed recently (useful when you come back)
  - A repo `Makefile` with common targets: `build`, `deploy`, `deploy-skip-api`, `auto-deploy`, `push` (call `make` from repository root).
  - Two shell aliases appended to `~/.bashrc` (if not already present):
    - `deploy-vc` → `/home/$(whoami)/vpn-enterprise/scripts/deploy-vercel.sh`
    - `auto-deploy` → `/home/$(whoami)/vpn-enterprise/scripts/auto-deploy.sh`
      (If you prefer not to modify your shell config, remove those lines from `~/.bashrc`.)

  ## Important scripts (what they do)
  - `scripts/build-api-vercel.sh`
    - Builds relevant workspace packages and prepares `packages/api/dist` for Vercel.
    - It may copy built outputs into `packages/api/dist/lib/` and temporarily swap `packages/api/package.json` with `package.vercel.json` to shape the bundle for Vercel.

  - `scripts/deploy-vercel.sh` (main deploy helper)
    - Default: runs the API build helper then deploys API and Web Dashboard to Vercel using the CLI.
    - Options:
      - `--skip-api-build` — skip the API build step
      - `--api-project <slug>` — pass a Vercel project slug for the API deploy
      - `--web-project <slug>` — pass a Vercel project slug for the Web deploy
      - `--vercel-args '<extra args>'` — pass additional args to `vercel`
    - Behavior: restores `packages/api/package.json` automatically if a backup exists.

  - `scripts/git/push.sh`
    - Stages all changes, prompts for (or accepts) a commit message, commits and pushes to `origin/main`.
    - If there is nothing to commit it will notify and skip the push.

  - `scripts/auto-deploy.sh`
    - Orchestrator: runs `git/push.sh` then `deploy-vercel.sh` and forwards extra flags.

  - For older Docker deployment scripts, see `scripts/archive/deployment/`.

  ## Local developer flows (recommended)
  1. Work & test locally (run the servers you need, run unit tests for packages you changed).

  2. When ready, either:
  - Interactive push + deploy (recommended):

    ```bash
    ./scripts/auto-deploy.sh
    ```

  - Non-interactive push + deploy with message (convenient in CI or scripted releases):

    ```bash
    ./scripts/auto-deploy.sh "Release: fix X" --skip-api-build
    ```

  - Deploy only (no commit) if you want to quickly test the built artifacts:

    ```bash
    ./scripts/deploy-vercel.sh --skip-api-build
    ```

  ## Notes about the API build
  - The API is TypeScript. Before Vercel deploys the bridge requires compiled JS under `packages/api/dist`. `build-api-vercel.sh` runs `tsc` for the API and ensures the dist is packaged for Vercel.
  - If a `package.json.backup` appears under `packages/api`, it means the build helper swapped `package.json` during packaging. `deploy-vercel.sh` tries to restore it; to restore manually:

  ```bash
  mv packages/api/package.json.backup packages/api/package.json
  ```

  ## CI: GitHub Actions
  - There is a `.github/workflows/deploy.yml` workflow that runs on pushes to `main` and uses a `VERCEL_TOKEN` secret to call the Vercel CLI.
  - The workflow has an early-check step that fails clearly if the secret is missing (this prevents confusing CI runs).

  ## Managing Vercel tokens & repository secrets
  - Create a token in the Vercel dashboard: https://vercel.com/account/tokens — copy it (shown only once).
  - Add it to GitHub Repository Secrets (Settings → Secrets and variables → Actions) with the name `VERCEL_TOKEN`.
  - Never paste tokens into chat or code — if you ever accidentally expose a token, revoke it immediately via Vercel and create a new one.

  ## Local verification using a token (optional, for testing only)

  ```bash
  export VERCEL_TOKEN="<token>"
  npx vercel --prod --confirm --cwd packages/api --token "$VERCEL_TOKEN"
  npx vercel --prod --confirm --cwd apps/web-dashboard --token "$VERCEL_TOKEN"
  ```

  ## Authentication / session notes (where to look)
  - The API's Express app lives at `packages/api/src/app.ts` and contains routes for session refresh and logout (e.g. `/api/v1/auth/refresh`, `/api/v1/auth/logout`).
  - The client fetch wrapper that performs a silent refresh lives at `apps/web-dashboard/lib/api.ts`. If you change auth flow, update both client and server.

  ## Troubleshooting & verification checklist (when you return later)
  1. Local build sanity
     - `make build` or run `npm run build` in `packages/api` — ensure `packages/api/dist` appears.
  2. Verify API bridge for Vercel
     - Check `packages/api/api/index.js` exists and requires `../dist/index.js`.
  3. Run deploy script and capture URLs
     - `./scripts/deploy-vercel.sh` prints the Vercel inspect/production URLs. Save them for later.
  4. If something goes wrong with package.json swap
     - Restore the backup: `mv packages/api/package.json.backup packages/api/package.json` and re-run build.
  5. Check Vercel logs for runtime errors
     - Use the Vercel dashboard Links (`Inspect`) from the deploy output or `vercel logs <deploymentId>`.
  6. Session/auth issues
     - If clients start getting 401s, test `/api/v1/auth/refresh` manually and check cookies (httpOnly refresh cookie must be present).

  ## Quick commands (copy/paste)

  ```bash
  # Makefile targets
  make deploy
  make deploy-skip-api
  make auto-deploy

  # One-command interactive push + deploy
  ./scripts/auto-deploy.sh

  # Non-interactive push + deploy with message
  ./scripts/auto-deploy.sh "Release: small fix" --skip-api-build

  # Deploy only (no commit)
  ./scripts/deploy-vercel.sh --skip-api-build

  # Push only
  ./scripts/git/push.sh
  ./scripts/git/push.sh "My commit message"

  # Restore API package.json if needed
  mv packages/api/package.json.backup packages/api/package.json
  ```

  ## Safety, rollback & housekeeping
  - Revoke and rotate any token you think may be compromised.
  - For rollbacks: in Vercel dashboard you can restore a previous deployment. For code rollbacks, revert the commit and re-run `./scripts/auto-deploy.sh`.

  ## Where to look (quick repo map)
  - API entry: `packages/api/src/app.ts` (Express app)
  - API Vercel bridge: `packages/api/api/index.js`
  - API build helper: `scripts/build-api-vercel.sh`
  - Deploy helper: `scripts/deploy-vercel.sh`
  - Git helper: `scripts/git/push.sh`
  - Orchestrator: `scripts/auto-deploy.sh`
  - Web client fetch wrapper (silent refresh): `apps/web-dashboard/lib/api.ts`

  If you prefer I can also:
  - Add an optional small test script to verify the silent-refresh flow end-to-end locally.
  - Add a small health-check script that pings the deployed API and returns a concise status.

  ## Contact & notes
  - Do NOT paste tokens or secrets into PRs or chat logs. Use GitHub Secrets. If you accidentally paste a token, revoke it and rotate immediately.
  - If you want I can add a tiny `scripts/verify-deploy.sh` that checks the production URLs and returns a quick pass/fail status.

  ***

  End of scripts/README
