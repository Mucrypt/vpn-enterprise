# ============================================
# NETWORKING OUTPUTS
# ============================================

output "vpc_id" {
  description = "VPC ID"
  value       = module.networking.vpc_id
}

output "nat_gateway_ips" {
  description = "NAT Gateway public IPs"
  value       = module.networking.nat_gateway_ips
}

# ============================================
# DATABASE OUTPUTS
# ============================================

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.database.rds_endpoint
}

output "rds_secret_arn" {
  description = "ARN of the RDS secret in Secrets Manager"
  value       = module.database.rds_secret_arn
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = module.database.redis_endpoint
}

output "redis_secret_arn" {
  description = "ARN of the Redis secret in Secrets Manager"
  value       = module.database.redis_secret_arn
  sensitive   = true
}

# ============================================
# COMPUTE OUTPUTS
# ============================================

output "alb_url" {
  description = "URL to access the application"
  value       = module.compute.alb_url
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.compute.alb_dns_name
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = module.compute.autoscaling_group_name
}

# ============================================
# QUICK REFERENCE
# ============================================

output "quick_access" {
  description = "Quick access information"
  value = {
    application_url = module.compute.alb_url
    api_url         = "${module.compute.alb_url}/api"
    environment     = var.environment
    region          = var.aws_region
  }
}
