# Compute Module

Manages compute infrastructure (EC2 instances and Application Load Balancer) for VPN Enterprise.

## Features

- **Application Load Balancer**: Distributes traffic across instances
- **EC2 Instances** or **Auto Scaling Group**: Flexible deployment options
- **Launch Templates**: Standardized instance configuration
- **IAM Roles**: Secure access to AWS services
- **User Data**: Automated instance bootstrapping
- **CloudWatch Monitoring**: Instance and application metrics
- **Systems Manager**: Remote access without SSH keys

## Resources Created

### Load Balancer
- Application Load Balancer (ALB)
- Target groups for web (port 3000) and API (port 5000)
- HTTP listener with path-based routing
- Health checks for both services

### Compute
- Launch template with encrypted EBS volumes
- EC2 instances OR Auto Scaling Group
- IAM role with Secrets Manager and CloudWatch access
- Auto Scaling policies (if using ASG)

### Monitoring
- CloudWatch alarms for CPU utilization
- CloudWatch Logs for application logs
- Auto Scaling metrics

## Usage

```hcl
module "compute" {
  source = "../../modules/compute"
  
  environment  = "dev"
  project_name = "vpn-enterprise"
  
  # From networking module
  vpc_id                 = module.networking.vpc_id
  public_subnet_ids      = module.networking.public_subnet_ids
  private_app_subnet_ids = module.networking.private_app_subnet_ids
  alb_security_group_id  = module.networking.alb_security_group_id
  app_security_group_id  = module.networking.app_security_group_id
  
  # From database module
  db_secret_arn    = module.database.rds_secret_arn
  redis_secret_arn = module.database.redis_secret_arn
  secrets_arns     = [
    module.database.rds_secret_arn,
    module.database.redis_secret_arn
  ]
  
  # Compute configuration
  instance_type    = "t3.micro"
  use_autoscaling  = false
  instance_count   = 2
  
  aws_region = "eu-north-1"
  
  tags = {
    Owner = "DevTeam"
  }
}
```

## Deployment Options

### Option 1: Fixed Instances (Development)
```hcl
use_autoscaling = false
instance_count  = 2
```
- Simple deployment
- Fixed number of instances
- Lower cost
- Good for dev/staging

### Option 2: Auto Scaling (Production)
```hcl
use_autoscaling     = true
asg_min_size        = 2
asg_max_size        = 6
asg_desired_capacity = 2
```
- Automatic scaling based on CPU
- High availability
- Handles traffic spikes
- Recommended for production

## Environment-Specific Configurations

### Dev
- t3.micro (2 vCPU, 1 GB RAM)
- 2 instances
- No Auto Scaling
- **Cost**: ~€16/month (2 instances)

### Staging
- t3.small (2 vCPU, 2 GB RAM)
- Auto Scaling: 2-4 instances
- **Cost**: ~€40-80/month

### Production
- t3.medium (2 vCPU, 4 GB RAM)
- Auto Scaling: 2-6 instances
- Deletion protection enabled
- **Cost**: ~€120-360/month

## Application Deployment

The user data script automatically:
1. ✅ Updates system packages
2. ✅ Installs Docker, Node.js, AWS CLI
3. ✅ Fetches database credentials from Secrets Manager
4. ✅ Creates application environment file
5. ✅ Starts simple health check server
6. ✅ Configures CloudWatch Logs agent
7. ✅ Sets up log rotation

### Customize Application Deployment

Edit `user-data.sh` to deploy your actual application:

```bash
# Replace the placeholder with:
git clone https://github.com/your-org/vpn-enterprise.git /opt/vpn-enterprise
cd /opt/vpn-enterprise

# Install dependencies
npm install

# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
```

## Accessing Instances

### Via Systems Manager (Recommended)
```bash
# List instances
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=vpn-enterprise-dev-app-*" \
  --query "Reservations[].Instances[].[InstanceId,PrivateIpAddress,State.Name]"

# Connect via SSM (no SSH keys needed!)
aws ssm start-session --target <instance-id>
```

### Via SSH (if needed)
```bash
# Update security group to allow your IP
# Then connect
ssh -i your-key.pem ec2-user@<private-ip>
```

## Load Balancer Configuration

### Endpoints
- **Web Dashboard**: `http://<alb-dns>/`
- **API**: `http://<alb-dns>/api/*`

### Health Checks
- Web: `GET / HTTP/1.1` (port 3000)
- API: `GET /health HTTP/1.1` (port 5000)
- Interval: 30 seconds
- Healthy threshold: 2 consecutive successes
- Unhealthy threshold: 3 consecutive failures

## Monitoring

### CloudWatch Metrics
View in AWS Console:
```
https://console.aws.amazon.com/cloudwatch/home?region=eu-north-1#metricsV2:
```

Metrics collected:
- CPU Utilization (per instance)
- Memory Usage (custom metric)
- Disk Usage (custom metric)
- Network In/Out
- Target Health (ALB)

### CloudWatch Logs
Logs stored in:
- `/aws/ec2/vpn-enterprise/{environment}/user-data` - Bootstrap logs
- `/aws/ec2/vpn-enterprise/{environment}/application` - App logs

View logs:
```bash
aws logs tail /aws/ec2/vpn-enterprise/dev/application --follow
```

### Auto Scaling Alarms (if enabled)
- **Scale Up**: CPU > 70% for 4 minutes
- **Scale Down**: CPU < 20% for 4 minutes

## Security Features

✅ **IAM Roles**
- No hardcoded credentials
- Secrets Manager access only
- CloudWatch Logs access
- SSM access for remote management

✅ **Network Security**
- Instances in private subnets
- ALB in public subnets
- Security groups restrict traffic

✅ **Instance Security**
- IMDSv2 enforced (metadata protection)
- Encrypted EBS volumes
- No SSH keys required (use SSM)
- Regular security updates via user data

## Cost Optimization

### Tips
1. Use Spot Instances for non-critical workloads
2. Right-size instances based on actual usage
3. Use Reserved Instances for production (save up to 70%)
4. Enable Auto Scaling to scale down during off-hours

### Cost Breakdown
**Dev (2x t3.micro)**:
- Instances: €0.0114/hour × 2 × 730 hours = €16.65/month
- ALB: €19.71/month
- Data transfer: ~€5/month
- **Total**: ~€41/month

## Troubleshooting

### Instance Won't Start
```bash
# Check user data logs
aws ssm start-session --target <instance-id>
sudo tail -f /var/log/user-data.log
```

### Health Check Failing
```bash
# Connect to instance
aws ssm start-session --target <instance-id>

# Check if application is running
sudo pm2 list

# Check application logs
sudo pm2 logs

# Test health endpoint locally
curl http://localhost:3000/health
```

### Can't Access Load Balancer
```bash
# Check ALB status
aws elbv2 describe-load-balancers \
  --names vpn-enterprise-dev-alb

# Check target health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>
```

### Secrets Manager Access Denied
```bash
# Check IAM role attached to instance
aws ec2 describe-instances \
  --instance-ids <instance-id> \
  --query "Reservations[].Instances[].IamInstanceProfile"

# Check if role has correct policy
aws iam get-role-policy \
  --role-name vpn-enterprise-dev-ec2-role \
  --policy-name vpn-enterprise-dev-secrets-access
```

## AMI Selection

The module uses Amazon Linux 2023 by default. Update `ami_id` variable for your region:

### Common Regions
- **eu-north-1** (Stockholm): `ami-07c8c1b18ca66bb07`
- **us-east-1** (N. Virginia): `ami-0c02fb55b1a5d8f8e`
- **eu-west-1** (Ireland): `ami-0694d931cee176e7d`

Find latest AMIs:
```bash
aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=al2023-ami-2023*" \
  --query "Images | sort_by(@, &CreationDate) | [-1].[ImageId,Name]"
```

## Outputs

After deployment, access your application:

```bash
# Get load balancer URL
terraform output alb_url

# Open in browser
open $(terraform output -raw alb_url)

# Get instance IDs (if not using ASG)
terraform output instance_ids
```

## Integration with Ansible

Export Terraform outputs for Ansible:

```bash
terraform output -json > ../../../ansible/inventory/compute_outputs.json
```

Use in Ansible inventory:
```yaml
all:
  hosts:
    {% for instance in compute_outputs.instance_ids %}
    - {{ instance }}
    {% endfor %}
```
