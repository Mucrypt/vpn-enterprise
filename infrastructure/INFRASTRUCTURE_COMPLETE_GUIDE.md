# 🏗️ Complete Infrastructure Guide

**Your Lifetime Reference for VPN Enterprise Infrastructure**

---

## 📚 Table of Contents

1. [Infrastructure Basics - Start Here](#1-infrastructure-basics---start-here)
2. [Understanding Your Stack](#2-understanding-your-stack)
3. [Docker Architecture](#3-docker-architecture)
4. [Service Configurations](#4-service-configurations)
5. [Networking & Routing](#5-networking--routing)
6. [Deployment Strategies](#6-deployment-strategies)
7. [Monitoring & Observability](#7-monitoring--observability)
8. [Security & Secrets](#8-security--secrets)
9. [Scaling & Performance](#9-scaling--performance)
10. [Troubleshooting](#10-troubleshooting)
11. [Maintenance & Backups](#11-maintenance--backups)
12. [Quick Reference](#12-quick-reference)

---

## 1. Infrastructure Basics - Start Here

### What is Infrastructure?

**Infrastructure** is the foundation that runs your applications:

- **Containers** - Isolated environments for each service
- **Networking** - How services communicate
- **Storage** - Where data is persisted
- **Monitoring** - Tracking system health
- **Security** - Protecting your systems

### Your Infrastructure Stack

```
┌─────────────────────────────────────────────────────────┐
│                     INTERNET                            │
│                   (Port 80/443)                         │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS/HTTP
                       ↓
┌─────────────────────────────────────────────────────────┐
│                  NGINX (Reverse Proxy)                  │
│   - SSL Termination                                     │
│   - Load Balancing                                      │
│   - Request Routing                                     │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┬─────────────┐
         ↓             ↓             ↓             ↓
    ┌────────┐   ┌──────────┐  ┌─────────┐  ┌──────────┐
    │  Web   │   │   API    │  │ Python  │  │   N8N    │
    │  :3001 │   │  :3000   │  │  :5001  │  │  :5678   │
    └────────┘   └──────────┘  └─────────┘  └──────────┘
         │             │             │             │
         └─────────────┼─────────────┼─────────────┘
                       ↓             ↓
              ┌────────────┐   ┌─────────┐
              │  Supabase  │   │ Ollama  │
              │ (External) │   │ :11434  │
              └────────────┘   └─────────┘
                       ↓
              ┌────────────────────┐
              │  PostgreSQL/Redis  │
              │   :5432 / :6379    │
              └────────────────────┘
```

### Why Docker?

**Docker** packages applications into containers:

- **Consistency** - Same environment everywhere (dev, staging, prod)
- **Isolation** - Services don't interfere with each other
- **Portability** - Run anywhere (laptop, server, cloud)
- **Scalability** - Easy to add more instances
- **Version Control** - Infrastructure as code

---

## 2. Understanding Your Stack

### Infrastructure Directory Structure

```
infrastructure/
├── docker/                      # 🔥 Docker configurations
│   ├── docker-compose.yml      # Production compose
│   ├── docker-compose.dev.yml  # Development compose
│   ├── docker-compose.prod.yml # Additional prod config
│   ├── docker-compose.monitoring.yml  # Monitoring stack
│   │
│   ├── Dockerfile.api          # API container build
│   ├── Dockerfile.web          # Web dashboard build
│   ├── Dockerfile.db-manager   # Database manager build
│   ├── Dockerfile.provisioner  # Tenant provisioner build
│   │
│   ├── nginx/                  # Nginx configuration
│   │   ├── nginx.conf         # Main nginx config
│   │   ├── conf.d/            # Site configs
│   │   └── ssl/               # SSL certificates
│   │
│   ├── postgres/              # PostgreSQL config
│   ├── config/                # Service configs
│   └── secrets/               # Secret management
│
├── monitoring/                # Monitoring tools
│   ├── prometheus/           # Metrics collection
│   ├── grafana/              # Visualization
│   ├── alertmanager/         # Alerts
│   └── promtail/             # Log aggregation
│
├── ansible/                  # Configuration management
├── migrations/               # Database migrations
└── scripts/                  # Automation scripts
```

### Technology Stack

**Container Orchestration:**

- **Docker** - Container runtime
- **Docker Compose** - Multi-container orchestration
- **Docker Networks** - Service communication

**Services:**

- **Nginx** - Reverse proxy & load balancer
- **Node.js** - API & Web dashboard
- **Python/FastAPI** - AI service
- **PostgreSQL** - Primary database
- **Redis** - Caching layer
- **Ollama** - AI model serving
- **N8N** - Workflow automation

**Monitoring:**

- **Prometheus** - Metrics collection
- **Grafana** - Dashboards
- **Promtail** - Log shipping
- **AlertManager** - Alerting

---

## 3. Docker Architecture

### What is Docker Compose?

**Docker Compose** is a tool for defining multi-container applications:

**Without Compose (manual):**

```bash
docker run -d --name nginx nginx:alpine
docker run -d --name api node:20-alpine
docker run -d --name web node:20-alpine
docker network create vpn-network
docker network connect vpn-network nginx
docker network connect vpn-network api
# ... and so on (tedious!)
```

**With Compose (automated):**

```bash
docker compose up -d
# Done! All services started with networking configured
```

### Understanding docker-compose.yml

**Basic structure:**

```yaml
version: '3.9'

services: # Your containers
  nginx: # Service name
    image: nginx:alpine # Docker image to use
    container_name: vpn-nginx # Container name
    restart: unless-stopped # Restart policy
    ports:
      - '80:80' # Port mapping (host:container)
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf # File mount
    networks:
      - vpn-network # Network to join
    depends_on:
      - api # Start after api service

networks: # Network definitions
  vpn-network:
    driver: bridge

volumes: # Persistent storage
  api-logs:
```

### Multi-Stage Docker Builds

**Why multi-stage?**

- Smaller final images (less attack surface)
- Faster deployments
- Separate build and runtime dependencies

**Example: API Dockerfile**

```dockerfile
# Stage 1: Build (includes dev tools)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production (minimal)
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

**Result:**

- Builder stage: 500MB (includes TypeScript, build tools)
- Production stage: 150MB (only runtime files)
- Final image: 150MB (builder stage discarded)

### Docker Networks

**Your networks:**

**vpn-network (Production):**

```yaml
networks:
  vpn-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

**vpn-dev-network (Development):**

```yaml
networks:
  vpn-dev-network:
    driver: bridge
```

**How services communicate:**

```
Inside Docker network:
- nginx can reach api at: http://api:3000
- api can reach redis at: redis://redis:6379
- web can reach api at: http://api:3000

Docker DNS automatically resolves service names!
```

### Docker Volumes

**Types:**

**Named volumes (persistent data):**

```yaml
volumes:
  postgres-data: # Survives container restarts
  redis-data: # Managed by Docker
  api-logs: # Good for databases, logs
```

**Bind mounts (development):**

```yaml
volumes:
  - ./app:/app # Maps host folder to container
  - ./config:/config # Changes on host reflect in container
```

**Anonymous volumes (temporary):**

```yaml
volumes:
  - /app/node_modules # Preserves node_modules in container
```

---

## 4. Service Configurations

### Nginx Configuration

**Location:** `infrastructure/docker/nginx/`

**Purpose:** Reverse proxy that routes requests to appropriate services

**How it works:**

```
Browser request: https://chatbuilds.com/api/health
                 ↓
Nginx receives: https://chatbuilds.com/api/health
                 ↓
Matches location: /api
                 ↓
Proxies to: http://api:3000/health
                 ↓
API responds: {"status": "healthy"}
                 ↓
Nginx returns: {"status": "healthy"}
```

**Main config breakdown:**

**`nginx.conf`:**

```nginx
# Worker processes
worker_processes auto;  # One per CPU core
worker_rlimit_nofile 65535;  # Max open files

events {
    worker_connections 4096;  # Concurrent connections per worker
    use epoll;  # Efficient I/O method (Linux)
    multi_accept on;  # Accept multiple connections at once
}

http {
    # Logging
    access_log /var/log/nginx/access.log json_combined;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;

    # Compression
    gzip on;
    gzip_comp_level 5;
    gzip_types text/plain text/css application/json;

    # Include site configs
    include /etc/nginx/conf.d/*.conf;
}
```

**Site config (conf.d/default.conf):**

```nginx
upstream api_backend {
    least_conn;  # Load balancing method
    server api:3000 max_fails=3 fail_timeout=30s;
    # Add more servers here for scaling:
    # server api-2:3000;
    # server api-3:3000;
}

server {
    listen 80;
    server_name chatbuilds.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name chatbuilds.com;

    # SSL certificates
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # API proxy
    location /api/ {
        proxy_pass http://api_backend/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Python AI API
    location /api/ai/ {
        proxy_pass http://python-api:5001/;
        proxy_read_timeout 120s;  # AI can be slow
    }

    # N8N workflows
    location /admin/n8n/ {
        proxy_pass http://n8n:5678/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Web dashboard (everything else)
    location / {
        proxy_pass http://web-dashboard:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### API Service (Node.js)

**Dockerfile:** `infrastructure/docker/Dockerfile.api`

**Multi-stage build:**

```dockerfile
# Stage 1: Build TypeScript
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/

# Install dependencies
RUN npm ci

# Copy source
COPY packages/api ./packages/api
COPY tsconfig.json ./

# Build
RUN npm run build --workspace=@vpn-enterprise/api

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app

# Security updates
RUN apk add --no-cache tini curl
RUN apk upgrade --no-cache

# Non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -S nodejs -u 1001

# Copy built code
COPY --from=builder /app/packages/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Logs directory
RUN mkdir -p /app/logs && chown nodejs:nodejs /app/logs

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
```

**Compose configuration:**

```yaml
api:
  build:
    context: ../..
    dockerfile: infrastructure/docker/Dockerfile.api
  container_name: vpn-api
  restart: unless-stopped
  environment:
    - NODE_ENV=production
    - PORT=3000
    - SUPABASE_URL=${SUPABASE_URL}
  env_file:
    - ../../.env
  networks:
    - vpn-network
  expose:
    - '3000' # Only accessible within Docker network
  volumes:
    - api-logs:/app/logs
  healthcheck:
    test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
    interval: 30s
    timeout: 10s
    retries: 3
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 512M
      reservations:
        cpus: '0.25'
        memory: 256M
```

### Web Dashboard (Next.js)

**Dockerfile:** `infrastructure/docker/Dockerfile.web`

**Multi-stage build:**

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY apps/web-dashboard/package.json ./
RUN npm install

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web-dashboard ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache tini curl

RUN addgroup -g 1001 nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder --chown=nodejs:nodejs /app/public ./public
COPY --from=builder --chown=nodejs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/.next/static ./.next/static

USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:3001/ || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
```

### Python AI Service (FastAPI)

**See:** `flask/Dockerfile`

**Compose configuration:**

```yaml
python-api:
  build:
    context: ../../flask
    dockerfile: Dockerfile
  container_name: vpn-python-api
  restart: unless-stopped
  environment:
    - OLLAMA_URL=http://ollama:11434
    - API_URL=http://api:3000
    - N8N_URL=http://n8n:5678
  networks:
    - vpn-network
  expose:
    - '5001'
  healthcheck:
    test: ['CMD', 'curl', '-f', 'http://localhost:5001/health']
    interval: 30s
```

### Ollama (AI Model Server)

**Compose configuration:**

```yaml
ollama:
  image: ollama/ollama:latest
  container_name: vpn-ollama
  restart: unless-stopped
  volumes:
    - ollama-models:/root/.ollama # Persist models
  networks:
    - vpn-network
  expose:
    - '11434'
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 4G # AI models need memory
```

### PostgreSQL

**Compose configuration:**

```yaml
postgres:
  image: postgres:15-alpine
  container_name: vpn-postgres
  restart: unless-stopped
  environment:
    - POSTGRES_USER=${POSTGRES_USER}
    - POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password
    - POSTGRES_DB=${POSTGRES_DB}
  secrets:
    - postgres_password
  volumes:
    - postgres-data:/var/lib/postgresql/data
    - ./postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
  networks:
    - vpn-network
  ports:
    - '5432:5432' # Expose for external connections
  healthcheck:
    test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER}']
    interval: 10s
```

### Redis

**Compose configuration:**

```yaml
redis:
  image: redis:7-alpine
  container_name: vpn-redis
  restart: unless-stopped
  command: redis-server --requirepass $(cat /run/secrets/redis_password)
  secrets:
    - redis_password
  volumes:
    - redis-data:/data
  networks:
    - vpn-network
  expose:
    - '6379'
  healthcheck:
    test: ['CMD', 'redis-cli', 'ping']
    interval: 10s
```

---

## 5. Networking & Routing

### Docker Networking Explained

**Bridge Network (default):**

```yaml
networks:
  vpn-network:
    driver: bridge
```

**What it does:**

- Creates isolated network for containers
- Containers can talk to each other by name
- Isolated from host network (secure)

**How DNS works:**

```
Container "api" wants to reach "redis":
1. Looks up "redis" in Docker DNS
2. Docker returns 172.20.0.5 (redis container IP)
3. Connection established

No hardcoded IPs needed!
```

### Port Mapping

**Format:** `HOST:CONTAINER`

**Example:**

```yaml
ports:
  - '80:80' # Host port 80 → Container port 80
  - '3000:3001' # Host port 3000 → Container port 3001
  - '127.0.0.1:5432:5432' # Only localhost can access
```

**Expose vs Ports:**

```yaml
# expose: Only accessible within Docker network
expose:
  - '3000'

# ports: Accessible from host machine
ports:
  - '3000:3000'
```

### Request Flow

**Example: User visits dashboard**

```
1. Browser → https://chatbuilds.com
   ↓
2. Nginx (443) receives request
   ↓
3. Nginx SSL termination (HTTPS → HTTP)
   ↓
4. Nginx looks at path: /
   ↓
5. Matches: location / { proxy_pass http://web-dashboard:3001; }
   ↓
6. Nginx forwards to web-dashboard:3001
   ↓
7. Web dashboard (Next.js) renders page
   ↓
8. Response travels back through Nginx
   ↓
9. Browser receives HTML
```

**Example: API call from dashboard**

```
1. Dashboard JavaScript → fetch('/api/servers')
   ↓
2. Browser → https://chatbuilds.com/api/servers
   ↓
3. Nginx receives request
   ↓
4. Matches: location /api/ { proxy_pass http://api:3000/; }
   ↓
5. Nginx forwards to api:3000/servers
   ↓
6. API (Node.js) processes request
   ↓
7. API queries Supabase
   ↓
8. API returns JSON
   ↓
9. Nginx forwards response
   ↓
10. Dashboard receives data, updates UI
```

### Load Balancing

**Configure multiple backend instances:**

```nginx
upstream api_backend {
    least_conn;  # Route to server with fewest connections
    server api-1:3000 weight=3;  # More weight = more traffic
    server api-2:3000 weight=2;
    server api-3:3000 weight=1;

    # Health checks
    server api-1:3000 max_fails=3 fail_timeout=30s;
}

server {
    location /api/ {
        proxy_pass http://api_backend/;
    }
}
```

**Compose (scaling):**

```bash
docker compose up -d --scale api=3
```

---

## 6. Deployment Strategies

### Development Setup

**Quick start:**

```bash
cd infrastructure/docker
docker compose -f docker-compose.dev.yml up -d
```

**What it includes:**

- API with hot reload
- Web dashboard with hot reload
- Redis
- PostgreSQL
- N8N
- Ollama

**Development features:**

- Volume mounts for live code changes
- Debug ports exposed
- Verbose logging
- No SSL (HTTP only)

### Production Deployment

**Full stack:**

```bash
cd infrastructure/docker
docker compose -f docker-compose.yml up -d
```

**What it includes:**

- Nginx with SSL
- API (production build)
- Web dashboard (production build)
- Python AI service
- PostgreSQL
- Redis
- Ollama
- N8N
- Monitoring stack

**Production features:**

- Multi-stage builds (smaller images)
- Health checks
- Resource limits
- Restart policies
- SSL certificates
- Non-root users

### Blue-Green Deployment

**Strategy:** Run two identical environments, switch traffic

**Setup:**

```bash
# Current production (blue)
docker compose -f docker-compose.yml up -d

# New version (green)
docker compose -f docker-compose.green.yml up -d

# Test green environment
curl http://green.chatbuilds.com/health

# Switch nginx to point to green
# Update nginx config, reload

# If successful, keep green
# If issues, switch back to blue (instant rollback)
```

### Rolling Updates

**Strategy:** Update containers one at a time

**Example:**

```bash
# Update API (zero downtime with multiple instances)
docker compose up -d --no-deps --build api-1
# Wait for health check
docker compose up -d --no-deps --build api-2
# Wait for health check
docker compose up -d --no-deps --build api-3
```

### Deployment Checklist

**Pre-deployment:**

- [ ] Code reviewed and tested
- [ ] Environment variables updated
- [ ] Secrets rotated if needed
- [ ] Database migrations prepared
- [ ] Backup current state

**Deployment:**

- [ ] Build new images
- [ ] Run database migrations
- [ ] Deploy services
- [ ] Verify health checks
- [ ] Test critical paths

**Post-deployment:**

- [ ] Monitor logs for errors
- [ ] Check metrics (CPU, memory, response times)
- [ ] Verify all services healthy
- [ ] Test user flows
- [ ] Have rollback plan ready

---

## 7. Monitoring & Observability

### Monitoring Stack

**Location:** `infrastructure/monitoring/`

**Components:**

1. **Prometheus** - Metrics collection
2. **Grafana** - Visualization
3. **AlertManager** - Alerting
4. **Promtail** - Log aggregation

**Setup:**

```bash
cd infrastructure/docker
docker compose -f docker-compose.monitoring.yml up -d
```

### Prometheus

**What it monitors:**

- Container CPU, memory, disk usage
- Request rates, response times
- Error rates
- Custom application metrics

**Configuration:** `infrastructure/monitoring/prometheus/prometheus.yml`

```yaml
scrape_configs:
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:9113']

  - job_name: 'api'
    static_configs:
      - targets: ['api:3000']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
```

**Access:** http://localhost:9090

### Grafana

**Pre-built dashboards:**

- Docker containers overview
- Nginx metrics
- API performance
- Database queries
- System resources

**Configuration:** `infrastructure/monitoring/grafana/`

**Access:** http://localhost:3000

- User: admin
- Password: (set in secrets)

### Logging

**Centralized logging:**

```yaml
logging:
  driver: 'json-file'
  options:
    max-size: '10m'
    max-file: '3'
```

**View logs:**

```bash
# Single service
docker logs vpn-api

# Follow logs
docker logs -f vpn-api

# Last 100 lines
docker logs --tail 100 vpn-api

# All services
docker compose logs

# Specific service with timestamp
docker logs -t vpn-api
```

### Health Checks

**Purpose:** Ensure services are running correctly

**Example:**

```yaml
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
  interval: 30s # Check every 30 seconds
  timeout: 10s # Timeout after 10 seconds
  retries: 3 # Try 3 times before marking unhealthy
  start_period: 40s # Give 40s to start before first check
```

**Check health status:**

```bash
docker ps
# HEALTHY if passing
# UNHEALTHY if failing

docker inspect vpn-api | grep Health -A 10
```

### Alerting

**AlertManager configuration:**

```yaml
route:
  receiver: 'team-email'
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h

receivers:
  - name: 'team-email'
    email_configs:
      - to: 'devops@example.com'
        from: 'alerts@example.com'
```

**Common alerts:**

- Service down
- High CPU/memory usage
- Disk space low
- High error rate
- Slow response times

---

## 8. Security & Secrets

### Secret Management

**Docker Secrets:**

```yaml
secrets:
  postgres_password:
    file: ./secrets/postgres_password.txt
  api_key:
    file: ./secrets/api_key.txt

services:
  postgres:
    secrets:
      - postgres_password
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password
```

**Creating secrets:**

```bash
# Create secrets directory
mkdir -p infrastructure/docker/secrets
chmod 700 infrastructure/docker/secrets

# Create secret files
echo "your-strong-password" > secrets/postgres_password.txt
chmod 600 secrets/postgres_password.txt

# Add to .gitignore
echo "secrets/*.txt" >> .gitignore
```

**In code:**

```javascript
// Read secret from file
const fs = require('fs')
const password = fs
  .readFileSync('/run/secrets/postgres_password', 'utf8')
  .trim()
```

### Environment Variables

**Security levels:**

**Public (NEXT*PUBLIC*\*):**

```bash
# Exposed to browser, not sensitive
NEXT_PUBLIC_API_URL=https://chatbuilds.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
```

**Private (backend only):**

```bash
# Never sent to browser
SUPABASE_SERVICE_ROLE_KEY=secret-key
DATABASE_URL=postgresql://...
```

**Best practices:**

- Never commit secrets to Git
- Use `.env` files (in `.gitignore`)
- Rotate secrets regularly
- Use different secrets per environment

### SSL/TLS Certificates

**Let's Encrypt (automated):**

```bash
# Install certbot
apt-get install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d chatbuilds.com -d www.chatbuilds.com

# Auto-renewal
certbot renew --dry-run
```

**Manual certificates:**

```bash
# Generate self-signed (development)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem
```

**Nginx SSL config:**

```nginx
server {
    listen 443 ssl http2;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Strong SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
}
```

### Container Security

**Non-root users:**

```dockerfile
RUN addgroup -g 1001 nodejs && \
    adduser -S nodejs -u 1001
USER nodejs
```

**Read-only filesystem:**

```yaml
security_opt:
  - no-new-privileges:true
read_only: true
tmpfs:
  - /tmp
  - /var/run
```

**Resource limits:**

```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
```

---

## 9. Scaling & Performance

### Horizontal Scaling

**Scale services:**

```bash
# Start 3 API instances
docker compose up -d --scale api=3

# Nginx automatically load balances
```

**Compose config for scaling:**

```yaml
api:
  deploy:
    replicas: 3
```

### Vertical Scaling

**Increase resources:**

```yaml
deploy:
  resources:
    limits:
      cpus: '2' # 2 CPU cores
      memory: 2G # 2GB RAM
    reservations:
      cpus: '0.5' # Guaranteed 0.5 cores
      memory: 512M # Guaranteed 512MB
```

### Caching

**Redis caching:**

```javascript
const redis = require('redis')
const client = redis.createClient({ url: 'redis://redis:6379' })

// Cache API response
async function getServers() {
  // Try cache first
  const cached = await client.get('servers')
  if (cached) return JSON.parse(cached)

  // Fetch from database
  const servers = await db.query('SELECT * FROM servers')

  // Store in cache (5 minutes)
  await client.setex('servers', 300, JSON.stringify(servers))

  return servers
}
```

**Nginx caching:**

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;

location /api/static/ {
    proxy_cache my_cache;
    proxy_cache_valid 200 60m;
    proxy_pass http://api:3000/static/;
}
```

### Database Optimization

**Connection pooling:**

```javascript
const { Pool } = require('pg')

const pool = new Pool({
  host: 'postgres',
  max: 20, // Max 20 connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
```

**Indexes:**

```sql
-- Speed up queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_servers_status ON servers(status);
```

### Performance Monitoring

**Key metrics:**

- Request rate (requests/second)
- Response time (p50, p95, p99)
- Error rate (%)
- CPU usage (%)
- Memory usage (MB)
- Disk I/O (MB/s)

**Tools:**

- Prometheus metrics
- Grafana dashboards
- Docker stats
- Application logs

---

## 10. Troubleshooting

### Common Issues

**Issue: Container won't start**

```bash
# Check logs
docker logs vpn-api

# Common causes:
# - Port already in use
# - Environment variable missing
# - Volume permission issues
# - Health check failing
```

**Issue: Service unreachable**

```bash
# Check if running
docker ps | grep vpn-api

# Check network
docker network inspect vpn-network

# Test connectivity
docker exec vpn-nginx curl http://api:3000/health
```

**Issue: Out of memory**

```bash
# Check resource usage
docker stats

# Increase limits in compose file
deploy:
  resources:
    limits:
      memory: 1G  # Increase from 512M
```

**Issue: Slow performance**

```bash
# Check logs for errors
docker logs vpn-api | grep ERROR

# Check database connections
docker exec vpn-postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check Redis
docker exec vpn-redis redis-cli INFO stats
```

### Debugging Commands

**Container inspection:**

```bash
# Detailed info
docker inspect vpn-api

# Just health status
docker inspect --format='{{.State.Health.Status}}' vpn-api

# Environment variables
docker exec vpn-api env
```

**Network debugging:**

```bash
# Test DNS resolution
docker exec vpn-api nslookup postgres

# Test connectivity
docker exec vpn-api ping postgres

# Check open ports
docker exec vpn-api netstat -tulpn
```

**Resource usage:**

```bash
# Real-time stats
docker stats

# Disk usage
docker system df

# Clean up
docker system prune -a --volumes
```

### Log Analysis

**Search logs:**

```bash
# Find errors
docker logs vpn-api 2>&1 | grep -i error

# Find specific request
docker logs vpn-nginx | grep "/api/servers"

# Count errors
docker logs vpn-api 2>&1 | grep -c ERROR
```

**Export logs:**

```bash
# Save to file
docker logs vpn-api > api-logs.txt

# With timestamps
docker logs -t vpn-api > api-logs-timestamped.txt
```

---

## 11. Maintenance & Backups

### Regular Maintenance

**Weekly tasks:**

```bash
# Check logs for errors
docker compose logs | grep ERROR

# Verify health checks
docker ps

# Check disk space
df -h
docker system df
```

**Monthly tasks:**

```bash
# Update images
docker compose pull
docker compose up -d

# Clean old images
docker image prune -a

# Rotate logs
docker logs --since 30d vpn-api > archive.log
```

### Backup Strategy

**Database backups:**

```bash
# Automated daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec vpn-postgres pg_dump -U postgres vpn_db > backup_$DATE.sql

# Keep last 7 days
find . -name "backup_*.sql" -mtime +7 -delete
```

**Volume backups:**

```bash
# Backup postgres data
docker run --rm -v postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data

# Restore
docker run --rm -v postgres-data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /data
```

**Configuration backups:**

```bash
# Backup all configs
tar czf configs-backup.tar.gz infrastructure/docker/

# Commit to Git (without secrets)
git add infrastructure/
git commit -m "Backup infrastructure configs"
git push
```

### Disaster Recovery

**Recovery plan:**

**1. Data loss:**

```bash
# Stop services
docker compose down

# Restore data
docker run --rm -v postgres-data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /data

# Start services
docker compose up -d

# Verify
docker logs vpn-postgres
docker exec vpn-postgres psql -U postgres -c "SELECT count(*) FROM users;"
```

**2. Complete server failure:**

```bash
# On new server:
# 1. Install Docker
# 2. Clone repository
git clone https://github.com/you/vpn-enterprise.git
cd vpn-enterprise

# 3. Restore secrets
# Copy secrets files to infrastructure/docker/secrets/

# 4. Restore data volumes
# Copy backup files

# 5. Start stack
cd infrastructure/docker
docker compose up -d

# 6. Verify all services
docker ps
curl http://localhost/health
```

---

## 12. Quick Reference

### Common Commands

```bash
# Start all services
docker compose up -d

# Start specific service
docker compose up -d nginx

# Stop all services
docker compose down

# Restart service
docker compose restart api

# View logs
docker logs vpn-api
docker compose logs -f

# Execute command in container
docker exec -it vpn-api sh

# Check status
docker ps
docker compose ps

# Rebuild and restart
docker compose up -d --build api

# Scale service
docker compose up -d --scale api=3

# Clean up
docker compose down -v  # Remove volumes
docker system prune -a  # Clean everything
```

### File Locations

```
Configs:     infrastructure/docker/
Nginx:       infrastructure/docker/nginx/
Secrets:     infrastructure/docker/secrets/
Monitoring:  infrastructure/monitoring/
Logs:        /var/lib/docker/volumes/
```

### Port Reference

```
80/443   - Nginx (HTTP/HTTPS)
3000     - API
3001     - Web Dashboard
5001     - Python AI
5432     - PostgreSQL
6379     - Redis
5678     - N8N
11434    - Ollama
9090     - Prometheus
3000     - Grafana
```

### Health Check URLs

```
http://localhost/health              - Nginx
http://localhost:3000/health         - API
http://localhost:3001/               - Web
http://localhost:5001/health         - Python AI
```

---

**Last Updated:** February 1, 2026  
**Infrastructure Status:** Production-ready ✅

---

_Master this guide and you'll confidently manage infrastructure for years to come!_ 🏗️
