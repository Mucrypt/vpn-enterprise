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
