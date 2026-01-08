# ============================================
# LOAD BALANCER OUTPUTS
# ============================================

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "alb_url" {
  description = "URL to access the application"
  value       = "http://${aws_lb.main.dns_name}"
}

# ============================================
# TARGET GROUP OUTPUTS
# ============================================

output "web_target_group_arn" {
  description = "ARN of the web target group"
  value       = aws_lb_target_group.web.arn
}

output "api_target_group_arn" {
  description = "ARN of the API target group"
  value       = aws_lb_target_group.api.arn
}

# ============================================
# INSTANCE OUTPUTS
# ============================================

output "instance_ids" {
  description = "IDs of EC2 instances"
  value       = var.use_autoscaling ? [] : aws_instance.app[*].id
}

output "instance_private_ips" {
  description = "Private IP addresses of EC2 instances"
  value       = var.use_autoscaling ? [] : aws_instance.app[*].private_ip
}

# ============================================
# AUTO SCALING OUTPUTS
# ============================================

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = var.use_autoscaling ? aws_autoscaling_group.app[0].name : null
}

output "autoscaling_group_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = var.use_autoscaling ? aws_autoscaling_group.app[0].arn : null
}

# ============================================
# IAM OUTPUTS
# ============================================

output "iam_role_arn" {
  description = "ARN of the IAM role for EC2 instances"
  value       = aws_iam_role.ec2.arn
}

output "instance_profile_arn" {
  description = "ARN of the instance profile"
  value       = aws_iam_instance_profile.ec2.arn
}

# ============================================
# LAUNCH TEMPLATE OUTPUTS
# ============================================

output "launch_template_id" {
  description = "ID of the launch template"
  value       = aws_launch_template.app.id
}

output "launch_template_latest_version" {
  description = "Latest version of the launch template"
  value       = aws_launch_template.app.latest_version
}
