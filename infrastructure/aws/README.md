# AWS Deployment - Quick Start Guide

This directory contains two deployment methods:

## 🚀 Quick Start (Bash Scripts)

### Prerequisites
- AWS CLI installed and configured (`aws configure`)
- jq installed (`sudo apt-get install jq`)
- Active AWS account

### Deploy Everything
```bash
./deploy.sh all
```

### Deploy Step by Step
```bash
# Phase 1: Network infrastructure (VPC, subnets, security groups)
./deploy.sh network

# Phase 2: Data layer (RDS, ElastiCache, Secrets Manager)
./deploy.sh data

# View summary
./deploy.sh summary
```

### Cleanup
```bash
./cleanup.sh
# Type 'DELETE' when prompted
```

## 🏗️ Infrastructure as Code (Terraform)

### Prerequisites
- Terraform installed (`terraform version`)
- AWS CLI configured
- EC2 key pair created

### Deploy with Terraform
```bash
cd terraform

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the infrastructure
terraform apply

# When done, destroy everything
terraform destroy
```

### Create terraform.tfvars
```hcl
aws_region        = "us-east-1"
environment       = "prod"
key_name          = "your-ec2-key-pair-name"
ec2_instance_type = "t3.medium"
```

## 📊 Cost Comparison

| Resource | Type | Monthly Cost |
|----------|------|--------------|
| EC2 t3.medium | 1 instance | ~$30 |
| RDS db.t3.micro | Single-AZ | ~$15 |
| ElastiCache t3.micro | 1 node | ~$15 |
| NAT Gateway | 730 hours | ~$35 |
| **Total** | | **~$95/month** |

*Using free tier where possible*

## 📁 Files Overview

- `deploy.sh` - Automated deployment script (Bash)
- `cleanup.sh` - Resource cleanup script
- `ec2-user-data.sh` - EC2 bootstrap script
- `terraform/main.tf` - Complete Terraform configuration
- `aws-deployment-state.json` - Deployment state (auto-generated)

## 🔑 Accessing Resources

After deployment:

```bash
# Get RDS endpoint
aws rds describe-db-instances \
  --db-instance-identifier vpn-enterprise-db \
  --query 'DBInstances[0].Endpoint.Address'

# Get Redis endpoint
aws elasticache describe-cache-clusters \
  --cache-cluster-id vpn-enterprise-redis \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address'

# Get secrets
aws secretsmanager get-secret-value \
  --secret-id vpn-enterprise/db-password \
  --query SecretString --output text
```

## 🎓 Learning Path

1. **Week 1**: Deploy network infrastructure, understand VPC concepts
2. **Week 2**: Add RDS and ElastiCache, learn managed services
3. **Week 3**: Deploy EC2 instances, set up monitoring
4. **Week 4**: Add load balancer, implement auto-scaling

## 🔒 Security Best Practices

✅ Use Secrets Manager for credentials
✅ Security groups with least privilege
✅ Private subnets for databases
✅ Encrypted storage for RDS
✅ IAM roles instead of access keys
✅ Multi-AZ for production
✅ Regular backups enabled

## 🐛 Troubleshooting

### "AWS CLI not configured"
```bash
aws configure
# Enter your AWS Access Key ID, Secret Key, and region
```

### "jq: command not found"
```bash
sudo apt-get update && sudo apt-get install -y jq
```

### "VPC limit exceeded"
Check your VPC quota in AWS Console or request increase

### State file lost
Check `aws-deployment-state.json` - if lost, manually delete resources from AWS Console

## 📚 Next Steps

After successful deployment:
1. SSH into EC2 instance
2. Configure application environment
3. Set up CI/CD with Jenkins
4. Add SSL certificate with ACM
5. Configure Route53 for custom domain
6. Set up CloudWatch alarms
7. Implement auto-scaling

## 💡 Tips

- Start with `deploy.sh network` to test connectivity
- Use `terraform plan` to preview changes before applying
- Tag all resources for better cost tracking
- Enable MFA delete for production S3 buckets
- Use AWS Cost Explorer to monitor spending
