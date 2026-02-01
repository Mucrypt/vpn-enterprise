# Hetzner Server Configuration

## 🖥️ Your Server Details

### Production Server

- **IP Address:** `157.180.123.240`
- **IPv6:** `2a01:4f9:c013:655f::1`
- **Hostname:** `mukulah-ubuntu-8gb`
- **OS:** Ubuntu 24.04.3 LTS
- **SSH User:** `root`
- **SSH Key:** `~/.ssh/id_ed25519`
- **Memory:** 8GB (51% used)
- **Disk:** 149.92GB (29.7% used)

---

## 🔐 GitHub Secrets Configuration

Add these secrets to your GitHub repository (`Settings` → `Secrets and variables` → `Actions`):

### Production Deployment

```
PROD_DEPLOY_HOST = 157.180.123.240
PROD_DEPLOY_USER = root
PROD_DEPLOY_SSH_KEY = <contents of ~/.ssh/id_ed25519>
```

### Get Your SSH Private Key

```bash
# On your local machine
cat ~/.ssh/id_ed25519
```

Copy the **entire output** including:

- `-----BEGIN OPENSSH PRIVATE KEY-----`
- All the content in between
- `-----END OPENSSH PRIVATE KEY-----`

Paste this into GitHub as the `PROD_DEPLOY_SSH_KEY` secret.

---

## 📂 Expected Repository Location on Server

Based on the workflow configuration, ensure your repository is cloned at:

### Production

```bash
/opt/vpn-enterprise
```

### Current Setup Check

```bash
ssh root@157.180.123.240 "ls -la /opt/"
```

If the directory doesn't exist:

```bash
ssh root@157.180.123.240 "sudo mkdir -p /opt && cd /opt && git clone https://github.com/Mucrypt/vpn-enterprise.git"
```

---

## ✅ Verify Server Setup

Run these commands on your Hetzner server to ensure everything is ready:

### 1. Check Docker Installation

```bash
docker --version
docker compose version
```

Expected output:

```
Docker version 24.x.x
Docker Compose version v2.x.x
```

If not installed:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose (if needed)
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

### 2. Check Repository

```bash
cd /opt/vpn-enterprise
git status
git remote -v
```

### 3. Check Running Containers

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expected containers:

- vpn-nginx (ports 80, 443)
- vpn-api
- vpn-web
- vpn-postgres
- vpn-redis
- vpn-python-api
- vpn-n8n
- vpn-ollama
- vpn-pgadmin

### 4. Check Nginx Configuration

```bash
docker exec vpn-nginx nginx -t
```

### 5. Test Health Endpoints

```bash
curl http://localhost/health
curl http://localhost/api/health
```

---

## 🚀 Manual Deployment (for testing)

If you want to test deployment manually before using CI/CD:

```bash
# SSH into server
ssh root@157.180.123.240

# Navigate to repo
cd /opt/vpn-enterprise

# Pull latest changes
git fetch origin
git checkout main
git pull origin main

# Deploy production stack
docker compose -f infrastructure/docker/docker-compose.prod.yml pull
docker compose -f infrastructure/docker/docker-compose.prod.yml up -d

# Check status
docker ps
docker compose -f infrastructure/docker/docker-compose.prod.yml logs --tail=50
```

---

## 🔍 Troubleshooting

### Can't connect via SSH

```bash
# Test connection from local machine
ssh -i ~/.ssh/id_ed25519 root@157.180.123.240

# If permission denied, check key permissions
chmod 600 ~/.ssh/id_ed25519
```

### Port already in use

```bash
# Check what's using port 80/443
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Stop nginx if needed
docker stop vpn-nginx
```

### Disk space issues

```bash
# Clean up Docker
docker system prune -a --volumes

# Check disk usage
df -h
du -sh /var/lib/docker/*
```

### Container won't start

```bash
# View logs
docker logs vpn-api --tail=100
docker logs vpn-nginx --tail=100

# Check health
docker inspect vpn-api --format='{{json .State.Health}}' | jq
```

---

## 🔄 Backup Strategy

### Before Deployment

The CI/CD workflow automatically creates backups at:

```
/opt/backups/deployments/YYYYMMDD-HHMMSS/
```

### Manual Backup

```bash
# Create backup directory
mkdir -p /opt/backups/manual-$(date +%Y%m%d-%H%M%S)

# Backup database
docker exec vpn-postgres pg_dump -U platform_admin platform_db > /opt/backups/manual-$(date +%Y%m%d-%H%M%S)/database.sql

# Backup docker volumes
docker run --rm -v vpn-enterprise_postgres_data:/data -v /opt/backups:/backup alpine tar czf /backup/postgres-data-$(date +%Y%m%d).tar.gz /data
```

### Restore from Backup

```bash
# Restore database
cat /opt/backups/[backup-dir]/database.sql | docker exec -i vpn-postgres psql -U platform_admin platform_db
```

---

## 📊 Monitoring

### Check System Resources

```bash
# CPU and Memory
htop

# Disk usage
df -h

# Docker stats
docker stats

# Specific container
docker stats vpn-api
```

### View Application Logs

```bash
# All services
docker compose -f infrastructure/docker/docker-compose.prod.yml logs -f

# Specific service
docker logs -f vpn-api
docker logs -f vpn-nginx

# Last 100 lines
docker logs --tail=100 vpn-api
```

### Nginx Access Logs

```bash
docker exec vpn-nginx tail -f /var/log/nginx/access.log
docker exec vpn-nginx tail -f /var/log/nginx/error.log
```

---

## 🔐 Security Checklist

- [x] Firewall configured (UFW)
- [ ] SSH key authentication only (disable password)
- [ ] Non-root user for Docker (optional)
- [ ] Fail2ban installed
- [ ] SSL certificates configured
- [ ] Docker secrets properly set
- [ ] Regular backups automated
- [ ] Monitoring alerts configured

### Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## 📝 Quick Commands Reference

```bash
# View running containers
docker ps

# Restart a service
docker restart vpn-api

# View service logs
docker logs -f vpn-api

# Enter container shell
docker exec -it vpn-api sh

# Reload nginx config
docker exec vpn-nginx nginx -s reload

# Check nginx config
docker exec vpn-nginx nginx -t

# Update and restart all services
cd /opt/vpn-enterprise
git pull origin main
docker compose -f infrastructure/docker/docker-compose.prod.yml pull
docker compose -f infrastructure/docker/docker-compose.prod.yml up -d

# Clean up unused Docker resources
docker system prune -a
```

---

## 🆘 Emergency Procedures

### Complete System Restart

```bash
cd /opt/vpn-enterprise
docker compose -f infrastructure/docker/docker-compose.prod.yml down
docker compose -f infrastructure/docker/docker-compose.prod.yml up -d
```

### Rollback to Previous Version

```bash
cd /opt/vpn-enterprise
git log --oneline -10  # Find previous commit
git checkout <commit-hash>
docker compose -f infrastructure/docker/docker-compose.prod.yml down
docker compose -f infrastructure/docker/docker-compose.prod.yml up -d
```

### Emergency Stop All

```bash
docker stop $(docker ps -q)
```

---

**Server Ready for CI/CD Deployment** ✅

Once you add the GitHub secrets, you can trigger deployments from the GitHub Actions UI:
`Actions` → `Deploy to Environment` → `Run workflow`
