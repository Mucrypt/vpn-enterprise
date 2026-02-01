# Infrastructure Alignment - CI/CD ↔ Docker

## 🎯 Overview

This document explains how the CI/CD pipeline was aligned with your actual Docker infrastructure.

---

## 📦 Your Actual Container Structure

### Development (`docker-compose.dev.yml`)

```
api-dev:5000          → Node.js/Express API
web-dev:3000          → Next.js Dashboard
redis-dev:6379        → Redis cache
n8n-dev:5678          → Workflow automation
nexusai-dev:8080      → AI chat-to-code builder
ollama-dev:11434      → Local AI models
python-api-dev:5001   → FastAPI AI service
```

### Production (`docker-compose.prod.yml`)

```
nginx:80/443          → REVERSE PROXY (Entry point for all traffic)
api:5000              → Node.js/Express API
web:3000              → Next.js Dashboard
postgres:5432         → PostgreSQL database
pgadmin               → Database admin
redis:6379            → Redis cache
n8n:5678              → Workflow automation
python-api:5001       → FastAPI AI service
ollama:11434          → AI model hosting
nexusai:80            → Chat-to-code builder
```

### Nginx Routing (Production)

```
chatbuilds.com                    → web container
chatbuilds.com/api                → api container
python-api.chatbuilds.com         → python-api container
nexusai.domain.com                → nexusai container
chatbuilds.com/pgadmin            → pgadmin container
chatbuilds.com/n8n                → n8n container
```

---

## ❌ Problems Found & Fixed

### 1. **Wrong Service Names**

**Before:**

```yaml
SERVICES="api,web,python-api,database-manager,tenant-provisioner"
```

**Issues:**

- `database-manager` doesn't exist (should be `postgres`)
- `tenant-provisioner` doesn't exist
- Missing `nginx` - the most critical service!

**After:**

```yaml
SERVICES="api,web,python-api,nginx"
```

### 2. **Missing Nginx Deployments**

**Problem:** Nginx is your reverse proxy and entry point. Even if you deploy api/web successfully, users could still be routed to old instances if nginx isn't reloaded.

**Fixed:**

- Development: Added nginx restart after service deployments
- Staging: Added nginx reload after rolling updates
- Production: Special handling for nginx with graceful reload
  ```bash
  docker exec vpn-nginx nginx -s reload
  ```

### 3. **Incorrect Docker Compose Paths**

**Before:** Used generic `docker-compose.yml`
**After:** Uses correct environment-specific files:

- Dev: `infrastructure/docker/docker-compose.dev.yml`
- Staging/Prod: `infrastructure/docker/docker-compose.prod.yml`

### 4. **Health Check Container Names**

Your workflow checks `vpn-${service}` which matches:

```
vpn-api          ✅
vpn-web          ✅
vpn-python-api   ✅
vpn-nginx        ✅
vpn-postgres     ✅
vpn-redis        ✅
```

This is correct and maintained.

---

## 🔧 What Changed in the Workflow

### Pre-Deploy Job

```diff
- SERVICES="api,web,python-api,database-manager,tenant-provisioner"
+ SERVICES="api,web,python-api,nginx"
```

### Development Deployment

```diff
  docker compose -f infrastructure/docker/docker-compose.dev.yml up -d --no-deps $service
+ # Always restart nginx to reload config
+ docker compose -f infrastructure/docker/docker-compose.dev.yml restart nginx 2>/dev/null
```

### Staging Deployment

```diff
- docker compose pull $service
+ docker compose -f infrastructure/docker/docker-compose.prod.yml pull $service

- docker compose up -d --no-deps --force-recreate $service
+ docker compose -f infrastructure/docker/docker-compose.prod.yml up -d --no-deps --force-recreate $service

+ # Always reload nginx last
+ docker exec vpn-nginx nginx -s reload || docker restart vpn-nginx
```

### Production Deployment

```diff
- docker compose pull $service
+ docker compose -f infrastructure/docker/docker-compose.prod.yml pull $service

+ # Special handling for nginx
+ if [[ "$service" == "nginx" ]]; then
+   docker exec vpn-nginx nginx -s reload || docker compose restart nginx
+   continue
+ fi

- docker compose up -d --no-deps --scale ${service}=2
+ docker compose -f infrastructure/docker/docker-compose.prod.yml up -d --no-deps --scale ${service}=2
```

### Rollback

```diff
- docker compose down
- docker compose up -d
+ docker compose -f infrastructure/docker/docker-compose.prod.yml down
+ docker compose -f infrastructure/docker/docker-compose.prod.yml up -d
```

---

## 🚀 Deployment Flow (Corrected)

### Production Blue-Green Deployment:

1. Pull new images for each service
2. **Special nginx handling:**
   - Don't scale nginx (can't have 2 reverse proxies)
   - Reload configuration instead: `nginx -s reload`
   - Zero downtime
3. For other services (api, web, python-api):
   - Scale to 2 instances
   - Wait for health check on new instance
   - Scale back to 1 (removes old instance)
   - Zero downtime achieved
4. Clean up old Docker images
5. Final health checks through nginx

---

## 🎯 Service Priority Order

When deploying "all" services, they deploy in this order:

1. **api** - Backend API (other services depend on this)
2. **web** - Frontend dashboard
3. **python-api** - AI/FastAPI service
4. **nginx** - Reverse proxy (last, so it routes to new services)

---

## 🔐 Required Secrets (Reminder)

Make sure these exist in GitHub repository settings:

### Development

- `DEV_DEPLOY_HOST`
- `DEV_DEPLOY_USER`
- `DEV_DEPLOY_SSH_KEY`

### Staging

- `STAGING_DEPLOY_HOST`
- `STAGING_DEPLOY_USER`
- `STAGING_DEPLOY_SSH_KEY`

### Production

- `PROD_DEPLOY_HOST` (Your Hetzner server IP)
- `PROD_DEPLOY_USER` (SSH username, likely `root`)
- `PROD_DEPLOY_SSH_KEY` (Private SSH key)

### Optional

- `SLACK_WEBHOOK` (For notifications)

---

## 🐳 Docker Compose Files Reference

### Development: `infrastructure/docker/docker-compose.dev.yml`

- Used for: Local development
- Services: 7 containers
- Port exposure: Direct (5000, 3001, 6379, etc.)
- Volumes: Live code mounting
- Hot reload: Enabled

### Production: `infrastructure/docker/docker-compose.prod.yml`

- Used for: Production and staging
- Services: 10 containers
- Port exposure: Only nginx (80, 443)
- Internal network: 172.20.0.0/16
- Secrets: File-based via `./secrets/`
- Health checks: Enabled on all critical services
- Resource limits: CPU and memory constrained
- Logging: JSON format, 10MB rotation

---

## 📊 Container Resource Allocation (Production)

| Service    | CPU Limit | Memory Limit | Role          |
| ---------- | --------- | ------------ | ------------- |
| nginx      | 1.0       | 512M         | Reverse proxy |
| api        | 2.0       | 2G           | Backend API   |
| web        | 1.5       | 1G           | Frontend      |
| postgres   | 2.0       | 4G           | Database      |
| redis      | 1.0       | 512M         | Cache         |
| python-api | 4.0       | 4G           | AI service    |
| ollama     | 4.0       | 8G           | AI models     |
| n8n        | 1.5       | 2G           | Workflows     |
| nexusai    | 2.0       | 2G           | Code builder  |

---

## ✅ Testing Your Deployment

### 1. Verify Services Are Running

```bash
ssh root@your-hetzner-ip
cd /opt/vpn-enterprise
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expected output:

```
vpn-nginx        Up 10 minutes    0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
vpn-api          Up 10 minutes    (healthy)
vpn-web          Up 10 minutes    (healthy)
vpn-python-api   Up 10 minutes    (healthy)
vpn-postgres     Up 10 minutes    (healthy)
vpn-redis        Up 10 minutes    (healthy)
vpn-n8n          Up 10 minutes    (healthy)
vpn-ollama       Up 10 minutes    (healthy)
```

### 2. Test Health Endpoints

```bash
# From your Hetzner server
curl http://localhost/health          # Should return 200 via nginx
curl http://localhost/api/health      # Should return 200
curl http://localhost:5001/health     # Python API direct

# From external
curl https://chatbuilds.com/health
curl https://chatbuilds.com/api/health
```

### 3. Check Nginx Configuration

```bash
docker exec vpn-nginx nginx -t        # Test config syntax
docker exec vpn-nginx nginx -s reload # Reload gracefully
```

### 4. View Logs

```bash
# All services
docker compose -f infrastructure/docker/docker-compose.prod.yml logs --tail=50

# Specific service
docker logs vpn-nginx --tail=50
docker logs vpn-api --tail=50
```

---

## 🚨 Troubleshooting

### "Service not found" during deployment

- Check container name: `docker ps -a | grep vpn-`
- Verify docker-compose.prod.yml has the service defined
- Ensure service name matches in CI/CD workflow

### Nginx not routing correctly

```bash
# Reload nginx config
docker exec vpn-nginx nginx -s reload

# Check nginx config
docker exec vpn-nginx nginx -t

# View nginx logs
docker logs vpn-nginx --tail=100

# Restart nginx if needed
docker restart vpn-nginx
```

### Health checks failing

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' vpn-api

# View health check logs
docker inspect --format='{{json .State.Health}}' vpn-api | jq
```

### Database connection issues

```bash
# Check postgres is healthy
docker exec vpn-postgres pg_isready -U platform_admin

# Connect to database
docker exec -it vpn-postgres psql -U platform_admin -d platform_db
```

---

## 📝 Next Steps

1. ✅ **Add GitHub Secrets** (see DEPLOYMENT_SETUP.md)
2. ✅ **Test with Development deployment first**
3. ✅ **Verify all services start correctly**
4. ✅ **Test staging deployment**
5. ✅ **Then attempt production deployment**

---

## 🔗 Related Documentation

- [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md) - GitHub secrets and SSH setup
- [../../infrastructure/docker/README.md](../../infrastructure/docker/README.md) - Docker compose details
- [../../infrastructure/docker/nginx/README.md](../../infrastructure/docker/nginx/README.md) - Nginx configuration

---

**Last Updated:** Fixed to match actual infrastructure
**Status:** ✅ Ready for deployment
