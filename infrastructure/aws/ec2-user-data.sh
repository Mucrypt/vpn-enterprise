#!/bin/bash
# EC2 User Data Script for VPN Enterprise
# This script runs automatically when the EC2 instance launches

# Exit on any error
set -e

# Log everything to a file
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "=========================================="
echo "VPN Enterprise EC2 Bootstrap Starting..."
echo "=========================================="

# Update system
echo "Updating system packages..."
yum update -y

# Install Docker
echo "Installing Docker..."
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose
echo "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Install Node.js 20
echo "Installing Node.js 20..."
curl -sL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# Install Git
echo "Installing Git..."
yum install -y git

# Install AWS CLI v2
echo "Installing AWS CLI..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
yum install -y unzip
unzip -q awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# Install CloudWatch agent
echo "Installing CloudWatch agent..."
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm
rm amazon-cloudwatch-agent.rpm

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/vpn-enterprise/*.log",
            "log_group_name": "/vpn-enterprise/application",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -s \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Get AWS region
REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)

# Create application directory
echo "Setting up application directory..."
mkdir -p /var/log/vpn-enterprise
mkdir -p /home/ec2-user/vpn-enterprise
cd /home/ec2-user

# Clone repository
# Note: For private repositories, you'll need to set up SSH keys or use a personal access token
echo "Cloning repository..."
# TODO: Replace with your actual repository URL
# For now, we'll create a placeholder
# git clone https://github.com/Mucrypt/vpn-enterprise.git

# Fetch secrets from AWS Secrets Manager
echo "Fetching secrets from AWS Secrets Manager..."
DB_PASSWORD=$(aws secretsmanager get-secret-value \
    --secret-id vpn-enterprise/db-password \
    --query SecretString \
    --output text \
    --region $REGION)

REDIS_PASSWORD=$(aws secretsmanager get-secret-value \
    --secret-id vpn-enterprise/redis-password \
    --query SecretString \
    --output text \
    --region $REGION)

API_KEY=$(aws secretsmanager get-secret-value \
    --secret-id vpn-enterprise/api-key \
    --query SecretString \
    --output text \
    --region $REGION)

N8N_KEY=$(aws secretsmanager get-secret-value \
    --secret-id vpn-enterprise/n8n-encryption-key \
    --query SecretString \
    --output text \
    --region $REGION)

# Get RDS and Redis endpoints from instance tags
RDS_ENDPOINT=$(aws ec2 describe-tags \
    --filters "Name=resource-id,Values=$(ec2-metadata --instance-id | cut -d ' ' -f 2)" \
    --region $REGION | jq -r '.Tags[] | select(.Key=="RDS_ENDPOINT") | .Value')

REDIS_ENDPOINT=$(aws ec2 describe-tags \
    --filters "Name=resource-id,Values=$(ec2-metadata --instance-id | cut -d ' ' -f 2)" \
    --region $REGION | jq -r '.Tags[] | select(.Key=="REDIS_ENDPOINT") | .Value')

# Create .env file
echo "Creating environment configuration..."
cat > /home/ec2-user/vpn-enterprise/.env <<EOF
# AWS Production Environment
NODE_ENV=production
AWS_REGION=$REGION

# Database Configuration
DB_HOST=$RDS_ENDPOINT
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=$DB_PASSWORD
DB_NAME=vpn_enterprise

# Redis Configuration
REDIS_HOST=$REDIS_ENDPOINT
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD

# API Configuration
API_KEY=$API_KEY
API_PORT=5000

# N8N Configuration
N8N_ENCRYPTION_KEY=$N8N_KEY
N8N_HOST=0.0.0.0
N8N_PORT=5678

# Web Dashboard
WEB_PORT=3000

# Python API
PYTHON_API_PORT=5001

# Monitoring
LOG_LEVEL=info
EOF

# Set proper permissions
chown -R ec2-user:ec2-user /home/ec2-user/vpn-enterprise

# Install application dependencies
echo "Installing application dependencies..."
# cd /home/ec2-user/vpn-enterprise
# npm install

# Build applications
# echo "Building applications..."
# cd packages/api && npm run build && cd ../..
# cd apps/web-dashboard && npm run build && cd ../..

# Create systemd service for the application
cat > /etc/systemd/system/vpn-enterprise.service <<'EOF'
[Unit]
Description=VPN Enterprise Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ec2-user/vpn-enterprise
ExecStart=/usr/local/bin/docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f infrastructure/docker/docker-compose.prod.yml down
User=ec2-user
Group=ec2-user

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
# systemctl daemon-reload
# systemctl enable vpn-enterprise
# systemctl start vpn-enterprise

# Set up log rotation
cat > /etc/logrotate.d/vpn-enterprise <<'EOF'
/var/log/vpn-enterprise/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ec2-user ec2-user
}
EOF

# Create health check script
cat > /usr/local/bin/health-check.sh <<'EOF'
#!/bin/bash
# Health check script for monitoring

check_service() {
    local service=$1
    local port=$2
    
    if curl -f -s http://localhost:$port/health > /dev/null 2>&1; then
        echo "✅ $service is healthy"
        return 0
    else
        echo "❌ $service is unhealthy"
        return 1
    fi
}

check_service "API" 5000
check_service "Python API" 5001
check_service "Web Dashboard" 3000
EOF

chmod +x /usr/local/bin/health-check.sh

# Set up cron for health checks
echo "*/5 * * * * /usr/local/bin/health-check.sh >> /var/log/vpn-enterprise/health-check.log 2>&1" | crontab -

echo "=========================================="
echo "VPN Enterprise EC2 Bootstrap Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. SSH into the instance: ssh -i your-key.pem ec2-user@<instance-ip>"
echo "2. Check logs: tail -f /var/log/user-data.log"
echo "3. View application: docker ps"
echo "4. Run health check: /usr/local/bin/health-check.sh"
echo ""
