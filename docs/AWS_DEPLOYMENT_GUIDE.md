# AWS Deployment Guide - VPN Enterprise

## 🎯 Learning Objectives
By the end of this deployment, you'll understand:
- VPC networking (subnets, route tables, internet gateways)
- Security groups and network ACLs
- RDS database setup and management
- ElastiCache for Redis
- EC2 instance deployment and management
- Application Load Balancer (ALB)
- AWS Secrets Manager
- CloudWatch monitoring and logging
- IAM roles and policies
- S3 for static assets

## 📋 Prerequisites
- AWS Account (Free tier works for initial setup)
- AWS CLI installed and configured
- SSH key pair for EC2 access
- Domain name (optional, can use AWS-provided DNS)

## 🏗️ Architecture Overview

```
Internet
    ↓
Internet Gateway
    ↓
Application Load Balancer (Public Subnets)
    ↓
EC2 Instances (Private Subnets)
    ├── Web Dashboard (Next.js)
    ├── API Server (Node.js)
    └── Python API (FastAPI)
    ↓
RDS PostgreSQL (Private Subnet)
ElastiCache Redis (Private Subnet)
```

## Phase 1: Foundation (30 minutes)

### 1.1 Create VPC and Network Infrastructure

**What you'll learn**: AWS networking fundamentals

```bash
# Create VPC
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=vpn-enterprise-vpc}]'

# Enable DNS hostnames
aws ec2 modify-vpc-attribute \
  --vpc-id <VPC_ID> \
  --enable-dns-hostnames

# Create Internet Gateway
aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=vpn-enterprise-igw}]'

# Attach Internet Gateway to VPC
aws ec2 attach-internet-gateway \
  --vpc-id <VPC_ID> \
  --internet-gateway-id <IGW_ID>
```

### 1.2 Create Subnets

**What you'll learn**: Multi-AZ deployment for high availability

```bash
# Public Subnet 1 (us-east-1a)
aws ec2 create-subnet \
  --vpc-id <VPC_ID> \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=vpn-enterprise-public-1a}]'

# Public Subnet 2 (us-east-1b)
aws ec2 create-subnet \
  --vpc-id <VPC_ID> \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=vpn-enterprise-public-1b}]'

# Private Subnet 1 (us-east-1a) - For applications
aws ec2 create-subnet \
  --vpc-id <VPC_ID> \
  --cidr-block 10.0.10.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=vpn-enterprise-private-app-1a}]'

# Private Subnet 2 (us-east-1b) - For applications
aws ec2 create-subnet \
  --vpc-id <VPC_ID> \
  --cidr-block 10.0.11.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=vpn-enterprise-private-app-1b}]'

# Private Subnet 3 (us-east-1a) - For databases
aws ec2 create-subnet \
  --vpc-id <VPC_ID> \
  --cidr-block 10.0.20.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=vpn-enterprise-private-db-1a}]'

# Private Subnet 4 (us-east-1b) - For databases
aws ec2 create-subnet \
  --vpc-id <VPC_ID> \
  --cidr-block 10.0.21.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=vpn-enterprise-private-db-1b}]'
```

### 1.3 Create Route Tables

**What you'll learn**: Routing traffic between public and private subnets

```bash
# Create Public Route Table
aws ec2 create-route-table \
  --vpc-id <VPC_ID> \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=vpn-enterprise-public-rt}]'

# Add route to Internet Gateway
aws ec2 create-route \
  --route-table-id <PUBLIC_RT_ID> \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id <IGW_ID>

# Associate public subnets with public route table
aws ec2 associate-route-table \
  --subnet-id <PUBLIC_SUBNET_1_ID> \
  --route-table-id <PUBLIC_RT_ID>

aws ec2 associate-route-table \
  --subnet-id <PUBLIC_SUBNET_2_ID> \
  --route-table-id <PUBLIC_RT_ID>

# Create NAT Gateway for private subnet internet access
# First, allocate Elastic IP
aws ec2 allocate-address --domain vpc

# Create NAT Gateway in public subnet
aws ec2 create-nat-gateway \
  --subnet-id <PUBLIC_SUBNET_1_ID> \
  --allocation-id <EIP_ALLOCATION_ID> \
  --tag-specifications 'ResourceType=nat-gateway,Tags=[{Key=Name,Value=vpn-enterprise-nat}]'

# Create Private Route Table
aws ec2 create-route-table \
  --vpc-id <VPC_ID> \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=vpn-enterprise-private-rt}]'

# Add route to NAT Gateway
aws ec2 create-route \
  --route-table-id <PRIVATE_RT_ID> \
  --destination-cidr-block 0.0.0.0/0 \
  --nat-gateway-id <NAT_GW_ID>

# Associate private subnets
aws ec2 associate-route-table \
  --subnet-id <PRIVATE_APP_SUBNET_1_ID> \
  --route-table-id <PRIVATE_RT_ID>

aws ec2 associate-route-table \
  --subnet-id <PRIVATE_APP_SUBNET_2_ID> \
  --route-table-id <PRIVATE_RT_ID>
```

### 1.4 Create Security Groups

**What you'll learn**: Network security and least privilege access

```bash
# ALB Security Group (Allow HTTP/HTTPS from internet)
aws ec2 create-security-group \
  --group-name vpn-enterprise-alb-sg \
  --description "Security group for Application Load Balancer" \
  --vpc-id <VPC_ID>

aws ec2 authorize-security-group-ingress \
  --group-id <ALB_SG_ID> \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id <ALB_SG_ID> \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# EC2 Security Group (Allow traffic from ALB only)
aws ec2 create-security-group \
  --group-name vpn-enterprise-ec2-sg \
  --description "Security group for EC2 instances" \
  --vpc-id <VPC_ID>

aws ec2 authorize-security-group-ingress \
  --group-id <EC2_SG_ID> \
  --protocol tcp \
  --port 3000 \
  --source-group <ALB_SG_ID> \
  --group-owner <ACCOUNT_ID>

aws ec2 authorize-security-group-ingress \
  --group-id <EC2_SG_ID> \
  --protocol tcp \
  --port 5000 \
  --source-group <ALB_SG_ID> \
  --group-owner <ACCOUNT_ID>

aws ec2 authorize-security-group-ingress \
  --group-id <EC2_SG_ID> \
  --protocol tcp \
  --port 5001 \
  --source-group <ALB_SG_ID> \
  --group-owner <ACCOUNT_ID>

# Allow SSH from your IP only
aws ec2 authorize-security-group-ingress \
  --group-id <EC2_SG_ID> \
  --protocol tcp \
  --port 22 \
  --cidr <YOUR_IP>/32

# RDS Security Group (Allow PostgreSQL from EC2 only)
aws ec2 create-security-group \
  --group-name vpn-enterprise-rds-sg \
  --description "Security group for RDS PostgreSQL" \
  --vpc-id <VPC_ID>

aws ec2 authorize-security-group-ingress \
  --group-id <RDS_SG_ID> \
  --protocol tcp \
  --port 5432 \
  --source-group <EC2_SG_ID> \
  --group-owner <ACCOUNT_ID>

# ElastiCache Security Group (Allow Redis from EC2 only)
aws ec2 create-security-group \
  --group-name vpn-enterprise-redis-sg \
  --description "Security group for ElastiCache Redis" \
  --vpc-id <VPC_ID>

aws ec2 authorize-security-group-ingress \
  --group-id <REDIS_SG_ID> \
  --protocol tcp \
  --port 6379 \
  --source-group <EC2_SG_ID> \
  --group-owner <ACCOUNT_ID>
```

## Phase 2: Data Layer (30 minutes)

### 2.1 Create RDS PostgreSQL Database

**What you'll learn**: Managed database services, multi-AZ deployment

```bash
# Create DB Subnet Group
aws rds create-db-subnet-group \
  --db-subnet-group-name vpn-enterprise-db-subnet-group \
  --db-subnet-group-description "Subnet group for VPN Enterprise RDS" \
  --subnet-ids <PRIVATE_DB_SUBNET_1_ID> <PRIVATE_DB_SUBNET_2_ID>

# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier vpn-enterprise-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.5 \
  --master-username postgres \
  --master-user-password '<STRONG_PASSWORD>' \
  --allocated-storage 20 \
  --storage-type gp3 \
  --vpc-security-group-ids <RDS_SG_ID> \
  --db-subnet-group-name vpn-enterprise-db-subnet-group \
  --backup-retention-period 7 \
  --multi-az \
  --publicly-accessible false \
  --storage-encrypted \
  --enable-cloudwatch-logs-exports '["postgresql"]' \
  --tags Key=Name,Value=vpn-enterprise-db
```

### 2.2 Create ElastiCache Redis Cluster

**What you'll learn**: Managed cache services, cluster mode

```bash
# Create Cache Subnet Group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name vpn-enterprise-redis-subnet-group \
  --cache-subnet-group-description "Subnet group for VPN Enterprise Redis" \
  --subnet-ids <PRIVATE_DB_SUBNET_1_ID> <PRIVATE_DB_SUBNET_2_ID>

# Create Redis Cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id vpn-enterprise-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name vpn-enterprise-redis-subnet-group \
  --security-group-ids <REDIS_SG_ID> \
  --port 6379 \
  --tags Key=Name,Value=vpn-enterprise-redis
```

## Phase 3: Application Deployment (45 minutes)

### 3.1 Create AWS Secrets Manager Secrets

**What you'll learn**: Secure credential management

```bash
# Database password
aws secretsmanager create-secret \
  --name vpn-enterprise/db-password \
  --secret-string '<STRONG_DB_PASSWORD>'

# Redis password
aws secretsmanager create-secret \
  --name vpn-enterprise/redis-password \
  --secret-string '<STRONG_REDIS_PASSWORD>'

# API keys
aws secretsmanager create-secret \
  --name vpn-enterprise/api-key \
  --secret-string '<RANDOM_API_KEY>'

# N8N encryption key
aws secretsmanager create-secret \
  --name vpn-enterprise/n8n-encryption-key \
  --secret-string '<RANDOM_32_CHAR_KEY>'
```

### 3.2 Create IAM Role for EC2

**What you'll learn**: IAM roles and least privilege principle

```bash
# Create trust policy
cat > ec2-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name vpn-enterprise-ec2-role \
  --assume-role-policy-document file://ec2-trust-policy.json

# Create policy for Secrets Manager access
cat > ec2-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:vpn-enterprise/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name vpn-enterprise-ec2-role \
  --policy-name vpn-enterprise-ec2-policy \
  --policy-document file://ec2-policy.json

# Create instance profile
aws iam create-instance-profile \
  --instance-profile-name vpn-enterprise-ec2-profile

aws iam add-role-to-instance-profile \
  --instance-profile-name vpn-enterprise-ec2-profile \
  --role-name vpn-enterprise-ec2-role
```

### 3.3 Create EC2 Instance with User Data

**What you'll learn**: EC2 instance provisioning, user data scripts

Create deployment script:
```bash
#!/bin/bash
# Save as: infrastructure/aws/ec2-user-data.sh

# Update system
yum update -y

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Node.js 20
curl -sL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# Install AWS CLI
yum install -y aws-cli

# Clone repository (you'll need to set up GitHub access)
cd /home/ec2-user
git clone https://github.com/Mucrypt/vpn-enterprise.git
cd vpn-enterprise

# Fetch secrets from AWS Secrets Manager
export DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id vpn-enterprise/db-password --query SecretString --output text --region us-east-1)
export REDIS_PASSWORD=$(aws secretsmanager get-secret-value --secret-id vpn-enterprise/redis-password --query SecretString --output text --region us-east-1)
export API_KEY=$(aws secretsmanager get-secret-value --secret-id vpn-enterprise/api-key --query SecretString --output text --region us-east-1)

# Create .env file
cat > .env <<EOF
NODE_ENV=production
DB_HOST=<RDS_ENDPOINT>
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=$DB_PASSWORD
DB_NAME=vpn_enterprise
REDIS_HOST=<REDIS_ENDPOINT>
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD
API_KEY=$API_KEY
EOF

# Install dependencies
npm install

# Build applications
cd packages/api && npm run build && cd ../..
cd apps/web-dashboard && npm run build && cd ../..

# Start services with Docker Compose
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d

# Set up log rotation
cat > /etc/logrotate.d/vpn-enterprise <<EOF
/var/log/vpn-enterprise/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
EOF
```

Launch EC2 instance:
```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name <YOUR_KEY_PAIR> \
  --security-group-ids <EC2_SG_ID> \
  --subnet-id <PRIVATE_APP_SUBNET_1_ID> \
  --iam-instance-profile Name=vpn-enterprise-ec2-profile \
  --user-data file://infrastructure/aws/ec2-user-data.sh \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=vpn-enterprise-app}]'
```

## Phase 4: Load Balancer Setup (30 minutes)

### 4.1 Create Application Load Balancer

**What you'll learn**: Load balancing, target groups, health checks

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name vpn-enterprise-alb \
  --subnets <PUBLIC_SUBNET_1_ID> <PUBLIC_SUBNET_2_ID> \
  --security-groups <ALB_SG_ID> \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4 \
  --tags Key=Name,Value=vpn-enterprise-alb

# Create Target Group for Web Dashboard
aws elbv2 create-target-group \
  --name vpn-enterprise-web-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id <VPC_ID> \
  --health-check-enabled \
  --health-check-path / \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 2

# Register EC2 instance with target group
aws elbv2 register-targets \
  --target-group-arn <WEB_TG_ARN> \
  --targets Id=<EC2_INSTANCE_ID>

# Create Target Group for API
aws elbv2 create-target-group \
  --name vpn-enterprise-api-tg \
  --protocol HTTP \
  --port 5000 \
  --vpc-id <VPC_ID> \
  --health-check-path /health \
  --health-check-interval-seconds 30

aws elbv2 register-targets \
  --target-group-arn <API_TG_ARN> \
  --targets Id=<EC2_INSTANCE_ID>

# Create Target Group for Python API
aws elbv2 create-target-group \
  --name vpn-enterprise-python-tg \
  --protocol HTTP \
  --port 5001 \
  --vpc-id <VPC_ID> \
  --health-check-path /health \
  --health-check-interval-seconds 30

aws elbv2 register-targets \
  --target-group-arn <PYTHON_TG_ARN> \
  --targets Id=<EC2_INSTANCE_ID>

# Create HTTP Listener with path-based routing
aws elbv2 create-listener \
  --load-balancer-arn <ALB_ARN> \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=<WEB_TG_ARN>

# Add rule for API path
aws elbv2 create-rule \
  --listener-arn <LISTENER_ARN> \
  --priority 10 \
  --conditions Field=path-pattern,Values='/api/*' \
  --actions Type=forward,TargetGroupArn=<API_TG_ARN>

# Add rule for Python API path
aws elbv2 create-rule \
  --listener-arn <LISTENER_ARN> \
  --priority 20 \
  --conditions Field=path-pattern,Values='/python-api/*' \
  --actions Type=forward,TargetGroupArn=<PYTHON_TG_ARN>
```

## Phase 5: Monitoring and Logging (30 minutes)

### 5.1 Set Up CloudWatch Logs

**What you'll learn**: Centralized logging, log groups, log streams

```bash
# Create log group
aws logs create-log-group \
  --log-group-name /vpn-enterprise/application

# Create log streams
aws logs create-log-stream \
  --log-group-name /vpn-enterprise/application \
  --log-stream-name web-dashboard

aws logs create-log-stream \
  --log-group-name /vpn-enterprise/application \
  --log-stream-name api

aws logs create-log-stream \
  --log-group-name /vpn-enterprise/application \
  --log-stream-name python-api
```

### 5.2 Set Up CloudWatch Alarms

**What you'll learn**: Automated monitoring, alerting

```bash
# CPU Utilization Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name vpn-enterprise-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=InstanceId,Value=<EC2_INSTANCE_ID> \
  --evaluation-periods 2

# RDS Storage Space Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name vpn-enterprise-low-storage \
  --alarm-description "Alert when RDS storage is low" \
  --metric-name FreeStorageSpace \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 2000000000 \
  --comparison-operator LessThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=vpn-enterprise-db \
  --evaluation-periods 1

# ALB Target Health Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name vpn-enterprise-unhealthy-targets \
  --alarm-description "Alert when targets are unhealthy" \
  --metric-name UnHealthyHostCount \
  --namespace AWS/ApplicationELB \
  --statistic Average \
  --period 60 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --evaluation-periods 2
```

## Phase 6: Backup and Disaster Recovery (20 minutes)

### 6.1 Enable Automated Backups

**What you'll learn**: Backup strategies, recovery procedures

```bash
# RDS automated backups are already enabled with 7-day retention
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier vpn-enterprise-db \
  --db-snapshot-identifier vpn-enterprise-db-manual-$(date +%Y%m%d)

# Set up AWS Backup for EC2
aws backup create-backup-plan \
  --backup-plan '{
    "BackupPlanName": "vpn-enterprise-backup-plan",
    "Rules": [{
      "RuleName": "DailyBackups",
      "TargetBackupVaultName": "Default",
      "ScheduleExpression": "cron(0 2 * * ? *)",
      "StartWindowMinutes": 60,
      "CompletionWindowMinutes": 120,
      "Lifecycle": {
        "DeleteAfterDays": 30
      }
    }]
  }'
```

## 📊 Cost Estimation

| Service | Type | Monthly Cost (USD) |
|---------|------|-------------------|
| EC2 t3.medium | 730 hours | ~$30 |
| RDS db.t3.micro | Multi-AZ | ~$30 |
| ElastiCache t3.micro | Single node | ~$15 |
| ALB | 730 hours + data | ~$20 |
| NAT Gateway | 730 hours + data | ~$35 |
| Data Transfer | 100 GB out | ~$9 |
| CloudWatch | Basic monitoring | ~$5 |
| **Total** | | **~$144/month** |

## 🎓 Learning Checkpoints

After completing this deployment, you should be able to answer:

1. **Networking**:
   - What's the difference between public and private subnets?
   - Why do we need a NAT Gateway?
   - How do route tables control traffic flow?

2. **Security**:
   - Why use security groups instead of opening all ports?
   - What's the principle of least privilege?
   - How does IAM differ from security groups?

3. **High Availability**:
   - Why deploy across multiple availability zones?
   - What happens if one AZ fails?
   - How does the load balancer distribute traffic?

4. **Managed Services**:
   - Benefits of RDS vs self-managed PostgreSQL?
   - How does automated backup work?
   - What's the difference between vertical and horizontal scaling?

## 🚀 Next Steps

1. **Add HTTPS**: Set up SSL/TLS with ACM (AWS Certificate Manager)
2. **Domain Setup**: Use Route53 for DNS management
3. **Auto Scaling**: Create Auto Scaling Group for horizontal scaling
4. **CI/CD Integration**: Connect Jenkins to deploy to AWS
5. **Kubernetes**: Migrate to EKS (Elastic Kubernetes Service)
6. **Monitoring**: Integrate Grafana with CloudWatch

## 🔧 Troubleshooting

### Cannot connect to EC2 instance
- Check security group allows SSH from your IP
- Verify instance is in running state
- Ensure you're using correct key pair

### RDS connection timeout
- Verify EC2 security group is allowed in RDS security group
- Check RDS endpoint is correct
- Ensure EC2 is in same VPC as RDS

### Load balancer returns 502/504
- Check target group health checks
- Verify applications are running on EC2
- Check security group allows traffic from ALB to EC2

## 📚 Additional Resources

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [VPC User Guide](https://docs.aws.amazon.com/vpc/latest/userguide/)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [EC2 Instance Types](https://aws.amazon.com/ec2/instance-types/)
