# 📦 VPN Enterprise Packages

**Enterprise-grade monorepo packages for VPN platform business logic.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Monorepo](https://img.shields.io/badge/Monorepo-npm%20workspaces-orange.svg)](https://docs.npmjs.com/cli/v7/using-npm/workspaces)

> Modular, type-safe packages containing the core business logic for VPN Enterprise. Built as independent, reusable modules that can be imported by apps or deployed as microservices.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Package Structure](#package-structure)
- [Quick Start](#quick-start)
- [Core Packages](#core-packages)
- [Service Packages](#service-packages)
- [Utility Packages](#utility-packages)
- [Documentation](#documentation)
- [Development](#development)
- [Contributing](#contributing)

---

## Overview

The `packages/` directory contains the **core business logic** of VPN Enterprise organized as independent, reusable TypeScript modules using **npm workspaces**.

### Why Monorepo?

✅ **Code Reuse** - Share types, utilities, and business logic across services  
✅ **Type Safety** - TypeScript ensures cross-package compatibility  
✅ **Atomic Changes** - Update multiple packages in a single commit  
✅ **Unified Versioning** - All packages evolve together  
✅ **Simplified Dependencies** - No need to publish internal packages  
✅ **Better DX** - Single checkout, unified tooling  

### Architecture

```
┌─────────────────────────────────────────┐
│        Frontend Apps                     │
│  (web-dashboard, mobile-app)            │
└──────────────┬──────────────────────────┘
               │ Import packages
               ▼
┌─────────────────────────────────────────┐
│           API Package                    │
│  (Express server, REST endpoints)       │
└───┬──────────┬──────────┬───────────────┘
    │          │          │
    ▼          ▼          ▼
┌────────┐ ┌─────────┐ ┌──────────┐
│  Auth  │ │Database │ │ VPN-Core │
│        │ │         │ │          │
└───┬────┘ └────┬────┘ └─────┬────┘
    │           │            │
    └───────────┴────────────┘
                │
                ▼
         ┌──────────┐
         │  Shared  │
         │(Utils/Types)
         └──────────┘
```

---

## Package Structure

### Core Packages (Business Logic)

| Package | Purpose | Key Exports | Port |
|---------|---------|-------------|------|
| **api** | REST API server | Express app, routes | 3000 |
| **auth** | Authentication | AuthService, middleware | - |
| **database** | Data access | Repositories, types, client | - |
| **vpn-core** | VPN management | VPNServerManager, LoadBalancer | - |

### Service Packages (Microservices)

| Package | Purpose | Key Features | Port |
|---------|---------|--------------|------|
| **tenant-provisioner** | Tenant DB provisioning | Async job processing, resource limits | 4000 |
| **database-manager** | DB operations | Backups, metrics, monitoring | 4001 |
| **billing** | Payment processing | Stripe integration, subscriptions | - |

### Utility Packages (Shared Code)

| Package | Purpose | Key Exports |
|---------|---------|-------------|
| **shared** | Common utilities | Types, validators, logger, errors |
| **realtime** | WebSocket/subscriptions | PostgresSubscriptionEngine |
| **editor** | SQL editor UI | SQLEditor, QueryBuilder |

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm 8+
- TypeScript 5+

### Installation

```bash
# From repo root
npm install

# Installs all workspace dependencies
```

### Build All Packages

```bash
# Build all packages in dependency order
npm run build

# Or with make
make build
```

### Build Single Package

```bash
cd packages/api
npm run build

# Output in dist/
ls dist/
```

### Development Mode

```bash
# Auto-rebuild on changes
cd packages/api
npm run dev

# API running at http://localhost:3000
```

---

## Core Packages

### API (`packages/api/`)

**Purpose:** Main REST API server for VPN Enterprise

**Key Features:**
- Express.js with TypeScript
- JWT authentication
- Rate limiting
- CORS configuration
- Health checks
- Vercel serverless deployment

**Start Development:**
```bash
cd packages/api
npm run dev

# API: http://localhost:3000/health
```

**Environment Variables:**
```bash
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
JWT_SECRET=...
PORT=3000
```

**API Endpoints:**
```
GET  /health              # Health check
GET  /api/vpn/servers     # List VPN servers
POST /api/vpn/connect     # Connect to VPN
GET  /api/tenants         # List user tenants
POST /api/tenants         # Create tenant
GET  /api/admin/users     # Admin: list users (requires admin)
```

---

### Auth (`packages/auth/`)

**Purpose:** Authentication and authorization using Supabase Auth

**Key Features:**
- Supabase Auth integration
- JWT token verification
- Express middleware
- Role-based access control

**Usage:**
```typescript
import { authMiddleware, AuthRequest } from '@vpn-enterprise/auth';

// Protect route
app.get('/api/profile', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  // ...
});

// Admin-only route
app.get('/api/admin', adminMiddleware, async (req, res) => {
  // Only admins can access
});
```

---

### Database (`packages/database/`)

**Purpose:** Type-safe database client and repository pattern

**Key Features:**
- Supabase client (admin & user)
- Repository pattern for data access
- TypeScript types generated from schema
- SQL migrations
- PostgreSQL, MySQL, NoSQL managers

**Usage:**
```typescript
import { ServerRepository } from '@vpn-enterprise/database';

const serverRepo = new ServerRepository();

// Get user's servers
const servers = await serverRepo.getUserServers(userId);

// Create server
const server = await serverRepo.createServer({
  name: 'vpn-us-1',
  region: 'us-east',
  userId
});

// Update status
await serverRepo.updateStatus(serverId, 'active');
```

**Repositories:**
- `ServerRepository` - VPN servers
- `SubscriptionRepository` - User subscriptions
- `ConnectionRepository` - VPN connections
- `DeviceRepository` - User devices
- `AuditRepository` - Audit logs
- `HostingPlanRepository` - Database hosting plans

---

### VPN-Core (`packages/vpn-core/`)

**Purpose:** Core VPN server management and WireGuard operations

**Key Features:**
- VPN server lifecycle management
- WireGuard configuration
- Load balancing
- Connection tracking
- Native client config generation

**Usage:**
```typescript
import { 
  VPNServerManager, 
  ServerLoadBalancer 
} from '@vpn-enterprise/vpn-core';

const vpnManager = new VPNServerManager();

// Create server
const server = await vpnManager.createServer({
  name: 'vpn-us-1',
  region: 'us-east',
  port: 51820
});

// Load balancing
const loadBalancer = new ServerLoadBalancer();
const bestServer = loadBalancer.selectServer(servers, userRegion);

// Connect client
await vpnManager.connectClient(serverId, clientPublicKey, clientIp);
```

---

## Service Packages

### Tenant Provisioner (`packages/tenant-provisioner/`)

**Purpose:** Automated provisioning of isolated tenant databases

**How It Works:**
1. User requests database hosting
2. Job added to Redis/Bull queue
3. Provisioner creates isolated PostgreSQL database
4. Applies schema, security, resource limits
5. Returns connection string

**Resource Limits:**
```
Free Plan:    10 connections, 100MB storage
Pro Plan:     50 connections, 5GB storage  
Enterprise:   500 connections, 50GB storage
```

**Start Service:**
```bash
cd packages/tenant-provisioner
npm start

# Service: http://localhost:4000
```

---

### Database Manager (`packages/database-manager/`)

**Purpose:** Automated database operations and monitoring

**Features:**
- Automated backups (hourly, daily, weekly)
- Performance metrics collection
- Resource monitoring
- Slow query detection
- Automated cleanup

**Backup Schedule:**
```
Hourly:   Incremental backups
Daily:    Full backup at 2 AM
Weekly:   Table analysis and optimization
```

**Start Service:**
```bash
cd packages/database-manager
npm start

# Service: http://localhost:4001
```

---

## Utility Packages

### Shared (`packages/shared/`)

**Purpose:** Common utilities, types, and validators

**Exports:**
```typescript
import {
  logger,                # Winston logger
  ValidationError,       # Custom errors
  emailSchema,          # Zod validators
  formatDate            # Utility functions
} from '@vpn-enterprise/shared';
```

**Usage:**
```typescript
// Logging
logger.info('Server started', { port: 3000 });

// Validation
const validEmail = emailSchema.parse(email);

// Error handling
throw new ValidationError('Invalid input', 'email');
```

---

### Realtime (`packages/realtime/`)

**Purpose:** WebSocket connections and database subscriptions

**Features:**
- PostgreSQL LISTEN/NOTIFY
- Logical replication decoding
- WebSocket broadcast
- Real-time updates

**Usage:**
```typescript
import { PostgresSubscriptionEngine } from '@vpn-enterprise/realtime';

const engine = new PostgresSubscriptionEngine();
await engine.subscribe('connections', websocket);

// Clients receive real-time updates when data changes
```

---

### Editor (`packages/editor/`)

**Purpose:** SQL editor and query builder UI components

**Features:**
- Monaco-based SQL editor
- Syntax highlighting
- Auto-completion
- Visual query builder
- Query history

**Usage:**
```typescript
import { SQLEditor } from '@vpn-enterprise/editor';

<SQLEditor
  onExecute={handleExecute}
  defaultValue="SELECT * FROM users"
/>
```

---

## Documentation

### Complete Guides

📖 **[Packages Complete Guide](./PACKAGES_COMPLETE_GUIDE.md)**  
Comprehensive reference covering all packages, architecture, integration patterns, best practices, and troubleshooting. Start here for deep understanding.

⚡ **[Packages Quick Reference](./PACKAGES_QUICK_REFERENCE.md)**  
Daily operations cheat sheet with essential commands, import patterns, and quick fixes. Print this out!

### Related Documentation

- **Infrastructure:** [../infrastructure/README.md](../infrastructure/README.md)
- **Web Dashboard:** [../apps/web-dashboard/README.md](../apps/web-dashboard/README.md)
- **API Docs:** [./api/README.md](./api/README.md)

---

## Development

### Common Commands

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Build single package
cd packages/api && npm run build

# Run tests
npm test

# Run tests for single package
cd packages/api && npm test

# Development mode (auto-rebuild)
cd packages/api && npm run dev

# Clean build artifacts
npm run clean

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

### Package Import Pattern

```typescript
// Import from packages using workspace namespace
import { authMiddleware } from '@vpn-enterprise/auth';
import { ServerRepository } from '@vpn-enterprise/database';
import { VPNServerManager } from '@vpn-enterprise/vpn-core';
import { logger } from '@vpn-enterprise/shared';
```

### Adding New Package

```bash
# 1. Create package directory
mkdir packages/my-package
cd packages/my-package

# 2. Initialize
npm init -y

# 3. Update name: "@vpn-enterprise/my-package"

# 4. Create src/
mkdir src && touch src/index.ts

# 5. Add tsconfig.json
cp ../auth/tsconfig.json .

# 6. Install from root
cd ../..
npm install
```

### Testing

```bash
# All packages
npm test

# Single package
cd packages/api
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

---

## Contributing

### Workflow

1. **Create branch**
   ```bash
   git checkout -b feature/add-feature
   ```

2. **Make changes**
   ```bash
   cd packages/api
   vim src/routes/new-route.ts
   ```

3. **Build and test**
   ```bash
   npm run build
   npm test
   ```

4. **Commit**
   ```bash
   git add .
   git commit -m "feat(api): add new endpoint"
   ```

5. **Push and PR**
   ```bash
   git push origin feature/add-feature
   ```

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Write tests for new features
- Document public APIs with JSDoc
- Use meaningful variable names
- Keep functions small and focused

### Best Practices

✅ **Single Responsibility** - Each package has one clear purpose  
✅ **Loose Coupling** - Minimize dependencies between packages  
✅ **Type Safety** - Use TypeScript types everywhere  
✅ **Error Handling** - Use custom error classes  
✅ **Testing** - Unit tests for business logic  
✅ **Documentation** - Document public APIs  

---

## Troubleshooting

### Build Errors

**Issue:** "Cannot find module '@vpn-enterprise/auth'"

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Runtime Errors

**Issue:** Environment variables not loading

**Solution:**
```typescript
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
```

### Dependency Issues

**Issue:** Version conflicts

**Solution:**
```json
// Root package.json
{
  "overrides": {
    "problematic-package": "^3.0.0"
  }
}
```

---

## Architecture Decisions

### Why npm Workspaces?

- **Native Solution** - Built into npm, no extra tools
- **Simple** - Easy to understand and maintain
- **Fast** - Efficient dependency resolution
- **Compatible** - Works with all npm tooling

### Why TypeScript Project References?

- **Incremental Builds** - Only rebuild changed packages
- **Type Checking** - Enforce type safety across packages
- **IDE Support** - Better IntelliSense and navigation

### Why Repository Pattern?

- **Abstraction** - Hide database implementation details
- **Testing** - Easy to mock for unit tests
- **Flexibility** - Swap database providers easily
- **Consistency** - Uniform data access API

---

## Resources

### Official Documentation

- **TypeScript:** https://www.typescriptlang.org/docs
- **npm Workspaces:** https://docs.npmjs.com/cli/v7/using-npm/workspaces
- **Express:** https://expressjs.com/
- **Supabase:** https://supabase.com/docs

### Community

- **GitHub:** https://github.com/your-org/vpn-enterprise
- **Slack:** https://vpn-enterprise.slack.com

---

## License

[Your License Here]

---

**Built with ❤️ by the VPN Enterprise Team**

*Modular, type-safe, production-ready* 🚀

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
