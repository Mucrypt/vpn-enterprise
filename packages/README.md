# packages — VPN Enterprise (monorepo packages)

This file explains the purpose of each package in the `packages/` folder, how to build and test packages, and enterprise-grade maintenance and onboarding guidance so you (or future teammates) can pick this project up quickly.

Why this README exists

- This is an enterprise-level monorepo. Over time the number of packages and responsibilities will grow. This document is a single, persistent reference for package owners, CI, and maintainers.

Quick map (what's in `packages/` today)

- `api/` — TypeScript Express API used for local development and compiled for serverless (Vercel). Key files:
  - `src/app.ts` — Express app (routes, middleware) exported for dev and serverless deployments.
  - `src/index.ts` — dev entry that listens when run directly.
  - `api/index.js` — Vercel bridge (requires `../dist/index.js` for production deployments).
  - `package.json`, `package.vercel.json`, `vercel.json`, `prepare-vercel.sh`, `.vercelignore`, `.env`.

- `auth/` — Authentication helpers and service wrappers.
  - `src/auth-service.ts` — authentication wrapper (session handling, refresh, signIn flows).
  - `src/middleware.ts` — express/route middleware helpers for authentication.

- `database/` — DB client, repositories and supporting SQL migration/schema files.
  - `src/` includes database client and repository layers (connections, subscriptions, servers, etc.).
  - SQL files live at the package root (schema files, triggers and helpers).

- `billing/` — billing-related code (may contain integrations or billing-domain logic).

- `shared/` — shared utilities and types used across packages & apps.

- `vpn-core/` — core VPN logic, server management, wireguard helpers, and native client generator.

Note: package list above is intentionally brief — use the per-package folder README (or the package `package.json`/`src` files) for implementation details.

Common developer commands (run from repo root)

```bash
# Build all packages (fast path)
make build

# Build a single package (example)
cd packages/api && npm install && npm run build

# Run tests for a package (if tests exist)
cd packages/database && npm test

# Lint + typecheck across repo (if configured at root)
npm run lint
npm run -w @vpn-enterprise/api tsc --noEmit
```

Package-specific notes

- packages/api
  - Build: `cd packages/api && npm install && npm run build` — this produces `packages/api/dist`.
  - Vercel: `scripts/build-api-vercel.sh` prepares a self-contained dist and (if needed) swaps `packages/api/package.json` for `package.vercel.json` to shape the bundle for Vercel.
  - Dev: `cd packages/api && npm run dev` (or use the top-level dev scripts) — `src/index.ts` will start an HTTP server in non-serverless mode.

- packages/auth
  - Exposes an `AuthService` used by the API and possibly other packages. Check `src/auth-service.ts` when updating auth behavior (session refresh, token rotation).

- packages/database
  - Contains DB schemas and repositories. SQL files are authoritative for schema changes — keep migrations and schema files in sync and review RLS/trigger changes carefully.

- packages/vpn-core
  - Contains core logic that other packages rely on. Be conservative about breaking changes and follow semver for releases.

Enterprise-grade maintenance & conventions

1) Versioning & releases
   - Prefer semantic versioning for packages that are published or consumed externally.
   - Use CHANGELOGs for package-level breaking changes.

2) Tests & CI
   - Each package that contains logic should have unit tests. Add package-level test scripts in the package `package.json`.
   - CI should run `make build`, `npm test` for changed packages, and `npm run lint`.

3) Security & secrets
   - Do never commit production secrets. Use environment variables and store tokens in CI secrets.
   - If a token is leaked, rotate and revoke immediately and update the repo secret.

4) Code ownership & reviews
   - Add CODEOWNERS for critical packages (e.g., `packages/api`, `packages/database`) so changes require review by owners.

5) API contracts & docs
   - Maintain API docs (OpenAPI or internal markdown) if the API becomes a stable contract for external consumers.

6) Database migrations
   - Treat SQL scripts as source-of-truth. Use a migration system or document manual steps clearly in the package.

Onboarding checklist (when someone returns after a break)

1) Environment
   - Ensure Node.js and npm are installed (recommended versions are in `package.json` engines or repo README).
   - Confirm you have access to required Git remotes and CI secrets.
2) Local build
   - `make build` — builds packages including `packages/api/dist`.
3) Run locally
   - Start the API dev server (`cd packages/api && npm run dev`), start the web dashboard with `pnpm/ npm/ yarn dev` (see `apps/web-dashboard` README).
4) Run tests
   - Run package tests and linting: `npm test` / `npm run lint`.
5) Deploy (if necessary)
   - Use `./scripts/deploy-vercel.sh` or `./scripts/auto-deploy.sh` from the repository root.

Suggested next improvements (scalable as project grows)

- Add per-package README.md files describing public API, usage examples, and owners.
- Add package-level unit tests and a test coverage gate in CI.
- Implement a migration tool (Flyway, Sqitch, or a Node-based migrator) if schema changes become frequent.
- Add semantic-release or release automation for packages that are published.

Where to look for live code

- API main app: `packages/api/src/app.ts`
- API dev entrypoint: `packages/api/src/index.ts`
- Vercel bridge: `packages/api/api/index.js`
- Auth service: `packages/auth/src/auth-service.ts`
- DB repositories: `packages/database/src/repositories/*`
- VPN core: `packages/vpn-core/src/*`

If you'd like, I can:

- Add per-package `README.md` files (one file per package) with owner, public exports, and examples. This scales well for large teams.
- Add a small `scripts/verify-packages.sh` that runs build/test for each package and prints a concise status report.

---

End of packages/README
