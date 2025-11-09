# infrastructure — VPN Enterprise

This document explains the contents of the `infrastructure/` folder, how to run the Docker-based stacks (dev and prod), the nginx configuration, and the included monitoring stack (Prometheus, Grafana, Promtail). It also contains operational guidance and troubleshooting steps so on-call engineers and future maintainers can pick this up quickly.

Contents overview

- `docker/`
    - `docker-compose.dev.yml` — development compose file that wires up local API, web, database, and reverse proxy in a single environment.
    - `docker-compose.yml` — production-ish compose file (intended for self-hosting or staging).
    - `Dockerfile.api` — container build for the API service (used by compose and CI if you build docker images).
    - `Dockerfile.web` — container build for the web dashboard.
    - `nginx/`
        - `nginx.conf` — main nginx config
        - `conf.d/` — site-specific vhost configs (`default.conf`, `dev.conf`)
        - `ssl/` — placeholder for TLS certs for on-prem deployments (gitignored or contains .gitkeep here)

- `monitoring/`
    - `prometheus/` — `prometheus.yml` with scrape configs for services
    - `grafana/` — dashboards and datasource config
    - `promtail/` — config for shipping logs to Loki or configured log endpoints

Quick start — development (docker-compose)

1. Prerequisites

     - Docker & Docker Compose installed (Docker Engine + Compose v1/v2)
     - Sufficient disk space for images/volumes
     - If you plan to use TLS locally, add certs to `infrastructure/docker/nginx/ssl/` (or mount them at runtime)

2. Start the development stack

```bash
cd infrastructure/docker
docker compose -f docker-compose.dev.yml up --build
```

3. Bring the stack down when finished

```bash
docker compose -f docker-compose.dev.yml down --volumes
```

Notes

- The dev compose file is intended to run local copies of the API, web, and any supporting services (db, redis). It also includes an nginx reverse proxy to replicate host routing.
- If you modify Dockerfiles, re-run `--build` or manually `docker build` the images and restart the compose stack.

Production / staging with `docker-compose.yml`

- `docker-compose.yml` is a starting point for self-hosted or on-prem deployments. It is not a replacement for a real orchestrator (Kubernetes, Nomad) in large-scale environments.
- For production, ensure:
    - TLS termination is handled (nginx + Let's Encrypt or a managed LB)
    - Secrets are injected via environment variables or a secret manager (do not commit secrets)
    - External volumes/backups for any persistent storage (Postgres data, logs)

Example to run production compose (careful — this expects configured env and volumes):

```bash
cd infrastructure/docker
docker compose -f docker-compose.yml up -d --build
```

Reverse proxy (nginx)

- `infrastructure/docker/nginx/nginx.conf` is the main global config. Per-site configs live under `conf.d/`.
- `conf.d/default.conf` and `conf.d/dev.conf` contain host-based routing and proxy_pass rules for the API and web dashboard.
- TLS/SSL
    - `infrastructure/docker/nginx/ssl/` is where TLS certs are expected for on-prem deployments. For production, use a trusted CA (Let's Encrypt or a corporate CA).
    - If you use Let's Encrypt, manage cert renewal (certbot or an automated ACME client). Mount renewed certs into the nginx container and trigger a reload: `docker compose exec nginx nginx -s reload`.

Monitoring (Prometheus / Grafana / Promtail)

- The monitoring folder contains starter configs for a basic monitoring stack:
    - Prometheus: `monitoring/prometheus/prometheus.yml` — scrape targets for services (adjust job targets to match your deployment hostnames/ports).
    - Grafana: `monitoring/grafana/datasources/datasources.yml` and `monitoring/grafana/dashboards/` — preconfigured dashboards/DS.
    - Promtail: `monitoring/promtail/promtail-config.yml` — tails container logs and forwards them to a Loki/Log endpoint configured in Grafana.

Bringing up the monitoring stack (example)

```bash
cd infrastructure/monitoring
docker compose -f ./docker-compose.yml up -d
# or, if you have a single compose file referencing these services, bring them up there.
```

Operational runbook (common tasks)

1) See container logs

```bash
docker compose -f infrastructure/docker/docker-compose.yml logs -f <service>
```

2) Restart a service (nginx example)

```bash
docker compose -f infrastructure/docker/docker-compose.yml restart nginx
```

3) Update TLS certs and reload nginx

```bash
# after placing new certs into infrastructure/docker/nginx/ssl/
docker compose -f infrastructure/docker/docker-compose.yml exec nginx nginx -s reload
```

4) Backup Postgres data

```bash
docker exec -t <postgres-container> pg_dumpall -U <user> > /path/to/backup.sql
```

Troubleshooting

- Container fails to start: check `docker compose logs <service>` and the service's healthcheck.
- Port conflicts: ensure the host ports in docker-compose do not collide with other services.
- Nginx 502 errors: the proxied upstream (API or web) may not be ready or listening on the expected host/port — check the service logs.
- Monitoring missing data: verify Prometheus scrape targets and that services expose metrics endpoints (e.g., `/metrics`).

Security & secrets

- Do not store production secrets in the repository. Use environment variables, Docker secrets, or a secrets manager.
- Limit access to the host(s) running these containers. Use firewalls and restrict management ports (SSH, Docker API).

Enterprise notes & best practices

- Orchestration: for production scale, migrate to an orchestrator (Kubernetes, ECS, Nomad). Compose is fine for small infra or staging.
- Observability: wire application metrics (Prometheus), structured logs (Loki), and tracing (Jaeger or similar) before scaling.
- Automated deployments: integrate CI to build images and push to a registry, then deploy images to the orchestrator instead of building on host.
- Secrets & rotation: centralize secrets, enforce rotation policies, and audit access.

Maintenance checklist (for regular ops)

1) Verify backups for DB and critical data
2) Check monitoring alerts and dashboards daily
3) Rotate TLS certificates and secrets as needed
4) Patch base images and dependencies periodically
5) Run security scans on images (Trivy / Clair)

Where to look for configuration

- Docker compose files: `infrastructure/docker/docker-compose.dev.yml`, `infrastructure/docker/docker-compose.yml`
- Dockerfiles: `infrastructure/docker/Dockerfile.api`, `infrastructure/docker/Dockerfile.web`
- Nginx config: `infrastructure/docker/nginx/` (conf.d/ and ssl/)
- Monitoring: `infrastructure/monitoring/`

Suggested follow-ups I can implement

- Add a `infrastructure/verify-stack.sh` that performs quick health checks for API, web, Prometheus, and Grafana and returns pass/fail.
- Add a small CI job that builds images and runs `infrastructure/verify-stack.sh` against a disposable environment.
- Add example `docker-compose.override.yml` (local developer tweaks) and a small `Makefile` for common infra tasks.

---

End of infrastructure/README

# 🚀 VPN Enterprise - Infrastructure

**Enterprise-grade infrastructure for VPN service deployment**

## 📁 Structure

```
infrastructure/
├── docker/                    # Docker configurations
│   ├── Dockerfile.api        # API server image
│   ├── Dockerfile.web        # Web dashboard image
│   ├── docker-compose.yml    # Production stack
│   ├── docker-compose.dev.yml # Development stack
│   └── nginx/                # Nginx reverse proxy
│       ├── nginx.conf        # Main configuration
│       └── conf.d/           # Virtual hosts
└── monitoring/               # Monitoring stack
    ├── prometheus/           # Metrics collection
    ├── grafana/              # Visualization
    └── promtail/             # Log aggregation
```

## 🐳 Docker Services

### Production Stack (`docker-compose.yml`)

| Service | Port | Description |
|---------|------|-------------|
| **nginx** | 80, 443 | Reverse proxy, SSL termination, load balancing |
| **api** | 3000 | Node.js REST API (Express) |
| **web-dashboard** | 3001 | Next.js web application |
| **redis** | 6379 | Caching and rate limiting |
| **prometheus** | 9090 | Metrics collection |
| **grafana** | 3000 | Monitoring dashboards |
| **loki** | 3100 | Log aggregation |
| **promtail** | - | Log shipper |

## 🚀 Quick Start

### Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- 4GB RAM minimum (8GB recommended)
- 20GB disk space

### 1. Build Images

```bash
cd /home/mukulah/vpn-enterprise
./scripts/deployment/build.sh
```

### 2. Deploy Services

```bash
./scripts/deployment/deploy.sh
```

### 3. Verify Health

```bash
./scripts/deployment/health-check.sh
```

## 🛠️ Development Mode

For local development with hot-reloading:

```bash
docker-compose -f infrastructure/docker/docker-compose.dev.yml up
```

Services:
- API: http://localhost:3000
- Web: http://localhost:3001
- Redis: localhost:6379

## 📊 Monitoring

### Prometheus
- URL: http://localhost:9090
- Metrics: API performance, system resources, container stats

### Grafana
- URL: http://localhost:3000
- Default credentials: `admin` / `admin`
- Dashboards: Pre-configured for VPN Enterprise

### Loki + Promtail
- Centralized logging from all services
- Query logs in Grafana

## 🔒 SSL/TLS Configuration

### Self-Signed (Development)

Generated automatically by deploy script:

```bash
./scripts/deployment/deploy.sh
```

### Production Certificates

Replace self-signed certificates:

```bash
# Using Let's Encrypt
certbot certonly --standalone -d your-domain.com

# Copy certificates
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem infrastructure/docker/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem infrastructure/docker/nginx/ssl/key.pem
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis
REDIS_PASSWORD=strong-password

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=strong-password
```

### Nginx Configuration

- **Main config**: `infrastructure/docker/nginx/nginx.conf`
- **Virtual hosts**: `infrastructure/docker/nginx/conf.d/default.conf`
- **Rate limiting**: Configured in main config
- **SSL settings**: Modern TLS 1.2/1.3 only

## 📦 Deployment Scripts

### build.sh
Builds all Docker images with version tagging

```bash
./scripts/deployment/build.sh [production|development]
```

### deploy.sh
Zero-downtime deployment with health checks

```bash
./scripts/deployment/deploy.sh [production|development]
```

### health-check.sh
Comprehensive health validation

```bash
./scripts/deployment/health-check.sh
```

### rollback.sh
Rollback to previous deployment

```bash
./scripts/deployment/rollback.sh
```

## 🌐 Nginx Features

✅ **Performance**
- HTTP/2 support
- Gzip compression
- Static asset caching
- Keep-alive connections

✅ **Security**
- Modern SSL/TLS (1.2+)
- Security headers (HSTS, CSP, X-Frame-Options)
- Rate limiting (10 req/s API, 5 req/m auth)
- CORS configuration

✅ **Load Balancing**
- Least connections algorithm
- Health checks
- Fail-over support

## 📝 Common Operations

### View Logs

```bash
# All services
docker-compose -f infrastructure/docker/docker-compose.yml logs -f

# Specific service
docker-compose -f infrastructure/docker/docker-compose.yml logs -f api

# Last 100 lines
docker-compose -f infrastructure/docker/docker-compose.yml logs --tail=100
```

### Restart Service

```bash
docker-compose -f infrastructure/docker/docker-compose.yml restart api
```

### Scale Services

```bash
# Scale API to 3 instances
docker-compose -f infrastructure/docker/docker-compose.yml up -d --scale api=3
```

### Update Single Service

```bash
# Rebuild and restart API
docker-compose -f infrastructure/docker/docker-compose.yml up -d --build api
```

## 🔍 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs vpn-api

# Check health
docker inspect vpn-api | grep -A 10 Health
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Or use docker
docker ps --filter "publish=3000"
```

### Out of Disk Space

```bash
# Clean up unused images
docker system prune -a

# Remove unused volumes
docker volume prune
```

## 🚀 Production Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone Repository

```bash
git clone https://github.com/Mucrypt/vpn-enterprise.git
cd vpn-enterprise
```

### 3. Configure Environment

```bash
cp .env.example .env
nano .env  # Edit with production values
```

### 4. Deploy

```bash
./scripts/deployment/build.sh production
./scripts/deployment/deploy.sh production
```

### 5. Verify

```bash
./scripts/deployment/health-check.sh
```

## 📊 Resource Requirements

### Minimum (Development)
- CPU: 2 cores
- RAM: 4GB
- Disk: 20GB

### Recommended (Production)
- CPU: 4 cores
- RAM: 8GB
- Disk: 50GB SSD

### High Availability (Enterprise)
- CPU: 8+ cores
- RAM: 16GB+
- Disk: 100GB+ SSD
- Multiple nodes for redundancy

## 🔐 Security Checklist

- [ ] Change default Grafana password
- [ ] Set strong Redis password
- [ ] Use real SSL certificates (not self-signed)
- [ ] Configure firewall (UFW/iptables)
- [ ] Enable automatic security updates
- [ ] Regular backup of persistent volumes
- [ ] Monitor logs for suspicious activity
- [ ] Rotate secrets regularly

## 📈 Performance Tuning

### API Server
- Adjust `worker_processes` in Nginx
- Tune `keepalive` connections
- Configure Redis caching

### Database
- Enable connection pooling
- Configure query caching
- Add database indexes

### Monitoring
- Set up alerts in Prometheus
- Configure retention policies
- Enable log rotation

---

**Built for enterprise-grade VPN services** 🔒
