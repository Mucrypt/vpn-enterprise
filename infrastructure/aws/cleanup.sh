#!/bin/bash

# VPN Enterprise AWS Cleanup Script
# WARNING: This will delete all AWS resources created by the deployment script
# Use with caution!

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

STATE_FILE="aws-deployment-state.json"
PROJECT_NAME="vpn-enterprise"

log_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

get_state() {
    local key=$1
    jq -r ".${key} // empty" "$STATE_FILE" 2>/dev/null || echo ""
}

if [ ! -f "$STATE_FILE" ]; then
    log_error "State file not found: $STATE_FILE"
    log_info "Nothing to clean up."
    exit 0
fi

echo ""
log_warning "⚠️  WARNING: This will DELETE all AWS resources for VPN Enterprise!"
log_warning "This includes:"
echo "  - EC2 instances"
echo "  - RDS databases (and all data)"
echo "  - ElastiCache clusters"
echo "  - Load balancers"
echo "  - VPC and all networking components"
echo "  - Secrets in Secrets Manager"
echo ""
read -p "Are you absolutely sure you want to continue? (type 'DELETE' to confirm): " confirm

if [ "$confirm" != "DELETE" ]; then
    log_info "Cleanup cancelled."
    exit 0
fi

echo ""
log_info "Starting cleanup process..."

# Delete RDS instance
RDS_ID="${PROJECT_NAME}-db"
if aws rds describe-db-instances --db-instance-identifier "$RDS_ID" &>/dev/null; then
    log_info "Deleting RDS instance: $RDS_ID"
    aws rds delete-db-instance \
        --db-instance-identifier "$RDS_ID" \
        --skip-final-snapshot \
        --delete-automated-backups &>/dev/null || true
    log_info "Waiting for RDS deletion..."
    aws rds wait db-instance-deleted --db-instance-identifier "$RDS_ID" 2>/dev/null || true
    log_info "Deleting RDS subnet group..."
    aws rds delete-db-subnet-group --db-subnet-group-name "${PROJECT_NAME}-db-subnet-group" &>/dev/null || true
fi

# Delete ElastiCache cluster
REDIS_ID="${PROJECT_NAME}-redis"
if aws elasticache describe-cache-clusters --cache-cluster-id "$REDIS_ID" &>/dev/null; then
    log_info "Deleting ElastiCache cluster: $REDIS_ID"
    aws elasticache delete-cache-cluster --cache-cluster-id "$REDIS_ID" &>/dev/null || true
    sleep 5
    log_info "Deleting Cache subnet group..."
    aws elasticache delete-cache-subnet-group --cache-subnet-group-name "${PROJECT_NAME}-redis-subnet-group" &>/dev/null || true
fi

# Delete Load Balancer
ALB_NAME="${PROJECT_NAME}-alb"
ALB_ARN=$(aws elbv2 describe-load-balancers --names "$ALB_NAME" --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null || echo "")
if [ -n "$ALB_ARN" ] && [ "$ALB_ARN" != "None" ]; then
    log_info "Deleting Application Load Balancer..."
    
    # Delete listeners
    LISTENERS=$(aws elbv2 describe-listeners --load-balancer-arn "$ALB_ARN" --query 'Listeners[*].ListenerArn' --output text 2>/dev/null)
    for listener in $LISTENERS; do
        aws elbv2 delete-listener --listener-arn "$listener" &>/dev/null || true
    done
    
    # Delete load balancer
    aws elbv2 delete-load-balancer --load-balancer-arn "$ALB_ARN" &>/dev/null || true
    log_info "Waiting for ALB deletion..."
    sleep 10
fi

# Delete Target Groups
for tg in "${PROJECT_NAME}-web-tg" "${PROJECT_NAME}-api-tg" "${PROJECT_NAME}-python-tg"; do
    TG_ARN=$(aws elbv2 describe-target-groups --names "$tg" --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || echo "")
    if [ -n "$TG_ARN" ] && [ "$TG_ARN" != "None" ]; then
        log_info "Deleting target group: $tg"
        aws elbv2 delete-target-group --target-group-arn "$TG_ARN" &>/dev/null || true
    fi
done

# Delete EC2 instances
log_info "Checking for EC2 instances..."
INSTANCE_IDS=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=${PROJECT_NAME}-app" "Name=instance-state-name,Values=running,stopped" \
    --query 'Reservations[*].Instances[*].InstanceId' \
    --output text)

if [ -n "$INSTANCE_IDS" ]; then
    log_info "Terminating EC2 instances: $INSTANCE_IDS"
    aws ec2 terminate-instances --instance-ids $INSTANCE_IDS &>/dev/null || true
    log_info "Waiting for instances to terminate..."
    aws ec2 wait instance-terminated --instance-ids $INSTANCE_IDS 2>/dev/null || true
fi

# Delete NAT Gateway
NAT_GW=$(get_state "nat_gateway")
if [ -n "$NAT_GW" ]; then
    log_info "Deleting NAT Gateway: $NAT_GW"
    aws ec2 delete-nat-gateway --nat-gateway-id "$NAT_GW" &>/dev/null || true
    log_info "Waiting for NAT Gateway deletion..."
    sleep 30
fi

# Release Elastic IP
EIP_ALLOC=$(get_state "eip_allocation")
if [ -n "$EIP_ALLOC" ]; then
    log_info "Releasing Elastic IP: $EIP_ALLOC"
    aws ec2 release-address --allocation-id "$EIP_ALLOC" &>/dev/null || true
fi

# Delete Security Groups
VPC_ID=$(get_state "vpc_id")
if [ -n "$VPC_ID" ]; then
    log_info "Deleting security groups..."
    for sg_name in "${PROJECT_NAME}-alb-sg" "${PROJECT_NAME}-ec2-sg" "${PROJECT_NAME}-rds-sg" "${PROJECT_NAME}-redis-sg"; do
        SG_ID=$(aws ec2 describe-security-groups \
            --filters "Name=group-name,Values=$sg_name" "Name=vpc-id,Values=$VPC_ID" \
            --query 'SecurityGroups[0].GroupId' \
            --output text 2>/dev/null || echo "")
        if [ -n "$SG_ID" ] && [ "$SG_ID" != "None" ]; then
            aws ec2 delete-security-group --group-id "$SG_ID" &>/dev/null || true
        fi
    done
fi

# Delete Internet Gateway
IGW_ID=$(get_state "igw_id")
if [ -n "$IGW_ID" ] && [ -n "$VPC_ID" ]; then
    log_info "Detaching and deleting Internet Gateway..."
    aws ec2 detach-internet-gateway --internet-gateway-id "$IGW_ID" --vpc-id "$VPC_ID" &>/dev/null || true
    aws ec2 delete-internet-gateway --internet-gateway-id "$IGW_ID" &>/dev/null || true
fi

# Delete Subnets
if [ -n "$VPC_ID" ]; then
    log_info "Deleting subnets..."
    SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[*].SubnetId' --output text)
    for subnet in $SUBNETS; do
        aws ec2 delete-subnet --subnet-id "$subnet" &>/dev/null || true
    done
fi

# Delete Route Tables
if [ -n "$VPC_ID" ]; then
    log_info "Deleting route tables..."
    ROUTE_TABLES=$(aws ec2 describe-route-tables \
        --filters "Name=vpc-id,Values=$VPC_ID" \
        --query 'RouteTables[?Associations[0].Main==`false`].RouteTableId' \
        --output text)
    for rt in $ROUTE_TABLES; do
        aws ec2 delete-route-table --route-table-id "$rt" &>/dev/null || true
    done
fi

# Delete VPC
if [ -n "$VPC_ID" ]; then
    log_info "Deleting VPC: $VPC_ID"
    aws ec2 delete-vpc --vpc-id "$VPC_ID" &>/dev/null || true
fi

# Delete Secrets from Secrets Manager
log_info "Deleting secrets from Secrets Manager..."
for secret in "db-password" "redis-password" "api-key" "n8n-encryption-key"; do
    aws secretsmanager delete-secret \
        --secret-id "${PROJECT_NAME}/${secret}" \
        --force-delete-without-recovery &>/dev/null || true
done

# Delete IAM resources
log_info "Deleting IAM resources..."
aws iam remove-role-from-instance-profile \
    --instance-profile-name "${PROJECT_NAME}-ec2-profile" \
    --role-name "${PROJECT_NAME}-ec2-role" &>/dev/null || true

aws iam delete-instance-profile \
    --instance-profile-name "${PROJECT_NAME}-ec2-profile" &>/dev/null || true

aws iam delete-role-policy \
    --role-name "${PROJECT_NAME}-ec2-role" \
    --policy-name "${PROJECT_NAME}-ec2-policy" &>/dev/null || true

aws iam delete-role \
    --role-name "${PROJECT_NAME}-ec2-role" &>/dev/null || true

# Delete state file
if [ -f "$STATE_FILE" ]; then
    log_info "Removing state file..."
    rm "$STATE_FILE"
fi

echo ""
log_info "✅ Cleanup complete!"
log_info "All VPN Enterprise AWS resources have been deleted."
echo ""
