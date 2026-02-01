# 📦 VPN Enterprise Packages — Complete Guide

**Comprehensive reference for understanding and maintaining the monorepo packages architecture.**

> This guide explains every package in the VPN Enterprise monorepo, how they work internally, how they integrate with each other, and how to build, test, and maintain them over the lifetime of the project.

---

## 📚 Table of Contents

1. [Introduction](#introduction)
2. [Monorepo Architecture](#monorepo-architecture)
3. [Package Overview](#package-overview)
4. [Core Packages Deep Dive](#core-packages-deep-dive)
5. [Service Packages Deep Dive](#service-packages-deep-dive)
6. [Utility Packages Deep Dive](#utility-packages-deep-dive)
7. [Package Integration Patterns](#package-integration-patterns)
8. [Building and Testing](#building-and-testing)
9. [Development Workflow](#development-workflow)
10. [Dependency Management](#dependency-management)
11. [Troubleshooting](#troubleshooting)
12. [Best Practices](#best-practices)

---

## 1. Introduction

### What is the Packages Folder?

The `packages/` directory contains the **core business logic** of VPN Enterprise organized as independent, reusable modules. Each package has a specific responsibility and can be:

- **Imported by other packages** using TypeScript workspace references
- **Used by frontend apps** (web-dashboard, mobile-app)
- **Deployed independently** as microservices (API, tenant-provisioner, database-manager)
- **Tested in isolation** with their own test suites

### Why a Monorepo?

✅ **Code Reuse** - Share types, utilities, and business logic across services  
✅ **Atomic Changes** - Update API and database logic in a single commit  
✅ **Type Safety** - TypeScript ensures cross-package compatibility  
✅ **Unified Versioning** - All packages evolve together  
✅ **Simplified Dependencies** - No need to publish internal packages to npm  
✅ **Better Developer Experience** - Single checkout, unified tooling  

### Package Categories

```
packages/
├── Core Packages      (Business Logic)
│   ├── api/           # REST API server
│   ├── auth/          # Authentication services
│   ├── database/      # Database client + repositories
│   └── vpn-core/      # VPN server management
│
├── Service Packages   (Microservices)
│   ├── tenant-provisioner/    # Tenant database provisioning
│   ├── database-manager/      # Database operations + backups
│   └── billing/               # Billing integrations
│
└── Utility Packages   (Shared Code)
    ├── shared/        # Common utilities + types
    ├── realtime/      # WebSocket + subscriptions
    └── editor/        # SQL editor components
```

---

## 2. Monorepo Architecture

### Workspace Structure

The monorepo uses **npm workspaces** for dependency management and builds:

```json
// Root package.json
{
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
```

**How it works:**
- All packages share a single `node_modules` at the root
- Package imports use `@vpn-enterprise/<package-name>` namespace
- TypeScript uses project references for fast incremental builds
- Changes to one package automatically reflect in dependent packages

### Dependency Graph

```
┌──────────────────────────────────────────┐
│           Frontend Apps                   │
│  (web-dashboard, mobile-app)             │
└─────────────┬────────────────────────────┘
              │ Import from packages
              ▼
┌──────────────────────────────────────────┐
│           API Package                     │
│  (Express server, routes, controllers)   │
└───┬──────────┬──────────┬────────────────┘
    │          │          │
    ▼          ▼          ▼
┌────────┐ ┌─────────┐ ┌──────────┐
│  Auth  │ │Database │ │ VPN-Core │
│Package │ │ Package │ │  Package │
└────┬───┘ └────┬────┘ └─────┬────┘
     │          │            │
     │          │            │
     └──────────┴────────────┘
                │
                ▼
         ┌──────────────┐
         │Shared Package│
         │(Types, Utils)│
         └──────────────┘
```

### Build Order

TypeScript builds packages in dependency order:

1. **shared** (no dependencies)
2. **auth**, **database**, **vpn-core** (depend on shared)
3. **api** (depends on all core packages)
4. **Apps** (depend on packages)

---

## 3. Package Overview

### Quick Reference Table

| Package | Purpose | Key Exports | Used By |
|---------|---------|-------------|---------|
| **api** | REST API server | Express app, routes | web-dashboard, mobile-app |
| **auth** | Authentication | AuthService, authMiddleware | api, apps |
| **database** | Database access | Repositories, types, client | api, services |
| **vpn-core** | VPN management | VPNServerManager, LoadBalancer | api |
| **tenant-provisioner** | Tenant DB provisioning | TenantProvisioningService | platform |
| **database-manager** | DB operations | BackupService, MetricsCollector | platform |
| **billing** | Payment processing | Billing integrations | api |
| **shared** | Common utilities | Types, validators, logger | All packages |
| **realtime** | WebSocket/subscriptions | PostgresSubscriptionEngine | api, apps |
| **editor** | SQL editor UI | SQLEditor, QueryBuilder | web-dashboard |

### Port Allocations (Services)

```
3000    API (development)
3001    Web Dashboard
4000    Tenant Provisioner
4001    Database Manager
5001    Python AI (Flask)
```

---

## 4. Core Packages Deep Dive

### 4.1 API Package (`packages/api/`)

**Purpose:** Main REST API server for the VPN Enterprise platform.

**Architecture:**
```
packages/api/
├── src/
│   ├── app.ts              # Express app with routes + middleware
│   ├── index.ts            # Dev server entry point
│   ├── routes/             # API route handlers
│   │   ├── hosting.ts      # Database hosting APIs
│   │   ├── tenants.ts      # Tenant management
│   │   └── admin/          # Admin-only routes
│   ├── controllers/        # Business logic controllers
│   ├── middleware/         # Custom middleware
│   └── services/           # Business services
├── api/index.js            # Vercel serverless entry
└── package.json
```

**Key Components:**

#### App Configuration (app.ts)
```typescript
import express from 'express';
import { authMiddleware } from '@vpn-enterprise/auth';
import { VPNServerManager } from '@vpn-enterprise/vpn-core';

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Body parsing
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/vpn', authMiddleware, vpnRouter);
app.use('/api/tenants', authMiddleware, tenantsRouter);
app.use('/api/admin', adminMiddleware, adminRouter);

export { app };
```

**How it integrates:**
1. **Auth Package** - Uses `authMiddleware` for route protection
2. **Database Package** - Imports repositories for data access
3. **VPN-Core Package** - Uses `VPNServerManager` for server operations
4. **Shared Package** - Uses common types, validators, logger

**Deployment Modes:**

**Development:**
```typescript
// src/index.ts
import { app } from './app';
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on :${PORT}`));
```

**Production (Vercel Serverless):**
```javascript
// api/index.js - Vercel bridge
const { app } = require('../dist/app');
module.exports = app;
```

**Environment Variables:**
```bash
# Required
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
JWT_SECRET=...

# Optional
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=https://app.example.com,https://dashboard.example.com
REDIS_URL=redis://...
```

**API Endpoints:**

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/health` | GET | No | Health check |
| `/api/vpn/servers` | GET | Yes | List VPN servers |
| `/api/vpn/connect` | POST | Yes | Connect to VPN |
| `/api/tenants` | GET | Yes | List user tenants |
| `/api/tenants` | POST | Yes | Create tenant |
| `/api/admin/users` | GET | Admin | List all users |
| `/api/hosting/plans` | GET | Yes | Database hosting plans |

---

### 4.2 Auth Package (`packages/auth/`)

**Purpose:** Authentication and authorization services using Supabase Auth.

**Architecture:**
```
packages/auth/
├── src/
│   ├── auth-service.ts     # Auth operations wrapper
│   ├── middleware.ts       # Express middleware
│   └── index.ts            # Exports
└── package.json
```

**Key Components:**

#### AuthService (auth-service.ts)
```typescript
import { createClient } from '@supabase/supabase-js';

export class AuthService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  // Sign in with email/password
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  // Verify JWT token
  async verifyToken(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);
    if (error) throw error;
    return data.user;
  }

  // Refresh access token
  async refreshSession(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken
    });
    if (error) throw error;
    return data;
  }
}
```

#### Authentication Middleware (middleware.ts)
```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth-service';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const authService = new AuthService();

// Protect routes requiring authentication
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const user = await authService.verifyToken(token);
    
    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email!,
      role: user.user_metadata?.role || 'user'
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Protect admin-only routes
export async function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  await authMiddleware(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}
```

**How it integrates:**
- **API Package** - Imports middleware to protect routes
- **Web Dashboard** - Uses AuthService for login/logout
- **Mobile App** - Uses AuthService for authentication

**Usage Example:**
```typescript
// In API routes
import { authMiddleware, AuthRequest } from '@vpn-enterprise/auth';

app.get('/api/profile', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  // Fetch user profile...
});
```

---

### 4.3 Database Package (`packages/database/`)

**Purpose:** Database client, type-safe repositories, and SQL migrations.

**Architecture:**
```
packages/database/
├── src/
│   ├── client.ts                  # Supabase client setup
│   ├── types.ts                   # TypeScript types
│   ├── postgres-manager.ts        # Tenant DB manager
│   ├── mysql-manager.ts           # MySQL support
│   ├── repositories/              # Data access layer
│   │   ├── servers.ts             # VPN servers
│   │   ├── subscriptions.ts       # User subscriptions
│   │   ├── connections.ts         # VPN connections
│   │   ├── devices.ts             # User devices
│   │   ├── audit.ts               # Audit logs
│   │   ├── hosting.ts             # Database hosting
│   │   └── security.ts            # Security events
│   └── migrations/                # SQL migration files
├── schema.sql                     # Main database schema
├── enterprise-features.sql        # Enterprise features
└── package.json
```

**Key Components:**

#### Supabase Client (client.ts)
```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from './supabase-types';

// User client (respects RLS)
export const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Admin client (bypasses RLS)
export const supabaseAdmin = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export type SupabaseDatabase = Database;
```

#### Repository Pattern (repositories/servers.ts)
```typescript
import { supabaseAdmin } from '../client';
import { Server, ServerStatus } from '../types';

export class ServerRepository {
  // Get all servers for a user
  async getUserServers(userId: string): Promise<Server[]> {
    const { data, error } = await supabaseAdmin
      .from('servers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Create new server
  async createServer(server: Partial<Server>): Promise<Server> {
    const { data, error } = await supabaseAdmin
      .from('servers')
      .insert(server)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update server status
  async updateStatus(serverId: string, status: ServerStatus): Promise<void> {
    const { error } = await supabaseAdmin
      .from('servers')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', serverId);

    if (error) throw error;
  }

  // Get server by ID
  async getById(serverId: string): Promise<Server | null> {
    const { data, error } = await supabaseAdmin
      .from('servers')
      .select('*')
      .eq('id', serverId)
      .single();

    if (error) return null;
    return data;
  }

  // Delete server
  async delete(serverId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('servers')
      .delete()
      .eq('id', serverId);

    if (error) throw error;
  }
}
```

**Database Schema Highlights:**

```sql
-- servers table
CREATE TABLE servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  region VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  ip_address INET,
  port INTEGER,
  public_key TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  billing_cycle VARCHAR(50),
  price DECIMAL(10, 2),
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- connections table
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  server_id UUID REFERENCES servers(id),
  device_id UUID REFERENCES devices(id),
  connected_at TIMESTAMP DEFAULT NOW(),
  disconnected_at TIMESTAMP,
  bytes_sent BIGINT DEFAULT 0,
  bytes_received BIGINT DEFAULT 0
);
```

**How it integrates:**
- **API Package** - Uses repositories for all database operations
- **Tenant Provisioner** - Uses PostgresDatabaseManager to create tenant DBs
- **All Packages** - Import types for type safety

**Usage Example:**
```typescript
import { ServerRepository, SubscriptionRepository } from '@vpn-enterprise/database';

const serverRepo = new ServerRepository();
const servers = await serverRepo.getUserServers(userId);
```

---

### 4.4 VPN-Core Package (`packages/vpn-core/`)

**Purpose:** Core VPN server management, load balancing, and connection tracking.

**Architecture:**
```
packages/vpn-core/
├── src/
│   ├── vpn-server-manager.ts      # Main VPN manager
│   ├── server-load-balancer.ts    # Load balancing logic
│   ├── connection-tracker.ts      # Track active connections
│   ├── native-client-generator.ts # Generate client configs
│   ├── types.ts                   # VPN types
│   └── wireguard/                 # WireGuard specifics
│       ├── config-generator.ts
│       └── key-generator.ts
└── package.json
```

**Key Components:**

#### VPN Server Manager (vpn-server-manager.ts)
```typescript
import { Server, ConnectionInfo } from './types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class VPNServerManager {
  // Create new VPN server
  async createServer(config: {
    name: string;
    region: string;
    port: number;
  }): Promise<Server> {
    // Generate WireGuard keys
    const { privateKey, publicKey } = await this.generateKeys();

    // Create WireGuard configuration
    const wgConfig = `
[Interface]
PrivateKey = ${privateKey}
Address = 10.0.0.1/24
ListenPort = ${config.port}
SaveConfig = true

PostUp = iptables -A FORWARD -i wg0 -j ACCEPT
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT
    `.trim();

    // Save config to file
    const configPath = `/etc/wireguard/${config.name}.conf`;
    await this.writeFile(configPath, wgConfig);

    // Start WireGuard interface
    await execAsync(`wg-quick up ${config.name}`);

    return {
      name: config.name,
      region: config.region,
      port: config.port,
      publicKey,
      status: 'active'
    };
  }

  // Connect client to server
  async connectClient(
    serverId: string,
    clientPublicKey: string,
    clientIp: string
  ): Promise<void> {
    const server = await this.getServer(serverId);
    
    // Add peer to WireGuard
    await execAsync(`
      wg set ${server.name} peer ${clientPublicKey} \
      allowed-ips ${clientIp}/32
    `);
  }

  // Disconnect client
  async disconnectClient(serverId: string, clientPublicKey: string): Promise<void> {
    const server = await this.getServer(serverId);
    await execAsync(`wg set ${server.name} peer ${clientPublicKey} remove`);
  }

  // Get server statistics
  async getServerStats(serverId: string): Promise<ConnectionInfo> {
    const server = await this.getServer(serverId);
    const { stdout } = await execAsync(`wg show ${server.name}`);
    
    // Parse WireGuard output
    const peers = this.parseWgOutput(stdout);
    
    return {
      serverId,
      activePeers: peers.length,
      totalBytesTransferred: peers.reduce((sum, p) => sum + p.transfer, 0),
      uptime: await this.getUptime(server.name)
    };
  }

  private async generateKeys() {
    const { stdout: privateKey } = await execAsync('wg genkey');
    const { stdout: publicKey } = await execAsync(`echo ${privateKey.trim()} | wg pubkey`);
    
    return {
      privateKey: privateKey.trim(),
      publicKey: publicKey.trim()
    };
  }
}
```

#### Load Balancer (server-load-balancer.ts)
```typescript
import { Server } from './types';

export class ServerLoadBalancer {
  // Select best server for new connection
  selectServer(servers: Server[], userLocation?: string): Server {
    // Filter healthy servers
    const healthy = servers.filter(s => s.status === 'active');
    
    if (healthy.length === 0) {
      throw new Error('No healthy servers available');
    }

    // Prefer servers in user's region
    if (userLocation) {
      const regionalServers = healthy.filter(s => s.region === userLocation);
      if (regionalServers.length > 0) {
        return this.selectLeastLoaded(regionalServers);
      }
    }

    // Fall back to least loaded server globally
    return this.selectLeastLoaded(healthy);
  }

  private selectLeastLoaded(servers: Server[]): Server {
    // Sort by active connections (ascending)
    const sorted = servers.sort((a, b) => {
      return (a.activeConnections || 0) - (b.activeConnections || 0);
    });

    return sorted[0];
  }

  // Calculate server load percentage
  calculateLoad(server: Server): number {
    const maxConnections = server.maxConnections || 1000;
    const active = server.activeConnections || 0;
    return (active / maxConnections) * 100;
  }
}
```

#### Connection Tracker (connection-tracker.ts)
```typescript
export class ConnectionTracker {
  private connections = new Map<string, Connection>();

  // Track new connection
  startTracking(connectionId: string, info: ConnectionInfo): void {
    this.connections.set(connectionId, {
      ...info,
      startTime: Date.now(),
      bytesIn: 0,
      bytesOut: 0
    });
  }

  // Update connection stats
  updateStats(connectionId: string, stats: { bytesIn: number; bytesOut: number }): void {
    const conn = this.connections.get(connectionId);
    if (conn) {
      conn.bytesIn += stats.bytesIn;
      conn.bytesOut += stats.bytesOut;
      conn.lastUpdate = Date.now();
    }
  }

  // Stop tracking connection
  stopTracking(connectionId: string): Connection | null {
    const conn = this.connections.get(connectionId);
    if (conn) {
      conn.endTime = Date.now();
      conn.duration = conn.endTime - conn.startTime;
      this.connections.delete(connectionId);
      return conn;
    }
    return null;
  }

  // Get active connections count
  getActiveCount(): number {
    return this.connections.size;
  }

  // Get connection by ID
  getConnection(connectionId: string): Connection | undefined {
    return this.connections.get(connectionId);
  }
}
```

**How it integrates:**
- **API Package** - Uses VPNServerManager for server operations
- **API Package** - Uses LoadBalancer to assign servers to users
- **API Package** - Uses ConnectionTracker for real-time stats

**Usage Example:**
```typescript
import { VPNServerManager, ServerLoadBalancer } from '@vpn-enterprise/vpn-core';

const vpnManager = new VPNServerManager();
const loadBalancer = new ServerLoadBalancer();

// Create server
const server = await vpnManager.createServer({
  name: 'vpn-us-east-1',
  region: 'us-east',
  port: 51820
});

// Select best server for user
const availableServers = await getServers();
const bestServer = loadBalancer.selectServer(availableServers, userRegion);

// Connect user
await vpnManager.connectClient(bestServer.id, userPublicKey, assignedIp);
```

---

## 5. Service Packages Deep Dive

### 5.1 Tenant Provisioner (`packages/tenant-provisioner/`)

**Purpose:** Automated provisioning and management of isolated tenant databases.

**Architecture:**
```
packages/tenant-provisioner/
├── src/
│   ├── index.ts                           # Main service
│   └── services/
│       ├── tenant-provisioning-service.ts # Provision tenants
│       ├── resource-limit-service.ts      # Resource quotas
│       └── tenant-security-service.ts     # Tenant isolation
└── package.json
```

**Key Features:**
- Creates isolated PostgreSQL databases for each tenant
- Configures resource limits (CPU, memory, storage)
- Sets up database users with proper permissions
- Enforces security policies (SSL, row-level security)
- Uses Bull queue for async provisioning
- Monitors provisioning status

**Tenant Provisioning Flow:**

```
User Request → API
     ↓
Add to Queue (Redis/Bull)
     ↓
Provisioner picks up job
     ↓
1. Create database
2. Create user
3. Apply schema
4. Set resource limits
5. Configure security
     ↓
Update status in platform_db
     ↓
Notify user (webhook/email)
```

**Key Service: TenantProvisioningService**

```typescript
export class TenantProvisioningService {
  async provisionTenant(request: {
    tenantId: string;
    plan: 'free' | 'pro' | 'enterprise';
    region: string;
  }) {
    // 1. Create database
    const dbName = `tenant_${request.tenantId}`;
    await this.pgPool.query(`CREATE DATABASE ${dbName}`);

    // 2. Create dedicated user
    const username = `user_${request.tenantId}`;
    const password = this.generateSecurePassword();
    await this.pgPool.query(`
      CREATE USER ${username} WITH PASSWORD '${password}'
    `);

    // 3. Grant permissions
    await this.pgPool.query(`
      GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${username}
    `);

    // 4. Apply resource limits based on plan
    const limits = this.getPlanLimits(request.plan);
    await this.resourceLimitService.applyLimits(dbName, limits);

    // 5. Apply schema migrations
    await this.applySchema(dbName);

    // 6. Setup security (SSL, RLS)
    await this.tenantSecurityService.setupSecurity(dbName);

    // 7. Record in platform database
    await this.pgPool.query(`
      INSERT INTO tenants (id, database_name, username, plan, region, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
    `, [request.tenantId, dbName, username, request.plan, request.region]);

    return {
      tenantId: request.tenantId,
      connectionString: `postgresql://${username}:${password}@${host}:5432/${dbName}`,
      status: 'active'
    };
  }
}
```

**Resource Limits by Plan:**

```typescript
const PLAN_LIMITS = {
  free: {
    maxConnections: 10,
    maxStorageMB: 100,
    maxCPUPercent: 10,
    maxMemoryMB: 100
  },
  pro: {
    maxConnections: 50,
    maxStorageMB: 5000,
    maxCPUPercent: 50,
    maxMemoryMB: 1024
  },
  enterprise: {
    maxConnections: 500,
    maxStorageMB: 50000,
    maxCPUPercent: 100,
    maxMemoryMB: 8192
  }
};
```

**How it integrates:**
- **API Package** - Calls provisioner to create tenant databases
- **Database Manager** - Monitors provisioned tenant databases
- **Redis** - Uses Bull queue for job management
- **Docker** - Can spin up isolated database containers

---

### 5.2 Database Manager (`packages/database-manager/`)

**Purpose:** Automated database operations, backups, monitoring, and maintenance.

**Architecture:**
```
packages/database-manager/
├── src/
│   ├── index.ts                   # Main service
│   └── services/
│       ├── backup-service.ts      # Automated backups
│       ├── metrics-collector.ts   # Collect DB metrics
│       ├── resource-monitor.ts    # Monitor resources
│       └── cleanup-service.ts     # Clean old data
└── package.json
```

**Key Features:**
- Automated database backups (hourly, daily, weekly)
- Performance metrics collection (queries, connections, locks)
- Resource monitoring (CPU, memory, disk, connections)
- Automated cleanup of old data
- Query performance analysis
- Slow query detection and logging

**Backup Service:**

```typescript
export class BackupService {
  // Run automated backup
  async runBackup(type: 'full' | 'incremental') {
    const timestamp = new Date().toISOString();
    const backupName = `backup_${type}_${timestamp}`;

    if (type === 'full') {
      // Full database dump
      await this.execAsync(`
        pg_dump -U postgres -Fc -f /backups/${backupName}.dump vpn_db
      `);
    } else {
      // Incremental backup using WAL
      await this.execAsync(`
        pg_basebackup -U postgres -D /backups/${backupName} -Fp -Xs -P
      `);
    }

    // Upload to S3/cloud storage
    await this.uploadBackup(`/backups/${backupName}`);

    // Record in database
    await this.pgPool.query(`
      INSERT INTO backups (name, type, size_bytes, status, created_at)
      VALUES ($1, $2, $3, 'completed', NOW())
    `, [backupName, type, backupSize]);

    // Clean old backups (keep last 30 days)
    await this.cleanOldBackups(30);
  }

  // Restore from backup
  async restoreBackup(backupName: string) {
    // Download from storage
    await this.downloadBackup(backupName);

    // Stop connections
    await this.pgPool.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = 'vpn_db' AND pid <> pg_backend_pid()
    `);

    // Restore database
    await this.execAsync(`
      pg_restore -U postgres -d vpn_db -c /backups/${backupName}.dump
    `);

    this.logger.info(`Restored backup: ${backupName}`);
  }
}
```

**Metrics Collector:**

```typescript
export class MetricsCollector {
  async collectMetrics() {
    const metrics = {
      // Connection stats
      activeConnections: await this.getActiveConnections(),
      maxConnections: await this.getMaxConnections(),

      // Query performance
      queriesPerSecond: await this.getQPS(),
      avgQueryTime: await this.getAvgQueryTime(),
      slowQueries: await this.getSlowQueries(),

      // Resource usage
      cpuPercent: await this.getCPUUsage(),
      memoryUsedMB: await this.getMemoryUsage(),
      diskUsedMB: await this.getDiskUsage(),

      // Locks and blocks
      activeLocks: await this.getActiveLocks(),
      blockedQueries: await this.getBlockedQueries(),

      // Cache hit ratio
      cacheHitRatio: await this.getCacheHitRatio()
    };

    // Store in Redis for quick access
    await this.redis.set('db:metrics', JSON.stringify(metrics), 'EX', 60);

    // Store in Prometheus
    this.prometheusGauge.set(metrics.activeConnections);

    return metrics;
  }

  private async getActiveConnections(): Promise<number> {
    const { rows } = await this.pgPool.query(`
      SELECT count(*) FROM pg_stat_activity WHERE state = 'active'
    `);
    return parseInt(rows[0].count);
  }

  private async getSlowQueries(): Promise<any[]> {
    const { rows } = await this.pgPool.query(`
      SELECT query, query_start, state, wait_event
      FROM pg_stat_activity
      WHERE state = 'active'
        AND query_start < NOW() - INTERVAL '10 seconds'
      ORDER BY query_start
    `);
    return rows;
  }
}
```

**Cron Jobs:**

```typescript
// Schedule automated tasks
class DatabaseManager {
  private setupCronJobs() {
    // Hourly incremental backup
    cron.schedule('0 * * * *', async () => {
      await this.backupService.runBackup('incremental');
    });

    // Daily full backup at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.backupService.runBackup('full');
    });

    // Collect metrics every minute
    cron.schedule('* * * * *', async () => {
      await this.metricsCollector.collectMetrics();
    });

    // Clean old logs daily at 3 AM
    cron.schedule('0 3 * * *', async () => {
      await this.cleanupService.cleanOldLogs(30);
    });

    // Analyze tables weekly on Sunday at 4 AM
    cron.schedule('0 4 * * 0', async () => {
      await this.cleanupService.analyzeTables();
    });
  }
}
```

**How it integrates:**
- Runs as independent microservice
- Monitors all tenant databases
- Sends metrics to Prometheus/Grafana
- Alerts on issues (via email, Slack, PagerDuty)
- Used by platform administrators

---

### 5.3 Billing Package (`packages/billing/`)

**Purpose:** Payment processing and subscription management.

**Features:**
- Stripe integration for payments
- Subscription lifecycle management
- Invoice generation
- Usage-based billing
- Payment method management

**How it integrates:**
- **API Package** - Uses billing service for checkout flows
- **Database Package** - Updates subscription records
- **Web Dashboard** - Displays billing information

---

## 6. Utility Packages Deep Dive

### 6.1 Shared Package (`packages/shared/`)

**Purpose:** Common utilities, types, validators, and constants used across all packages.

**Architecture:**
```
packages/shared/
├── src/
│   ├── types.ts         # Shared TypeScript types
│   ├── constants.ts     # App constants
│   ├── logger.ts        # Winston logger
│   ├── errors.ts        # Custom error classes
│   ├── validators.ts    # Input validation
│   └── utils.ts         # Utility functions
└── package.json
```

**Key Exports:**

#### Types (types.ts)
```typescript
// User types
export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

// Server types
export interface Server {
  id: string;
  name: string;
  region: string;
  status: 'active' | 'inactive' | 'maintenance';
  ipAddress: string;
  port: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

#### Logger (logger.ts)
```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});
```

#### Validators (validators.ts)
```typescript
import { z } from 'zod';

// Email validation
export const emailSchema = z.string().email();

// Server creation validation
export const createServerSchema = z.object({
  name: z.string().min(3).max(50),
  region: z.enum(['us-east', 'us-west', 'eu-central', 'ap-south']),
  port: z.number().min(1024).max(65535)
});

// Validate input
export function validateServerInput(data: unknown) {
  return createServerSchema.parse(data);
}
```

#### Error Classes (errors.ts)
```typescript
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}
```

**How it integrates:**
- **All Packages** - Import types for consistency
- **All Packages** - Use logger for structured logging
- **API Package** - Use validators for input validation
- **All Packages** - Use error classes for consistent error handling

---

### 6.2 Realtime Package (`packages/realtime/`)

**Purpose:** WebSocket connections and real-time database subscriptions.

**Architecture:**
```
packages/realtime/
├── src/
│   ├── postgres-subscriptions.ts  # PostgreSQL LISTEN/NOTIFY
│   ├── pgoutput-decoder.ts        # Decode logical replication
│   └── index.ts
└── package.json
```

**Key Features:**
- Real-time updates from PostgreSQL
- WebSocket connections for clients
- Logical replication decoding
- Change data capture (CDC)

**PostgreSQL Subscriptions:**

```typescript
export class PostgresSubscriptionEngine {
  private pgClient: pg.Client;
  private subscribers = new Map<string, Set<WebSocket>>();

  async subscribe(channel: string, ws: WebSocket) {
    // Add WebSocket to subscribers
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
      
      // Start listening on PostgreSQL channel
      await this.pgClient.query(`LISTEN ${channel}`);
    }
    
    this.subscribers.get(channel)!.add(ws);
  }

  private setupNotificationHandler() {
    this.pgClient.on('notification', (msg) => {
      const { channel, payload } = msg;
      const subscribers = this.subscribers.get(channel);
      
      if (subscribers) {
        // Broadcast to all subscribers
        const data = JSON.parse(payload || '{}');
        subscribers.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'update',
              channel,
              data
            }));
          }
        });
      }
    });
  }
}
```

**Database Triggers for Real-time:**

```sql
-- Notify on new connection
CREATE OR REPLACE FUNCTION notify_new_connection()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('connections', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER connection_created
AFTER INSERT ON connections
FOR EACH ROW EXECUTE FUNCTION notify_new_connection();
```

**How it integrates:**
- **API Package** - Sets up WebSocket server
- **Web Dashboard** - Subscribes to real-time updates
- **Mobile App** - Receives push notifications

---

### 6.3 Editor Package (`packages/editor/`)

**Purpose:** SQL editor and visual query builder UI components.

**Architecture:**
```
packages/editor/
├── src/
│   ├── sql-editor.tsx              # Monaco-based SQL editor
│   └── visual-query-builder.tsx    # Drag-and-drop query builder
└── package.json
```

**Key Features:**
- Syntax highlighting for SQL
- Auto-completion
- Query execution
- Visual query builder (no-code)
- Query history

**How it integrates:**
- **Web Dashboard** - Uses SQL editor in database console
- Used for tenant database management

---

## 7. Package Integration Patterns

### 7.1 Import Patterns

#### Cross-Package Imports
```typescript
// API imports from multiple packages
import { authMiddleware } from '@vpn-enterprise/auth';
import { ServerRepository } from '@vpn-enterprise/database';
import { VPNServerManager } from '@vpn-enterprise/vpn-core';
import { logger } from '@vpn-enterprise/shared';
```

#### Type-Only Imports
```typescript
import type { Server, User } from '@vpn-enterprise/shared';
```

#### Barrel Exports
```typescript
// packages/database/src/index.ts
export * from './repositories/servers';
export * from './repositories/subscriptions';
export * from './client';
```

### 7.2 Dependency Flow

```
Frontend Apps
    ↓
  API Package ← (HTTP requests)
    ↓
Auth, Database, VPN-Core ← (function calls)
    ↓
Shared Package ← (types, utils)
```

### 7.3 Communication Patterns

#### Synchronous (Direct Function Calls)
```typescript
// API directly calls repository
const servers = await serverRepo.getUserServers(userId);
```

#### Asynchronous (Queue-Based)
```typescript
// API adds job to queue
await provisioningQueue.add('provision-tenant', { tenantId, plan });

// Provisioner processes job
provisioningQueue.process('provision-tenant', async (job) => {
  await provisionTenant(job.data);
});
```

#### Event-Driven (Pub/Sub)
```typescript
// Database publishes event
await redis.publish('server:created', JSON.stringify(server));

// Service subscribes to events
redis.subscribe('server:created', (channel, message) => {
  const server = JSON.parse(message);
  // Handle new server
});
```

---

## 8. Building and Testing

### 8.1 Build Commands

#### Build All Packages
```bash
# From repo root
npm run build

# Or with make
make build
```

#### Build Single Package
```bash
cd packages/api
npm run build

# Output in dist/
ls dist/
```

#### Watch Mode (Development)
```bash
cd packages/api
npm run dev

# Auto-rebuilds on file changes
```

#### Clean Build Artifacts
```bash
# Remove all dist/ folders
npm run clean

# Or manually
find packages -name "dist" -type d -exec rm -rf {} +
```

### 8.2 TypeScript Configuration

#### Root tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

#### Project References
```json
// packages/api/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "references": [
    { "path": "../auth" },
    { "path": "../database" },
    { "path": "../vpn-core" },
    { "path": "../shared" }
  ]
}
```

### 8.3 Testing

#### Run Tests for All Packages
```bash
npm test
```

#### Run Tests for Single Package
```bash
cd packages/api
npm test
```

#### Test Structure
```
packages/api/
├── src/
│   └── app.ts
└── test/
    ├── unit/
    │   ├── vpn-manager.test.ts
    │   └── load-balancer.test.ts
    └── integration/
        └── api.test.ts
```

#### Example Test (Vitest)
```typescript
// test/unit/load-balancer.test.ts
import { describe, it, expect } from 'vitest';
import { ServerLoadBalancer } from '../../src/server-load-balancer';

describe('ServerLoadBalancer', () => {
  it('selects least loaded server', () => {
    const loadBalancer = new ServerLoadBalancer();
    const servers = [
      { id: '1', activeConnections: 10 },
      { id: '2', activeConnections: 5 },
      { id: '3', activeConnections: 8 }
    ];

    const selected = loadBalancer.selectServer(servers);
    expect(selected.id).toBe('2');
  });
});
```

---

## 9. Development Workflow

### 9.1 Adding a New Package

```bash
# 1. Create package directory
mkdir packages/my-new-package
cd packages/my-new-package

# 2. Initialize package.json
npm init -y

# 3. Update package name
# Edit package.json: "name": "@vpn-enterprise/my-new-package"

# 4. Create src/ directory
mkdir src
touch src/index.ts

# 5. Add tsconfig.json
cp ../auth/tsconfig.json .

# 6. Install dependencies
npm install

# 7. Add to workspace (automatic if in packages/)
cd ../..
npm install
```

### 9.2 Adding Dependencies

#### Production Dependencies
```bash
cd packages/api
npm install express @types/express
```

#### Development Dependencies
```bash
npm install -D vitest
```

#### Peer Dependencies (for library packages)
```json
{
  "peerDependencies": {
    "react": "^18.0.0"
  }
}
```

### 9.3 Making Changes

```bash
# 1. Create feature branch
git checkout -b feature/add-new-endpoint

# 2. Make changes to package
cd packages/api
vim src/routes/new-endpoint.ts

# 3. Build to check for errors
npm run build

# 4. Run tests
npm test

# 5. Commit changes
git add .
git commit -m "feat(api): add new endpoint for X"

# 6. Push and create PR
git push origin feature/add-new-endpoint
```

---

## 10. Dependency Management

### 10.1 Workspace Dependencies

```json
// packages/api/package.json
{
  "dependencies": {
    "@vpn-enterprise/auth": "file:../auth",
    "@vpn-enterprise/database": "file:../database",
    "@vpn-enterprise/vpn-core": "file:../vpn-core",
    "@vpn-enterprise/shared": "file:../shared"
  }
}
```

### 10.2 Updating Dependencies

```bash
# Update all packages
npm update

# Update specific package
cd packages/api
npm update express

# Check outdated packages
npm outdated
```

### 10.3 Version Management

```json
// Root package.json - lock versions
{
  "overrides": {
    "react": "^19.0.0"
  }
}
```

---

## 11. Troubleshooting

### 11.1 Build Errors

#### Issue: "Cannot find module '@vpn-enterprise/auth'"

**Solution:**
```bash
# Reinstall workspace dependencies
cd /path/to/repo
rm -rf node_modules
npm install

# Rebuild all packages
npm run build
```

#### Issue: TypeScript errors after updating package

**Solution:**
```bash
# Clear TypeScript cache
cd packages/api
rm -rf dist/ node_modules/.cache/

# Rebuild with clean slate
npm run build
```

### 11.2 Runtime Errors

#### Issue: "Module not found" in production

**Solution:**
- Check that package is built before deployment
- Verify `dist/` folder exists
- Check `package.json` exports are correct

```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"]
}
```

#### Issue: Environment variables not loading

**Solution:**
```typescript
// Load .env from repo root
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
```

### 11.3 Dependency Issues

#### Issue: Version conflicts

**Solution:**
```bash
# Check which packages depend on conflicting version
npm ls problematic-package

# Use overrides in root package.json
{
  "overrides": {
    "problematic-package": "^3.0.0"
  }
}
```

---

## 12. Best Practices

### 12.1 Package Design

✅ **Single Responsibility** - Each package should have one clear purpose  
✅ **Loose Coupling** - Minimize dependencies between packages  
✅ **High Cohesion** - Related functionality stays together  
✅ **Clear Interfaces** - Export clean, documented APIs  
✅ **Type Safety** - Use TypeScript types everywhere  

### 12.2 Code Organization

```
packages/my-package/
├── src/
│   ├── index.ts           # Public exports only
│   ├── types.ts           # Type definitions
│   ├── services/          # Business logic
│   ├── utils/             # Helpers
│   └── internal/          # Private implementation
├── test/                  # Tests
├── package.json
├── tsconfig.json
└── README.md              # Package documentation
```

### 12.3 Naming Conventions

#### Packages
- Use kebab-case: `tenant-provisioner`, `database-manager`
- Namespace: `@vpn-enterprise/package-name`

#### Files
- Use kebab-case: `vpn-server-manager.ts`
- Test files: `*.test.ts`
- Type files: `*.types.ts` or `types.ts`

#### Exports
- Use PascalCase for classes: `VPNServerManager`
- Use camelCase for functions: `createServer`
- Use UPPER_CASE for constants: `MAX_CONNECTIONS`

### 12.4 Documentation

#### Document Public APIs
```typescript
/**
 * Manages VPN server lifecycle and operations.
 * 
 * @example
 * ```typescript
 * const manager = new VPNServerManager();
 * const server = await manager.createServer({
 *   name: 'vpn-us-1',
 *   region: 'us-east',
 *   port: 51820
 * });
 * ```
 */
export class VPNServerManager {
  /**
   * Creates a new VPN server instance.
   * 
   * @param config - Server configuration
   * @returns Created server with credentials
   * @throws {ValidationError} If config is invalid
   */
  async createServer(config: ServerConfig): Promise<Server> {
    // Implementation
  }
}
```

#### Add Package README
```markdown
# @vpn-enterprise/package-name

Brief description of what this package does.

## Installation

```bash
npm install @vpn-enterprise/package-name
```

## Usage

```typescript
import { Thing } from '@vpn-enterprise/package-name';
```

## API

### `Thing`

Description...
```

### 12.5 Testing

✅ **Unit Tests** - Test individual functions/classes  
✅ **Integration Tests** - Test package interactions  
✅ **E2E Tests** - Test complete workflows  
✅ **Mock External Dependencies** - Use test doubles for databases, APIs  
✅ **Test Edge Cases** - Error handling, empty inputs, limits  

```typescript
// Good test structure
describe('ServerLoadBalancer', () => {
  describe('selectServer', () => {
    it('selects least loaded server', () => { /* ... */ });
    it('prefers regional servers', () => { /* ... */ });
    it('throws when no servers available', () => { /* ... */ });
    it('handles equal load distribution', () => { /* ... */ });
  });
});
```

### 12.6 Error Handling

```typescript
// Use custom error classes
import { ValidationError, NotFoundError } from '@vpn-enterprise/shared';

export class ServerRepository {
  async getById(id: string): Promise<Server> {
    if (!id) {
      throw new ValidationError('Server ID is required', 'id');
    }

    const server = await this.findServer(id);
    if (!server) {
      throw new NotFoundError('Server');
    }

    return server;
  }
}
```

### 12.7 Security

✅ **Never commit secrets** - Use environment variables  
✅ **Validate all inputs** - Use Zod or similar validation  
✅ **Sanitize user data** - Prevent SQL injection, XSS  
✅ **Use parameterized queries** - Never concatenate SQL  
✅ **Implement rate limiting** - Prevent abuse  
✅ **Log security events** - Audit trail for compliance  

```typescript
// Good: Parameterized query
const { rows } = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// Bad: SQL injection vulnerability
const { rows } = await pool.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

---

## Quick Reference Commands

```bash
# Install all dependencies
npm install

# Build all packages
npm run build

# Build single package
cd packages/api && npm run build

# Run tests
npm test

# Run tests for single package
cd packages/api && npm test

# Start API in dev mode
cd packages/api && npm run dev

# Add dependency to package
cd packages/api && npm install package-name

# Check for outdated dependencies
npm outdated

# Update dependencies
npm update

# Clean build artifacts
npm run clean

# Lint all packages
npm run lint

# Type check
npx tsc --noEmit --project packages/api
```

---

**Last Updated:** February 1, 2026  
**Maintain this guide as the project evolves** 🚀

---

*This is your lifetime reference for the VPN Enterprise packages architecture. Keep it updated as you add new packages or change existing ones.*
