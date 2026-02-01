# 🏗️ VPN Enterprise Infrastructure

**Production-ready Docker orchestration for the complete VPN Enterprise platform.**

[![Docker](https://img.shields.io/badge/Docker-20.10+-blue.svg)](https://www.docker.com/)
[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-v2.0+-blue.svg)](https://docs.docker.com/compose/)
[![Nginx](https://img.shields.io/badge/Nginx-Alpine-green.svg)](https://nginx.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)

> Complete infrastructure orchestration with Docker Compose, featuring automatic SSL, load balancing, monitoring, and zero-downtime deployments.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Services](#services)
- [Documentation](#documentation)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Overview

The infrastructure layer provides complete container orchestration for the VPN Enterprise platform using Docker Compose. It manages 9+ microservices with automatic health checks, service discovery, load balancing, and observability.

### Key Features

✅ **Multi-stage Docker builds** - Optimized images with security scanning  
✅ **Zero-downtime deployments** - Rolling updates with health checks  
✅ **Automatic SSL/TLS** - Let's Encrypt integration via Nginx  
✅ **Service mesh networking** - Isolated bridge networks with DNS  
✅ **Horizontal scaling** - Load-balanced service replicas  
✅ **Secret management** - Docker secrets with encrypted storage  
✅ **Full observability** - Prometheus, Grafana, centralized logging  
✅ **Development parity** - Identical dev/prod configurations  

---

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet (443/80)                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Nginx Reverse     │  SSL Termination
                    │  Proxy (Alpine)    │  Load Balancing
                    └─────────┬──────────┘  Rate Limiting
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
      ┌─────▼─────┐   ┌──────▼──────┐   ┌─────▼─────┐
      │    Web    │   │     API     │   │  Python   │
      │ Dashboard │   │   Server    │   │    AI     │
      │ (Next.js) │   │ (Node.js)   │   │ (FastAPI) │
      └───────────┘   └──────┬──────┘   └─────┬─────┘
                             │                │
                    ┌────────┼────────────────┘
                    │        │
         ┌──────────▼───┐  ┌─▼────────┐  ┌───────────┐
         │  PostgreSQL  │  │  Redis   │  │   Ollama  │
         │  (Primary)   │  │  Cache   │  │  AI Models│
         └──────────────┘  └──────────┘  └───────────┘
                    │
         ┌──────────▼──────────┐
         │  Monitoring Stack   │
         │  Prometheus/Grafana │
         └─────────────────────┘
```

### Network Topology

- **vpn-network** (172.20.0.0/16) - Production bridge network
- **vpn-dev-network** (172.21.0.0/16) - Development isolation
- **Internal DNS** - Automatic service discovery via container names

### Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Reverse Proxy** | Nginx | Alpine | SSL, load balancing, caching |
| **API Server** | Node.js | 20-alpine | REST API, WebSocket |
| **Web UI** | Next.js | 15 | User dashboard |
| **AI Service** | FastAPI | 3.11 | LLM integration |
| **Database** | PostgreSQL | 15-alpine | Primary data store |
| **Cache** | Redis | 7-alpine | Sessions, rate limiting |
| **Workflow** | N8N | Latest | Automation engine |
| **AI Runtime** | Ollama | Latest | Local LLM hosting |
| **Metrics** | Prometheus | Latest | Time-series metrics |
| **Dashboards** | Grafana | Latest | Visualization |

---

## Quick Start

### Prerequisites

- Docker 20.10+ ([Install](https://docs.docker.com/engine/install/))
- Docker Compose v2.0+ ([Install](https://docs.docker.com/compose/install/))
- Git
- 4GB+ RAM available
- Linux/macOS/WSL2

### Development Setup (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/your-org/vpn-enterprise.git
cd vpn-enterprise

# 2. Create environment file
cp .env.example .env
# Edit .env with your values

# 3. Start development stack
cd infrastructure/docker
docker compose -f docker-compose.dev.yml up -d

# 4. Check services
docker ps

# 5. Access services
# API:     http://localhost:5000/health
# Web:     http://localhost:3001
# N8N:     http://localhost:5678
# Grafana: http://localhost:3000
```

### Production Setup

```bash
# 1. Clone and configure
git clone https://github.com/your-org/vpn-enterprise.git
cd vpn-enterprise/infrastructure/docker

# 2. Create secrets
mkdir -p secrets
echo "strong-password" > secrets/postgres_password.txt
chmod 600 secrets/*.txt

# 3. Configure environment
cp config/app.prod.env.example config/app.prod.env
# Edit app.prod.env

# 4. Deploy stack
docker compose up -d

# 5. Verify health
curl https://yourdomain.com/health
```

---

## Services

### Core Services

#### Nginx Reverse Proxy
**Port:** 80/443  
**Container:** `vpn-nginx`  
**Purpose:** SSL termination, load balancing, rate limiting

```bash
# Access logs
docker logs vpn-nginx

# Reload config
docker exec vpn-nginx nginx -s reload

# Test config
docker exec vpn-nginx nginx -t
```

#### API Server (Node.js)
**Port:** 3000 (internal)  
**Container:** `vpn-api`  
**Endpoint:** `/api/*`

```bash
# Health check
curl http://localhost:3000/health

# View logs
docker logs -f vpn-api

# Enter shell
docker exec -it vpn-api sh
```

#### Web Dashboard (Next.js)
**Port:** 3001 (internal)  
**Container:** `vpn-web-dashboard`  
**Endpoint:** `/*`

```bash
# Access via Nginx
curl http://localhost/

# Development with hot reload
docker compose -f docker-compose.dev.yml up -d web-dev
```

#### Python AI Service (FastAPI)
**Port:** 5001 (internal)  
**Container:** `vpn-python-api`  
**Endpoint:** `/ai/*`

```bash
# Health check
curl http://localhost:5001/health

# API docs
open http://localhost:5001/docs
```

### Data Services

#### PostgreSQL Database
**Port:** 5432  
**Container:** `vpn-postgres`  
**Volume:** `postgres-data`

```bash
# Access psql
docker exec -it vpn-postgres psql -U postgres

# Backup
docker exec vpn-postgres pg_dump -U postgres > backup.sql

# Restore
docker exec -i vpn-postgres psql -U postgres < backup.sql
```

#### Redis Cache
**Port:** 6379  
**Container:** `vpn-redis`  
**Volume:** `redis-data`

```bash
# Redis CLI
docker exec -it vpn-redis redis-cli

# Monitor commands
docker exec vpn-redis redis-cli MONITOR

# Check memory
docker exec vpn-redis redis-cli INFO memory
```

### Platform Services

#### N8N Workflows
**Port:** 5678  
**Container:** `vpn-n8n`  
**Purpose:** Workflow automation

#### Ollama AI Models
**Port:** 11434  
**Container:** `vpn-ollama`  
**Purpose:** Local LLM hosting

---

## Documentation

### Complete Guides

📖 **[Infrastructure Complete Guide](./INFRASTRUCTURE_COMPLETE_GUIDE.md)**  
Comprehensive reference covering Docker architecture, networking, deployment strategies, monitoring, security, scaling, and troubleshooting. Start here for deep understanding.

⚡ **[Infrastructure Quick Reference](./INFRASTRUCTURE_QUICK_REFERENCE.md)**  
Daily operations cheat sheet with essential commands, troubleshooting steps, and quick fixes. Print this out!

🌐 **[Nginx Complete Guide](./docker/nginx/NGINX_COMPLETE_GUIDE.md)**  
Everything about reverse proxy configuration, SSL/TLS, load balancing, caching, and security.

### Service-Specific Docs

- **API Server:** [packages/api/README.md](../packages/api/README.md)
- **Web Dashboard:** [apps/web-dashboard/README.md](../apps/web-dashboard/README.md)
- **Python AI:** [flask/README.md](../flask/README.md)

---

## Deployment

### Development Deployment

```bash
cd infrastructure/docker

# Start with hot reload
docker compose -f docker-compose.dev.yml up -d

# Watch logs
docker compose -f docker-compose.dev.yml logs -f

# Restart after package.json changes
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d --build
```

**Development URLs:**
- API: http://localhost:5000
- Web: http://localhost:3001
- N8N: http://localhost:5678
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Production Deployment

```bash
cd infrastructure/docker

# Build images
docker compose build

# Start services (zero downtime)
docker compose up -d

# Verify health
docker ps
curl https://chatbuilds.com/health
```

### Rolling Updates

```bash
# Update one service at a time
docker compose up -d --no-deps --build api
docker compose up -d --no-deps --build web-dashboard

# Verify each step
docker logs vpn-api
curl https://chatbuilds.com/api/health
```

### Blue-Green Deployment

```bash
# 1. Start new version (green)
docker compose -p vpn-green up -d

# 2. Test green environment
curl http://localhost:8080/health

# 3. Switch Nginx to green
docker exec vpn-nginx-blue nginx -s reload

# 4. Stop old version (blue)
docker compose -p vpn-blue down
```

### Rollback Procedure

```bash
# Stop current deployment
docker compose down

# Checkout previous version
git log --oneline
git checkout <previous-commit>

# Redeploy
docker compose up -d --force-recreate

# Verify
docker ps
curl https://chatbuilds.com/health
```

---

## Monitoring

### Monitoring Stack

The infrastructure includes a complete observability stack:

- **Prometheus** (`:9090`) - Metrics collection and alerting
- **Grafana** (`:3000`) - Dashboards and visualization
- **AlertManager** - Alert routing and notification
- **Promtail** - Log aggregation and forwarding

### Start Monitoring

```bash
# Start monitoring stack
docker compose -f docker-compose.monitoring.yml up -d

# Access dashboards
open http://localhost:3000    # Grafana (admin/admin)
open http://localhost:9090    # Prometheus
```

### Health Checks

All services include automatic health checks:

```bash
# Check health status
docker ps --format "table {{.Names}}\t{{.Status}}"

# Service-specific health endpoints
curl http://localhost/health              # Nginx
curl http://localhost:3000/health         # API
curl http://localhost:5001/health         # Python AI
curl http://localhost:3001/               # Web Dashboard
```

### Metrics Collection

```bash
# API metrics
curl http://localhost:3000/metrics

# View in Prometheus
open http://localhost:9090/graph

# Common queries:
# - Request rate: rate(http_requests_total[5m])
# - Error rate: rate(http_requests_total{status=~"5.."}[5m])
# - CPU usage: container_cpu_usage_seconds_total
```

### Logging

```bash
# Centralized logging
docker compose logs

# Specific service
docker logs -f vpn-api

# Last 100 lines with timestamps
docker logs --tail 100 -t vpn-api

# Search for errors
docker logs vpn-api 2>&1 | grep ERROR

# Export logs
docker logs vpn-api > api-logs.txt
```

### Alerts

Configure alerts in [monitoring/alertmanager/config.yml](./monitoring/alertmanager/config.yml):

```yaml
route:
  receiver: 'team-email'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'

receivers:
  - name: 'team-email'
    email_configs:
      - to: 'team@example.com'
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker logs vpn-api

# Common issues:

# 1. Port conflict
sudo lsof -i :3000
sudo kill -9 <PID>

# 2. Missing environment variable
docker exec vpn-api env | grep DATABASE_URL

# 3. Volume permission issue
docker exec vpn-api ls -la /app

# 4. Network issue
docker network inspect vpn-network
```

### Container Keeps Restarting

```bash
# Check restart count
docker ps -a | grep vpn-api

# Disable auto-restart temporarily
docker update --restart=no vpn-api
docker stop vpn-api

# Fix issue, then restart
docker start vpn-api
docker update --restart=unless-stopped vpn-api
```

### High Resource Usage

```bash
# Check resource usage
docker stats

# Limit resources
docker update --cpus=1 --memory=512m vpn-api

# Or in docker-compose.yml:
# deploy:
#   resources:
#     limits:
#       cpus: '1'
#       memory: 512M
```

### Network Connectivity Issues

```bash
# Test service connectivity
docker exec vpn-nginx curl http://api:3000/health
docker exec vpn-api nc -zv postgres 5432

# Recreate network
docker compose down
docker network prune
docker compose up -d
```

### Database Connection Errors

```bash
# Check PostgreSQL status
docker exec vpn-postgres pg_isready -U postgres

# View active connections
docker exec vpn-postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Kill stuck queries
docker exec vpn-postgres psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction';"
```

### SSL/Certificate Issues

```bash
# Check certificate expiry
docker exec vpn-nginx openssl x509 -in /etc/nginx/ssl/cert.pem -noout -dates

# Renew Let's Encrypt certificate
docker exec vpn-nginx certbot renew

# Test SSL configuration
docker exec vpn-nginx nginx -t
```

---

## Security Best Practices

### Secrets Management

✅ Use Docker secrets for sensitive data  
✅ Never commit secrets to Git  
✅ Rotate secrets regularly (90 days)  
✅ Use separate secrets for dev/prod  

```bash
# Create secret
echo "secret-password" | docker secret create db_password -

# Use in compose:
secrets:
  - db_password
```

### Network Security

✅ Isolate services with bridge networks  
✅ Expose only necessary ports  
✅ Use internal DNS for service communication  
✅ Enable TLS between services  

### Container Security

✅ Run as non-root user  
✅ Use official base images  
✅ Scan images for vulnerabilities  
✅ Keep images updated  

```bash
# Scan image
docker scan vpn-api:latest

# Update base images
docker compose pull
docker compose up -d --build
```

---

## Maintenance

### Daily Tasks

```bash
# Check service health
docker ps

# Check for errors
docker compose logs --since 24h | grep -i error

# Monitor resources
docker stats --no-stream
```

### Weekly Tasks

```bash
# Backup database
./scripts/backup-database.sh

# Clean unused resources
docker system prune -f

# Update images
docker compose pull
docker compose up -d
```

### Monthly Tasks

```bash
# Rotate logs
docker compose logs > logs/archive-$(date +%Y%m).log
docker compose logs --tail 0

# Review security
docker scan vpn-api
docker scan vpn-web-dashboard

# Update dependencies
cd packages/api && npm update
cd apps/web-dashboard && npm update
```

---

## Scaling

### Horizontal Scaling

```bash
# Scale API to 3 replicas
docker compose up -d --scale api=3

# Nginx automatically load balances
docker ps | grep vpn-api

# Scale down
docker compose up -d --scale api=1
```

### Vertical Scaling

Edit resource limits in [docker-compose.yml](./docker/docker-compose.yml):

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2'      # Increase from 1
          memory: 1G     # Increase from 512M
```

---

## Contributing

### Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-service
   ```

2. **Make changes**
   ```bash
   # Edit infrastructure files
   vim docker-compose.yml
   ```

3. **Test locally**
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   docker compose logs -f
   ```

4. **Run tests**
   ```bash
   cd apps/web-dashboard
   npm run test:e2e
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat(infra): add new monitoring service"
   git push origin feature/new-service
   ```

### Adding a New Service

1. Create Dockerfile in `infrastructure/docker/`
2. Add service to `docker-compose.yml`
3. Configure health checks
4. Add to monitoring (Prometheus targets)
5. Update documentation
6. Test deployment

### Testing Infrastructure Changes

```bash
# Test in isolated environment
docker compose -p test up -d

# Run smoke tests
./scripts/test-deployment.sh

# Clean up
docker compose -p test down -v
```

---

## Directory Structure

```
infrastructure/
├── README.md                           # This file
├── INFRASTRUCTURE_COMPLETE_GUIDE.md    # Complete reference
├── INFRASTRUCTURE_QUICK_REFERENCE.md   # Quick commands
├── docker/
│   ├── docker-compose.yml              # Production stack
│   ├── docker-compose.dev.yml          # Development stack
│   ├── docker-compose.monitoring.yml   # Monitoring stack
│   ├── Dockerfile.api                  # API build
│   ├── Dockerfile.web                  # Web build
│   ├── nginx/
│   │   ├── nginx.conf                  # Main config
│   │   ├── conf.d/                     # Site configs
│   │   └── ssl/                        # Certificates
│   ├── postgres/                       # PostgreSQL init scripts
│   ├── config/                         # Environment configs
│   └── secrets/                        # Secret files (gitignored)
├── monitoring/
│   ├── prometheus/                     # Prometheus config
│   ├── grafana/                        # Grafana dashboards
│   ├── alertmanager/                   # Alert routing
│   └── promtail/                       # Log aggregation
├── ansible/                            # Server provisioning
└── scripts/                            # Automation scripts
```

---

## Resources

### Official Documentation

- **Docker:** https://docs.docker.com
- **Docker Compose:** https://docs.docker.com/compose
- **Nginx:** https://nginx.org/en/docs
- **Node.js:** https://nodejs.org/docs
- **PostgreSQL:** https://www.postgresql.org/docs
- **Redis:** https://redis.io/documentation

### Community

- **GitHub:** https://github.com/your-org/vpn-enterprise
- **Slack:** https://vpn-enterprise.slack.com
- **Email:** devops@example.com

### Support

For infrastructure issues:
1. Check [Troubleshooting](#troubleshooting) section
2. Review [Infrastructure Complete Guide](./INFRASTRUCTURE_COMPLETE_GUIDE.md)
3. Search existing GitHub issues
4. Create new issue with logs and reproduction steps

---

## License

[Your License Here]

---

**Built with ❤️ by the VPN Enterprise Team**

*Keep building, keep shipping* 🚀