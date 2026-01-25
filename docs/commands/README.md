# VPN Enterprise — Commands & use-cases

This is a practical command reference for day-to-day work (local dev, Vercel, and Hetzner production).

## How to run npm commands

- Run from repo root.
- Pass extra args with `--`.
  - Example: `npm run hetzner:deploy -- --pull --build`

## Local development (Docker)

- `npm run dev`
  - Starts the dev compose stack and tails logs.
  - Use when you’re actively coding API/Web.

- `npm run dev:stop`
  - Stops the dev compose stack.

- `npm run dev:all`
  - Starts the “everything” dev stack (includes monitoring/extra services).

- `npm run compose:dev:up`
  - Brings up dev compose without tailing logs (useful for background).

- `npm run compose:dev:down`
  - Brings down dev compose.

## Database tooling

- `npm run db:dev`
  - Starts local PostgreSQL + admin tools for development.

- `npm run db:platform`
  - Starts the database platform stack (SQL editor + API + pgAdmin).

- `npm run db:platform:stop`
  - Stops the database platform stack.

## Secrets / env

- `npm run secrets:setup`
  - Creates/updates files in `infrastructure/docker/secrets/`.
  - Run this on the Hetzner server before first production deploy.

## Hetzner production (single server)

These are intended to run _on the Hetzner host_ inside the cloned repo directory.

If you don’t want Node.js/npm on the server, run the underlying bash scripts directly (e.g. `bash ./scripts/hetzner/deploy-prod.sh --pull --build`).

- `npm run hetzner:env`
  - Creates/edits `.env.production` from `.env.production.example`.

- `npm run hetzner:deploy -- --pull --build`
  - Pulls latest `main` and deploys the production compose stack.

- `npm run hetzner:status`
  - Shows production container status + recent nginx logs.

- `npm run hetzner:logs -- <service>`
  - Tails logs for a single service.
  - Example: `npm run hetzner:logs -- api`

## Go Live Checklist

Use this once when going from “it works locally” → “public production”.

### 1) Domain + DNS (Hostinger)

- Decide your domains:
  - Web: `https://example.com`
  - API: `https://api.example.com`
  - Optional: `n8n.example.com`, `ollama.example.com`, `python-api.example.com`
- In Hostinger DNS, create `A` records pointing to your Hetzner server IP:
  - `@` → `<HETZNER_SERVER_IP>`
  - `www` → `<HETZNER_SERVER_IP>`
  - `api` → `<HETZNER_SERVER_IP>`
  - `n8n` → `<HETZNER_SERVER_IP>` (if using n8n)
  - `ollama` → `<HETZNER_SERVER_IP>` (if exposing ollama)
  - `python-api` → `<HETZNER_SERVER_IP>` (if exposing python api)

### 2) Hetzner host prerequisites

- Server firewall/security group:
  - Allow inbound: `22/tcp` (or your SSH port), `80/tcp`, `443/tcp`
  - Block everything else publicly (internal services stay inside Docker network)
- Install Docker + Compose v2 on the server.
- Clone the repo on the server (recommended path): `/opt/vpn-enterprise`.
- Confirm nginx cert paths exist (nginx expects):
  - `infrastructure/docker/nginx/ssl/fullchain.pem`
  - `infrastructure/docker/nginx/ssl/privkey.pem`

### 3) Production env + secrets (on the Hetzner host)

- Create production env file:
  - `npm run hetzner:env`
  - Update `ALLOWED_ORIGINS` to match your real domains.
  - Set `N8N_BASIC_AUTH_USER` / `N8N_BASIC_AUTH_PASSWORD`.
- Create production secret files:
  - `npm run secrets:setup`

### 4) First production deploy (on the Hetzner host)

- Deploy stack:
  - `npm run hetzner:deploy -- --pull --build`
- Check status:
  - `npm run hetzner:status`

### 5) GitHub Actions deploy (recommended path)

- Add GitHub repo secrets for the Hetzner deploy workflow:
  - `HETZNER_HOST`, `HETZNER_USER`, `HETZNER_SSH_PRIVATE_KEY`
  - `ENV_PRODUCTION`, `SECRET_DB_PASSWORD`, `SECRET_REDIS_PASSWORD`, `SECRET_N8N_ENCRYPTION_KEY`, `SECRET_API_KEY`
- Push to `main`:
  - `npm run release:hetzner "Release: go live"`
- Verify Actions ran:
  - Workflow “CI” must succeed
  - Workflow “Deploy to Hetzner (Docker Compose)” must succeed

### 6) Smoke checks (from your laptop)

- Web loads:
  - `curl -fsS https://example.com/ >/dev/null && echo OK`
- API health:
  - `curl -fsS https://api.example.com/health && echo`
  - If you’re routing API via the same domain: `curl -fsS https://example.com/api/health && echo`
- n8n (if enabled):
  - `curl -I https://n8n.example.com/`

### 7) Post-go-live basics

- Confirm you can sign up/login in the dashboard.
- Confirm the database editor pages load and can list tenants/tables.
- Save these operational commands:
  - `npm run hetzner:logs -- nginx`
  - `npm run hetzner:logs -- api`
  - `npm run hetzner:status`

## Release flow (recommended)

- `npm run release:hetzner "Release: message"`
  - Commits + pushes to `main`.
  - GitHub Actions then runs CI and deploys to Hetzner.

## Vercel (legacy)

If you still need Vercel deploys locally:

- `npm run vercel:auto "Release: message"`
  - Commits + pushes then deploys via Vercel CLI.

- `npm run vercel:deploy -- --skip-api-build`
  - Deploy only (no git commit).

## Lint/build helpers

- `npm run lint:api` / `npm run build:api`
- `npm run lint:web` / `npm run build:web`

## Utility

- `npm run generate-client-cli -- <clientName> [--out /tmp/wgtest] [--publicIP x.x.x.x] [--port 51820] [--iface wg0] [--qr]`
  - Generates a test WireGuard client config using `@vpn-enterprise/vpn-core`.
  - Requires vpn-core to be built first: `npm run build --workspace=@vpn-enterprise/vpn-core`
