#!/bin/bash
# Quick Deployment Script for Hetzner VPN Enterprise Platform
# This script handles the complete deployment process

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

show_banner() {
    echo -e "${BLUE}"
    echo "🚀 VPN Enterprise - Hetzner Quick Deployment"
    echo "==========================================="
    echo -e "${NC}"
}

log_step() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're on the right user
check_user() {
    if [ "$USER" = "root" ]; then
        log_error "Don't run this as root. Use the 'deploy' user created by hetzner-setup.sh"
        exit 1
    fi
    
    if [ "$USER" != "deploy" ] && [ "$USER" != "$(whoami)" ]; then
        log_warning "Recommended to run as 'deploy' user"
    fi
}

# Collect deployment information
collect_info() {
    echo -e "${CYAN}📋 Deployment Configuration${NC}"
    echo "=========================="
    
    # Domain information
    read -p "Enter your domain name (e.g., vpn-enterprise.com): " DOMAIN
    if [ -z "$DOMAIN" ]; then
        DOMAIN="$(curl -s ifconfig.me).nip.io"
        log_warning "No domain provided, using $DOMAIN (works but not recommended for production)"
    fi
    
    # Email for Let's Encrypt
    read -p "Enter your email for SSL certificates: " SSL_EMAIL
    if [ -z "$SSL_EMAIL" ]; then
        SSL_EMAIL="admin@$DOMAIN"
        log_warning "Using default email: $SSL_EMAIL"
    fi
    
    # Server IP
    SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
    
    echo ""
    echo -e "${BLUE}Configuration Summary:${NC}"
    echo "  Domain: $DOMAIN"
    echo "  Server IP: $SERVER_IP"
    echo "  SSL Email: $SSL_EMAIL"
    echo ""
}

# Generate secure passwords
generate_passwords() {
    log_step "Generating secure passwords..."
    
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
    REDIS_PASSWORD=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 64)
    MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)
    GRAFANA_PASSWORD=$(openssl rand -base64 32)
    
    log_success "Secure passwords generated"
}

# Create environment configuration
create_env_config() {
    log_step "Creating environment configuration..."
    
    cat > "$SCRIPT_DIR/.env" << EOF
# VPN Enterprise - Hetzner Deployment Configuration
# Generated on $(date)

# Domain Configuration
DOMAIN=$DOMAIN
PLATFORM_URL=https://$DOMAIN
API_URL=https://api.$DOMAIN
SERVER_URL=$SERVER_IP

# Database Credentials
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD
MINIO_ROOT_USER=vpn-enterprise-admin
MINIO_ROOT_PASSWORD=$MINIO_ROOT_PASSWORD

# Security
JWT_SECRET=$JWT_SECRET
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Monitoring
GRAFANA_USER=admin
GRAFANA_PASSWORD=$GRAFANA_PASSWORD

# VPN Configuration
WG_PEERS=100

# SMTP Configuration (update with your provider)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@$DOMAIN
SMTP_PASSWORD=your_smtp_password_here

# Production Settings
NODE_ENV=production
LOG_LEVEL=info
DEBUG_MODE=false

# SSL Configuration
SSL_EMAIL=$SSL_EMAIL
EOF
    
    log_success "Environment configuration created"
}

# Setup SSL certificates
setup_ssl() {
    log_step "Setting up SSL certificates..."
    
    # Install certbot if not present
    if ! command -v certbot &> /dev/null; then
        sudo apt update
        sudo apt install -y certbot python3-certbot-nginx
    fi
    
    # Stop nginx temporarily
    sudo systemctl stop nginx
    
    # Get certificates
    log_step "Obtaining SSL certificates for $DOMAIN..."
    sudo certbot certonly --standalone \
        --email "$SSL_EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN" \
        -d "api.$DOMAIN" \
        -d "admin.$DOMAIN"
    
    # Start nginx
    sudo systemctl start nginx
    
    # Copy certificates to project directory
    sudo mkdir -p "$SCRIPT_DIR/ssl"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SCRIPT_DIR/ssl/"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SCRIPT_DIR/ssl/"
    sudo chown -R $USER:$USER "$SCRIPT_DIR/ssl/"
    
    # Set up auto-renewal
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx") | crontab -
    
    log_success "SSL certificates configured"
}

# Configure nginx reverse proxy
setup_nginx() {
    log_step "Configuring Nginx reverse proxy..."
    
    sudo tee /etc/nginx/sites-available/vpn-enterprise << EOF
# VPN Enterprise - Main Domain
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    ssl_certificate $SCRIPT_DIR/ssl/fullchain.pem;
    ssl_certificate_key $SCRIPT_DIR/ssl/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# API Subdomain
server {
    listen 80;
    server_name api.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.$DOMAIN;
    
    ssl_certificate $SCRIPT_DIR/ssl/fullchain.pem;
    ssl_certificate_key $SCRIPT_DIR/ssl/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    
    location / {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # API timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# Admin Panel
server {
    listen 443 ssl http2;
    server_name admin.$DOMAIN;
    
    ssl_certificate $SCRIPT_DIR/ssl/fullchain.pem;
    ssl_certificate_key $SCRIPT_DIR/ssl/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # Restrict access (optional - add your IP)
    # allow YOUR_IP_ADDRESS;
    # deny all;
    
    location /grafana/ {
        proxy_pass http://localhost:3003/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /minio/ {
        proxy_pass http://localhost:9001/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /prometheus/ {
        proxy_pass http://localhost:9090/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/vpn-enterprise /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    sudo nginx -t
    
    # Reload nginx
    sudo systemctl reload nginx
    
    log_success "Nginx configured"
}

# Build and deploy platform
deploy_platform() {
    log_step "Building and deploying VPN Enterprise platform..."
    
    # Navigate to project root
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    if [ -f "package.json" ]; then
        npm install
    fi
    
    # Build API
    if [ -d "packages/api" ]; then
        log_step "Building API..."
        cd packages/api
        npm install
        npm run build || log_warning "API build failed, continuing..."
        cd "$PROJECT_ROOT"
    fi
    
    # Build Web Dashboard
    if [ -d "apps/web-dashboard" ]; then
        log_step "Building Web Dashboard..."
        cd apps/web-dashboard
        npm install
        npm run build || log_warning "Web dashboard build failed, continuing..."
        cd "$PROJECT_ROOT"
    fi
    
    # Return to infrastructure directory
    cd "$SCRIPT_DIR"
    
    # Run platform setup
    ./manage.sh setup
    
    # Start the platform
    ./manage.sh start
    
    log_success "Platform deployed"
}

# Setup monitoring
setup_monitoring() {
    log_step "Setting up monitoring configuration..."
    
    mkdir -p "$SCRIPT_DIR/monitoring"
    
    # Create Prometheus config
    cat > "$SCRIPT_DIR/monitoring/prometheus.yml" << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets: []

scrape_configs:
  - job_name: 'vpn-enterprise-api'
    static_configs:
      - targets: ['vpn-api:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
    metrics_path: '/metrics'

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    metrics_path: '/metrics'

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
EOF
    
    # Create alert rules
    cat > "$SCRIPT_DIR/monitoring/alert_rules.yml" << 'EOF'
groups:
- name: vpn-enterprise-alerts
  rules:
  - alert: HighCPUUsage
    expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High CPU usage detected"
      description: "CPU usage is above 80% for more than 5 minutes"

  - alert: HighMemoryUsage
    expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 90
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High memory usage detected"
      description: "Memory usage is above 90% for more than 5 minutes"

  - alert: DiskSpaceLow
    expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 10
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Low disk space"
      description: "Disk space is below 10%"

  - alert: ServiceDown
    expr: up == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Service is down"
      description: "Service {{ $labels.job }} is down"
EOF
    
    log_success "Monitoring configured"
}

# Create backup system
setup_backups() {
    log_step "Setting up automated backup system..."
    
    cat > "$SCRIPT_DIR/backup.sh" << EOF
#!/bin/bash
# VPN Enterprise Automated Backup Script

BACKUP_DIR="/opt/vpn-enterprise/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
DOMAIN="$DOMAIN"

# Create backup directory if it doesn't exist
mkdir -p "\$BACKUP_DIR"

# Database backup
cd $SCRIPT_DIR
./manage.sh db-backup

# Configuration backup
tar -czf "\$BACKUP_DIR/config_\$DATE.tar.gz" \\
    .env \\
    docker-compose.yml \\
    ssl/ \\
    monitoring/ \\
    /etc/nginx/sites-available/vpn-enterprise

# Docker volumes backup
docker run --rm \\
    -v vpn-enterprise_postgres_data:/data \\
    -v "\$BACKUP_DIR:/backup" \\
    alpine tar czf "/backup/postgres_data_\$DATE.tar.gz" -C /data .

docker run --rm \\
    -v vpn-enterprise_minio_data:/data \\
    -v "\$BACKUP_DIR:/backup" \\
    alpine tar czf "/backup/minio_data_\$DATE.tar.gz" -C /data .

# Log backup completion
echo "\$(date): Backup completed - \$DATE" >> "\$BACKUP_DIR/backup.log"

# Keep only last 30 days of backups
find "\$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
find "\$BACKUP_DIR" -name "*.sql" -mtime +30 -delete

# Optional: Upload to remote storage (uncomment and configure)
# aws s3 cp "\$BACKUP_DIR/" s3://your-backup-bucket/ --recursive --exclude "*" --include "*_\$DATE.*"

echo "Backup completed successfully: \$DATE"
EOF
    
    chmod +x "$SCRIPT_DIR/backup.sh"
    
    # Schedule daily backups at 2 AM
    (crontab -l 2>/dev/null; echo "0 2 * * * $SCRIPT_DIR/backup.sh") | crontab -
    
    log_success "Backup system configured"
}

# Display final information
show_final_info() {
    log_success "VPN Enterprise platform deployed successfully!"
    
    echo ""
    echo -e "${CYAN}🌐 Platform Access URLs:${NC}"
    echo "  Main Dashboard: https://$DOMAIN"
    echo "  API: https://api.$DOMAIN"
    echo "  Admin Panel: https://admin.$DOMAIN"
    echo ""
    echo -e "${CYAN}📊 Admin Credentials:${NC}"
    echo "  Grafana: admin / $GRAFANA_PASSWORD"
    echo "  MinIO: vpn-enterprise-admin / $MINIO_ROOT_PASSWORD"
    echo ""
    echo -e "${CYAN}🗃️ Important Files:${NC}"
    echo "  Environment: $SCRIPT_DIR/.env"
    echo "  SSL Certs: $SCRIPT_DIR/ssl/"
    echo "  Backups: /opt/vpn-enterprise/backups/"
    echo ""
    echo -e "${CYAN}🛠️ Management Commands:${NC}"
    echo "  Platform status: ./manage.sh status"
    echo "  View logs: ./manage.sh logs"
    echo "  Health check: ./manage.sh health"
    echo "  Manual backup: ./backup.sh"
    echo ""
    echo -e "${CYAN}📋 Next Steps:${NC}"
    echo "1. Test all platform components"
    echo "2. Create your first admin user"
    echo "3. Configure payment processing"
    echo "4. Set up customer onboarding"
    echo "5. Launch marketing efforts"
    echo ""
    echo -e "${GREEN}Your VPN Enterprise platform is ready for customers! 🚀${NC}"
}

# Main deployment process
main() {
    show_banner
    check_user
    collect_info
    generate_passwords
    create_env_config
    setup_ssl
    setup_nginx
    deploy_platform
    setup_monitoring
    setup_backups
    show_final_info
}

# Run main function
main "$@"