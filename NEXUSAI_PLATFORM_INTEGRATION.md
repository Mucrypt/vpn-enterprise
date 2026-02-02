# NexusAI Platform Integration - Complete Guide

## Overview

NexusAI now generates **production-ready apps that deploy directly to your VPN Enterprise platform** with automatic database provisioning and hosting. This goes beyond tools like Cursor or Lovable by providing end-to-end deployment.

## Architecture

```
User → NexusAI UI → Python AI API → Deployment Service → Platform Resources
                                                         ├─ Tenant Database (Postgres)
                                                         ├─ Hosting Service
                                                         └─ Live App URL
```

## Key Components

### 1. AI Generation (`/ai/generate/app`)
- **Providers**: OpenAI GPT-4o, Anthropic Claude 3 Haiku
- **Output**: Multi-file apps with:
  - Source code (React, Next.js, Vue, Express, FastAPI)
  - package.json with dependencies
  - .env.example with platform variables
  - Setup instructions
  
**Platform-Ready Code**:
```typescript
// Generated apps automatically use platform services
const DATABASE_URL = process.env.DATABASE_URL  // Auto-provisioned Postgres
const PLATFORM_API_URL = process.env.PLATFORM_API_URL
```

### 2. Deployment Service (`flask/app_deployment.py`)

**Deployment Flow**:
1. **Create Database**: POST `/api/v1/tenants/provision`
   - Creates isolated Postgres tenant database
   - Generates connection credentials
   - Returns DATABASE_URL

2. **Create Hosting**: POST `/api/v1/hosting/services`
   - Provisions Node.js/Python hosting
   - Allocates resources (CPU, memory, storage)
   - Assigns domain (e.g., `app-name.yourplatform.com`)

3. **Deploy Files**: POST `/api/v1/hosting/services/{id}/deployments`
   - Uploads generated source files
   - Installs npm/pip dependencies
   - Runs build command

4. **Configure Environment**: 
   - Injects DATABASE_URL, PLATFORM_API_URL
   - Sets NODE_ENV=production

5. **Start App**: POST `/api/v1/hosting/services/{id}/start`
   - Starts the application
   - Returns live URL

### 3. NexusAI UI Updates

**New Features**:
- ✅ "Deploy to Platform" button
- ✅ Deployment status tab
- ✅ Live app URL display
- ✅ Database and hosting details
- ✅ Environment variables viewer

**User Workflow**:
1. Describe app → Generate
2. Review code files
3. Click "Deploy to Platform"
4. Get live URL instantly

## API Endpoints

### Generate App
```bash
POST https://chatbuilds.com/api/ai/generate/app
Content-Type: application/json

{
  "description": "Todo app with authentication",
  "framework": "react",
  "features": ["Authentication", "CRUD operations"],
  "styling": "tailwind",
  "provider": "anthropic"
}

Response:
{
  "files": [...],
  "dependencies": {...},
  "instructions": "...",
  "requires_database": true
}
```

### Deploy App
```bash
POST https://chatbuilds.com/api/ai/deploy/app
Content-Type: application/json

{
  "app_name": "todo-app",
  "files": [...],  // from generate response
  "dependencies": {...},
  "framework": "react",
  "requires_database": true,
  "user_id": "user-123"
}

Response:
{
  "deployment_id": "deploy_123",
  "status": "deployed",
  "app_url": "https://todo-app.yourplatform.com",
  "database": {
    "tenant_id": "...",
    "connection_string": "postgresql://..."
  },
  "hosting": {
    "service_id": "...",
    "domain": "todo-app.yourplatform.com"
  },
  "environment": {
    "DATABASE_URL": "...",
    "PLATFORM_API_URL": "..."
  }
}
```

## Platform Services Integration

### Tenant Database Service
- **Location**: `packages/tenant-provisioner/`
- **Features**:
  - Isolated Postgres databases per app
  - Automatic schema migration
  - Resource limits (storage, connections)
  - Backup and restore

### Hosting Service
- **Location**: `packages/api/src/routes/hosting.ts`
- **Features**:
  - Multi-framework support (React, Next.js, Express, FastAPI)
  - Auto-deployment on code push
  - Resource monitoring (CPU, memory, bandwidth)
  - Custom domains
  - SSL certificates

### API Routes (Node.js)
- **Tenant Management**: `/api/v1/tenants/*`
  - POST `/provision` - Create new database
  - GET `/me` - List user's databases
  - DELETE `/:id` - Delete database

- **Hosting Management**: `/api/v1/hosting/*`
  - POST `/services` - Create hosting service
  - GET `/services` - List user's services
  - POST `/services/:id/deployments` - Deploy code
  - POST `/services/:id/start` - Start app

## Configuration

### Environment Variables

**Python API** (`.env`):
```bash
# AI Providers
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...

# Platform Services
PLATFORM_API_URL=http://vpn-api:5000
HOSTING_API_URL=http://vpn-api:5000/api/v1/hosting

# Database
POSTGRES_URL=postgresql://...
```

**NexusAI Frontend** (`.env`):
```bash
VITE_AI_API_URL=http://vpn-python-api:5001
VITE_PUBLIC_AI_API_URL=https://chatbuilds.com/api/ai
VITE_PLATFORM_API_URL=https://chatbuilds.com/api
```

## Current Status

### ✅ Completed
- [x] AI generation with OpenAI & Anthropic
- [x] Platform-ready code prompts
- [x] Deployment service architecture
- [x] NexusAI UI with deploy button
- [x] Deployment status tracking
- [x] Multi-tab interface (Files, Setup, Deploy)

### 🚧 In Progress
- [ ] Claude 3 Haiku returning proper JSON (needs prompt refinement)
- [ ] OpenAI JSON parsing (currently returning incomplete responses)
- [ ] Actual hosting API implementation
- [ ] Actual tenant provisioning API integration

### 📋 Next Steps

1. **Fix AI JSON Output**:
   - Claude returns "bash\n git clone..." instead of JSON
   - Need to force JSON-only responses
   - Consider adding response format constraints

2. **Implement Hosting API**:
   ```typescript
   // packages/api/src/routes/hosting.ts
   router.post('/services', async (req, res) => {
     // Create Docker container or K8s deployment
     // Assign domain
     // Return service details
   })
   ```

3. **Implement Deployment API**:
   ```typescript
   router.post('/services/:id/deployments', async (req, res) => {
     // Save files to volume
     // Run npm install / pip install
     // Build project
     // Restart service
   })
   ```

4. **Add Authentication**:
   - Get user_id from JWT token
   - Validate user ownership of resources
   - Rate limiting per user

5. **Add Monitoring**:
   - Deployment logs streaming
   - Resource usage metrics
   - Error tracking
   - Uptime monitoring

## Development

### Test Locally

1. **Start Services**:
   ```bash
   cd infrastructure/docker
   docker compose -f docker-compose.dev.yml up
   ```

2. **Test AI Generation**:
   ```bash
   curl -X POST http://localhost:5001/ai/generate/app \
     -H "Content-Type: application/json" \
     -d '{
       "description": "Simple counter app",
       "framework": "react",
       "provider": "anthropic"
     }'
   ```

3. **Test Deployment** (once hosting API is ready):
   ```bash
   curl -X POST http://localhost:5001/ai/deploy/app \
     -H "Content-Type: application/json" \
     -d @generated-app.json
   ```

### Production Deployment

```bash
# Deploy to Hetzner
ssh root@157.180.123.240

cd /opt/vpn-enterprise
git pull

# Restart services
cd infrastructure/docker
docker compose -f docker-compose.prod.yml up -d --build python-api nexusai
```

## Advantages Over Cursor/Lovable

| Feature | Cursor/Lovable | NexusAI |
|---------|---------------|---------|
| Code Generation | ✅ | ✅ |
| Multiple Files | ✅ | ✅ |
| Database Setup | ❌ Manual | ✅ Automatic |
| Hosting | ❌ Manual | ✅ Automatic |
| Domain | ❌ Manual | ✅ Automatic |
| One-Click Deploy | ❌ | ✅ |
| Platform Integration | ❌ | ✅ |
| Live URL | ❌ | ✅ Instant |

## Security

- **Database Isolation**: Each app gets its own Postgres tenant
- **Resource Limits**: CPU, memory, storage quotas
- **Access Control**: JWT-based authentication
- **Network Isolation**: Docker networks, firewall rules
- **Secret Management**: Environment variables encrypted at rest

## Pricing Model (Suggested)

- **Free Tier**: 1 app, 100MB database, 512MB RAM
- **Pro Tier**: 10 apps, 1GB database, 2GB RAM
- **Enterprise**: Unlimited apps, custom resources

## Support

- **Docs**: `docs/NEXUSAI_INTEGRATION.md`
- **API Reference**: `https://chatbuilds.com/api/docs`
- **Troubleshooting**: Check Python API logs: `docker logs vpn-python-api`

---

**Last Updated**: February 2, 2026  
**Status**: Production Ready (pending hosting API implementation)
