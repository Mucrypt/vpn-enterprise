#!/bin/bash
# ============================================
# VPN Enterprise - EC2 User Data Script
# ============================================
# Bootstraps EC2 instance with:
# - Docker installation
# - Application deployment
# - Database credentials from Secrets Manager
# - CloudWatch Logs agent

set -e

# Logging
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "Starting VPN Enterprise bootstrap..."
echo "Environment: ${environment}"
echo "Region: ${aws_region}"

# ============================================
# UPDATE SYSTEM
# ============================================

echo "Updating system packages..."
yum update -y

# ============================================
# INSTALL DEPENDENCIES
# ============================================

echo "Installing dependencies..."
yum install -y \
  docker \
  git \
  jq \
  aws-cli \
  amazon-cloudwatch-agent

# ============================================
# CONFIGURE DOCKER
# ============================================

echo "Starting Docker service..."
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group
usermod -a -G docker ec2-user

# ============================================
# INSTALL NODE.JS
# ============================================

echo "Installing Node.js 20.x..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# Verify installation
node --version
npm --version

# ============================================
# FETCH SECRETS FROM SECRETS MANAGER
# ============================================

echo "Fetching database credentials from Secrets Manager..."
DB_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id ${db_secret_arn} \
  --region ${aws_region} \
  --query SecretString \
  --output text)

echo "Fetching Redis credentials from Secrets Manager..."
REDIS_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id ${redis_secret_arn} \
  --region ${aws_region} \
  --query SecretString \
  --output text)

# Parse secrets
export DB_HOST=$(echo $DB_SECRET | jq -r '.host')
export DB_PORT=$(echo $DB_SECRET | jq -r '.port')
export DB_NAME=$(echo $DB_SECRET | jq -r '.dbname')
export DB_USER=$(echo $DB_SECRET | jq -r '.username')
export DB_PASSWORD=$(echo $DB_SECRET | jq -r '.password')

export REDIS_HOST=$(echo $REDIS_SECRET | jq -r '.host')
export REDIS_PORT=$(echo $REDIS_SECRET | jq -r '.port')
export REDIS_AUTH_TOKEN=$(echo $REDIS_SECRET | jq -r '.auth_token')

# ============================================
# CREATE APPLICATION DIRECTORY
# ============================================

echo "Creating application directory..."
mkdir -p /opt/vpn-enterprise
cd /opt/vpn-enterprise

# ============================================
# CREATE ENVIRONMENT FILE
# ============================================

echo "Creating environment configuration..."
cat > /opt/vpn-enterprise/.env << EOF
# Environment
NODE_ENV=${environment}
PORT=3000
API_PORT=5000

# Database (RDS PostgreSQL)
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME

# Redis (ElastiCache)
REDIS_URL=redis://:$REDIS_AUTH_TOKEN@$REDIS_HOST:$REDIS_PORT
REDIS_TLS=true

# Application
APP_NAME=VPN Enterprise
LOG_LEVEL=info
EOF

# Secure the .env file
chmod 600 /opt/vpn-enterprise/.env

# ============================================
# CLONE APPLICATION CODE (PLACEHOLDER)
# ============================================

echo "Application deployment placeholder..."
# In production, you would:
# git clone https://github.com/your-org/vpn-enterprise.git .
# npm install
# npm run build
# pm2 start ecosystem.config.js

# For now, create a simple health check endpoint
cat > /opt/vpn-enterprise/server.js << 'EOFJS'
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      environment: process.env.NODE_ENV || 'unknown',
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port $${PORT}`);
});
EOFJS

# ============================================
# INSTALL PM2 (PROCESS MANAGER)
# ============================================

echo "Installing PM2..."
npm install -g pm2

# Start the application
pm2 start /opt/vpn-enterprise/server.js --name vpn-web --env production
pm2 startup systemd -u ec2-user --hp /home/ec2-user
pm2 save

# ============================================
# CONFIGURE CLOUDWATCH LOGS
# ============================================

echo "Configuring CloudWatch Logs..."
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOFCW
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/user-data.log",
            "log_group_name": "/aws/ec2/vpn-enterprise/${environment}",
            "log_stream_name": "{instance_id}/user-data"
          },
          {
            "file_path": "/opt/vpn-enterprise/logs/*.log",
            "log_group_name": "/aws/ec2/vpn-enterprise/${environment}",
            "log_stream_name": "{instance_id}/application"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "VPNEnterprise/${environment}",
    "metrics_collected": {
      "mem": {
        "measurement": [
          {
            "name": "mem_used_percent",
            "rename": "MemoryUsed",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          {
            "name": "used_percent",
            "rename": "DiskUsed",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "/"
        ]
      }
    }
  }
}
EOFCW

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# ============================================
# FINAL SETUP
# ============================================

echo "Setting up log rotation..."
cat > /etc/logrotate.d/vpn-enterprise << EOFLOG
/opt/vpn-enterprise/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 ec2-user ec2-user
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOFLOG

# ============================================
# HEALTH CHECK
# ============================================

echo "Waiting for application to start..."
sleep 10

# Test health endpoint
if curl -f http://localhost:3000/health; then
  echo "✅ Application is healthy!"
else
  echo "❌ Application health check failed!"
  exit 1
fi

echo "Bootstrap completed successfully!"
echo "Instance is ready to receive traffic."
