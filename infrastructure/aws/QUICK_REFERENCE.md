# AWS Deployment - Quick Reference Card

Keep this open while deploying!

## 🚀 Quick Start Commands

```bash
# Navigate to AWS infrastructure
cd /home/mukulah/vpn-enterprise/infrastructure/aws

# Deploy everything (2-3 hours)
./deploy.sh all

# Or deploy step by step:
./deploy.sh network    # 30 min - VPC, subnets, security groups
./deploy.sh data       # 30 min - RDS, Redis, secrets

# View summary
./deploy.sh summary

# Cleanup everything
./cleanup.sh
```

## 📋 Essential AWS CLI Commands

### Check AWS Connection
```bash
aws sts get-caller-identity
aws ec2 describe-regions --output table
```

### VPC & Networking
```bash
# List VPCs
aws ec2 describe-vpcs --query 'Vpcs[*].[VpcId,CidrBlock,Tags[?Key==`Name`].Value|[0]]' --output table

# List Subnets
aws ec2 describe-subnets --query 'Subnets[*].[SubnetId,CidrBlock,AvailabilityZone,Tags[?Key==`Name`].Value|[0]]' --output table

# List Security Groups
aws ec2 describe-security-groups --query 'SecurityGroups[*].[GroupId,GroupName,VpcId]' --output table
```

### EC2
```bash
# List instances
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,State.Name,PrivateIpAddress,Tags[?Key==`Name`].Value|[0]]' --output table

# Stop instance
aws ec2 stop-instances --instance-ids i-xxxxx

# Start instance
aws ec2 start-instances --instance-ids i-xxxxx

# Terminate instance
aws ec2 terminate-instances --instance-ids i-xxxxx

# Get instance console output
aws ec2 get-console-output --instance-id i-xxxxx
```

### RDS
```bash
# List databases
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceStatus,Endpoint.Address]' --output table

# Stop database (saves money during testing)
aws rds stop-db-instance --db-instance-identifier vpn-enterprise-db

# Start database
aws rds start-db-instance --db-instance-identifier vpn-enterprise-db

# Get endpoint
aws rds describe-db-instances --db-instance-identifier vpn-enterprise-db --query 'DBInstances[0].Endpoint.Address' --output text
```

### ElastiCache
```bash
# List Redis clusters
aws elasticache describe-cache-clusters --query 'CacheClusters[*].[CacheClusterId,CacheClusterStatus]' --output table

# Get endpoint
aws elasticache describe-cache-clusters --cache-cluster-id vpn-enterprise-redis --show-cache-node-info --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' --output text
```

### Load Balancer
```bash
# List load balancers
aws elbv2 describe-load-balancers --query 'LoadBalancers[*].[LoadBalancerName,DNSName,State.Code]' --output table

# Get DNS name
aws elbv2 describe-load-balancers --names vpn-enterprise-alb --query 'LoadBalancers[0].DNSName' --output text

# Check target health
aws elbv2 describe-target-health --target-group-arn <TG_ARN>
```

### Secrets Manager
```bash
# List secrets
aws secretsmanager list-secrets --query 'SecretList[*].[Name,ARN]' --output table

# Get secret value
aws secretsmanager get-secret-value --secret-id vpn-enterprise/db-password --query SecretString --output text
```

### CloudWatch
```bash
# List log groups
aws logs describe-log-groups --query 'logGroups[*].[logGroupName]' --output table

# Tail logs
aws logs tail /vpn-enterprise/application --follow

# List alarms
aws cloudwatch describe-alarms --query 'MetricAlarms[*].[AlarmName,StateValue]' --output table
```

### Billing
```bash
# Get current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -u +%Y-%m-01),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost

# Get costs by service
aws ce get-cost-and-usage \
  --time-period Start=$(date -u +%Y-%m-01),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

## 🔐 Getting Credentials

```bash
# From state file
cat aws-deployment-state.json | jq

# Database password
aws secretsmanager get-secret-value \
  --secret-id vpn-enterprise/db-password \
  --query SecretString --output text

# Redis password
aws secretsmanager get-secret-value \
  --secret-id vpn-enterprise/redis-password \
  --query SecretString --output text
```

## 🌐 Access URLs

```bash
# Get ALB DNS
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names vpn-enterprise-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

echo "Web Dashboard: http://$ALB_DNS"
echo "API: http://$ALB_DNS/api/health"
echo "Python API: http://$ALB_DNS/python-api/health"
```

## 🔍 Debugging

### Check EC2 User Data Logs
```bash
# SSH into instance first
ssh -i ~/.ssh/vpn-enterprise-key.pem ec2-user@<INSTANCE_IP>

# View bootstrap logs
sudo tail -f /var/log/user-data.log

# Check Docker status
sudo docker ps
sudo docker logs <container-name>
```

### Check Network Connectivity
```bash
# From your local machine
ping <ALB_DNS>
curl -I http://<ALB_DNS>

# From EC2 instance
curl localhost:3000
curl localhost:5000/health
nc -zv <RDS_ENDPOINT> 5432
```

### Check Security Groups
```bash
# View inbound rules for EC2 security group
aws ec2 describe-security-groups \
  --group-ids <EC2_SG_ID> \
  --query 'SecurityGroups[0].IpPermissions'
```

## 💰 Cost Management

### Daily Monitoring
```bash
# Check today's estimated costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -u +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost
```

### Stop Resources (Save Money)
```bash
# Stop EC2 (charges only for storage)
aws ec2 stop-instances --instance-ids <INSTANCE_ID>

# Stop RDS (no charges while stopped, max 7 days)
aws rds stop-db-instance --db-instance-identifier vpn-enterprise-db

# Note: NAT Gateway and ALB charge even when idle!
# Delete them if not needed
```

## 📊 Key Metrics to Watch

| Metric | Threshold | Action |
|--------|-----------|--------|
| EC2 CPU | > 80% | Scale up or optimize |
| RDS Storage | < 2GB | Increase storage |
| ALB 5xx errors | > 1% | Check app logs |
| Monthly cost | > $100 | Review resources |

## 🚨 Emergency Commands

### Stop Everything (Save Money)
```bash
# Stop EC2
INSTANCE_ID=$(jq -r '.ec2_instance_id' aws-deployment-state.json)
aws ec2 stop-instances --instance-ids $INSTANCE_ID

# Stop RDS
aws rds stop-db-instance --db-instance-identifier vpn-enterprise-db
```

### Delete Everything (Nuclear Option)
```bash
./cleanup.sh
# Type 'DELETE' to confirm
# This removes ALL resources and data!
```

## 📱 Useful Links

- **AWS Console**: https://console.aws.amazon.com
- **VPC Dashboard**: https://console.aws.amazon.com/vpc
- **EC2 Dashboard**: https://console.aws.amazon.com/ec2
- **RDS Dashboard**: https://console.aws.amazon.com/rds
- **CloudWatch**: https://console.aws.amazon.com/cloudwatch
- **Billing**: https://console.aws.amazon.com/billing

## 🎯 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "InvalidKeyPair.NotFound" | Create EC2 key pair first |
| "UnauthorizedOperation" | Check IAM permissions |
| "VpcLimitExceeded" | Delete old VPCs or request increase |
| "InsufficientFreeAddressesInSubnet" | Subnet CIDR too small |
| "Could not connect to endpoint" | Wrong AWS region configured |
| Target health: "unhealthy" | Check security groups, app logs |
| "DBSubnetGroupDoesNotCoverEnoughAZs" | Need subnets in 2+ AZs |

## 🏆 Best Practices

1. **Always** enable billing alarms
2. **Always** tag resources with project name
3. **Never** hardcode credentials
4. **Always** use IAM roles for EC2
5. **Stop** non-production resources when not in use
6. **Backup** state files before major changes
7. **Review** security group rules monthly
8. **Monitor** CloudWatch logs daily

## 📞 Getting Help

```bash
# AWS CLI help
aws help
aws ec2 help
aws rds help

# Specific command help
aws ec2 describe-instances help
```

## ✅ Pre-Deployment Checklist

- [ ] AWS CLI configured: `aws sts get-caller-identity`
- [ ] jq installed: `jq --version`
- [ ] EC2 key pair exists: `aws ec2 describe-key-pairs`
- [ ] Billing alerts enabled
- [ ] Enough AWS service limits (VPCs, EIPs, instances)

## 🎓 Learning Resources

- [AWS VPC Guide](https://docs.aws.amazon.com/vpc/)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [EC2 User Guide](https://docs.aws.amazon.com/ec2/)
- [Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

---

**Pro Tip**: Keep this file open in a split terminal while deploying!
