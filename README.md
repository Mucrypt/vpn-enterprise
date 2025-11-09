# 🔐 VPN Enterprise - Enterprise-Level VPN Service

A production-ready, enterprise-grade VPN service built with WireGuard, Node.js, Supabase, and Next.js. This platform provides the infrastructure for a NordVPN-like service with user management, subscription handling, and a beautiful dashboard.

## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Next.js Web   │◄────►│   Node.js API    │◄────►│    Supabase     │
│    Dashboard    │      │   (Express.js)   │      │   (PostgreSQL)  │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                 ▲
                                 │
                                 ▼
                         ┌──────────────────┐
                         │  WireGuard VPN   │
                         │     Servers      │
                         └──────────────────┘
```

## 📦 Project Structure

```
vpn-enterprise/
├── packages/
│   ├── api/              # REST API server (Express.js)
│   ├── auth/             # Authentication & authorization
│   ├── database/         # Supabase database layer
│   ├── vpn-core/         # VPN server management
│   ├── billing/          # Subscription & payment handling
│   └── shared/           # Shared utilities
├── apps/
│   └── web-dashboard/    # Next.js user dashboard
└── infrastructure/
    ├── docker/           # Docker configurations
    └── monitoring/       # Monitoring & logging
```

## ✨ Features

### Core Features
```markdown
# 🔐 VPN Enterprise — Enterprise-grade, monetizable VPN platform

VPN Enterprise is a production-ready platform that combines WireGuard, Node.js, Supabase, and Next.js to provide a commercial-grade VPN service. The project is designed to be deployed for customers (SaaS and on-prem), and includes the dashboard, API, database schema, and infrastructure automation needed to run a scalable, monetizable VPN offering.

Build status: experimental | License: ISC | Platform: Docker, Vercel, Supabase

Quick links
- Docs: ./docs/DEPLOYMENT_GUIDE.md and ./infrastructure/README.md
- Dev helpers: `./scripts/start-dev.sh`, `./scripts/stop-dev.sh`, `./infrastructure/verify-stack.sh`
- API entry: `packages/api/src/index.ts`

Why this project
- Real-world stack: WireGuard for performance and security, Supabase for auth & Postgres, Next.js for the dashboard.
- Designed for monetization: subscription tiers, billing integration points, and enterprise features baked into the data model.
- Developer-friendly: monorepo with npm workspaces, Docker compose for dev and prod, and helper scripts for fast iteration.

## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Next.js Web   │◄────►│   Node.js API    │◄────►│    Supabase     │
│    Dashboard    │      │   (Express.js)   │      │   (PostgreSQL)  │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                         ▲
                         │
                         ▼
                   ┌──────────────────┐
                   │  WireGuard VPN   │
                   │     Servers      │
                   └──────────────────┘
```

## 📦 Project Structure

```
vpn-enterprise/
├── packages/
│   ├── api/              # REST API server (Express.js)
│   ├── auth/             # Authentication & authorization
│   ├── database/         # Supabase database layer
│   ├── vpn-core/         # VPN server management
│   ├── billing/          # Subscription & payment handling
│   └── shared/           # Shared utilities
├── apps/
│   └── web-dashboard/    # Next.js user dashboard
└── infrastructure/
   ├── docker/           # Docker configurations
   └── monitoring/       # Monitoring & logging
```

## ✨ Features

### Core Features
- ✅ WireGuard integration for high-performance encrypted tunnels
- ✅ Supabase-based auth and user management
- ✅ Subscription management and billing hooks
- ✅ Multi-device support and device key management
- ✅ Server selection and load balancing utilities
- ✅ Connection tracking and usage analytics

### Database schema highlights
- `servers`, `user_subscriptions`, `user_devices`, `connection_logs`, `server_statistics`

## 🚀 Quick start (developer)

1) Clone and install

```bash
git clone <your-repo>
cd vpn-enterprise
npm install
```

2) Copy env template and edit required values

```bash
cp .env.example .env
# Edit .env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, etc.
```

3) Use the start helper for the development stack (recommended)

```bash
chmod +x ./scripts/start-dev.sh ./scripts/stop-dev.sh
./scripts/start-dev.sh
```

Dev endpoints
- API: http://localhost:3000
- Web (Next dev): http://localhost:3001

For a production-like deployment (nginx reverse-proxy + internal network), see `infrastructure/docker/docker-compose.yml` and `docs/DEPLOYMENT_GUIDE.md`.

## 💰 Monetization & Business model

This project is built to be monetized. The repo includes hooks and data models to support multiple revenue streams:

- Subscription tiers (Free, Basic, Premium, Enterprise) — billing integration points are provided under `packages/billing` and server-side checks live in `packages/api`.
- Enterprise plans — dedicated servers, higher SLAs, and priority support. Add-ons can include dedicated IPs, higher throughput allocations, and on-prem deployment options.
- Usage-based billing — connection logs and server statistics (stored in `connection_logs` and `server_statistics`) can feed per-GB or per-session billing.
- Marketplace partnerships — provide white-label or partner APIs to resellers.

Suggested pricing model (example)
- Free: limited data, 1 device — good for user acquisition
- Basic: $9/mo — 3 devices, unlimited data
- Premium: $15/mo — 5 devices, premium servers
- Enterprise: custom pricing — dedicated capacity, SLA, SSO and support

Operational notes for monetization
- Use Supabase RLS to enforce data access control and protect billing records.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only; never expose it to client code.
- Add audit logs and billing reconciliation (monthly jobs) to avoid disputes.

## � Development & contrib

Run tests

```bash
npm test
```

Build (monorepo)

```bash
npm run build
```

Start production server (example)

```bash
cd packages/api
npm run build
npm start
```

Developer helpers

- `./scripts/start-dev.sh` — bring up dev compose and tail logs
- `./scripts/stop-dev.sh` — stop dev compose and remove orphans
- `./infrastructure/verify-stack.sh` — quick health verification for API and web

Where to look
- API entry & routes: `packages/api/src/app.ts`, `packages/api/src/index.ts`
- Web app: `apps/web-dashboard`
- Infra: `infrastructure/docker/` (dev / prod compose & nginx)
- Docs & deployment guide: `docs/DEPLOYMENT_GUIDE.md`

## 🤝 Contributing

Contributions welcome. A few guidelines to keep the project healthy:

- Keep changes small and focused. For API changes, update `packages/api/src/app.ts` and add tests where appropriate.
- If you change a package, run `npm install` at repo root and `npm run build` for the changed package.
- Don't commit secrets. Use `.env.example` as the template. Local secrets should live in `.env` (already added to `.gitignore`).

See `CONTRIBUTING.md` in `apps/web-dashboard/` for frontend guidelines.

## 📧 Support & commercial contact

File issues on GitHub for bugs and feature requests. For commercial inquiries (partnerships, enterprise licensing, custom deployments), open an issue with the `business` label or contact the project owner listed in `.github/CODEOWNERS`.

---

Built with ambition — aiming to be the fastest, most secure, and most enterprise-ready VPN platform.
```
npm start
