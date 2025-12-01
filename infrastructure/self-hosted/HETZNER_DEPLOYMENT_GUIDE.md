# VPN Enterprise: Complete Hetzner Deployment Guide
## From Zero to Production in 2 Hours

### 🎯 What You'll Achieve
By the end of this guide, you'll have:
- A fully functional VPN Enterprise platform running on Hetzner
- All services running (API, Web Dashboard, Database, VPN, Storage)
- SSL certificates configured
- Monitoring and backups set up
- Ready to onboard your first customers

---

## 📋 Prerequisites Checklist

### Required Items:
- [ ] Hetzner account created
- [ ] Domain name purchased (optional but recommended)
- [ ] SSH key pair generated
- [ ] Credit card for server payment (~€39/month)
- [ ] Basic terminal/SSH knowledge

### Recommended Domain Setup:
```
Main domain: yourdomain.com
API subdomain: api.yourdomain.com
Admin panel: admin.yourdomain.com
Customer subdomains: *.yourdomain.com (wildcard)
```

---

## 🏗️ Part 1: Hetzner Server Setup (15 minutes)

### Step 1.1: Create Hetzner Account
1. Go to https://www.hetzner.com/
2. Click "Sign Up" → Create account
3. Verify email address
4. Add payment method (credit card)

### Step 1.2: Generate SSH Key (Local Machine)
```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -c "your-email@domain.com"

# Display public key (copy this)
cat ~/.ssh/id_rsa.pub
```

### Step 1.3: Order Dedicated Server
1. **Login to Hetzner Console** → https://robot.hetzner.com/
2. **Navigate to**: "Order" → "Dedicated Servers"
3. **Select Server**: AX41-NVMe
   ```
   - AMD Ryzen 5 3600 (6 cores, 12 threads)
   - 64 GB DDR4 RAM
   - 512 GB NVMe SSD
   - 1 Gbit/s port, unlimited traffic
   - Price: €39.00/month
   ```
4. **Configuration**:
   - Location: Falkenstein (Germany) or Helsinki (Finland)
   - Operating System: Ubuntu 24.04 LTS
   - SSH Key: Paste your public key from step 1.2
   - Hostname: vpn-enterprise-01
5. **Complete Order** → Wait 15-30 minutes for provisioning

### Step 1.4: Initial Server Access
```bash
# You'll receive an email with server IP
# SSH into your server
ssh root@YOUR_SERVER_IP

# Update system immediately
apt update && apt upgrade -y

# Set timezone
timedatectl set-timezone UTC

# Create non-root user
adduser deploy
usermod -aG sudo deploy
mkdir /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### Step 1.5: Basic Security Setup
```bash
# Configure firewall
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp  # API
ufw allow 3001/tcp  # Web Dashboard
ufw allow 51820/udp # VPN

# Disable root SSH login
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart ssh

# Exit and reconnect as deploy user
exit
ssh deploy@YOUR_SERVER_IP
```

---

## 🚀 Part 2: Infrastructure Setup (30 minutes)

### Step 2.1: Install Required Software
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Install Node.js (for building)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install nginx (reverse proxy)
sudo apt install -y nginx

# Enable services
sudo systemctl enable docker
sudo systemctl enable nginx
sudo systemctl start docker
sudo systemctl start nginx

# Log out and back in for docker group to take effect
exit
ssh deploy@YOUR_SERVER_IP
```

### Step 2.2: Clone Your Project
```bash
# Clone your VPN Enterprise project
git clone https://github.com/Mucrypt/vpn-enterprise.git
cd vpn-enterprise

# Make scripts executable
chmod +x infrastructure/self-hosted/*.sh

# Create necessary directories
sudo mkdir -p /opt/vpn-enterprise/{data,logs,backups,ssl}
sudo chown -R deploy:deploy /opt/vpn-enterprise
```

### Step 2.3: Configure Environment
```bash
# Navigate to self-hosted directory
cd infrastructure/self-hosted

# Copy environment template
cp .env.example .env

# Generate secure passwords
echo "Generate these secure passwords:"
echo "POSTGRES_PASSWORD: $(openssl rand -base64 32)"
echo "REDIS_PASSWORD: $(openssl rand -base64 32)"
echo "JWT_SECRET: $(openssl rand -base64 64)"
echo "MINIO_ROOT_PASSWORD: $(openssl rand -base64 32)"
echo "GRAFANA_PASSWORD: $(openssl rand -base64 32)"

# Edit environment file
nano .env
```

### Step 2.4: Environment Configuration (.env file)
```bash
# Basic Configuration
DOMAIN=YOUR_DOMAIN.com
PLATFORM_URL=https://YOUR_DOMAIN.com
API_URL=https://api.YOUR_DOMAIN.com
SERVER_URL=YOUR_SERVER_IP

# Database Credentials (use generated passwords from step 2.3)
POSTGRES_PASSWORD=your_generated_postgres_password
REDIS_PASSWORD=your_generated_redis_password
MINIO_ROOT_USER=vpn-enterprise-admin
MINIO_ROOT_PASSWORD=your_generated_minio_password

# Security
JWT_SECRET=your_generated_jwt_secret
ENCRYPTION_KEY=your_generated_32_char_key

# Monitoring
GRAFANA_USER=admin
GRAFANA_PASSWORD=your_generated_grafana_password

# VPN Configuration
WG_PEERS=50

# Production Settings
NODE_ENV=production
LOG_LEVEL=info
```

---

## 🔐 Part 3: SSL Certificates & Domain Setup (20 minutes)

### Step 3.1: Point Domain to Server
```bash
# Update your DNS records to point to your server IP
# A records needed:
# yourdomain.com        -> YOUR_SERVER_IP
# api.yourdomain.com    -> YOUR_SERVER_IP  
# admin.yourdomain.com  -> YOUR_SERVER_IP
# *.yourdomain.com      -> YOUR_SERVER_IP (wildcard)
```

### Step 3.2: Install Certbot for SSL
```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Stop nginx temporarily
sudo systemctl stop nginx

# Get SSL certificates (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com -d admin.yourdomain.com

# Start nginx again
sudo systemctl start nginx

# Copy certificates to platform directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/vpn-enterprise/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/vpn-enterprise/ssl/
sudo chown deploy:deploy /opt/vpn-enterprise/ssl/*

# Set up automatic renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### Step 3.3: Configure Nginx Reverse Proxy
```bash
# Create nginx configuration
sudo tee /etc/nginx/sites-available/vpn-enterprise << 'EOF'
# VPN Enterprise - Main Domain
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /opt/vpn-enterprise/ssl/fullchain.pem;
    ssl_certificate_key /opt/vpn-enterprise/ssl/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API Subdomain
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /opt/vpn-enterprise/ssl/fullchain.pem;
    ssl_certificate_key /opt/vpn-enterprise/ssl/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Admin Panel
server {
    listen 443 ssl http2;
    server_name admin.yourdomain.com;
    
    ssl_certificate /opt/vpn-enterprise/ssl/fullchain.pem;
    ssl_certificate_key /opt/vpn-enterprise/ssl/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # Admin panel locations
    location /grafana {
        proxy_pass http://localhost:3003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /minio {
        proxy_pass http://localhost:9001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /prometheus {
        proxy_pass http://localhost:9090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Replace yourdomain.com with your actual domain
sudo sed -i 's/yourdomain.com/YOUR_ACTUAL_DOMAIN.com/g' /etc/nginx/sites-available/vpn-enterprise

# Enable site
sudo ln -sf /etc/nginx/sites-available/vpn-enterprise /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## 🚢 Part 4: Deploy VPN Enterprise Platform (30 minutes)

### Step 4.1: Build Your Application
```bash
# Navigate to project root
cd ~/vpn-enterprise

# Install dependencies and build
npm install

# Build API
cd packages/api
npm install
npm run build

# Build Web Dashboard  
cd ../apps/web-dashboard
npm install
npm run build

# Return to infrastructure directory
cd ../../infrastructure/self-hosted
```

### Step 4.2: Setup Platform Infrastructure
```bash
# Run initial setup
./manage.sh setup

# This will:
# - Create necessary directories
# - Generate SSL certificates (if not already done)
# - Set up monitoring configuration
# - Create backup directories
```

### Step 4.3: Start the Platform
```bash
# Start all services
./manage.sh start

# This will start:
# - PostgreSQL database
# - Redis cache
# - MinIO object storage
# - Your VPN Enterprise API
# - Web Dashboard
# - Monitoring stack (Prometheus, Grafana)
# - WireGuard VPN server

# Check status
./manage.sh status

# View logs
./manage.sh logs
```

### Step 4.4: Initialize Database
```bash
# Run database migrations
./manage.sh db-migrate

# Create admin user (if you have a script for this)
./manage.sh db-shell
# Then run SQL to create your admin user
```

---

## 🎮 Part 5: Platform Configuration & Testing (20 minutes)

### Step 5.1: Verify All Services
```bash
# Check platform health
./manage.sh health

# Check individual service logs
./manage.sh logs vpn-api
./manage.sh logs vpn-web
./manage.sh logs postgres

# Test API endpoint
curl https://api.yourdomain.com/health

# Test web dashboard
curl https://yourdomain.com
```

### Step 5.2: Access Management Interfaces
```bash
# Your platform URLs:
echo "🌐 Platform Access URLs:"
echo "Main Dashboard: https://yourdomain.com"
echo "API: https://api.yourdomain.com"
echo "Grafana: https://admin.yourdomain.com/grafana"
echo "MinIO: https://admin.yourdomain.com/minio"
echo "Prometheus: https://admin.yourdomain.com/prometheus"
```

### Step 5.3: Initial Configuration
1. **Access your web dashboard** at https://yourdomain.com
2. **Create admin account** through your signup flow
3. **Configure VPN settings** in the dashboard
4. **Test database connections** in the databases section
5. **Verify monitoring** by checking Grafana dashboards

---

## 📊 Part 6: Monitoring & Backup Setup (15 minutes)

### Step 6.1: Set Up Automated Backups
```bash
# Create backup script
cat > /opt/vpn-enterprise/backup.sh << 'EOF'
#!/bin/bash
# VPN Enterprise Backup Script

BACKUP_DIR="/opt/vpn-enterprise/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
cd ~/vpn-enterprise/infrastructure/self-hosted
./manage.sh db-backup

# Configuration backup
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" \
    .env \
    /etc/nginx/sites-available/vpn-enterprise \
    /opt/vpn-enterprise/ssl/

# Docker volumes backup
docker run --rm -v vpn-enterprise_postgres_data:/data -v "$BACKUP_DIR:/backup" alpine tar czf "/backup/postgres_data_$DATE.tar.gz" -C /data .

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/vpn-enterprise/backup.sh

# Schedule daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/vpn-enterprise/backup.sh") | crontab -
```

### Step 6.2: Configure Monitoring Alerts
```bash
# Access Grafana
echo "1. Open https://admin.yourdomain.com/grafana"
echo "2. Login with admin / your_grafana_password"
echo "3. Import VPN Enterprise dashboards"
echo "4. Set up alert notifications"
```

### Step 6.3: Performance Monitoring
```bash
# Install system monitoring
./manage.sh metrics

# Check resource usage
htop
df -h
free -h
```

---

## 🚀 Part 7: Go Live & Customer Onboarding (10 minutes)

### Step 7.1: Final Security Check
```bash
# Check firewall status
sudo ufw status

# Verify SSL certificates
sudo certbot certificates

# Test all endpoints
curl -I https://yourdomain.com
curl -I https://api.yourdomain.com/health

# Check for updates
sudo apt update && sudo apt list --upgradable
```

### Step 7.2: Create Your First Customer
1. **Access your dashboard**: https://yourdomain.com
2. **Create customer account** through your signup flow
3. **Provision customer database** using your tenants section
4. **Generate VPN configuration** for the customer
5. **Test customer access** to all services

### Step 7.3: Document Access Information
```bash
# Create access documentation
cat > /opt/vpn-enterprise/access-info.txt << EOF
VPN Enterprise Platform - Access Information
==========================================

Server Details:
- IP Address: $(curl -s ifconfig.me)
- Hostname: $(hostname)
- Location: Hetzner Falkenstein/Helsinki
- Specs: 6 CPU, 64GB RAM, 512GB NVMe

Platform URLs:
- Main Dashboard: https://yourdomain.com
- API: https://api.yourdomain.com
- Admin Panel: https://admin.yourdomain.com

Admin Access:
- Grafana: admin / your_grafana_password
- MinIO: vpn-enterprise-admin / your_minio_password

SSH Access:
- User: deploy
- Command: ssh deploy@$(curl -s ifconfig.me)

Backup Location: /opt/vpn-enterprise/backups/
Configuration: ~/vpn-enterprise/infrastructure/self-hosted/.env

Daily Backups: 2:00 AM UTC
SSL Renewal: Automatic (Let's Encrypt)
EOF
```

---

## 🎉 Congratulations! Your Platform is Live!

### ✅ What You've Accomplished:
- ✅ Hetzner dedicated server configured and secured
- ✅ VPN Enterprise platform deployed and running
- ✅ SSL certificates installed and auto-renewal configured
- ✅ Database, caching, and storage services running
- ✅ Monitoring and alerting configured
- ✅ Automated backups scheduled
- ✅ Reverse proxy and load balancing configured
- ✅ Ready to onboard customers

### 🎯 Next Steps:
1. **Test everything thoroughly** with a few test customers
2. **Set up payment processing** (Stripe, PayPal)
3. **Create customer onboarding flow**
4. **Launch marketing website**
5. **Start customer acquisition**

### 📊 Monthly Costs:
- **Hetzner AX41-NVMe**: €39 ($42)
- **Domain**: ~$12/year
- **SSL**: Free (Let's Encrypt)
- **Total**: ~$43/month

### 💰 Revenue Potential:
- **50 customers @ $25/month**: $1,250/month
- **Profit**: $1,207/month (96% margin!)
- **Break-even**: 2 customers

### 🛠️ Daily Management:
```bash
# Check platform health
./manage.sh health

# View system metrics
./manage.sh metrics

# Update platform
./manage.sh update

# View logs
./manage.sh logs

# Create backup manually
/opt/vpn-enterprise/backup.sh
```

Your VPN Enterprise platform is now live and ready to compete with the big players! 🚀

Need help with any specific part of the setup? Just ask!