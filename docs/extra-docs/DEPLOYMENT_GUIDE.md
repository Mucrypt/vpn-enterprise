# 🚀 VPN Enterprise - Deployment Guide

Complete guide for deploying VPN Enterprise to production (Vercel + Docker).

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Testing](#local-testing)
3. [Vercel Deployment](#vercel-deployment)
4. [Docker Deployment](#docker-deployment)
5. [Production Checklist](#production-checklist)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Required Tools

- [x] Node.js 20+ installed
- [x] Docker Desktop installed (Windows/Mac) or Docker Engine (Linux)
- [x] Git configured
- [x] Vercel account (free tier works)
- [x] Supabase project created

### Required Accounts

1. **GitHub**: Code repository
2. **Vercel**: Serverless deployment
3. **Supabase**: Database and authentication
4. **Stripe** (optional): Payment processing

---

## Local Testing

### 1. Install Dependencies

```bash
cd /home/mukulah/vpn-enterprise
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### 3. Test with Docker (Recommended)

```bash
# Build all services
./scripts/deployment/build.sh development

# Start development stack
docker-compose -f infrastructure/docker/docker-compose.dev.yml up
```

Access services:
- API: http://localhost:3000/health
- Web Dashboard: http://localhost:3001

### 4. Test Without Docker

```bash
# Terminal 1: Start API
cd packages/api
npm run dev

# Terminal 2: Start Web Dashboard
cd apps/web-dashboard
npm run dev
```

---

## Vercel Deployment

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy API

```bash
cd packages/api

# First deployment (interactive)
vercel

# Follow prompts:
# - Set up and deploy: Yes
# - Which scope: Your account
# - Link to existing project: No
# - Project name: vpn-enterprise-api
# - Directory: ./
# - Override settings: No
```

**Configure Environment Variables in Vercel Dashboard:**

1. Go to https://vercel.com/dashboard
2. Select `vpn-enterprise-api` project
3. Go to Settings → Environment Variables
4. Add:
   ```
   SUPABASE_URL=https://wgmgtxlodyxbhxfpnwwm.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ALLOWED_ORIGINS=https://your-dashboard.vercel.app
   NODE_ENV=production
   ```

**Deploy to Production:**

```bash
vercel --prod
```

Your API will be live at: `https://vpn-enterprise-api.vercel.app`

### Step 4: Deploy Web Dashboard

```bash
cd ../../apps/web-dashboard

# First deployment
vercel

# Configure project:
# - Project name: vpn-enterprise-dashboard
# - Framework: Next.js
```

**Configure Environment Variables:**

1. Go to Dashboard → `vpn-enterprise-dashboard`
2. Settings → Environment Variables
3. Add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://wgmgtxlodyxbhxfpnwwm.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   NEXT_PUBLIC_API_URL=https://vpn-enterprise-api.vercel.app
   ```

**Deploy to Production:**

```bash
vercel --prod
```

Your dashboard will be live at: `https://vpn-enterprise-dashboard.vercel.app`

### Step 5: Update API CORS

Update Vercel environment variable for API:

```
ALLOWED_ORIGINS=https://vpn-enterprise-dashboard.vercel.app
```

Redeploy API:

```bash
cd ../../packages/api
vercel --prod
```

---

## Docker Deployment (VPS/Cloud)

For self-hosted deployment on VPS (DigitalOcean, AWS, Oracle Cloud, etc.)

### Step 1: Provision Server

**Minimum Specs:**
- 2 vCPU
- 4GB RAM
- 50GB SSD
- Ubuntu 22.04 LTS

### Step 2: Initial Server Setup

```bash
# SSH into server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 3: Clone Repository

```bash
# Install Git
apt install git -y

# Clone project
cd /opt
git clone https://github.com/Mucrypt/vpn-enterprise.git
cd vpn-enterprise
```

### Step 4: Configure Environment

```bash
cp .env.example .env
nano .env
```

Update with production values.

### Step 5: Configure SSL Certificates

**Option A: Let's Encrypt (Recommended)**

```bash
# Install Certbot
apt install certbot -y

# Get certificate
certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Copy to Nginx
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem infrastructure/docker/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem infrastructure/docker/nginx/ssl/key.pem
```

**Option B: Self-Signed (Development Only)**

Generated automatically by deploy script.

### Step 6: Deploy

```bash
# Make scripts executable
chmod +x scripts/deployment/*.sh

# Build images
./scripts/deployment/build.sh production

# Deploy services
./scripts/deployment/deploy.sh production
```

### Step 7: Configure Firewall

```bash
# Install UFW
apt install ufw -y

# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable
```

### Step 8: Verify Deployment

```bash
# Check services
docker-compose -f infrastructure/docker/docker-compose.yml ps

# Health check
./scripts/deployment/health-check.sh

# View logs
docker-compose -f infrastructure/docker/docker-compose.yml logs -f
```

Access your services:
- API: https://your-domain.com/api/health
- Dashboard: https://your-domain.com
- Grafana: https://your-domain.com:3000
- Prometheus: https://your-domain.com:9090

---

## Production Checklist

### Security

- [ ] Change default Grafana password
- [ ] Set strong Redis password
- [ ] Use real SSL certificates (Let's Encrypt)
- [ ] Configure firewall rules
- [ ] Enable automatic security updates
- [ ] Rotate Supabase service role key
- [ ] Review Nginx security headers
- [ ] Enable rate limiting
- [ ] Configure CSP headers

### Performance

- [ ] Enable Nginx caching
- [ ] Configure Redis for session storage
- [ ] Set up CDN for static assets
- [ ] Enable gzip compression
- [ ] Configure database connection pooling
- [ ] Add database indexes
- [ ] Enable query caching

### Monitoring

- [ ] Set up Prometheus alerts
- [ ] Configure Grafana dashboards
- [ ] Enable log aggregation (Loki)
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Configure error tracking (Sentry)
- [ ] Enable application metrics

### Backup

- [ ] Automated database backups
- [ ] Docker volume backups
- [ ] SSL certificate renewal automation
- [ ] Configuration version control
- [ ] Disaster recovery plan

### Domain & DNS

- [ ] Purchase custom domain
- [ ] Configure DNS records:
  - A record: your-domain.com → server IP
  - A record: www.your-domain.com → server IP
  - CNAME: api.your-domain.com → Vercel
- [ ] Configure SSL for custom domain

---

## Monitoring & Maintenance

### View Logs

```bash
# All services
docker-compose -f infrastructure/docker/docker-compose.yml logs -f

# Specific service
docker logs vpn-api -f --tail=100
```

### Health Checks

```bash
# Manual check
./scripts/deployment/health-check.sh

# API health
curl https://your-domain.com/api/health

# Web health
curl https://your-domain.com
```

### Update Deployment

```bash
# Pull latest code
git pull origin main

# Rebuild and redeploy
./scripts/deployment/build.sh production
./scripts/deployment/deploy.sh production
```

### Rollback

```bash
./scripts/deployment/rollback.sh
```

### Scale Services

```bash
# Scale API to 3 instances
docker-compose -f infrastructure/docker/docker-compose.yml up -d --scale api=3

# Nginx will automatically load balance
```

### Database Backup

```bash
# Backup Supabase (use Supabase dashboard)
# Or export manually:
curl "https://wgmgtxlodyxbhxfpnwwm.supabase.co/rest/v1/your-table" \
  -H "apikey: your-anon-key" > backup.json
```

### SSL Certificate Renewal

```bash
# Automatic renewal (Let's Encrypt)
certbot renew --dry-run

# Add to crontab for auto-renewal
crontab -e
# Add: 0 0 1 * * certbot renew --post-hook "systemctl reload nginx"
```

---

## Troubleshooting

### API Not Responding

```bash
# Check API logs
docker logs vpn-api

# Verify environment variables
docker exec vpn-api env | grep SUPABASE

# Restart API
docker-compose -f infrastructure/docker/docker-compose.yml restart api
```

### Database Connection Error

```bash
# Test Supabase connection
curl "https://wgmgtxlodyxbhxfpnwwm.supabase.co/rest/v1/" \
  -H "apikey: your-anon-key"

# Check API logs for details
docker logs vpn-api | grep -i database
```

### Nginx 502 Bad Gateway

```bash
# Check if API is running
docker ps | grep vpn-api

# Check Nginx logs
docker logs vpn-nginx

# Restart Nginx
docker-compose -f infrastructure/docker/docker-compose.yml restart nginx
```

### Out of Memory

```bash
# Check memory usage
docker stats

# Increase Docker memory limit
# Or scale down services
docker-compose -f infrastructure/docker/docker-compose.yml down prometheus grafana
```

---

## Support & Resources

- **Documentation**: `/docs` directory
- **GitHub Issues**: https://github.com/Mucrypt/vpn-enterprise/issues
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Docker Docs**: https://docs.docker.com

---

**🎉 Congratulations! Your VPN Enterprise platform is now live!**
