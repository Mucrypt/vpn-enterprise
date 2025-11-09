# Scripts — VPN Enterprise

This folder contains helper scripts used for building, deploying and managing the project.

Prerequisites
- Node.js & npm
- Docker (for local docker-based deploys)
- Vercel CLI (`npm i -g vercel`) or use `npx vercel`.
- A GitHub remote named `origin` and permission to push to the `main` branch.

Environment variables
- `VERCEL_TOKEN` (optional) — provide to the vercel CLI in CI to run non-interactive deploys.
- `.env` — project environment file used by many scripts (see `quick-start.sh`).

Key scripts

- `scripts/build-api-vercel.sh` — Prepares `packages/api/dist` for Vercel by building workspace packages and copying compiled output into `packages/api/dist/lib/`. Also swaps to the Vercel-friendly `package.vercel.json` during deploy prep (it creates a backup). Run this before deploying the API if you want the compiled `dist` to be used by Vercel.

- `scripts/deploy-vercel.sh` — Unified Vercel deploy helper. It runs `scripts/build-api-vercel.sh` (unless you pass `--skip-api-build`), then deploys the API and Web Dashboard with the `vercel` CLI using `--prod --yes`.

- `scripts/git/push.sh "commit message"` — Stages, commits, and pushes all changes to `origin/main`. Use a descriptive commit message. It will skip push if there are no changes.

- `scripts/auto-deploy.sh "commit message"` — Orchestrator: runs the push helper then runs `deploy-vercel.sh`. Useful for simple one-command releases from your workstation.

- `scripts/deploy-all.sh` — (Existing) Another helper that directly runs `vercel --prod` for the API and Dashboard. It assumes the projects are already configured with the expected slugs.

- `scripts/deployment/*` — Docker-based build, deploy, health-check and rollback scripts for on-prem or server deployments (not required for Vercel-hosted services). Useful for staging or local self-hosted environments.

Typical workflows

1) Quick local deploy to Vercel (build API for Vercel, then deploy both):

```bash
# from repo root
./scripts/deploy-vercel.sh
```

2) Skip rebuilding API (if you already prepared `packages/api/dist`):

```bash
./scripts/deploy-vercel.sh --skip-api-build
```

3) Commit changes and auto-deploy (convenience):

```bash
./scripts/auto-deploy.sh "My release: fix X and Y"
```

4) Only push to GitHub (no deploy):

```bash
./scripts/git/push.sh "WIP: my changes"
```

CI / Automation recommendations

- Use `VERCEL_TOKEN` in your CI secrets and call `npx vercel --prod --confirm` to deploy from CI. Example GitHub Actions job:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Node
        uses: actions/setup-node@v4
        with:
          node-version: 18
      - name: Build API for Vercel
        run: bash ./scripts/build-api-vercel.sh
      - name: Deploy API to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: npx vercel --prod --confirm --cwd packages/api
      - name: Deploy Web to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: npx vercel --prod --confirm --cwd apps/web-dashboard
```

Notes & safety
- The scripts make some assumptions about repo layout and configured Vercel project slugs. Verify the slugs in your Vercel dashboard match the URLs referenced in the messages.
- `build-api-vercel.sh` will swap `package.json` for `package.vercel.json` by backing up the original — remember to restore if you need the original locally. The script prints instructions.
- For production secrets and tokens, use your CI provider's secrets store (GitHub Actions secrets) — never hard-code tokens.

If you want, I can:
- Add a GitHub Actions workflow file under `.github/workflows/deploy.yml` that runs the CI snippet above.
- Make the API build script restore `package.json` automatically after the vercel deploy completes to avoid manual restoration steps.

— End of scripts/README
