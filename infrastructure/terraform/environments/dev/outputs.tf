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

output "private_db_subnet_ids" {
  description = "Private DB subnet IDs"
  value       = module.networking.private_db_subnet_ids
}

output "app_security_group_id" {
  description = "Application security group ID"
  value       = module.networking.app_security_group_id
}

output "db_security_group_id" {
  description = "Database security group ID"
  value       = module.networking.db_security_group_id
}

output "cache_security_group_id" {
  description = "Cache security group ID"
  value       = module.networking.cache_security_group_id
}

output "nat_gateway_ips" {
  description = "NAT Gateway public IPs"
  value       = module.networking.nat_gateway_ips
}
