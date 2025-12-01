#!/bin/bash
# VPN Enterprise Self-Hosted Infrastructure Setup
# This script sets up the foundation for your cloud platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=${DOMAIN:-"vpn-enterprise.local"}
NODE_TYPE=${1:-"master"}
CLUSTER_NAME="vpn-enterprise-cluster"

echo -e "${BLUE}🚀 VPN Enterprise Self-Hosted Infrastructure Setup${NC}"
echo "=================================================="
echo -e "Domain: ${GREEN}$DOMAIN${NC}"
echo -e "Node Type: ${GREEN}$NODE_TYPE${NC}"
echo -e "Cluster: ${GREEN}$CLUSTER_NAME${NC}"
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ This script should not be run as root${NC}"
   echo "Please run as a regular user with sudo privileges"
   exit 1
fi

# Check Ubuntu version
if ! grep -q "Ubuntu 24.04\|Ubuntu 22.04\|Ubuntu 20.04" /etc/os-release; then
    echo -e "${YELLOW}⚠️  Warning: This script is optimized for Ubuntu 20.04+${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Function to log steps
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

# Update system
log_step "Updating system packages..."
sudo apt update && sudo apt upgrade -y
log_success "System updated"

# Install essential packages
log_step "Installing essential packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    iotop \
    ncdu \
    tree \
    jq \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    netdata
log_success "Essential packages installed"

# Install Docker
if ! command -v docker &> /dev/null; then
    log_step "Installing Docker..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
    log_success "Docker installed"
else
    log_success "Docker already installed"
fi

# Install Kubernetes tools
if ! command -v kubectl &> /dev/null; then
    log_step "Installing Kubernetes tools..."
    curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/kubernetes-archive-keyring.gpg
    echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list
    sudo apt update
    sudo apt install -y kubelet kubeadm kubectl
    sudo apt-mark hold kubelet kubeadm kubectl
    sudo systemctl enable kubelet
    log_success "Kubernetes tools installed"
else
    log_success "Kubernetes tools already installed"
fi

# Configure firewall
log_step "Configuring firewall..."
sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 6443/tcp  # Kubernetes API
sudo ufw allow 2379:2380/tcp  # etcd
sudo ufw allow 10250/tcp # Kubelet API
sudo ufw allow 10251/tcp # kube-scheduler
sudo ufw allow 10252/tcp # kube-controller-manager
sudo ufw allow 51820/udp # WireGuard VPN

if [ "$NODE_TYPE" = "worker" ]; then
    sudo ufw allow 30000:32767/tcp  # NodePort Services
fi

log_success "Firewall configured"

# Configure system settings for Kubernetes
log_step "Configuring system settings for Kubernetes..."
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

sudo sysctl --system
log_success "System settings configured"

# Disable swap
log_step "Disabling swap..."
sudo swapoff -a
sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab
log_success "Swap disabled"

# Install PostgreSQL client tools
log_step "Installing PostgreSQL client tools..."
sudo apt install -y postgresql-client-14
log_success "PostgreSQL client installed"

# Install Redis tools
log_step "Installing Redis tools..."
sudo apt install -y redis-tools
log_success "Redis tools installed"

# Setup monitoring (Netdata)
log_step "Configuring monitoring..."
sudo systemctl enable netdata
sudo systemctl start netdata
sudo ufw allow 19999/tcp  # Netdata web interface
log_success "Monitoring configured (Netdata available on port 19999)"

# Create directories for VPN Enterprise
log_step "Creating VPN Enterprise directories..."
sudo mkdir -p /opt/vpn-enterprise/{config,data,logs,backups}
sudo chown -R $USER:$USER /opt/vpn-enterprise
log_success "Directories created"

# Setup logging
log_step "Setting up centralized logging..."
sudo mkdir -p /var/log/vpn-enterprise
sudo chown -R $USER:$USER /var/log/vpn-enterprise

# Create log rotation config
cat <<EOF | sudo tee /etc/logrotate.d/vpn-enterprise
/var/log/vpn-enterprise/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        systemctl reload rsyslog > /dev/null 2>&1 || true
    endscript
}
EOF
log_success "Logging configured"

# Install Helm (Kubernetes package manager)
if ! command -v helm &> /dev/null; then
    log_step "Installing Helm..."
    curl https://baltocdn.com/helm/signing.asc | sudo apt-key add -
    echo "deb https://baltocdn.com/helm/stable/debian/ all main" | sudo tee /etc/apt/sources.list.d/helm-stable-debian.list
    sudo apt update
    sudo apt install -y helm
    log_success "Helm installed"
else
    log_success "Helm already installed"
fi

# Setup node-specific configurations
if [ "$NODE_TYPE" = "master" ]; then
    log_step "Configuring master node..."
    
    # Create kubeadm config
    cat <<EOF > /tmp/kubeadm-config.yaml
apiVersion: kubeadm.k8s.io/v1beta3
kind: ClusterConfiguration
clusterName: $CLUSTER_NAME
kubernetesVersion: v1.28.0
controlPlaneEndpoint: "$DOMAIN:6443"
networking:
  podSubnet: "10.244.0.0/16"
  serviceSubnet: "10.96.0.0/12"
apiServer:
  extraArgs:
    enable-admission-plugins: NodeRestriction,ResourceQuota,LimitRanger
---
apiVersion: kubeadm.k8s.io/v1beta3
kind: InitConfiguration
localAPIEndpoint:
  advertiseAddress: $(ip route get 1 | awk '{print $NF;exit}')
EOF

    log_success "Master node configuration prepared"
    log_warning "To initialize the cluster, run: sudo kubeadm init --config /tmp/kubeadm-config.yaml"
    
elif [ "$NODE_TYPE" = "worker" ]; then
    log_step "Configuring worker node..."
    log_success "Worker node ready"
    log_warning "To join the cluster, get the join command from the master node"
fi

# Create useful aliases
log_step "Creating useful aliases..."
cat <<EOF >> ~/.bashrc

# VPN Enterprise aliases
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgs='kubectl get svc'
alias kgd='kubectl get deployments'
alias kns='kubectl config set-context --current --namespace'
alias logs='tail -f /var/log/vpn-enterprise/*.log'
alias ve-status='systemctl status docker kubelet netdata'
EOF

log_success "Aliases created"

# Create health check script
log_step "Creating health check script..."
cat <<EOF > /opt/vpn-enterprise/health-check.sh
#!/bin/bash
# VPN Enterprise Health Check

echo "🏥 VPN Enterprise Health Check"
echo "=============================="

# Check Docker
if systemctl is-active --quiet docker; then
    echo "✅ Docker: Running"
else
    echo "❌ Docker: Stopped"
fi

# Check Kubelet
if systemctl is-active --quiet kubelet; then
    echo "✅ Kubelet: Running"
else
    echo "❌ Kubelet: Stopped"
fi

# Check if cluster is ready (only if kubectl is configured)
if kubectl cluster-info &>/dev/null; then
    echo "✅ Kubernetes: Connected"
    echo "   Nodes: \$(kubectl get nodes --no-headers | wc -l)"
    echo "   Pods: \$(kubectl get pods --all-namespaces --no-headers | wc -l)"
else
    echo "⏸️  Kubernetes: Not configured or not accessible"
fi

# Check disk space
echo "💾 Disk Usage:"
df -h / | tail -1 | awk '{printf "   Root: %s used (%s available)\\n", \$5, \$4}'

# Check memory
echo "🧠 Memory Usage:"
free -h | grep ^Mem | awk '{printf "   Memory: %s/%s (%.1f%%)\\n", \$3, \$2, (\$3/\$2)*100}'

# Check load average
echo "⚡ Load Average:"
uptime | awk -F'load average:' '{print "   " \$2}'

echo ""
echo "🌐 Services:"
echo "   Netdata: http://$(hostname -I | awk '{print $1}'):19999"
if [ "$NODE_TYPE" = "master" ]; then
    echo "   Kubernetes Dashboard: kubectl proxy --address=0.0.0.0 --port=8001 --accept-hosts='.*'"
fi
EOF

chmod +x /opt/vpn-enterprise/health-check.sh
log_success "Health check script created"

echo ""
echo -e "${GREEN}🎉 VPN Enterprise infrastructure setup complete!${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
if [ "$NODE_TYPE" = "master" ]; then
    echo "1. Initialize Kubernetes cluster:"
    echo "   sudo kubeadm init --config /tmp/kubeadm-config.yaml"
    echo ""
    echo "2. Configure kubectl:"
    echo "   mkdir -p \$HOME/.kube"
    echo "   sudo cp -i /etc/kubernetes/admin.conf \$HOME/.kube/config"
    echo "   sudo chown \$(id -u):\$(id -g) \$HOME/.kube/config"
    echo ""
    echo "3. Install network plugin:"
    echo "   kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml"
    echo ""
    echo "4. Get worker join command:"
    echo "   kubeadm token create --print-join-command"
else
    echo "1. Get join command from master node"
    echo "2. Run the join command with sudo"
fi
echo ""
echo "5. Run health check:"
echo "   /opt/vpn-enterprise/health-check.sh"
echo ""
echo "6. Access monitoring:"
echo "   http://$(hostname -I | awk '{print $1}'):19999"
echo ""
echo -e "${YELLOW}⚠️  Remember to reboot or re-login to apply Docker group membership${NC}"
echo ""
echo -e "${GREEN}Your VPN Enterprise cloud platform foundation is ready! 🚀${NC}"