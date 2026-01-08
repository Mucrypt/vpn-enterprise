# Terraform Setup Guide - Get Started in 10 Minutes

Quick setup guide to get your Terraform environment ready.

## ✅ Prerequisites Check

```bash
# 1. AWS CLI configured (✅ You have this!)
aws --version
aws sts get-caller-identity

# 2. Install Terraform
terraform version  # If not installed, see below
```

## 📥 Install Terraform (if needed)

```bash
# Download latest Terraform
cd /tmp
wget https://releases.hashicorp.com/terraform/1.6.6/terraform_1.6.6_linux_amd64.zip

# Extract
unzip terraform_1.6.6_linux_amd64.zip

# Move to PATH
sudo mv terraform /usr/local/bin/

# Verify
terraform version

# Clean up
rm terraform_1.6.6_linux_amd64.zip
```

## 🚀 Quick Start - Deploy Dev Environment

### Step 1: Understand the Structure

```
infrastructure/terraform/
├── modules/              # Reusable components
│   └── networking/      # ✅ Already created!
├── environments/        # Where you work
│   ├── dev/            # ⬅️ Start here
│   ├── staging/
│   └── prod/
└── README.md
```

### Step 2: Create Dev Environment

```bash
cd /home/mukulah/vpn-enterprise/infrastructure/terraform

# Create dev environment directory
mkdir -p environments/dev
cd environments/dev
```

### Step 3: Create Configuration Files

Create `main.tf`:
```hcl
# Configure AWS provider
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "VPN Enterprise"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Use networking module
module "networking" {
  source = "../../modules/networking"
  
  environment = var.environment
  project_name = "vpn-enterprise"
  
  vpc_cidr = var.vpc_cidr
  azs      = var.availability_zones
  
  public_subnet_cidrs      = var.public_subnet_cidrs
  private_app_subnet_cidrs = var.private_app_subnet_cidrs
  private_db_subnet_cidrs  = var.private_db_subnet_cidrs
  
  enable_nat_gateway = var.enable_nat_gateway
  single_nat_gateway = var.single_nat_gateway
  
  allowed_ssh_cidrs = [var.my_ip]
  
  tags = {
    Owner = "DevTeam"
  }
}
```

Create `variables.tf`:
```hcl
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDRs"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_app_subnet_cidrs" {
  description = "Private app subnet CIDRs"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "private_db_subnet_cidrs" {
  description = "Private DB subnet CIDRs"
  type        = list(string)
  default     = ["10.0.20.0/24", "10.0.21.0/24"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use single NAT Gateway (cost savings)"
  type        = bool
  default     = true
}

variable "my_ip" {
  description = "Your IP for SSH access"
  type        = string
}
```

Create `outputs.tf`:
```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = module.networking.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.networking.public_subnet_ids
}

output "private_app_subnet_ids" {
  description = "Private app subnet IDs"
  value       = module.networking.private_app_subnet_ids
}

output "app_security_group_id" {
  description = "Application security group ID"
  value       = module.networking.app_security_group_id
}

output "nat_gateway_ips" {
  description = "NAT Gateway public IPs"
  value       = module.networking.nat_gateway_ips
}
```

Create `terraform.tfvars`:
```hcl
# Get your IP: curl https://checkip.amazonaws.com
my_ip = "YOUR_IP_HERE/32"

# Dev configuration
environment = "dev"
aws_region  = "us-east-1"

# Network settings
vpc_cidr = "10.0.0.0/16"

# Cost savings for dev
single_nat_gateway = true
```

### Step 4: Deploy!

```bash
# Get your IP
MY_IP=$(curl -s https://checkip.amazonaws.com)
echo "Your IP: $MY_IP"

# Update terraform.tfvars
sed -i "s/YOUR_IP_HERE/$MY_IP/" terraform.tfvars

# Initialize Terraform
terraform init

# Preview what will be created
terraform plan

# Create the infrastructure
terraform apply
```

### Step 5: Verify

```bash
# Show outputs
terraform output

# Check AWS Console
# Go to VPC Dashboard and see your new VPC!
```

## 🎯 What Gets Created?

With just the networking module:

✅ 1x VPC (10.0.0.0/16)  
✅ 1x Internet Gateway  
✅ 1x NAT Gateway  
✅ 6x Subnets (2 public, 2 private app, 2 private db)  
✅ 3x Route Tables  
✅ 4x Security Groups (ALB, EC2, RDS, Redis)  

**Cost**: ~$35/month (NAT Gateway is the only paid component)

## 🧹 Cleanup

When done testing:

```bash
terraform destroy
```

## 🔄 What's Next?

Now that you have networking:

1. **Add Database Module**: RDS + ElastiCache
2. **Add Compute Module**: EC2 instances
3. **Add Load Balancer**: ALB for traffic distribution
4. **Create Staging**: Copy to `environments/staging`
5. **Configure with Ansible**: Install software on EC2

## 📚 Learning Resources

1. Read: `LEARNING_GUIDE.md` - Detailed explanations
2. Practice: `terraform plan` - See what changes
3. Experiment: Modify variables, re-apply
4. Explore: AWS Console - See created resources

## 🆘 Troubleshooting

### "command not found: terraform"
- Install Terraform (see above)

### "Error: No valid credential sources"
- Run `aws configure`

### "my_ip" variable not set
- Update `terraform.tfvars` with your IP

### "VPC limit exceeded"
- Delete old VPCs or request limit increase

## 🎓 Next Steps

After successful deployment:

```bash
# 1. View your infrastructure
terraform show

# 2. Export outputs for Ansible
terraform output -json > ../../../ansible/inventory/terraform_outputs.json

# 3. Continue to Ansible setup
cd ../../../ansible
cat README.md
```

---

**Congratulations!** You've just deployed infrastructure with Terraform! 🎉

Now you understand:
- ✅ Terraform modules
- ✅ Variables and outputs
- ✅ Multi-file organization
- ✅ Real AWS resource creation

**Next**: Add more modules (database, compute) or configure servers with Ansible!
