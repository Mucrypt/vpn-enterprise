<!-- .github/copilot-instructions.md - guidance for AI coding agents working on this repo -->
# VPN Enterprise — Copilot instructions

Concise, repo-aware guidance for AI coding agents working in this monorepo. Focus on small, targeted edits in packages and follow workspace conventions.

## Big picture (what to read first)
- Monorepo using npm workspaces. Top-level areas:
  - `packages/` — shared libraries and backend API (Express + TypeScript).
  - `apps/` — frontend apps: `web-dashboard` (Next.js) and `mobile-app` (Expo).
  - `infrastructure/` — docker-compose, Dockerfiles, nginx config, monitoring.

## Key runtime components & entry points
- API: `packages/api`. Primary files:
  - `packages/api/src/app.ts` — routes, middleware, auth wiring.
  - `packages/api/src/index.ts` — server bootstrap for local runs.
  - `packages/api/api/index.js` — small Vercel bridge: prefers `dist` compiled bundle, falls back to `src` via ts-node.
- Web: `apps/web-dashboard` — app code under `app/` and `components/`.
- Mobile: `apps/mobile-app` — Expo project under `app/` and `src/`.

## Exact dev workflows (use these commands)
- Install/update workspace deps (run from repo root):
  - npm install
- Run locally (no Docker):
  - API (dev): cd packages/api && npm run dev
  - Web: cd apps/web-dashboard && npm run dev
  - Mobile: cd apps/mobile-app && npx expo start
- Full stack with Docker (mirrors infra):
  - cd infrastructure/docker && docker compose -f docker-compose.dev.yml up --build

## Where to change code (practical patterns)
- API routes & auth: edit `packages/api/src/app.ts`. Protected routes use `authMiddleware` from `packages/auth`.
- Shared logic: add a package under `packages/` and reference via workspace `file:` dependency. After edits, run `npm install` at repo root so workspaces resolve.
- Database: prefer repository classes in `packages/database/src/repositories/*` instead of ad-hoc SQL in app code. Migration SQL is in `extra-docs/`.

## Vercel & build notes (important)
- Vercel entry uses `packages/api/api/index.js` which loads `dist/index.js` if present, otherwise tries the TS source via ts-node. For production builds prefer creating `dist` with `npm run build` in `packages/api`.
- Web app uses Next.js; see `apps/web-dashboard/next.config.ts` and `vercel.json` for deployment behavior.

## Conventions & gotchas
- Keep edits package-scoped; avoid repo-wide refactors.
- Env files: `packages/api` expects `.env` values available (root `.env` is used in many flows). Don't change env-loading without verifying Docker and Vercel scripts.
- Secrets: `server_private.key` and `server_public.key` exist at repo root. Never commit new secrets; use CI/Docker secrets and `.env` for local dev.
- React version: repository pins React 19 via root package.json overrides — check `apps/*/package.json` before suggesting version changes.

## Quick checklist for common tasks
- Add API route: edit `packages/api/src/app.ts` -> add handler -> wire auth via `authMiddleware` -> add tests under `packages/api` or `apps/web-dashboard/e2e` as appropriate -> run `cd packages/api && npm run dev` and smoke test `GET /health`.
- Build API for prod: cd packages/api && npm run build && npm start (ensure `dist` exists so Vercel bridge uses it).

## Files to consult (starter map)
- `packages/api/src/app.ts`, `packages/api/src/index.ts`, `packages/api/api/index.js`
- `packages/auth/src/*` for middleware and auth flows
- `packages/database/src/repositories/` for DB access patterns
- `apps/web-dashboard/app` and `apps/web-dashboard/components` for UI patterns
- `infrastructure/docker/docker-compose.dev.yml` and Dockerfiles for local stack

## Safety & edit rules
- Do not commit secrets. When a change requires credentials, list exact env var names and ask the human to add them to the secret manager.
- Prefer targeted edits and include tests or a short verification step. After changes, run `npm install` at the repo root to refresh workspace links.

If you'd like I can also add a short "how to add an API route" checklist as a follow-up or create a tiny template PR that adds a sample route + test. Tell me which you prefer.
