# ============================================
# COMPUTE MODULE - VPN Enterprise
# ============================================
# Creates EC2 compute infrastructure:
# - Launch templates
# - EC2 instances or Auto Scaling Groups
# - IAM roles and instance profiles
# - User data for initialization
# - Elastic Load Balancer (ALB)

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ============================================
# IAM ROLE FOR EC2 INSTANCES
# ============================================

# IAM Role
resource "aws_iam_role" "ec2" {
  name = "${var.project_name}-${var.environment}-ec2-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-ec2-role"
    }
  )
}

# IAM Policy for Secrets Manager access
resource "aws_iam_role_policy" "secrets_manager" {
  name = "${var.project_name}-${var.environment}-secrets-access"
  role = aws_iam_role.ec2.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = var.secrets_arns
      }
    ]
  })
}

# IAM Policy for CloudWatch Logs
resource "aws_iam_role_policy" "cloudwatch_logs" {
  name = "${var.project_name}-${var.environment}-cloudwatch-logs"
  role = aws_iam_role.ec2.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Attach SSM policy for Systems Manager access
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2" {
  name = "${var.project_name}-${var.environment}-ec2-profile"
  role = aws_iam_role.ec2.name
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-ec2-profile"
    }
  )
}

# ============================================
# APPLICATION LOAD BALANCER
# ============================================

resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids
  
  enable_deletion_protection = var.environment == "prod"
  enable_http2              = true
  enable_cross_zone_load_balancing = true
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-alb"
    }
  )
}

# Target Group for Web Dashboard (port 3000)
resource "aws_lb_target_group" "web" {
  name     = "${var.project_name}-${var.environment}-web-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }
  
  deregistration_delay = 30
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-web-tg"
    }
  )
}

# Target Group for API (port 5000)
resource "aws_lb_target_group" "api" {
  name     = "${var.project_name}-${var.environment}-api-tg"
  port     = 5000
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }
  
  deregistration_delay = 30
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-api-tg"
    }
  )
}

# ALB Listener (HTTP) - redirects to HTTPS in production
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
  
  tags = var.tags
}

# ALB Listener Rule for API
resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100
  
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
  
  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
  
  tags = var.tags
}

# ============================================
# LAUNCH TEMPLATE
# ============================================

# User data script
locals {
  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    environment         = var.environment
    db_secret_arn      = var.db_secret_arn
    redis_secret_arn   = var.redis_secret_arn
    aws_region         = var.aws_region
  }))
}

resource "aws_launch_template" "app" {
  name_prefix   = "${var.project_name}-${var.environment}-"
  image_id      = var.ami_id
  instance_type = var.instance_type
  
  vpc_security_group_ids = [var.app_security_group_id]
  
  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2.arn
  }
  
  user_data = local.user_data
  
  block_device_mappings {
    device_name = "/dev/xvda"
    
    ebs {
      volume_size           = var.root_volume_size
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }
  
  monitoring {
    enabled = true
  }
  
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"  # IMDSv2 only
    http_put_response_hop_limit = 1
  }
  
  tag_specifications {
    resource_type = "instance"
    
    tags = merge(
      var.tags,
      {
        Name = "${var.project_name}-${var.environment}-app"
      }
    )
  }
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-launch-template"
    }
  )
}

# ============================================
# AUTO SCALING GROUP or EC2 INSTANCES
# ============================================

resource "aws_autoscaling_group" "app" {
  count = var.use_autoscaling ? 1 : 0
  
  name                = "${var.project_name}-${var.environment}-asg"
  vpc_zone_identifier = var.private_app_subnet_ids
  target_group_arns   = [aws_lb_target_group.web.arn, aws_lb_target_group.api.arn]
  
  min_size         = var.asg_min_size
  max_size         = var.asg_max_size
  desired_capacity = var.asg_desired_capacity
  
  health_check_type         = "ELB"
  health_check_grace_period = 300
  
  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }
  
  enabled_metrics = [
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupMaxSize",
    "GroupMinSize",
    "GroupPendingInstances",
    "GroupStandbyInstances",
    "GroupTerminatingInstances",
    "GroupTotalInstances"
  ]
  
  tag {
    key                 = "Name"
    value               = "${var.project_name}-${var.environment}-app"
    propagate_at_launch = true
  }
  
  dynamic "tag" {
    for_each = var.tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

# EC2 Instances (if not using Auto Scaling)
resource "aws_instance" "app" {
  count = var.use_autoscaling ? 0 : var.instance_count
  
  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }
  
  subnet_id = var.private_app_subnet_ids[count.index % length(var.private_app_subnet_ids)]
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-app-${count.index + 1}"
    }
  )
}

# Register instances with target groups (if not using ASG)
resource "aws_lb_target_group_attachment" "web" {
  count = var.use_autoscaling ? 0 : var.instance_count
  
  target_group_arn = aws_lb_target_group.web.arn
  target_id        = aws_instance.app[count.index].id
  port             = 3000
}

resource "aws_lb_target_group_attachment" "api" {
  count = var.use_autoscaling ? 0 : var.instance_count
  
  target_group_arn = aws_lb_target_group.api.arn
  target_id        = aws_instance.app[count.index].id
  port             = 5000
}

# ============================================
# AUTO SCALING POLICIES
# ============================================

# Scale up policy
resource "aws_autoscaling_policy" "scale_up" {
  count = var.use_autoscaling ? 1 : 0
  
  name                   = "${var.project_name}-${var.environment}-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.app[0].name
}

# Scale down policy
resource "aws_autoscaling_policy" "scale_down" {
  count = var.use_autoscaling ? 1 : 0
  
  name                   = "${var.project_name}-${var.environment}-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.app[0].name
}

# CloudWatch Alarm - High CPU (triggers scale up)
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  count = var.use_autoscaling ? 1 : 0
  
  alarm_name          = "${var.project_name}-${var.environment}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app[0].name
  }
  
  alarm_actions = [aws_autoscaling_policy.scale_up[0].arn]
  
  tags = var.tags
}

# CloudWatch Alarm - Low CPU (triggers scale down)
resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  count = var.use_autoscaling ? 1 : 0
  
  alarm_name          = "${var.project_name}-${var.environment}-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "20"
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app[0].name
  }
  
  alarm_actions = [aws_autoscaling_policy.scale_down[0].arn]
  
  tags = var.tags
}
