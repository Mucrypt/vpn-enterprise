# Terminal System Deployment Checklist

## ✅ Completed

### Backend Implementation
- [x] **ContainerManager Service** - Docker container lifecycle with security hardening
  - Read-only filesystem, capability dropping, non-root execution
  - Command sanitization with whitelist approach
  - Resource limits: 512MB RAM, 1 CPU, 2GB disk
  - Auto-cleanup after 60 minutes
  - Location: `packages/api/src/services/ContainerManager.ts`

- [x] **TerminalWebSocketHandler** - Real-time terminal communication
  - WebSocket server for bidirectional communication
  - Rate limiting: 50 commands/minute
  - Session management with 30-minute timeout
  - Auth validation per connection
  - Location: `packages/api/src/services/TerminalWebSocketHandler.ts`

- [x] **PreviewProxyService** - HTTP/WebSocket proxying for dev servers
  - Proxies to containerized applications
  - WebSocket upgrade handling for HMR (Hot Module Reload)
  - Session ownership verification
  - 1-hour inactivity timeout
  - Location: `packages/api/src/services/PreviewProxyService.ts`

- [x] **Terminal Routes** - REST API endpoints
  - `POST /api/v1/terminal/workspaces` - Create workspace
  - `GET /api/v1/terminal/workspaces/:id` - Get workspace info
  - `DELETE /api/v1/terminal/workspaces/:id` - Stop workspace
  - `POST /api/v1/terminal/workspaces/:id/exec` - Execute command (fallback)
  - `ALL /api/v1/terminal/preview/:id/*` - Preview proxy
  - Location: `packages/api/src/routes/terminal.ts`

- [x] **API Integration** - Services wired into Express app
  - WebSocket handler initialized with HTTP server
  - Preview proxy integrated into upgrade handler
  - Location: `packages/api/src/app.ts`

- [x] **Dependencies Installed**
  - `http-proxy@1.18.1` - HTTP/WebSocket proxying
  - `@types/http-proxy@1.17.15` - TypeScript types
  - `@types/ws@8.5.13` - WebSocket types
  - `ws` (already installed) - WebSocket library

- [x] **TypeScript Build** - Compilation successful ✅
  - Fixed type errors in PreviewProxyService
  - All services compile without errors

- [x] **Documentation**
  - Comprehensive technical docs: `packages/api/TERMINAL_SYSTEM.md`
  - Architecture diagrams, API specs, security model
  - WebSocket protocol documentation
  - Troubleshooting guide
  - NexusAI database integration docs

- [x] **Migration Scripts**
  - Local migration: `scripts/run-nexusai-migration.sh`
  - Remote Hetzner migration: `scripts/hetzner/run-nexusai-migration-remote.sh`

### Database Schema
- [x] **Migration File Created**
  - `packages/database/migrations/004_nexusai_generated_apps.sql`
  - Tables: `nexusai_generated_apps`, `nexusai_app_files`
  - Indexes, triggers, helper functions included

## 🚀 Next Steps

### 1. Run Database Migration on Hetzner (REQUIRED)

```bash
# From your local machine
cd /home/mukulah/vpn-enterprise
./scripts/hetzner/run-nexusai-migration-remote.sh
```

This creates the required tables:
- `nexusai_generated_apps` - Stores app metadata
- `nexusai_app_files` - Stores app code/files

**Verification:**
```bash
ssh root@157.180.123.240
docker exec -i vpn-postgres psql -U platform_admin -d platform_db -c "\dt nexusai_*"
```

Expected output:
```
                       List of relations
 Schema |         Name          | Type  |      Owner      
--------+-----------------------+-------+-----------------
 public | nexusai_app_files     | table | platform_admin
 public | nexusai_generated_apps| table | platform_admin
```

### 2. Deploy Updated API to Hetzner

**Option A: Using Docker Compose (Recommended)**
```bash
# From Hetzner server
cd /root/vpn-enterprise
git pull origin main
cd infrastructure/docker
docker compose -f docker-compose.prod.yml up -d --build api
```

**Option B: Using Deploy Script**
```bash
# From local machine
./scripts/hetzner/deploy-prod.sh --pull --build
```

**Verify Deployment:**
```bash
# Check API health
curl -k https://chatbuilds.com/api/health

# Check terminal endpoints exist
curl -k https://chatbuilds.com/api/v1/terminal/workspaces \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Update Frontend Terminal Component

**File:** `apps/nexusAi/chat-to-code-38/src/components/Terminal.tsx`

**Required Changes:**
- Replace simulated terminal with WebSocket connection
- Connect to `wss://chatbuilds.com/api/v1/terminal/workspaces/ws`
- Send commands via WebSocket instead of simulation
- Display real command output from container
- Handle connection/reconnection logic

**Example WebSocket Integration:**
```typescript
const ws = new WebSocket(`wss://chatbuilds.com/api/v1/terminal/workspaces/ws`);

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: accessToken,
    workspaceId: workspaceId
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'output') {
    addOutput(data.output);
  }
};

// Send commands
ws.send(JSON.stringify({
  type: 'command',
  command: 'npm install'
}));
```

### 4. Test End-to-End Flow

**Generate New App:**
1. Go to nexusAI app builder
2. Generate a new React/Next.js app
3. Verify app appears in "My Apps"
4. Click "Open Terminal" button

**In Terminal:**
```bash
# Test basic commands
ls -la
cat package.json
npm install
npm run dev

# Check preview
# App should be accessible at preview URL
```

**Verify Database:**
```sql
-- Check app was saved
SELECT id, app_name, framework, status FROM nexusai_generated_apps 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC LIMIT 5;

-- Check files were saved
SELECT COUNT(*), SUM(file_size) FROM nexusai_app_files 
WHERE app_id = 'YOUR_APP_ID';
```

### 5. Monitor Production

**Health Checks:**
```bash
# API health
curl https://chatbuilds.com/api/health

# Terminal system health (requires auth)
curl -H "Authorization: Bearer TOKEN" https://chatbuilds.com/api/v1/terminal/workspaces
```

**Container Monitoring:**
```bash
# On Hetzner server
docker ps --filter "name=nexusai-workspace-"
docker stats --no-stream nexusai-workspace-*
```

**Logs:**
```bash
# API logs
docker logs vpn-api --tail 100 -f | grep Terminal

# Specific workspace logs
docker logs nexusai-workspace-USER_ID-APP_ID
```

## 🔒 Security Checklist

- [x] Command whitelist implemented (no arbitrary shell execution)
- [x] Read-only filesystem in containers
- [x] All Linux capabilities dropped
- [x] No new privileges flag set
- [x] Non-root user (node:node) execution
- [x] Rate limiting (50 commands/minute)
- [x] Resource limits enforced
- [x] Auto-cleanup of idle containers
- [x] WebSocket auth token validation
- [x] Preview session ownership verification

## 📊 Key Metrics to Monitor

- **Container Churn**: Containers created/destroyed per hour
- **Average Session Duration**: How long users keep containers alive
- **Command Rate**: Commands executed per minute
- **Resource Usage**: CPU/Memory per container
- **Error Rate**: Failed container creations, timeouts
- **Preview Usage**: Preview sessions per workspace

## 🐛 Known Limitations

1. **No TTY Support**: Full terminal emulation (colors, cursor control) not yet implemented
2. **No File Upload**: Users can't upload files directly, only via generated code
3. **Single User per Workspace**: No collaborative editing yet
4. **No Persistent Storage**: Containers are ephemeral, data lost on stop
5. **Limited Framework Support**: Optimized for Node.js/Python projects

## 🔮 Future Enhancements

- [ ] Full TTY support with pty.js for better UX
- [ ] File browser UI for navigating workspace
- [ ] Collaborative terminals (multiple users)
- [ ] Terminal playback/recording for debugging
- [ ] Custom Docker images per framework
- [ ] GPU support for ML/AI workloads
- [ ] Persistent volumes for long-term storage
- [ ] Container snapshots for quick restore
- [ ] Resource usage analytics dashboard
- [ ] Auto-deploy to production from terminal

## 📝 Rollback Plan

If issues arise after deployment:

```bash
# On Hetzner server
cd /root/vpn-enterprise
git log --oneline -5  # Find previous commit
git checkout PREVIOUS_COMMIT_HASH

# Rebuild API
cd infrastructure/docker
docker compose -f docker-compose.prod.yml up -d --build api

# Drop new tables if needed (emergency only)
docker exec -i vpn-postgres psql -U platform_admin -d platform_db -c "
DROP TABLE IF EXISTS nexusai_app_files CASCADE;
DROP TABLE IF EXISTS nexusai_generated_apps CASCADE;
"
```

## 🎯 Success Criteria

- [ ] Users can generate apps via nexusAI frontend
- [ ] Apps are saved to `nexusai_generated_apps` table
- [ ] App files are stored in `nexusai_app_files` table
- [ ] Terminal opens and shows real container shell
- [ ] Commands execute and return output in real-time
- [ ] `npm install` works and installs dependencies
- [ ] `npm run dev` starts dev server
- [ ] Preview URL loads the running application
- [ ] Container auto-cleans up after timeout
- [ ] No security vulnerabilities exploited
- [ ] System handles 10+ concurrent workspaces

## 🆘 Emergency Contacts

If terminal system causes production issues:

1. **Immediate**: Disable terminal routes in `packages/api/src/app.ts`
2. **Stop all containers**: `docker rm -f $(docker ps -aq --filter "name=nexusai-workspace-")`
3. **Check logs**: `docker logs vpn-api --tail 500`
4. **Rollback**: Use git checkout to previous stable commit

---

**Ready to deploy?** Start with Step 1: Run the database migration! 🚀
