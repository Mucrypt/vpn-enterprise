#!/bin/bash
# Hetzner Server Initial Setup Script
# Run this immediately after getting your new Hetzner server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🏗️  Hetzner Server Initial Setup for VPN Enterprise${NC}"
echo "=================================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root (first time setup)${NC}"
   exit 1
fi

log_step() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Get server information
SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
HOSTNAME="vpn-enterprise-$(date +%s)"

log_step "Server IP: $SERVER_IP"
log_step "Setting hostname to: $HOSTNAME"

# Set hostname
hostnamectl set-hostname $HOSTNAME
echo "127.0.0.1 $HOSTNAME" >> /etc/hosts

# Update system
log_step "Updating system packages..."
apt update && apt upgrade -y
log_success "System updated"

# Set timezone to UTC
log_step "Setting timezone to UTC..."
timedatectl set-timezone UTC
log_success "Timezone set to UTC"

# Create deploy user
log_step "Creating deploy user..."
if ! id "deploy" &>/dev/null; then
    useradd -m -s /bin/bash deploy
    usermod -aG sudo deploy
    
    # Set up SSH for deploy user
    mkdir -p /home/deploy/.ssh
    if [ -f ~/.ssh/authorized_keys ]; then
        cp ~/.ssh/authorized_keys /home/deploy/.ssh/
    else
        log_warning "No SSH key found. You'll need to set up SSH key manually."
    fi
    
    chown -R deploy:deploy /home/deploy/.ssh
    chmod 700 /home/deploy/.ssh
    chmod 600 /home/deploy/.ssh/authorized_keys 2>/dev/null || true
    
    log_success "Deploy user created"
else
    log_success "Deploy user already exists"
fi

# Configure firewall
log_step "Configuring UFW firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing

# Essential ports
ufw allow ssh
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS

# VPN Enterprise specific ports
ufw allow 3000/tcp    # API
ufw allow 3001/tcp    # Web Dashboard
ufw allow 9001/tcp    # MinIO Console
ufw allow 51820/udp   # WireGuard VPN

# Optional monitoring ports (can be restricted later)
ufw allow 3003/tcp    # Grafana
ufw allow 9090/tcp    # Prometheus

log_success "Firewall configured"

# Install essential packages
log_step "Installing essential packages..."
apt install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    iotop \
    ncdu \
    tree \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    fail2ban \
    ufw

log_success "Essential packages installed"

# Install Docker
log_step "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    systemctl enable docker
    systemctl start docker
    
    # Add deploy user to docker group
    usermod -aG docker deploy
    
    log_success "Docker installed"
else
    log_success "Docker already installed"
fi

# Install Node.js
log_step "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    log_success "Node.js installed"
else
    log_success "Node.js already installed"
fi

# Install nginx
log_step "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
    log_success "Nginx installed"
else
    log_success "Nginx already installed"
fi

# Configure SSH security
log_step "Configuring SSH security..."
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Disable root login
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Disable password authentication (force key-based auth)
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Change default SSH port (optional - uncomment if desired)
# sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config

systemctl restart ssh
log_success "SSH security configured"

# Set up fail2ban
log_step "Configuring fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6
EOF

systemctl reload fail2ban
log_success "Fail2ban configured"

# Create VPN Enterprise directories
log_step "Creating VPN Enterprise directories..."
mkdir -p /opt/vpn-enterprise/{data,logs,backups,ssl,config}
chown -R deploy:deploy /opt/vpn-enterprise
log_success "Directories created"

# Install monitoring tools
log_step "Installing monitoring tools..."
if ! command -v netdata &> /dev/null; then
    curl -fsSL https://my-netdata.io/kickstart.sh | bash -s -- --dont-wait --disable-telemetry
    log_success "Netdata installed"
else
    log_success "Netdata already installed"
fi

# Create useful aliases for deploy user
log_step "Setting up useful aliases..."
cat >> /home/deploy/.bashrc << 'EOF'

# VPN Enterprise aliases
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias ..='cd ..'
alias ...='cd ../..'
alias grep='grep --color=auto'
alias fgrep='fgrep --color=auto'
alias egrep='egrep --color=auto'

# Docker aliases
alias dc='docker-compose'
alias dps='docker ps'
alias dimg='docker images'
alias dlog='docker logs -f'

# VPN Enterprise specific
alias ve='cd ~/vpn-enterprise/infrastructure/self-hosted'
alias ve-logs='cd ~/vpn-enterprise/infrastructure/self-hosted && ./manage.sh logs'
alias ve-status='cd ~/vpn-enterprise/infrastructure/self-hosted && ./manage.sh status'
alias ve-health='cd ~/vpn-enterprise/infrastructure/self-hosted && ./manage.sh health'

# System monitoring
alias ports='netstat -tuln'
alias mem='free -h'
alias disk='df -h'
alias cpu='htop'
EOF

chown deploy:deploy /home/deploy/.bashrc
log_success "Aliases configured"

# Create system info script
log_step "Creating system info script..."
cat > /opt/vpn-enterprise/system-info.sh << 'EOF'
#!/bin/bash
# VPN Enterprise System Information

echo "🖥️  VPN Enterprise Server Information"
echo "===================================="
echo ""

echo "📊 Server Details:"
echo "  Hostname: $(hostname)"
echo "  IP Address: $(curl -s ifconfig.me)"
echo "  OS: $(lsb_release -d | cut -f2)"
echo "  Kernel: $(uname -r)"
echo "  Uptime: $(uptime -p)"
echo ""

echo "💾 Hardware:"
echo "  CPU: $(lscpu | grep 'Model name' | cut -f 2 -d ':' | awk '{$1=$1}1')"
echo "  Cores: $(nproc)"
echo "  RAM: $(free -h | grep ^Mem | awk '{print $2}')"
echo "  Disk: $(df -h / | tail -1 | awk '{print $2}')"
echo ""

echo "📈 Current Usage:"
echo "  CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')%"
echo "  Memory: $(free | grep Mem | awk '{printf "%.1f%% (%s/%s)", $3/$2*100, $3, $2}')"
echo "  Disk: $(df -h / | tail -1 | awk '{print $5}')"
echo "  Load: $(uptime | awk -F'load average:' '{print $2}')"
echo ""

echo "🌐 Network:"
echo "  External IP: $(curl -s ifconfig.me)"
echo "  Internal IP: $(hostname -I | awk '{print $1}')"
echo ""

echo "🔥 Active Services:"
systemctl is-active docker && echo "  ✅ Docker: Running" || echo "  ❌ Docker: Stopped"
systemctl is-active nginx && echo "  ✅ Nginx: Running" || echo "  ❌ Nginx: Stopped"
systemctl is-active fail2ban && echo "  ✅ Fail2ban: Running" || echo "  ❌ Fail2ban: Stopped"
systemctl is-active netdata && echo "  ✅ Netdata: Running" || echo "  ❌ Netdata: Stopped"

echo ""
echo "🔗 Quick Access:"
echo "  Netdata: http://$(curl -s ifconfig.me):19999"
echo "  SSH: ssh deploy@$(curl -s ifconfig.me)"
echo ""
EOF

chmod +x /opt/vpn-enterprise/system-info.sh
chown deploy:deploy /opt/vpn-enterprise/system-info.sh
log_success "System info script created"

# Final system optimization
log_step "Optimizing system settings..."

# Increase file limits
echo "* soft nofile 65535" >> /etc/security/limits.conf
echo "* hard nofile 65535" >> /etc/security/limits.conf

# Optimize network settings
cat >> /etc/sysctl.conf << 'EOF'
# Network optimizations for VPN Enterprise
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 87380 134217728
net.ipv4.tcp_wmem = 4096 65536 134217728
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq
EOF

sysctl -p
log_success "System optimized"

echo ""
echo -e "${GREEN}🎉 Hetzner server setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Log out and back in as deploy user:"
echo -e "   ${YELLOW}ssh deploy@$SERVER_IP${NC}"
echo ""
echo "2. Clone your VPN Enterprise project:"
echo -e "   ${YELLOW}git clone https://github.com/Mucrypt/vpn-enterprise.git${NC}"
echo ""
echo "3. Follow the deployment guide:"
echo -e "   ${YELLOW}cd vpn-enterprise/infrastructure/self-hosted${NC}"
echo -e "   ${YELLOW}./manage.sh setup${NC}"
echo ""
echo "4. View system information anytime:"
echo -e "   ${YELLOW}/opt/vpn-enterprise/system-info.sh${NC}"
echo ""
echo "5. Monitor your server:"
echo -e "   ${YELLOW}http://$SERVER_IP:19999${NC} (Netdata)"
echo ""
echo -e "${GREEN}Your Hetzner server is ready for VPN Enterprise deployment! 🚀${NC}"

# Show system info
/opt/vpn-enterprise/system-info.sh