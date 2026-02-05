# NexusAI Terminal System

World-class, production-grade terminal system for NexusAI with containerized execution, real-time WebSocket communication, and preview functionality.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Terminal.tsx)                   │
│                   WebSocket Client + UI                       │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ WebSocket (/api/v1/terminal/ws)
               ▼
┌─────────────────────────────────────────────────────────────┐
│           Terminal WebSocket Handler                         │
│  - Real-time command execution                               │
│  - Session management                                       │
│  - Rate limiting                                            │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│              Container Manager                               │
│  - Docker container lifecycle                                │
│  - Resource limits (CPU, memory, disk)                       │
│  - Command sanitization                                     │
│  - Security constraints                                     │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│          Isolated Docker Container (per workspace)           │
│  - Node.js 20 Alpine                                        │
│  - Read-only filesystem +rw /workspace                      │
│  - No privileges                                            │
│  - Resource constraints                                     │
│  - Auto-cleanup after timeout                               │
└─────────────────────────────────────────────────────────────┘
```

## 🔒 Security Features

### Container Isolation
- **Read-only root filesystem**: Prevents malicious file modifications
- **Capability dropping**: All Linux capabilities dropped except essential ones (CHOWN, SETGID, SETUID)
- **No new privileges**: Prevents privilege escalation
- **Non-root user**: Runs as `node` user (UID 1000)
- **Resource limits**: CPU, memory, and disk quotas enforced
- **Network isolation**: Dedicated Docker network

### Command Sanitization
- **Whitelist-based**: Only allowed commands can be executed
- **Injection prevention**: Blocks command chaining (`;`, `&&`, `||`, `|`)
- **Path restriction**: Prevents directory traversal attacks
- **Timeout enforcement**: Commands killed after max execution time

### Rate Limiting
- 50 commands per minute per user
- Session cleanup after 30 minutes of inactivity
- Maximum 5 containers per user

### Allowed Commands
```typescript
['npm', 'yarn', 'pnpm', 'node', 'npx', 'ls', 'cat', 'pwd', 'cd', 
 'mkdir', 'touch', 'echo', 'git', 'vite', 'next']
```

## 📡 API Endpoints

### REST API

#### Create Workspace
```http
POST /api/v1/terminal/workspaces
Authorization: Bearer <token>
Content-Type: application/json

{
  "workspaceId": "my-app-123",
  "memoryLimit": "512m",      // optional
  "cpuLimit": "1.0",          // optional
  "diskLimit": "2G",          // optional
  "timeoutMinutes": 60        // optional
}
```

**Response:**
```json
{
  "message": "Workspace created successfully",
  "container": {
    "containerId": "abc123",
    "workspaceId": "my-app-123",
    "status": "running",
    "ports": [{"internal": 3000, "external": 3456}]
  },
  "wsUrl": "/api/v1/terminal/ws?workspaceId=my-app-123&userId=user123"
}
```

#### Get Workspace Info
```http
GET /api/v1/terminal/workspaces/:workspaceId
Authorization: Bearer <token>
```

#### List User Workspaces
```http
GET /api/v1/terminal/workspaces
Authorization: Bearer <token>
```

#### Delete Workspace
```http
DELETE /api/v1/terminal/workspaces/:workspaceId
Authorization: Bearer <token>
```

#### Execute Command (REST fallback)
```http
POST /api/v1/terminal/workspaces/:workspaceId/exec
Authorization: Bearer <token>
Content-Type: application/json

{
  "command": "npm install",
  "timeout": 300000,  // optional, ms
  "cwd": "/workspace" // optional
}
```

### WebSocket API

#### Connect
```javascript
const ws = new WebSocket(
  `wss://api.example.com/api/v1/terminal/ws?workspaceId=${workspaceId}&userId=${userId}&token=${token}`
)
```

#### Send Command
```javascript
ws.send(JSON.stringify({
  type: 'command',
  command: 'npm install react'
}))
```

#### Message Types

**From Client:**
- `command`: Execute a command
- `ping`: Keep-alive ping
- `resize`: Terminal resize event (for future TTY support)

**From Server:**
- `info`: Informational message
- `success`: Success message
- `error`: Error message
- `output`: Command stdout
- `executing`: Command started
- `prompt`: Display prompt (`$`)
- `clear`: Clear terminal
- `pong`: Response to ping

## 🎯 Preview System

The preview system proxies HTTP requests to running dev servers inside containers.

### Start Dev Server
```bash
$ npm run dev
```

### Access Preview
```
https://api.example.com/api/v1/terminal/preview/<workspaceId>/
```

### Features
- **Hot Module Replacement (HMR)**: WebSocket proxying for Vite/Next.js HMR
- **Auto-routing**: Automatically routes to container's port 3000
- **Session management**: 1-hour inactivity timeout
- **Access control**: Only workspace owner can access preview

### Get Preview Info
```http
GET /api/v1/terminal/preview/:workspaceId/info
Authorization: Bearer <token>
```

## 🚀 Usage Examples

### Basic Terminal Session
```typescript
// 1. Create workspace
const response = await fetch('/api/v1/terminal/workspaces', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ workspaceId: 'my-app' })
})

const { wsUrl } = await response.json()

// 2. Connect via WebSocket
const ws = new WebSocket(`wss://${host}${wsUrl}&token=${token}`)

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data)
  console.log(`[${msg.type}]`, msg.content)
}

// 3. Send command
ws.send(JSON.stringify({
  type: 'command',
  command: 'npm init -y'
}))
```

### Install Dependencies and Start Dev Server
```bash
$ npm install react react-dom vite
$ npm install -D @vitejs/plugin-react
$ npx create-vite@latest . --template react
$ npm run dev
```

Then access preview at:
```
https://chatbuilds.com/api/v1/terminal/preview/my-app/
```

## 📊 Monitoring

### Container Stats
```typescript
const usage = await containerManager.getResourceUsage(workspaceId)
// { memory: 120.5, cpu: 15.2 }
```

### Active Sessions
```typescript
const count = terminalWSHandler.getActiveSessionsCount()
const userSessions = terminalWSHandler.getUserSessions(userId)
```

### Preview Stats
```typescript
const stats = previewProxyService.getStats()
// { totalSessions: 5, sessions: [...] }
```

## ⚙️ Configuration

### Environment Variables
```bash
# Workspace directory
WORKSPACES_DIR=/tmp/nexusai-workspaces

# Container defaults
DEFAULT_MEMORY_LIMIT=512m
DEFAULT_CPU_LIMIT=1.0
DEFAULT_DISK_LIMIT=2G
DEFAULT_TIMEOUT_MINUTES=60

# Security
MAX_CONTAINERS_PER_USER=5
SESSION_TIMEOUT_MINUTES=30
COMMAND_TIMEOUT_MS=300000

# Rate limiting
RATE_LIMIT_MAX_COMMANDS=50
RATE_LIMIT_WINDOW_MS=60000
```

## 🧹 Cleanup

### Automatic Cleanup
- Containers auto-delete after timeout (default: 60 minutes)
- Inactive WebSocket sessions closed after 30 minutes
- Preview sessions expire after 1 hour of inactivity
- Orphaned containers cleaned on server start

### Manual Cleanup
```typescript
// Stop specific workspace
await containerManager.stopContainer(workspaceId)

// Cleanup all (on shutdown)
await containerManager.cleanupAll()
```

## 🛡️ Best Practices

### For Users
1. **Start small**: Test with simple commands before running complex builds
2. **Monitor resources**: Check container stats if experiencing slowness
3. **Use timeouts**: Set appropriate timeouts for long-running commands
4. **Clean up**: Delete workspaces when done to free resources

### For Developers
1. **Validate input**: Always validate workspace IDs and commands
2. **Handle errors**: Implement proper error handling for all API calls
3. **Rate limit**: Respect rate limits to avoid blocks
4. **WebSocket health**: Implement ping/pong for connection health
5. **Progressive enhancement**: Use REST fallback when WebSocket unavailable

## �️ NexusAI Database Integration

### Database Schema
The terminal system works with the following NexusAI tables in `platform_db`:

```sql
-- Stores AI-generated applications
nexusai_generated_apps (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID,
  app_name VARCHAR(255) NOT NULL,
  framework VARCHAR(50) NOT NULL,
  requires_database BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'generated',
  deployment_url TEXT,
  created_at TIMESTAMP,
  ...
)

-- Stores individual files for each app
nexusai_app_files (
  id UUID PRIMARY KEY,
  app_id UUID NOT NULL REFERENCES nexusai_generated_apps(id),
  file_path VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  language VARCHAR(50),
  is_entry_point BOOLEAN DEFAULT false,
  ...
)
```

### Running the Migration

**On Hetzner Production Server:**
```bash
# From your local machine
cd /home/mukulah/vpn-enterprise
./scripts/hetzner/run-nexusai-migration-remote.sh
```

This automated script will:
1. Copy migration file to Hetzner server via SCP
2. Auto-detect the running postgres container (`vpn-postgres` or `dbplatform-postgres-primary`)
3. Execute the migration SQL to create tables
4. Verify tables were created successfully
5. Display helper functions available

**Locally (if Docker is running):**
```bash
./scripts/run-nexusai-migration.sh
# Select option 1 for Docker Postgres
```

### Workspace Creation Flow

When a user generates an app via NexusAI, the full flow is:

1. **App Generation** → AI generates code, stores in `nexusai_generated_apps` & `nexusai_app_files`
2. **Workspace Request** → Frontend calls `POST /api/v1/terminal/workspaces` with `appId`
3. **Container Creation** → Docker container created with Node.js 20 Alpine + security constraints
4. **File Sync** → Files fetched from database and written into container filesystem
5. **Dependencies** → `npm install` or `pip install` executed automatically based on framework
6. **Terminal Access** → WebSocket connection established for real-time command execution
7. **Preview** → Dev server started (e.g., `npm run dev`), accessible via `/api/v1/terminal/preview/:workspaceId/:port`
8. **Status Update** → App status updated to 'deployed', deployment_url stored

### Database Queries for Terminal Integration

```typescript
// Get app files for workspace creation
const getAppFiles = async (appId: string) => {
  const result = await pool.query(
    `SELECT file_path, content, language, is_entry_point 
     FROM nexusai_app_files 
     WHERE app_id = $1 
     ORDER BY is_entry_point DESC, file_path ASC`,
    [appId]
  );
  return result.rows;
};

// Update app deployment URL after preview
const updateDeploymentUrl = async (appId: string, url: string) => {
  await pool.query(
    `UPDATE nexusai_generated_apps 
     SET deployment_url = $1, status = 'deployed', updated_at = NOW() 
     WHERE id = $2`,
    [url, appId]
  );
};

// Get app statistics using helper function
const getAppStats = async (appId: string) => {
  const result = await pool.query(
    `SELECT * FROM get_nexusai_app_stats($1)`,
    [appId]
  );
  return result.rows[0];
  // Returns: { total_files: 15, total_size_bytes: 45678, languages: ['typescript', 'json'] }
};

// List user's generated apps
const getUserApps = async (userId: string) => {
  const result = await pool.query(
    `SELECT id, app_name, framework, status, deployment_url, created_at 
     FROM nexusai_generated_apps 
     WHERE user_id = $1 
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};
```

### Container Name Convention
```
nexusai-workspace-{userId}-{appId}
```
This ensures each user's apps are isolated and easily identifiable.

### Verify Database Setup on Hetzner

```bash
# SSH into Hetzner server
ssh root@157.180.123.240

# Check tables exist
docker exec -i vpn-postgres psql -U platform_admin -d platform_db -c "\dt nexusai_*"

# View sample data
docker exec -i vpn-postgres psql -U platform_admin -d platform_db -c "SELECT id, app_name, framework, status FROM nexusai_generated_apps LIMIT 5;"

# Check file count per app
docker exec -i vpn-postgres psql -U platform_admin -d platform_db -c "SELECT app_id, COUNT(*) as files FROM nexusai_app_files GROUP BY app_id;"
```

## �🐛 Troubleshooting

### Common Issues

**Container creation fails**
- Check Docker is running
- Verify disk space available
- Check user hasn't hit container limit (5 max)

**Command not allowed**
- Review allowed commands whitelist
- Check for command injection attempts in logs

**Preview not loading**
- Ensure dev server is running (`npm run dev`)
- Check container port mapping
- Verify preview session exists

**WebSocket disconnects**
- Implement reconnection logic with exponential backoff
- Check network stability
- Verify token hasn't expired

## 📝 Logs

Logs are prefixed for easy filtering:
- `[ContainerManager]` - Container lifecycle events
- `[TerminalWS]` - WebSocket session events
- `[PreviewProxy]` - Preview proxy requests
- `[TerminalAPI]` - REST API events

## 🔄 Future Enhancements

- [ ] Full TTY support with pty.js
- [ ] File browser UI
- [ ] Collaborative terminals (multiple users)
- [ ] Terminal playback/recording
- [ ] Custom Docker images per workspace
- [ ] GPU support for ML workloads
- [ ] Persistent storage volumes
- [ ] Container snapshots
- [ ] Resource usage analytics

## 📚 Related Documentation

- [Container Manager Service](../api/src/services/ContainerManager.ts)
- [WebSocket Handler](../api/src/services/TerminalWebSocketHandler.ts)
- [Preview Proxy Service](../api/src/services/PreviewProxyService.ts)
- [Terminal Routes](../api/src/routes/terminal.ts)
- [Terminal Component](../../apps/nexusAi/chat-to-code-38/src/components/Terminal.tsx)

## 🤝 Contributing

When adding new features:
1. Maintain security-first approach
2. Add comprehensive tests
3. Update this documentation
4. Follow existing code patterns
5. Add logging for debugging

## 📄 License

Part of VPN Enterprise / NexusAI platform.
