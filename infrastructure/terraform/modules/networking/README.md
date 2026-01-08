# Networking Module - VPN Enterprise

Creates VPC, subnets, NAT gateway, security groups for a complete network infrastructure.

## Usage

```hcl
module "networking" {
  source = "../../modules/networking"
  
  environment = "dev"
  vpc_cidr    = "10.0.0.0/16"
  azs         = ["us-east-1a", "us-east-1b"]
  
  public_subnet_cidrs      = ["10.0.1.0/24", "10.0.2.0/24"]
  private_app_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
  private_db_subnet_cidrs  = ["10.0.20.0/24", "10.0.21.0/24"]
  
  enable_nat_gateway = true
  single_nat_gateway = true  # Use false for HA across AZs
  
  tags = {
    Project     = "VPN Enterprise"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}
```

## Outputs

- `vpc_id` - VPC ID
- `public_subnet_ids` - List of public subnet IDs
- `private_app_subnet_ids` - List of private app subnet IDs
- `private_db_subnet_ids` - List of private database subnet IDs
- `alb_security_group_id` - Security group for ALB
- `app_security_group_id` - Security group for application servers
- `db_security_group_id` - Security group for databases

## Resources Created

- 1x VPC
- 1x Internet Gateway
- 1-2x NAT Gateway (depends on `single_nat_gateway`)
- 6x Subnets (2 public, 2 private app, 2 private db)
- 3x Route Tables
- 4x Security Groups (ALB, EC2, RDS, Redis)

## Cost

- VPC, Subnets, Security Groups: **FREE**
- Internet Gateway: **FREE**
- NAT Gateway: **~$32/month per AZ** (most expensive component!)
  - $0.045/hour = $32.85/month per NAT Gateway
  - Data processing: $0.045/GB
