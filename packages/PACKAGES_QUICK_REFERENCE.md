# 📦 Packages Quick Reference

**Your daily cheat sheet for working with VPN Enterprise packages.**

---

## ⚡ Quick Start

### Install Dependencies
```bash
# From repo root
npm install

# For specific package
cd packages/api && npm install
```

### Build All Packages
```bash
# From repo root
npm run build

# Or with make
make build
```

### Build Single Package
```bash
cd packages/api
npm run build

# Output in dist/
```

### Development Mode (Auto-rebuild)
```bash
cd packages/api
npm run dev

# Watches for changes and rebuilds
```

---

## 📋 Package Overview

### Core Packages

| Package | Purpose | Main Exports |
|---------|---------|--------------|
| **api** | REST API server | Express app, routes |
| **auth** | Authentication | AuthService, authMiddleware |
| **database** | Database access | Repositories, types |
| **vpn-core** | VPN management | VPNServerManager |

### Service Packages

| Package | Purpose | Port |
|---------|---------|------|
| **tenant-provisioner** | Create tenant DBs | 4000 |
| **database-manager** | DB operations | 4001 |
| **billing** | Payments | - |

### Utility Packages

| Package | Purpose | Main Exports |
|---------|---------|--------------|
| **shared** | Common utils | Types, logger, validators |
| **realtime** | WebSockets | PostgresSubscriptionEngine |
| **editor** | SQL editor | SQLEditor component |

---

## 🔧 Common Tasks

### Import from Package
```typescript
// Import from another package
import { authMiddleware } from '@vpn-enterprise/auth';
import { ServerRepository } from '@vpn-enterprise/database';
import { logger } from '@vpn-enterprise/shared';
```

### Add New Package
```bash
# 1. Create directory
mkdir packages/my-package
cd packages/my-package

# 2. Initialize
npm init -y

# 3. Update name in package.json
# "name": "@vpn-enterprise/my-package"

# 4. Create src/
mkdir src && touch src/index.ts

# 5. Add tsconfig.json
cp ../auth/tsconfig.json .

# 6. Install from root
cd ../..
npm install
```

### Add Dependency to Package
```bash
cd packages/api

# Production dependency
npm install express

# Dev dependency
npm install -D @types/express

# Workspace dependency (automatic via file: protocol)
# Already linked via workspace
```

### Run Tests
```bash
# All packages
npm test

# Single package
cd packages/api && npm test

# Watch mode
cd packages/api && npm run test:watch
```

---

## 📦 Package Details

### API Package (`packages/api/`)

**Purpose:** Main REST API server

**Key Files:**
```
src/
├── app.ts              # Express app
├── index.ts            # Dev server
└── routes/             # API routes
```

**Start Development:**
```bash
cd packages/api
npm run dev

# API running at http://localhost:3000
```

**Environment Variables:**
```bash
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
JWT_SECRET=...
PORT=3000
```

**Key Routes:**
```
GET  /health              # Health check
GET  /api/vpn/servers     # List servers
POST /api/vpn/connect     # Connect to VPN
GET  /api/tenants         # List tenants
POST /api/tenants         # Create tenant
GET  /api/admin/users     # Admin: list users
```

---

### Auth Package (`packages/auth/`)

**Purpose:** Authentication services

**Main Exports:**
```typescript
import { 
  AuthService,          // Auth operations
  authMiddleware,       // Protect routes
  adminMiddleware,      // Admin-only routes
  AuthRequest           // Type for req.user
} from '@vpn-enterprise/auth';
```

**Usage:**
```typescript
// Protect route
app.get('/api/profile', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  // ...
});

// Admin-only route
app.get('/api/admin/users', adminMiddleware, async (req, res) => {
  // Only admins can access
});
```

**Sign In:**
```typescript
const authService = new AuthService();
const { user, session } = await authService.signIn(email, password);
```

---

### Database Package (`packages/database/`)

**Purpose:** Database client and repositories

**Main Exports:**
```typescript
import {
  supabase,                  // User client (RLS)
  supabaseAdmin,             // Admin client (no RLS)
  ServerRepository,          // VPN servers
  SubscriptionRepository,    // Subscriptions
  ConnectionRepository,      // Connections
  DeviceRepository,          // Devices
  AuditRepository,           // Audit logs
  PostgresDatabaseManager    // Tenant DBs
} from '@vpn-enterprise/database';
```

**Usage:**
```typescript
// Use repository
const serverRepo = new ServerRepository();
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

**Direct Client Usage:**
```typescript
// Query with Supabase
const { data, error } = await supabase
  .from('servers')
  .select('*')
  .eq('user_id', userId);
```

---

### VPN-Core Package (`packages/vpn-core/`)

**Purpose:** VPN server management

**Main Exports:**
```typescript
import {
  VPNServerManager,        // Manage servers
  ServerLoadBalancer,      // Load balancing
  ConnectionTracker,       // Track connections
  NativeClientConfigGenerator  // Generate configs
} from '@vpn-enterprise/vpn-core';
```

**Usage:**
```typescript
const vpnManager = new VPNServerManager();

// Create server
const server = await vpnManager.createServer({
  name: 'vpn-us-1',
  region: 'us-east',
  port: 51820
});

// Connect client
await vpnManager.connectClient(serverId, clientPublicKey, clientIp);

// Get stats
const stats = await vpnManager.getServerStats(serverId);
```

**Load Balancing:**
```typescript
const loadBalancer = new ServerLoadBalancer();
const servers = await getAvailableServers();
const bestServer = loadBalancer.selectServer(servers, userRegion);
```

---

### Shared Package (`packages/shared/`)

**Purpose:** Common utilities

**Main Exports:**
```typescript
import {
  logger,                # Winston logger
  ValidationError,       # Custom errors
  AuthenticationError,
  NotFoundError,
  emailSchema,          # Validators
  createServerSchema
} from '@vpn-enterprise/shared';
```

**Logging:**
```typescript
import { logger } from '@vpn-enterprise/shared';

logger.info('Server started', { port: 3000 });
logger.error('Connection failed', { error: err.message });
logger.warn('High memory usage', { usage: '95%' });
```

**Validation:**
```typescript
import { createServerSchema } from '@vpn-enterprise/shared';

try {
  const validData = createServerSchema.parse(input);
} catch (error) {
  // Handle validation error
}
```

**Error Handling:**
```typescript
import { NotFoundError } from '@vpn-enterprise/shared';

const server = await serverRepo.getById(id);
if (!server) {
  throw new NotFoundError('Server');
}
```

---

### Tenant Provisioner (`packages/tenant-provisioner/`)

**Purpose:** Create isolated tenant databases

**Start Service:**
```bash
cd packages/tenant-provisioner
npm start

# Service running on port 4000
```

**How It Works:**
1. User requests new database hosting
2. API adds job to Redis queue
3. Provisioner picks up job
4. Creates isolated PostgreSQL database
5. Sets up user, schema, limits
6. Returns connection string

**Resource Limits:**
```typescript
Free Plan:
  - 10 connections
  - 100MB storage
  - 10% CPU

Pro Plan:
  - 50 connections
  - 5GB storage
  - 50% CPU

Enterprise:
  - 500 connections
  - 50GB storage
  - 100% CPU
```

---

### Database Manager (`packages/database-manager/`)

**Purpose:** Automated DB operations

**Start Service:**
```bash
cd packages/database-manager
npm start

# Service running on port 4001
```

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
Weekly:   Analysis and optimization
Monthly:  Archive old data
```

---

## 🔍 Troubleshooting

### Build Errors

**Issue:** "Cannot find module '@vpn-enterprise/auth'"

**Fix:**
```bash
# Reinstall workspace
rm -rf node_modules package-lock.json
npm install

# Rebuild packages
npm run build
```

**Issue:** TypeScript errors after update

**Fix:**
```bash
# Clear cache
rm -rf dist/ node_modules/.cache/

# Clean build
npm run build
```

### Runtime Errors

**Issue:** Environment variables not loading

**Fix:**
```typescript
// Load from repo root
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ 
  path: path.resolve(__dirname, '../../../.env') 
});
```

**Issue:** Module not found in production

**Fix:**
- Ensure package is built: `npm run build`
- Check `dist/` folder exists
- Verify `package.json` main field:
```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

### Dependency Issues

**Issue:** Version conflicts

**Fix:**
```bash
# Check which packages use it
npm ls problematic-package

# Override in root package.json
{
  "overrides": {
    "problematic-package": "^3.0.0"
  }
}
```

---

## 🛠️ Development Workflow

### Making Changes

```bash
# 1. Create branch
git checkout -b feature/add-endpoint

# 2. Make changes
cd packages/api
vim src/routes/new-route.ts

# 3. Build
npm run build

# 4. Test
npm test

# 5. Commit
git add .
git commit -m "feat(api): add new endpoint"

# 6. Push
git push origin feature/add-endpoint
```

### Testing Changes Across Packages

```bash
# 1. Edit shared types
cd packages/shared
vim src/types.ts

# 2. Rebuild shared
npm run build

# 3. Test in API (auto-linked via workspace)
cd ../api
npm test

# Changes immediately available!
```

### Adding New Route to API

```typescript
// 1. Create route file
// packages/api/src/routes/my-route.ts
import { Router } from 'express';
import { authMiddleware } from '@vpn-enterprise/auth';

const router = Router();

router.get('/endpoint', authMiddleware, async (req, res) => {
  // Implementation
});

export { router as myRouter };
```

```typescript
// 2. Register in app.ts
import { myRouter } from './routes/my-route';
app.use('/api/my', myRouter);
```

```bash
# 3. Build and test
npm run build
curl http://localhost:3000/api/my/endpoint
```

---

## 📊 Package Dependencies

### Dependency Graph
```
Apps (web, mobile)
    ↓
API Package
    ↓
├── Auth Package → Shared
├── Database Package → Shared
├── VPN-Core Package → Shared
└── Shared Package
```

### Import Rules

✅ **DO:**
- Import from `@vpn-enterprise/package-name`
- Use barrel exports from `index.ts`
- Import types with `import type`

❌ **DON'T:**
- Import from `../../other-package/src/file`
- Create circular dependencies
- Import from package internals

---

## 🎯 Quick Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Build all
npm run build

# Build one
cd packages/api && npm run build

# Test all
npm test

# Test one
cd packages/api && npm test

# Dev mode
cd packages/api && npm run dev

# Clean build
npm run clean && npm run build

# Update deps
npm update

# Check outdated
npm outdated

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

### Package-Specific Commands
```bash
# API
cd packages/api && npm run dev          # Start dev server
cd packages/api && npm run build        # Build for production
cd packages/api && npm test             # Run tests

# Database
cd packages/database && npm run migrate # Run migrations
cd packages/database && npm run seed    # Seed data

# Shared
cd packages/shared && npm run build     # Build types
```

---

## 💡 Pro Tips

### 1. Use TypeScript Project References
Faster incremental builds:
```json
// packages/api/tsconfig.json
{
  "references": [
    { "path": "../auth" },
    { "path": "../database" }
  ]
}
```

### 2. Watch Multiple Packages
```bash
# Terminal 1
cd packages/shared && npm run dev

# Terminal 2
cd packages/api && npm run dev

# Changes in shared auto-rebuild API
```

### 3. Debug Package Imports
```bash
# See what's exported
cd packages/auth
cat dist/index.d.ts

# Check import path
npm ls @vpn-enterprise/auth
```

### 4. Speed Up Builds
```bash
# Build only changed packages
npm run build --if-present

# Skip type checking in dev
tsc --noEmit false
```

### 5. Quick Testing
```typescript
// Create test helper
// packages/shared/src/test-utils.ts
export function createMockUser() {
  return { id: '123', email: 'test@example.com' };
}
```

---

## 📚 Documentation Links

- **Full Guide:** [PACKAGES_COMPLETE_GUIDE.md](./PACKAGES_COMPLETE_GUIDE.md)
- **API Docs:** [packages/api/README.md](./api/README.md)
- **Infrastructure:** [../infrastructure/README.md](../infrastructure/README.md)

---

**Last Updated:** February 1, 2026  
**Print this out for quick reference!** 📄

---

*Keep this handy while coding. Quick, simple, always helpful.* 🚀
