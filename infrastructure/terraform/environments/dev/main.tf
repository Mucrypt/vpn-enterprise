# ============================================
# VPN Enterprise - Dev Environment
# ============================================

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
