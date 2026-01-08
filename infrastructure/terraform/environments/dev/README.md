# Dev Environment

Development environment for VPN Enterprise.

## Configuration

- **Region**: eu-north-1 (Stockholm)
- **VPC CIDR**: 10.0.0.0/16
- **NAT**: Single NAT Gateway (cost optimization)
- **Cost**: ~$35/month

## Quick Deploy

### Prerequisites

1. **AWS Credentials** (ALREADY CONFIGURED ✅)
```bash
# Verify credentials are working
aws sts get-caller-identity

# If you need to set them again (don't commit these!):
# export AWS_ACCESS_KEY_ID=your_key_here
# export AWS_SECRET_ACCESS_KEY=your_secret_here
# export AWS_DEFAULT_REGION=eu-north-1
```

### Deploy Steps

```bash
# 1. Initialize Terraform
terraform init

# 2. Preview changes
terraform plan

# 3. Deploy (will ask for confirmation)
terraform apply

# 4. View outputs
terraform output
```

## What Gets Created?

- ✅ VPC with DNS enabled
- ✅ Internet Gateway
- ✅ 1x NAT Gateway (eu-north-1a)
- ✅ 2x Public subnets
- ✅ 2x Private app subnets  
- ✅ 2x Private DB subnets
- ✅ Route tables
- ✅ 4x Security groups (ALB, App, DB, Cache)

## Outputs

After deployment, get important values:

```bash
# All outputs
terraform output

# Specific output
terraform output vpc_id
terraform output nat_gateway_ips

# JSON format (for Ansible)
terraform output -json > ../../outputs/dev.json
```

## Cleanup

```bash
terraform destroy
```

## Next Steps

After networking is deployed:
1. Add database module (RDS + Redis)
2. Add compute module (EC2)
3. Add load balancer module (ALB)
4. Configure with Ansible
