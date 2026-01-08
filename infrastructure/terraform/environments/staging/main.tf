# ============================================
# VPN Enterprise - Staging Environment
# ============================================

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
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

# ============================================
# NETWORKING MODULE
# ============================================

module "networking" {
  source = "../../modules/networking"
  
  environment  = var.environment
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

# ============================================
# DATABASE MODULE
# ============================================

module "database" {
  source = "../../modules/database"
  
  environment  = var.environment
  project_name = "vpn-enterprise"
  
  # From networking module
  db_subnet_ids           = module.networking.private_db_subnet_ids
  db_security_group_id    = module.networking.db_security_group_id
  cache_security_group_id = module.networking.cache_security_group_id
  
  # RDS configuration (larger for staging)
  postgres_version          = "15.5"
  db_instance_class         = var.db_instance_class
  db_allocated_storage      = var.db_allocated_storage
  db_max_allocated_storage  = var.db_max_allocated_storage
  db_multi_az              = var.db_multi_az
  db_backup_retention_days = var.db_backup_retention_days
  
  # Redis configuration (multi-node for staging)
  redis_version                = "7.0"
  redis_node_type              = var.redis_node_type
  redis_num_cache_nodes        = var.redis_num_cache_nodes
  redis_snapshot_retention_days = var.redis_snapshot_retention_days
  
  tags = {
    Owner = "DevTeam"
  }
}

# ============================================
# COMPUTE MODULE
# ============================================

module "compute" {
  source = "../../modules/compute"
  
  environment  = var.environment
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
  
  # Compute configuration (Auto Scaling for staging)
  ami_id              = var.ami_id
  instance_type       = var.instance_type
  root_volume_size    = var.root_volume_size
  use_autoscaling     = var.use_autoscaling
  asg_min_size        = var.asg_min_size
  asg_max_size        = var.asg_max_size
  asg_desired_capacity = var.asg_desired_capacity
  
  aws_region = var.aws_region
  
  tags = {
    Owner = "DevTeam"
  }
}
