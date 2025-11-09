
<!--
	apps/web-dashboard/README.md
	Enterprise-grade README for the Web Dashboard (Next.js App Router)
	Purpose: onboarding, dev, build, deploy, observability, and maintenance guidance.
-->

# Web Dashboard — VPN Enterprise

The Web Dashboard is a Next.js (App Router) application that provides the administrative UI for VPN Enterprise. This README is written for an enterprise project: it focuses on reproducible local development, CI/CD, secure deployment, observability, and operational runbooks so future maintainers and large teams can work confidently.

Table of contents

- Quick start
- Development
- Environment & secrets
- Builds & production packaging
- Deployment (Vercel and Docker)
- CI recommendations
- Testing & quality gates
- Observability & logs
- Security notes
- Release & versioning
- Troubleshooting & common tasks
- File map & where to look
- Appendix: useful commands

## Quick start

Prerequisites

- Node.js 18+ (LTS recommended)
- npm or pnpm/yarn (this repo uses npm by default)
- Git
- (Optional) Vercel CLI: `npm i -g vercel` or `npx vercel`

Run the development server (from repo root recommended):

```bash
# start the whole monorepo dev flow (recommended):
# from repo root (monorepo-aware)
npm run dev --workspace=apps/web-dashboard

# or from inside the app
cd apps/web-dashboard
npm install
npm run dev
```

Open http://localhost:3000 (or the port printed in the terminal).

Note: In the monorepo we usually run the API locally as well (packages/api) so the dashboard talks to the local API (NEXT_PUBLIC_API_URL). See the Environment section below.

## Development

- Hot-reloading: Next's app router provides HMR while developing. Edit `app/` pages and components under `components/`.
- Local API integration: set `NEXT_PUBLIC_API_URL` to your local API (e.g. `http://localhost:3000`), or run the whole Docker dev compose to mirror the production reverse-proxy.
- Linting & formatting:

```bash
# lint the web dashboard (if configured in package.json)
npm run lint

# format with Prettier if available
npm run format
```

## Environment & secrets

This app relies on environment variables. There are two classes:

- Public (exposed to the browser) — prefix with `NEXT_PUBLIC_`.
- Private (server-only) — available to Next.js server components, API routes and runtime.

Common variables used in this repo (check `apps/web-dashboard/.env.local` and `apps/web-dashboard/.env.vercel`):

- NEXT_PUBLIC_API_URL — base URL of the API (e.g. `http://localhost:3000` or production API)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- VERCEL_ENV, NEXTAUTH_SECRET, other server-only secrets for production should be set in your deployment environment (Vercel/GCP/AWS) and never committed.

Add secrets to GitHub Actions as repository secrets (for CI deploys) and to Vercel as environment variables for production.

Security note: never put production credentials into `.env` under source control. Use `.env.local` for local development and add to `.gitignore` (already present).

## Builds & production packaging

This repository builds the Next.js app for production as part of the monorepo build. The common commands:

```bash
cd apps/web-dashboard
npm run build
npm run start   # runs the Next.js production server (if you want to self-host)
```

When deploying to Vercel you typically don't need to run `npm run build` locally; Vercel will build for you, but building locally helps diagnose bundling issues.

Important: When building in the monorepo, ensure workspace packages (packages/api, packages/auth, shared, vpn-core) are built if they are imported by the web dashboard server code.

## Deployment

Vercel (recommended for serverless Next.js)

1. Add the project to Vercel and link the Git repository.
2. Set the required environment variables in the Vercel dashboard (both Production and Preview): `NEXT_PUBLIC_API_URL`, Supabase keys, and any server secrets.
3. Use the CI/CD workflow or manual deploy. We have helper scripts in `scripts/`:

```bash
# from repo root
./scripts/deploy-vercel.sh         # build + deploy API and web
./scripts/auto-deploy.sh "msg" --skip-api-build
```

Docker / Self-hosted (infrastructure/docker)

- If you want to self-host, build the Docker image via the `infrastructure/docker/Dockerfile.web` and deploy it behind the reverse-proxy (nginx) defined in `infrastructure/docker/docker-compose.yml`.

Example (build and run locally):

```bash
docker build -t vpn-web-dashboard -f infrastructure/docker/Dockerfile.web ..
docker run -e NEXT_PUBLIC_API_URL=http://host.docker.internal:3000 -p 3001:3000 vpn-web-dashboard
```

Notes about hostnames: In the production compose, nginx proxies requests to the `web-dashboard` container and exposes it on standard HTTP/HTTPS.

## CI recommendations

- Use a pipeline that performs these gates:
	1. Install dependencies (monorepo-aware install, e.g., npm ci at root).
	2. Build affected packages (or `make build` which builds packages/api and web).
	3. Run tests and linters.
	4. Run `infrastructure/verify-stack.sh` against a disposable test environment if you bring up infra in CI.
	5. Deploy to staging/preview, run smoke tests, then promote to production.

Our repo includes a `scripts/` folder and GitHub Actions workflows as examples — adapt them to add approval gates and automatic rollbacks.

## Testing & quality gates

- Unit tests: add `npm test` entries per package. Prefer Jest or Vitest for React/Next.
- Integration tests: run against a staging deployment or bring up the Docker compose in CI and run tests against published ports.
- E2E tests: use Playwright or Cypress and run them against a preview deployment.

Example local test commands:

```bash
# run unit tests for the web-dashboard package
cd apps/web-dashboard
npm test
```

## Observability & logs

- Client errors: use Sentry or Datadog RUM to capture front-end errors and performance metrics.
- Server logs (Next.js server): surface server logs to your log aggregator (for Compose we ship logs with Promtail to Loki).
- Metrics: instrument critical paths with Prometheus metrics in the API and surface dashboards in Grafana. The monitoring stack is in `infrastructure/monitoring`.

## Security notes

- Content Security Policy: add a strict CSP in production via headers if your app loads third-party scripts.
- Authentication: the app uses Supabase + session tokens. Never store refresh tokens in localStorage; prefer httpOnly cookies for refresh flows.
- Secrets: rotate regularly and store in a secret manager.

## Release & versioning

- For UI-only changes you can deploy via Vercel previews. For releases involving API or core packages, bump package versions, run full repo build and smoke tests.
- Use semantic-release or a similar automated release tool for consistent changelogs and version bumps.

## Troubleshooting & common tasks

- Common issue: "Failed to fetch" in the browser — check `NEXT_PUBLIC_API_URL` and ensure the API is reachable. For local dev set it to `http://localhost:3000`.
- Modal overlay/layout broken in dev — the repo contains a dev-only overlay helper: ensure `data-env` is set to the correct value in `app/layout.tsx` if you see dev helper CSS.
- Health check: API health endpoint is `GET /health` (http://localhost:3000/health). Use `infrastructure/verify-stack.sh` to validate local infra.

Useful debug commands

```bash
# view web container logs (if using compose)
docker compose -f infrastructure/docker/docker-compose.yml logs -f web-dashboard

# check network connectivity from inside the web container
docker exec -it vpn-web-dashboard sh -c "apk add --no-cache curl >/dev/null 2>&1 || true; curl -v http://api:3000/health"
```

## File map & where to look

- `app/` — Next.js App Router routes and layouts (primary application code)
- `components/` — Reusable UI components
- `lib/` — shared client helpers (`lib/api.ts` is the fetch wrapper that handles refresh token retry logic)
- `hooks/` — custom hooks used across the app
- `public/` — static assets
- `next.config.ts` — Next.js configuration
- `vercel.json` — Vercel routing/headers (if used)

## Contribution & code ownership

- Add CODEOWNERS for `apps/web-dashboard` to require reviews from UI owners on PRs touching the dashboard.
- Follow the repo branching and PR conventions: small PRs, descriptive titles, link issues, run CI for tests/lint.

## Appendix: useful commands

```bash
# development
cd apps/web-dashboard
npm install
npm run dev

# build & run locally
npm run build
npm run start

# lint & tests
npm run lint
npm test

# deploy via scripts (repo root)
./scripts/deploy-vercel.sh --web-project <slug>
./scripts/auto-deploy.sh "Deploy web: ..." --skip-api-build

# infra verification
infrastructure/verify-stack.sh
```

---

If you'd like, I can next:

- Add a dedicated `apps/web-dashboard/CONTRIBUTING.md` with coding guidelines, component style rules, and testing templates.
- Add a Playwright test scaffold for E2E smoke tests that run on every preview deployment.

Tell me which follow-up you prefer and I'll implement it.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
