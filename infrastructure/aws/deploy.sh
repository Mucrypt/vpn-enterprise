#!/bin/bash

# VPN Enterprise AWS Deployment Script
# This script automates the deployment of VPN Enterprise to AWS
# Usage: ./deploy.sh [phase]
# Phases: network, data, app, lb, monitoring, all

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME="vpn-enterprise"
VPC_CIDR="10.0.0.0/16"

# State file to store resource IDs
STATE_FILE="aws-deployment-state.json"

# Initialize state file if it doesn't exist
if [ ! -f "$STATE_FILE" ]; then
    echo "{}" > "$STATE_FILE"
fi

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
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

save_state() {
    local key=$1
    local value=$2
    jq --arg k "$key" --arg v "$value" '.[$k] = $v' "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
}

get_state() {
    local key=$1
    jq -r ".${key} // empty" "$STATE_FILE"
}

check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install it first."
        exit 1
    fi
    log_success "AWS CLI found"
}

check_jq() {
    if ! command -v jq &> /dev/null; then
        log_error "jq not found. Please install it: sudo apt-get install jq"
        exit 1
    fi
    log_success "jq found"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    check_aws_cli
    check_jq
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Run: aws configure"
        exit 1
    fi
    
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    log_success "AWS credentials configured (Account: $ACCOUNT_ID)"
    save_state "account_id" "$ACCOUNT_ID"
}

# Phase 1: Network Infrastructure
deploy_network() {
    log_info "Phase 1: Deploying Network Infrastructure..."
    
    # Create VPC
    log_info "Creating VPC..."
    VPC_ID=$(aws ec2 create-vpc \
        --cidr-block "$VPC_CIDR" \
        --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=$PROJECT_NAME-vpc}]" \
        --query 'Vpc.VpcId' \
        --output text)
    save_state "vpc_id" "$VPC_ID"
    log_success "VPC created: $VPC_ID"
    
    # Enable DNS hostnames
    aws ec2 modify-vpc-attribute --vpc-id "$VPC_ID" --enable-dns-hostnames
    
    # Create Internet Gateway
    log_info "Creating Internet Gateway..."
    IGW_ID=$(aws ec2 create-internet-gateway \
        --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=$PROJECT_NAME-igw}]" \
        --query 'InternetGateway.InternetGatewayId' \
        --output text)
    save_state "igw_id" "$IGW_ID"
    
    aws ec2 attach-internet-gateway --vpc-id "$VPC_ID" --internet-gateway-id "$IGW_ID"
    log_success "Internet Gateway created and attached: $IGW_ID"
    
    # Create Subnets
    log_info "Creating subnets..."
    
    PUBLIC_SUBNET_1=$(aws ec2 create-subnet \
        --vpc-id "$VPC_ID" \
        --cidr-block "10.0.1.0/24" \
        --availability-zone "${AWS_REGION}a" \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$PROJECT_NAME-public-1a}]" \
        --query 'Subnet.SubnetId' \
        --output text)
    save_state "public_subnet_1" "$PUBLIC_SUBNET_1"
    
    PUBLIC_SUBNET_2=$(aws ec2 create-subnet \
        --vpc-id "$VPC_ID" \
        --cidr-block "10.0.2.0/24" \
        --availability-zone "${AWS_REGION}b" \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$PROJECT_NAME-public-1b}]" \
        --query 'Subnet.SubnetId' \
        --output text)
    save_state "public_subnet_2" "$PUBLIC_SUBNET_2"
    
    PRIVATE_APP_SUBNET_1=$(aws ec2 create-subnet \
        --vpc-id "$VPC_ID" \
        --cidr-block "10.0.10.0/24" \
        --availability-zone "${AWS_REGION}a" \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$PROJECT_NAME-private-app-1a}]" \
        --query 'Subnet.SubnetId' \
        --output text)
    save_state "private_app_subnet_1" "$PRIVATE_APP_SUBNET_1"
    
    PRIVATE_APP_SUBNET_2=$(aws ec2 create-subnet \
        --vpc-id "$VPC_ID" \
        --cidr-block "10.0.11.0/24" \
        --availability-zone "${AWS_REGION}b" \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$PROJECT_NAME-private-app-1b}]" \
        --query 'Subnet.SubnetId' \
        --output text)
    save_state "private_app_subnet_2" "$PRIVATE_APP_SUBNET_2"
    
    PRIVATE_DB_SUBNET_1=$(aws ec2 create-subnet \
        --vpc-id "$VPC_ID" \
        --cidr-block "10.0.20.0/24" \
        --availability-zone "${AWS_REGION}a" \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$PROJECT_NAME-private-db-1a}]" \
        --query 'Subnet.SubnetId' \
        --output text)
    save_state "private_db_subnet_1" "$PRIVATE_DB_SUBNET_1"
    
    PRIVATE_DB_SUBNET_2=$(aws ec2 create-subnet \
        --vpc-id "$VPC_ID" \
        --cidr-block "10.0.21.0/24" \
        --availability-zone "${AWS_REGION}b" \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$PROJECT_NAME-private-db-1b}]" \
        --query 'Subnet.SubnetId' \
        --output text)
    save_state "private_db_subnet_2" "$PRIVATE_DB_SUBNET_2"
    
    log_success "All subnets created"
    
    # Create and configure route tables
    log_info "Creating route tables..."
    
    PUBLIC_RT=$(aws ec2 create-route-table \
        --vpc-id "$VPC_ID" \
        --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=$PROJECT_NAME-public-rt}]" \
        --query 'RouteTable.RouteTableId' \
        --output text)
    save_state "public_rt" "$PUBLIC_RT"
    
    aws ec2 create-route --route-table-id "$PUBLIC_RT" --destination-cidr-block 0.0.0.0/0 --gateway-id "$IGW_ID"
    aws ec2 associate-route-table --subnet-id "$PUBLIC_SUBNET_1" --route-table-id "$PUBLIC_RT" > /dev/null
    aws ec2 associate-route-table --subnet-id "$PUBLIC_SUBNET_2" --route-table-id "$PUBLIC_RT" > /dev/null
    
    # Allocate Elastic IP for NAT Gateway
    log_info "Allocating Elastic IP for NAT Gateway..."
    EIP_ALLOC=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)
    save_state "eip_allocation" "$EIP_ALLOC"
    
    # Create NAT Gateway
    log_info "Creating NAT Gateway (this may take a few minutes)..."
    NAT_GW=$(aws ec2 create-nat-gateway \
        --subnet-id "$PUBLIC_SUBNET_1" \
        --allocation-id "$EIP_ALLOC" \
        --tag-specifications "ResourceType=nat-gateway,Tags=[{Key=Name,Value=$PROJECT_NAME-nat}]" \
        --query 'NatGateway.NatGatewayId' \
        --output text)
    save_state "nat_gateway" "$NAT_GW"
    
    # Wait for NAT Gateway to be available
    log_info "Waiting for NAT Gateway to become available..."
    aws ec2 wait nat-gateway-available --nat-gateway-ids "$NAT_GW"
    log_success "NAT Gateway ready: $NAT_GW"
    
    # Create private route table
    PRIVATE_RT=$(aws ec2 create-route-table \
        --vpc-id "$VPC_ID" \
        --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=$PROJECT_NAME-private-rt}]" \
        --query 'RouteTable.RouteTableId' \
        --output text)
    save_state "private_rt" "$PRIVATE_RT"
    
    aws ec2 create-route --route-table-id "$PRIVATE_RT" --destination-cidr-block 0.0.0.0/0 --nat-gateway-id "$NAT_GW"
    aws ec2 associate-route-table --subnet-id "$PRIVATE_APP_SUBNET_1" --route-table-id "$PRIVATE_RT" > /dev/null
    aws ec2 associate-route-table --subnet-id "$PRIVATE_APP_SUBNET_2" --route-table-id "$PRIVATE_RT" > /dev/null
    
    log_success "Route tables configured"
    
    # Create Security Groups
    log_info "Creating security groups..."
    
    ALB_SG=$(aws ec2 create-security-group \
        --group-name "$PROJECT_NAME-alb-sg" \
        --description "Security group for Application Load Balancer" \
        --vpc-id "$VPC_ID" \
        --query 'GroupId' \
        --output text)
    save_state "alb_sg" "$ALB_SG"
    
    aws ec2 authorize-security-group-ingress --group-id "$ALB_SG" --protocol tcp --port 80 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --group-id "$ALB_SG" --protocol tcp --port 443 --cidr 0.0.0.0/0
    
    EC2_SG=$(aws ec2 create-security-group \
        --group-name "$PROJECT_NAME-ec2-sg" \
        --description "Security group for EC2 instances" \
        --vpc-id "$VPC_ID" \
        --query 'GroupId' \
        --output text)
    save_state "ec2_sg" "$EC2_SG"
    
    # Allow traffic from ALB
    aws ec2 authorize-security-group-ingress --group-id "$EC2_SG" --protocol tcp --port 3000 --source-group "$ALB_SG"
    aws ec2 authorize-security-group-ingress --group-id "$EC2_SG" --protocol tcp --port 5000 --source-group "$ALB_SG"
    aws ec2 authorize-security-group-ingress --group-id "$EC2_SG" --protocol tcp --port 5001 --source-group "$ALB_SG"
    
    # Allow SSH from your current IP
    MY_IP=$(curl -s https://checkip.amazonaws.com)
    aws ec2 authorize-security-group-ingress --group-id "$EC2_SG" --protocol tcp --port 22 --cidr "${MY_IP}/32"
    log_info "SSH access allowed from your IP: $MY_IP"
    
    RDS_SG=$(aws ec2 create-security-group \
        --group-name "$PROJECT_NAME-rds-sg" \
        --description "Security group for RDS PostgreSQL" \
        --vpc-id "$VPC_ID" \
        --query 'GroupId' \
        --output text)
    save_state "rds_sg" "$RDS_SG"
    
    aws ec2 authorize-security-group-ingress --group-id "$RDS_SG" --protocol tcp --port 5432 --source-group "$EC2_SG"
    
    REDIS_SG=$(aws ec2 create-security-group \
        --group-name "$PROJECT_NAME-redis-sg" \
        --description "Security group for ElastiCache Redis" \
        --vpc-id "$VPC_ID" \
        --query 'GroupId' \
        --output text)
    save_state "redis_sg" "$REDIS_SG"
    
    aws ec2 authorize-security-group-ingress --group-id "$REDIS_SG" --protocol tcp --port 6379 --source-group "$EC2_SG"
    
    log_success "Security groups created"
    log_success "Phase 1 Complete: Network Infrastructure Ready! 🎉"
}

# Phase 2: Data Layer
deploy_data() {
    log_info "Phase 2: Deploying Data Layer..."
    
    VPC_ID=$(get_state "vpc_id")
    RDS_SG=$(get_state "rds_sg")
    REDIS_SG=$(get_state "redis_sg")
    PRIVATE_DB_SUBNET_1=$(get_state "private_db_subnet_1")
    PRIVATE_DB_SUBNET_2=$(get_state "private_db_subnet_2")
    
    # Generate random passwords
    DB_PASSWORD=$(openssl rand -base64 32)
    REDIS_PASSWORD=$(openssl rand -base64 32)
    
    # Create DB Subnet Group
    log_info "Creating RDS subnet group..."
    aws rds create-db-subnet-group \
        --db-subnet-group-name "$PROJECT_NAME-db-subnet-group" \
        --db-subnet-group-description "Subnet group for VPN Enterprise RDS" \
        --subnet-ids "$PRIVATE_DB_SUBNET_1" "$PRIVATE_DB_SUBNET_2" \
        --tags Key=Name,Value="$PROJECT_NAME-db-subnet-group" > /dev/null
    
    # Create RDS instance
    log_info "Creating RDS PostgreSQL instance (this will take 5-10 minutes)..."
    aws rds create-db-instance \
        --db-instance-identifier "$PROJECT_NAME-db" \
        --db-instance-class db.t3.micro \
        --engine postgres \
        --engine-version 15.5 \
        --master-username postgres \
        --master-user-password "$DB_PASSWORD" \
        --allocated-storage 20 \
        --storage-type gp3 \
        --vpc-security-group-ids "$RDS_SG" \
        --db-subnet-group-name "$PROJECT_NAME-db-subnet-group" \
        --backup-retention-period 7 \
        --no-multi-az \
        --no-publicly-accessible \
        --storage-encrypted \
        --enable-cloudwatch-logs-exports '["postgresql"]' \
        --tags Key=Name,Value="$PROJECT_NAME-db" > /dev/null
    
    log_info "Waiting for RDS instance to be available (this may take 5-10 minutes)..."
    aws rds wait db-instance-available --db-instance-identifier "$PROJECT_NAME-db"
    
    RDS_ENDPOINT=$(aws rds describe-db-instances \
        --db-instance-identifier "$PROJECT_NAME-db" \
        --query 'DBInstances[0].Endpoint.Address' \
        --output text)
    save_state "rds_endpoint" "$RDS_ENDPOINT"
    save_state "db_password" "$DB_PASSWORD"
    log_success "RDS instance ready: $RDS_ENDPOINT"
    
    # Create Cache Subnet Group
    log_info "Creating ElastiCache subnet group..."
    aws elasticache create-cache-subnet-group \
        --cache-subnet-group-name "$PROJECT_NAME-redis-subnet-group" \
        --cache-subnet-group-description "Subnet group for VPN Enterprise Redis" \
        --subnet-ids "$PRIVATE_DB_SUBNET_1" "$PRIVATE_DB_SUBNET_2" > /dev/null
    
    # Create Redis cluster
    log_info "Creating Redis cluster..."
    aws elasticache create-cache-cluster \
        --cache-cluster-id "$PROJECT_NAME-redis" \
        --cache-node-type cache.t3.micro \
        --engine redis \
        --engine-version 7.0 \
        --num-cache-nodes 1 \
        --cache-subnet-group-name "$PROJECT_NAME-redis-subnet-group" \
        --security-group-ids "$REDIS_SG" \
        --port 6379 \
        --tags Key=Name,Value="$PROJECT_NAME-redis" > /dev/null
    
    log_info "Waiting for Redis cluster to be available..."
    aws elasticache wait cache-cluster-available --cache-cluster-id "$PROJECT_NAME-redis"
    
    REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
        --cache-cluster-id "$PROJECT_NAME-redis" \
        --show-cache-node-info \
        --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
        --output text)
    save_state "redis_endpoint" "$REDIS_ENDPOINT"
    save_state "redis_password" "$REDIS_PASSWORD"
    log_success "Redis cluster ready: $REDIS_ENDPOINT"
    
    # Store secrets in AWS Secrets Manager
    log_info "Storing secrets in AWS Secrets Manager..."
    
    aws secretsmanager create-secret \
        --name "$PROJECT_NAME/db-password" \
        --secret-string "$DB_PASSWORD" \
        --description "Database password for VPN Enterprise" > /dev/null || true
    
    aws secretsmanager create-secret \
        --name "$PROJECT_NAME/redis-password" \
        --secret-string "$REDIS_PASSWORD" \
        --description "Redis password for VPN Enterprise" > /dev/null || true
    
    API_KEY=$(openssl rand -hex 32)
    aws secretsmanager create-secret \
        --name "$PROJECT_NAME/api-key" \
        --secret-string "$API_KEY" \
        --description "API key for VPN Enterprise" > /dev/null || true
    save_state "api_key" "$API_KEY"
    
    N8N_KEY=$(openssl rand -hex 16)
    aws secretsmanager create-secret \
        --name "$PROJECT_NAME/n8n-encryption-key" \
        --secret-string "$N8N_KEY" \
        --description "N8N encryption key for VPN Enterprise" > /dev/null || true
    
    log_success "Secrets stored in AWS Secrets Manager"
    log_success "Phase 2 Complete: Data Layer Ready! 🎉"
}

# Show deployment summary
show_summary() {
    log_info "Deployment Summary"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  🏗️  VPN Enterprise AWS Infrastructure"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📦 Network Resources:"
    echo "  VPC ID:              $(get_state vpc_id)"
    echo "  Public Subnets:      $(get_state public_subnet_1), $(get_state public_subnet_2)"
    echo "  Private Subnets:     $(get_state private_app_subnet_1), $(get_state private_app_subnet_2)"
    echo "  NAT Gateway:         $(get_state nat_gateway)"
    echo ""
    echo "🗄️  Data Layer:"
    echo "  RDS Endpoint:        $(get_state rds_endpoint)"
    echo "  Redis Endpoint:      $(get_state redis_endpoint)"
    echo ""
    echo "🔐 Security:"
    echo "  DB Password stored in: $PROJECT_NAME/db-password (Secrets Manager)"
    echo "  Redis Password stored in: $PROJECT_NAME/redis-password (Secrets Manager)"
    echo "  API Key stored in: $PROJECT_NAME/api-key (Secrets Manager)"
    echo ""
    echo "📝 State file: $STATE_FILE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Main execution
case "${1:-all}" in
    network)
        check_prerequisites
        deploy_network
        show_summary
        ;;
    data)
        check_prerequisites
        deploy_data
        show_summary
        ;;
    all)
        check_prerequisites
        deploy_network
        deploy_data
        show_summary
        ;;
    summary)
        show_summary
        ;;
    *)
        echo "Usage: $0 {network|data|all|summary}"
        exit 1
        ;;
esac

log_success "Deployment complete! 🚀"
