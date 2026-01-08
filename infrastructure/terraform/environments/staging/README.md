# Staging Environment

Production-like environment for VPN Enterprise testing before production deployment.

## Configuration

- **Region**: eu-north-1 (Stockholm)
- **VPC CIDR**: 10.1.0.0/16 (different from dev)
- **High Availability**: Multi-AZ deployment
- **NAT**: Multi-AZ NAT Gateways (2x)
- **Cost**: ~€150/month

## Key Differences from Dev

| Feature | Dev | Staging |
|---------|-----|---------|
| **VPC CIDR** | 10.0.0.0/16 | 10.1.0.0/16 |
| **NAT Gateway** | Single (1 AZ) | Multi (2 AZ) |
| **RDS Instance** | db.t3.micro | db.t3.small |
| **RDS Multi-AZ** | No | Yes |
| **Redis Nodes** | 1 | 2 (cluster) |
| **EC2 Instance** | t3.micro | t3.small |
| **Scaling** | Fixed (2) | Auto (2-4) |
| **Backups** | 7 days | 14 days |
| **Cost/Month** | ~€90 | ~€150 |

## Prerequisites

1. **AWS Credentials Configured** ✅
```bash
aws sts get-caller-identity
```

2. **Dev Environment Deployed**
- Staging uses same modules as dev
- Test in dev first!

## Deploy Steps

```bash
# 1. Go to staging directory
cd /home/mukulah/vpn-enterprise/infrastructure/terraform/environments/staging

# 2. Initialize Terraform
terraform init

# 3. Preview changes
terraform plan

# 4. Deploy (will ask for confirmation)
terraform apply

# 5. View outputs
terraform output
```

## What Gets Created?

### Networking (Multi-AZ)
- ✅ VPC with DNS enabled
- ✅ Internet Gateway
- ✅ 2x NAT Gateways (high availability)
- ✅ 6x Subnets across 2 AZs
- ✅ Route tables
- ✅ 4x Security groups

### Database (High Availability)
- ✅ RDS PostgreSQL (Multi-AZ)
  - db.t3.small (2 vCPU, 2 GB RAM)
  - 50 GB storage (auto-scales to 200 GB)
  - 14-day backups
  - Automatic failover

- ✅ ElastiCache Redis (Cluster)
  - cache.t3.small (2 vCPU, 1.55 GB RAM)
  - 2 nodes (primary + replica)
  - Automatic failover
  - 7-day snapshots

### Compute (Auto Scaling)
- ✅ Application Load Balancer
- ✅ Auto Scaling Group (2-4 instances)
  - t3.small (2 vCPU, 2 GB RAM)
  - Scales up at 70% CPU
  - Scales down at 20% CPU
- ✅ Launch template with encrypted volumes
- ✅ IAM roles for AWS service access
- ✅ CloudWatch monitoring

## Cost Breakdown

### Monthly Costs (EUR)
- **NAT Gateways**: 2 × €32 = €64
- **RDS Multi-AZ**: ~€45
- **ElastiCache (2 nodes)**: ~€30
- **EC2 (2-4 instances)**: €40-80
- **ALB**: ~€20
- **Data transfer**: ~€10

**Total**: ~€209/month (can vary with scaling)

## Testing Before Production

Staging is designed to mimic production. Use it to:

1. **Test deployments**
```bash
# Deploy your application
# Test database migrations
# Verify Redis connectivity
# Load test the ALB
```

2. **Test scaling**
```bash
# Generate load to trigger auto-scaling
ab -n 10000 -c 100 http://<alb-url>/

# Watch instances scale
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names vpn-enterprise-staging-asg
```

3. **Test failover**
```bash
# Reboot RDS to test Multi-AZ failover
aws rds reboot-db-instance \
  --db-instance-identifier vpn-enterprise-staging-postgres \
  --force-failover

# Watch recovery (< 2 minutes)
```

4. **Test backups**
```bash
# List RDS snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier vpn-enterprise-staging-postgres

# Test restore (in separate environment)
```

## Accessing Staging

### Application
```bash
# Get URL
terraform output alb_url

# Access web dashboard
open $(terraform output -raw alb_url)

# Access API
curl $(terraform output -raw alb_url)/api/health
```

### Database
```bash
# Get connection details
terraform output rds_endpoint

# Get password from Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id vpn-enterprise-staging-db-password \
  --query SecretString --output text | jq -r '.password'
```

### Instances
```bash
# List instances
aws autoscaling describe-auto-scaling-instances \
  --query "AutoScalingInstances[?AutoScalingGroupName=='vpn-enterprise-staging-asg']"

# Connect via Systems Manager (no SSH key needed!)
aws ssm start-session --target <instance-id>
```

## Monitoring

### CloudWatch Dashboards
View metrics:
```
https://console.aws.amazon.com/cloudwatch/home?region=eu-north-1#dashboards:
```

### Alarms
- RDS CPU > 80%
- RDS Free Storage < 5 GB
- Redis CPU > 75%
- Redis Memory > 80%
- EC2 Auto Scaling (CPU thresholds)

### Logs
```bash
# Application logs
aws logs tail /aws/ec2/vpn-enterprise/staging/application --follow

# RDS logs
aws rds describe-db-log-files \
  --db-instance-identifier vpn-enterprise-staging-postgres
```

## Maintenance Windows

- **RDS**: Monday 4-5 AM UTC
- **Redis**: Sunday 3-4 AM UTC
- **EC2 Updates**: Automatic via user data

Plan deployments around these windows!

## Cleanup

When done testing:

```bash
# WARNING: This destroys all resources!
terraform destroy

# Or scale down to save costs:
terraform apply -var="asg_desired_capacity=0"
```

## Promotion to Production

After successful staging testing:

1. **Copy to production environment**
```bash
cd ../prod
# Use same modules with prod variables
```

2. **Key production changes**
- Larger instance types (t3.medium)
- More aggressive auto-scaling (2-6 instances)
- Longer backup retention (30 days)
- Deletion protection enabled
- Production domain and SSL certificate

3. **Deploy production**
```bash
terraform init
terraform plan
terraform apply
```

## Troubleshooting

### High Costs?
```bash
# Check running resources
terraform show

# Scale down Auto Scaling
terraform apply -var="asg_desired_capacity=1"

# Temporarily destroy expensive resources
terraform destroy -target=module.database
```

### Deployment Failed?
```bash
# Check for resource conflicts
aws ec2 describe-vpcs --filters "Name=cidr,Values=10.1.0.0/16"

# Check CloudFormation stacks
aws cloudformation list-stacks

# Enable debug logging
export TF_LOG=DEBUG
terraform apply
```

### Performance Issues?
```bash
# Check RDS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=vpn-enterprise-staging-postgres

# Check Auto Scaling activity
aws autoscaling describe-scaling-activities \
  --auto-scaling-group-name vpn-enterprise-staging-asg
```

## Next Steps

After staging works:
1. ✅ Test application thoroughly
2. ✅ Run load tests
3. ✅ Test failover scenarios
4. ✅ Verify monitoring and alerts
5. 🚀 Deploy to production!
