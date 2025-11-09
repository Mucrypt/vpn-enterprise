<!-- .github/copilot-instructions.md - guidance for AI coding agents working on this repo -->
# VPN Enterprise — Copilot instructions

This file contains concise, actionable guidance for AI coding assistants working in this monorepo. Keep suggestions minimal, explicit, and repository-aware.

1) Big picture (what to know first)
- Monorepo (npm workspaces) with three main areas: `packages/` (shared libs & API), `apps/` (web-dashboard Next.js + mobile Expo), and `infrastructure/` (Docker, nginx, monitoring).
- Primary runtime components:
  - API: `packages/api` (Express, TypeScript). Entry: `packages/api/src/index.ts` and routes in `packages/api/src/app.ts`.
  - Web: `apps/web-dashboard` (Next.js 16, React 19). Development: `npm run dev` in that folder.
  - Mobile: `apps/mobile-app` (Expo). Start with `npx expo start`.
  - Database: Supabase (Postgres) — check `packages/database` and docs under `docs/` and `extra-docs/` for schema.

2) How to run & common workflows (exact commands)
- Install all workspaces from repo root:
  - `npm install` (root uses npm workspaces)
- Run services locally (without Docker):
  - API (dev): `cd packages/api && npm run dev` (nodemon -> ts-node)
  - Web: `cd apps/web-dashboard && npm run dev` (Next dev server)
  - Mobile: `cd apps/mobile-app && npx expo start`
- Docker-based local stack (recommended to mirror infra):
  - `cd infrastructure/docker && docker compose -f docker-compose.dev.yml up --build`
- Health endpoint (quick check): `GET /health` on the API (default port 3000).

3) Where to make code changes (patterns & examples)
- Add or modify API routes: edit `packages/api/src/app.ts`. Follow existing route patterns (auth endpoints, protected routes use `authMiddleware`). Example: new user endpoint -> `app.get('/api/v1/...', authMiddleware, async (req,res)=>{...})`.
- Shared logic & types: put reusable code in `packages/shared` or create a new package under `packages/` and link via workspaces. Packages are referenced with `file:../<pkg>` in package.json.
- Database access: use repository classes under `packages/database` (Repository pattern). Prefer those over raw SQL edits unless schema changes are required.

4) Auth, sessions, and cookies (important behaviour)
- Auth flows are built on `@vpn-enterprise/auth` and Supabase. The API sets refresh tokens as httpOnly cookies in `packages/api/src/app.ts`. Keep refresh-token handling server-side only.
- Never expose the Supabase `service_role` key to client code. If adding env variables, follow `.env.example` usage and set them only in server-side envs (Vercel secret / Docker secrets).

5) Build & deployment notes
- Build API for production: `cd packages/api && npm run build && npm start` (build uses `tsc`).
- Web is deployed to Vercel in docs/DEPLOYMENT_GUIDE.md — environment variables must use `NEXT_PUBLIC_` prefixes for client-accessible keys. See `docs/DEPLOYMENT_GUIDE.md` for Vercel commands and required env vars.
- Infra uses `infrastructure/docker/docker-compose*.yml`. Dev compose: `docker compose -f docker-compose.dev.yml up --build` (from `infrastructure/docker`).
- CI/CD: repository contains scripts in `scripts/` (e.g., `deploy-vercel.sh`, `build-api-vercel.sh`) — prefer using those for consistent deployments.

6) Project-specific conventions and gotchas
- Monorepo package linking: several packages are referenced with `file:` deps (e.g. `@vpn-enterprise/auth` in `packages/api/package.json`). After changing a package, re-run `npm install` at root or `npm run build` in the changed package if it is compiled.
- React overrides: root `package.json` forces React 19 via `overrides`. Avoid proposing a different React version unless the change is cross-checked with `apps/*/package.json` and tested.
- Keys at repo root: `server_private.key` and `server_public.key` exist — treat as sensitive. Do not recommend committing new private keys; prefer generating and mounting keys via infrastructure or secrets manager.
- Environment loading: `packages/api/src/app.ts` loads `.env` from the repo root path; modifying env usage requires updating that path or the Docker env injection.

7) Logs, debugging and troubleshooting
- API: use `npm run dev` (nodemon) for fast iteration. Check runtime logs printed by `packages/api` and the `/health` endpoint. For production, check `docker compose logs -f <service>` under `infrastructure/docker`.
- Nginx reverse proxy: configs live in `infrastructure/docker/nginx/conf.d/`. For 502s, first verify the upstream service is running.

8) Files & directories to consult first (quick links)
- API entry and routes: `packages/api/src/index.ts`, `packages/api/src/app.ts`
- Web app: `apps/web-dashboard` (Next config, app/ or src/ folder)
- Mobile app: `apps/mobile-app` (Expo `app/`)
- Infra + compose: `infrastructure/docker/docker-compose.dev.yml`, `infrastructure/docker/docker-compose.yml`, `infrastructure/docker/Dockerfile.api`
- Docs & deployment: `docs/DEPLOYMENT_GUIDE.md`, `infrastructure/README.md`, `README.md` (root)

9) Safety & repository rules for automated edits
- Never commit secrets or private keys. If a change requires credentials, instruct the human to add them to the environment or secrets manager and note the exact var names (use `.env.example` as the template).
- Avoid broad, repo-wide refactors without an explicit human request. Prefer small, focused edits with tests or manual verification steps.

10) If you add or change public API surface
- Update the OpenAPI or API docs (if present) and the `docs/` folder. Add or update the health checks in `infrastructure/verify-stack.sh` (or propose one if missing) and include manual test steps.

---
If anything above is unclear or you want me to include sample code snippets (e.g. how to add a new API endpoint or how to run the full Docker dev stack), tell me which area and I will add concrete examples. 
