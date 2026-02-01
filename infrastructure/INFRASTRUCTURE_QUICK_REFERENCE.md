# 🚀 Infrastructure Quick Reference

**Print this out! Your daily infrastructure cheat sheet.**

---

## ⚡ Essential Commands

### Service Management

```bash
# Start all services
cd infrastructure/docker
docker compose up -d

# Start specific service
docker compose up -d nginx api

# Stop all
docker compose down

# Restart service
docker compose restart api

# Rebuild and restart
docker compose up -d --build api

# View status
docker ps
docker compose ps
```

### Logs

```bash
# View logs
docker logs vpn-api

# Follow logs (live)
docker logs -f vpn-api

# Last 100 lines
docker logs --tail 100 vpn-api

# All services
docker compose logs

# Specific service with timestamps
docker logs -t vpn-api

# Search logs
docker logs vpn-api 2>&1 | grep ERROR
```

### Container Access

```bash
# Enter container shell
docker exec -it vpn-api sh

# Run command
docker exec vpn-api curl http://localhost:3000/health

# Check environment variables
docker exec vpn-api env
```

---

## 📋 Stack Overview

### Production Stack

```
Port   Service           Container Name
----   -------           --------------
80     Nginx (HTTP)      vpn-nginx
443    Nginx (HTTPS)     vpn-nginx
3000   API Server        vpn-api
3001   Web Dashboard     vpn-web-dashboard
5001   Python AI         vpn-python-api
5432   PostgreSQL        vpn-postgres
6379   Redis             vpn-redis
5678   N8N Workflows     vpn-n8n
11434  Ollama AI         vpn-ollama
```

### Network Architecture

```
Internet (443/80)
  ↓
Nginx (Reverse Proxy)
  ↓
├─ Web Dashboard (:3001)
├─ API Server (:3000)
├─ Python AI (:5001)
└─ N8N (:5678)
  ↓
├─ PostgreSQL (:5432)
├─ Redis (:6379)
└─ Ollama (:11434)
```

---

## 🐳 Docker Compose Files

### Available Compose Files

```bash
# Production (full stack)
docker-compose.yml

# Development (with hot reload)
docker-compose.dev.yml

# Additional production config
docker-compose.prod.yml

# Monitoring stack
docker-compose.monitoring.yml

# Database platform
docker-compose.database-platform.yml
```

### Using Specific Compose Files

```bash
# Development
docker compose -f docker-compose.dev.yml up -d

# Production
docker compose -f docker-compose.yml up -d

# Multiple files (merged)
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

---

## 🔍 Health Checks

### Check Service Health

```bash
# All containers
docker ps

# Specific service
docker inspect --format='{{.State.Health.Status}}' vpn-api

# Health check endpoint
curl http://localhost/health              # Nginx
curl http://localhost:3000/health         # API
curl http://localhost:3001/               # Web
curl http://localhost:5001/health         # Python AI
```

### Service Status Indicators

```
healthy      ✅ Service running normally
unhealthy    ❌ Health check failing
starting     ⏳ Still starting up
```

---

## 📊 Monitoring

### Resource Usage

```bash
# Real-time stats
docker stats

# Specific service
docker stats vpn-api

# Disk usage
docker system df

# Clean up unused resources
docker system prune
docker system prune -a --volumes  # More aggressive
```

### Container Information

```bash
# Detailed info
docker inspect vpn-api

# Just IP address
docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' vpn-api

# All containers in network
docker network inspect vpn-network
```

---

## 🔧 Development Workflow

### Start Development Environment

```bash
cd infrastructure/docker

# Start dev stack
docker compose -f docker-compose.dev.yml up -d

# Check logs
docker compose -f docker-compose.dev.yml logs -f

# Services running at:
# - API: http://localhost:5000
# - Web: http://localhost:3001
# - N8N: http://localhost:5678
```

### Hot Reload Development

```bash
# Code changes auto-reload (volumes mounted)
# Edit files in:
# - packages/api/src/
# - apps/web-dashboard/app/

# View changes immediately in logs
docker logs -f vpn-api-dev
```

### Rebuild After Package Changes

```bash
# If package.json changed
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml build
docker compose -f docker-compose.dev.yml up -d
```

---

## 🚢 Deployment

### Production Deployment

```bash
cd infrastructure/docker

# Pull latest code
git pull origin main

# Build images
docker compose build

# Start services (zero downtime with health checks)
docker compose up -d

# Verify
docker ps
curl https://chatbuilds.com/health
```

### Rolling Update

```bash
# Update one service at a time
docker compose up -d --no-deps --build api
docker compose up -d --no-deps --build web-dashboard
docker compose up -d --no-deps --build python-api
```

### Rollback

```bash
# Use previous image
docker compose down
docker compose up -d --force-recreate
```

---

## 🔐 Security & Secrets

### Create Secrets

```bash
# Create secrets directory
mkdir -p infrastructure/docker/secrets
chmod 700 secrets

# Create secret file
echo "your-secret-password" > secrets/postgres_password.txt
chmod 600 secrets/postgres_password.txt

# Never commit secrets!
echo "secrets/*.txt" >> .gitignore
```

### View Secrets in Container

```bash
# Secrets mounted at /run/secrets/
docker exec vpn-postgres ls -la /run/secrets/
docker exec vpn-postgres cat /run/secrets/postgres_password
```

### Rotate Secrets

```bash
# 1. Update secret file
echo "new-password" > secrets/postgres_password.txt

# 2. Recreate container
docker compose up -d --force-recreate postgres

# 3. Verify
docker logs vpn-postgres
```

---

## 🌐 Network Debugging

### Test Connectivity

```bash
# From nginx to api
docker exec vpn-nginx curl http://api:3000/health

# From api to postgres
docker exec vpn-api nc -zv postgres 5432

# DNS lookup
docker exec vpn-api nslookup postgres
```

### Network Inspection

```bash
# List networks
docker network ls

# Inspect network
docker network inspect vpn-network

# Show which containers are on network
docker network inspect vpn-network --format '{{range .Containers}}{{.Name}} {{end}}'
```

### Fix Network Issues

```bash
# Reconnect container to network
docker network disconnect vpn-network vpn-api
docker network connect vpn-network vpn-api

# Recreate network
docker compose down
docker compose up -d
```

---

## 📦 Volume Management

### List Volumes

```bash
# All volumes
docker volume ls

# Inspect volume
docker volume inspect postgres-data

# Volume location
docker volume inspect postgres-data --format '{{.Mountpoint}}'
```

### Backup Volume

```bash
# Backup postgres data
docker run --rm \
  -v postgres-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup.tar.gz /data

# Backup redis data
docker run --rm \
  -v redis-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/redis-backup.tar.gz /data
```

### Restore Volume

```bash
# Stop services first
docker compose down

# Restore
docker run --rm \
  -v postgres-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/postgres-backup.tar.gz -C /data

# Restart services
docker compose up -d
```

### Clean Volumes

```bash
# Remove unused volumes
docker volume prune

# Remove specific volume (CAUTION: data loss!)
docker volume rm postgres-data
```

---

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check logs for errors
docker logs vpn-api

# Common issues:
# 1. Port already in use
sudo lsof -i :3000
sudo kill -9 <PID>

# 2. Environment variable missing
docker exec vpn-api env | grep VARIABLE_NAME

# 3. Volume permission issues
docker exec vpn-api ls -la /app

# 4. Dependency not ready
docker logs vpn-postgres
```

### Container Keeps Restarting

```bash
# Check restart count
docker ps -a | grep vpn-api

# View last 50 lines of logs
docker logs --tail 50 vpn-api

# Check health check
docker inspect vpn-api | grep -A 10 Health

# Disable restart temporarily
docker update --restart=no vpn-api
docker stop vpn-api
# Fix issue, then start manually
docker start vpn-api
```

### High Resource Usage

```bash
# Check which container is using resources
docker stats --no-stream

# Limit resources
docker update --cpus=1 --memory=512m vpn-api

# Or in compose file:
# deploy:
#   resources:
#     limits:
#       cpus: '1'
#       memory: 512M
```

### Slow Performance

```bash
# Check logs for errors
docker logs vpn-api | grep -i error

# Check database connections
docker exec vpn-postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check Redis memory
docker exec vpn-redis redis-cli INFO memory

# Check Nginx access log for slow requests
docker logs vpn-nginx | grep "request_time"
```

### Database Issues

```bash
# Access PostgreSQL
docker exec -it vpn-postgres psql -U postgres

# Check connections
SELECT * FROM pg_stat_activity;

# Kill stuck query
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = 12345;

# Vacuum database
VACUUM ANALYZE;
```

---

## 🔄 Scaling

### Horizontal Scaling

```bash
# Scale API to 3 instances
docker compose up -d --scale api=3

# Nginx automatically load balances

# Check instances
docker ps | grep vpn-api
```

### Vertical Scaling

```yaml
# Edit docker-compose.yml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2' # Increase from 1
          memory: 1G # Increase from 512M
```

---

## 📁 Important Files

### Configuration Files

```
infrastructure/docker/
├── docker-compose.yml           # Main production config
├── docker-compose.dev.yml       # Development config
├── nginx/nginx.conf             # Nginx main config
├── nginx/conf.d/*.conf          # Site configs
├── config/app.dev.env           # Dev environment vars
└── secrets/                     # Secret files (gitignored)
```

### Dockerfiles

```
infrastructure/docker/
├── Dockerfile.api               # API build
├── Dockerfile.web               # Web dashboard build
├── Dockerfile.db-manager        # Database manager
└── Dockerfile.provisioner       # Tenant provisioner
```

### Logs (inside containers)

```
/var/log/nginx/access.log        # Nginx access
/var/log/nginx/error.log         # Nginx errors
/app/logs/                       # Application logs
```

---

## 🆘 Emergency Procedures

### Complete System Restart

```bash
# Stop everything
docker compose down

# Clean up
docker system prune -f

# Start fresh
docker compose up -d

# Verify
docker ps
curl http://localhost/health
```

### Rollback Deployment

```bash
# Stop current
docker compose down

# Checkout previous version
git checkout HEAD~1

# Rebuild
docker compose build

# Start
docker compose up -d
```

### Data Recovery

```bash
# Stop services
docker compose down

# Restore from backup
docker run --rm \
  -v postgres-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/postgres-backup.tar.gz -C /data

# Start services
docker compose up -d

# Verify data
docker exec vpn-postgres psql -U postgres -c "SELECT count(*) FROM users;"
```

---

## 📊 Monitoring URLs

```
Production:
  Main Site:    https://chatbuilds.com
  API Health:   https://chatbuilds.com/api/health
  Web Health:   https://chatbuilds.com/

Development:
  API:          http://localhost:5000/health
  Web:          http://localhost:3001/
  N8N:          http://localhost:5678/

Monitoring:
  Prometheus:   http://localhost:9090
  Grafana:      http://localhost:3000

Database:
  PostgreSQL:   localhost:5432
  Redis:        localhost:6379
```

---

## 💡 Pro Tips

### 1. Use Aliases

```bash
# Add to ~/.bashrc or ~/.zshrc
alias dps='docker ps'
alias dlog='docker logs -f'
alias dsh='docker exec -it'
alias dup='docker compose up -d'
alias ddown='docker compose down'
alias drebuild='docker compose up -d --build'
```

### 2. Watch Logs in Real-Time

```bash
# Multiple services
docker compose logs -f api web-dashboard

# Filter for errors
docker logs -f vpn-api 2>&1 | grep -i error
```

### 3. Quick Health Check Script

```bash
#!/bin/bash
# save as check-health.sh
services="vpn-nginx vpn-api vpn-web-dashboard vpn-python-api"
for service in $services; do
  status=$(docker inspect --format='{{.State.Health.Status}}' $service 2>/dev/null || echo "not found")
  echo "$service: $status"
done
```

### 4. Auto-restart Failed Containers

```yaml
# In docker-compose.yml
restart: unless-stopped  # Recommended
restart: always          # Restarts even if manually stopped
restart: on-failure      # Only on error
```

### 5. Resource Monitoring Script

```bash
#!/bin/bash
# save as monitor.sh
watch -n 2 'docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"'
```

---

## 🎯 Daily Checklist

### Morning Routine

```bash
# 1. Check all services running
docker ps

# 2. Check for errors in logs
docker compose logs --since 24h | grep -i error

# 3. Check resource usage
docker stats --no-stream

# 4. Verify health
curl https://chatbuilds.com/health
```

### After Code Changes

```bash
# 1. Pull latest code
git pull

# 2. Rebuild affected services
docker compose up -d --build api web-dashboard

# 3. Check logs
docker logs -f vpn-api

# 4. Test endpoints
curl http://localhost:3000/health
```

### Before Leaving

```bash
# 1. Check all healthy
docker ps

# 2. No critical errors
docker compose logs | grep -i "critical\|fatal"

# 3. Commit changes
git status
git add .
git commit -m "..."
git push
```

---

## 📚 Quick Links

**Documentation:**

- Infrastructure Guide: [INFRASTRUCTURE_COMPLETE_GUIDE.md](./INFRASTRUCTURE_COMPLETE_GUIDE.md)
- Nginx Docs: [docker/nginx/NGINX_COMPLETE_GUIDE.md](./docker/nginx/NGINX_COMPLETE_GUIDE.md)
- Docker Docs: https://docs.docker.com

**Monitoring:**

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

---

**Last Updated:** February 1, 2026  
**Quick, simple, always helpful** 🚀

---

_Keep this open while managing infrastructure. Copy-paste with confidence!_
