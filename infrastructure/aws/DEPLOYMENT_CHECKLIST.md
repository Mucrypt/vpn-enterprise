# AWS Deployment Checklist

Use this checklist to track your AWS deployment progress and ensure nothing is missed.

## 📋 Pre-Deployment (5-10 minutes)

- [ ] **AWS Account Setup**
  - [ ] Have an active AWS account
  - [ ] Billing alerts configured
  - [ ] Free tier monitoring enabled
  
- [ ] **Local Tools Installation**
  ```bash
  # Check AWS CLI
  aws --version  # Should show version 2.x
  
  # Check jq
  jq --version   # Should show version 1.5 or higher
  
  # Check Terraform (optional)
  terraform version  # Should show version 1.x
  ```

- [ ] **AWS CLI Configuration**
  ```bash
  aws configure
  # AWS Access Key ID: [Enter your key]
  # AWS Secret Access Key: [Enter your secret]
  # Default region name: us-east-1
  # Default output format: json
  ```

- [ ] **Verify AWS Credentials**
  ```bash
  aws sts get-caller-identity
  # Should show your Account ID and User ARN
  ```

- [ ] **EC2 Key Pair (for SSH access)**
  ```bash
  # Check existing keys
  aws ec2 describe-key-pairs
  
  # Or create a new one
  aws ec2 create-key-pair \
    --key-name vpn-enterprise-key \
    --query 'KeyMaterial' \
    --output text > ~/.ssh/vpn-enterprise-key.pem
  chmod 400 ~/.ssh/vpn-enterprise-key.pem
  ```

## 🌐 Phase 1: Network Infrastructure (30 minutes)

- [ ] **Run Network Deployment**
  ```bash
  cd /home/mukulah/vpn-enterprise/infrastructure/aws
  ./deploy.sh network
  ```

- [ ] **Verify Network Resources Created**
  - [ ] VPC created (10.0.0.0/16)
  - [ ] Internet Gateway attached
  - [ ] 2 Public Subnets created (us-east-1a, us-east-1b)
  - [ ] 2 Private App Subnets created
  - [ ] 2 Private DB Subnets created
  - [ ] NAT Gateway created (takes ~5 min)
  - [ ] Route tables configured
  - [ ] 4 Security Groups created (ALB, EC2, RDS, Redis)

- [ ] **Check State File**
  ```bash
  cat aws-deployment-state.json | jq
  # Should contain: vpc_id, igw_id, subnet IDs, security group IDs
  ```

- [ ] **Verify in AWS Console**
  - [ ] VPC Dashboard shows new VPC
  - [ ] Subnets show 6 subnets total
  - [ ] NAT Gateway status: Available
  - [ ] Security Groups show 4 groups

**Checkpoint**: Network infrastructure ready! Take a screenshot of your VPC dashboard.

## 🗄️ Phase 2: Data Layer (30-40 minutes)

- [ ] **Run Data Layer Deployment**
  ```bash
  ./deploy.sh data
  ```

- [ ] **Monitor RDS Creation (5-10 minutes)**
  ```bash
  # Watch RDS status
  watch -n 10 'aws rds describe-db-instances \
    --db-instance-identifier vpn-enterprise-db \
    --query "DBInstances[0].DBInstanceStatus"'
  ```

- [ ] **Monitor ElastiCache Creation (3-5 minutes)**
  ```bash
  # Watch Redis status
  watch -n 10 'aws elasticache describe-cache-clusters \
    --cache-cluster-id vpn-enterprise-redis \
    --query "CacheClusters[0].CacheClusterStatus"'
  ```

- [ ] **Verify Data Resources Created**
  - [ ] RDS PostgreSQL instance: Available
  - [ ] ElastiCache Redis: Available
  - [ ] DB Subnet Group created
  - [ ] Cache Subnet Group created
  - [ ] 4 Secrets in Secrets Manager

- [ ] **Get Database Endpoints**
  ```bash
  # RDS Endpoint
  aws rds describe-db-instances \
    --db-instance-identifier vpn-enterprise-db \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text
  
  # Redis Endpoint
  aws elasticache describe-cache-clusters \
    --cache-cluster-id vpn-enterprise-redis \
    --show-cache-node-info \
    --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
    --output text
  ```

- [ ] **Test Database Connectivity** (later, from EC2)

**Checkpoint**: Data layer ready! Save your endpoints in a notes file.

## 🚀 Phase 3: Application Deployment (45-60 minutes)

### A. IAM Setup

- [ ] **Create IAM Role for EC2**
  ```bash
  # Create trust policy
  cat > /tmp/ec2-trust-policy.json <<'EOF'
  {
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }
  EOF
  
  # Create role
  aws iam create-role \
    --role-name vpn-enterprise-ec2-role \
    --assume-role-policy-document file:///tmp/ec2-trust-policy.json
  ```

- [ ] **Attach Policies to Role**
  ```bash
  # For Secrets Manager access
  aws iam put-role-policy \
    --role-name vpn-enterprise-ec2-role \
    --policy-name SecretsManagerAccess \
    --policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Action": [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ],
        "Resource": "arn:aws:secretsmanager:*:*:secret:vpn-enterprise/*"
      }]
    }'
  
  # Create instance profile
  aws iam create-instance-profile \
    --instance-profile-name vpn-enterprise-ec2-profile
  
  aws iam add-role-to-instance-profile \
    --instance-profile-name vpn-enterprise-ec2-profile \
    --role-name vpn-enterprise-ec2-role
  ```

### B. EC2 Launch

- [ ] **Get Latest Amazon Linux 2023 AMI**
  ```bash
  AMI_ID=$(aws ec2 describe-images \
    --owners amazon \
    --filters "Name=name,Values=al2023-ami-2023*" \
              "Name=architecture,Values=x86_64" \
    --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
    --output text)
  echo "Using AMI: $AMI_ID"
  ```

- [ ] **Get Resource IDs from State**
  ```bash
  EC2_SG=$(jq -r '.ec2_sg' aws-deployment-state.json)
  PRIVATE_SUBNET=$(jq -r '.private_app_subnet_1' aws-deployment-state.json)
  echo "EC2 SG: $EC2_SG"
  echo "Subnet: $PRIVATE_SUBNET"
  ```

- [ ] **Launch EC2 Instance**
  ```bash
  INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --instance-type t3.medium \
    --key-name vpn-enterprise-key \
    --security-group-ids $EC2_SG \
    --subnet-id $PRIVATE_SUBNET \
    --iam-instance-profile Name=vpn-enterprise-ec2-profile \
    --user-data file://ec2-user-data.sh \
    --block-device-mappings '[{
      "DeviceName":"/dev/xvda",
      "Ebs":{"VolumeSize":30,"VolumeType":"gp3"}
    }]' \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=vpn-enterprise-app}]' \
    --query 'Instances[0].InstanceId' \
    --output text)
  
  echo "Instance launched: $INSTANCE_ID"
  jq --arg id "$INSTANCE_ID" '.ec2_instance_id = $id' \
    aws-deployment-state.json > aws-deployment-state.json.tmp && \
    mv aws-deployment-state.json.tmp aws-deployment-state.json
  ```

- [ ] **Wait for Instance to be Running**
  ```bash
  aws ec2 wait instance-running --instance-ids $INSTANCE_ID
  echo "✅ Instance is running!"
  ```

- [ ] **Get Instance Private IP**
  ```bash
  PRIVATE_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PrivateIpAddress' \
    --output text)
  echo "Private IP: $PRIVATE_IP"
  ```

**Checkpoint**: EC2 instance running! Check system logs in AWS Console.

## ⚖️ Phase 4: Load Balancer (30 minutes)

- [ ] **Create Application Load Balancer**
  ```bash
  ALB_SG=$(jq -r '.alb_sg' aws-deployment-state.json)
  PUBLIC_SUBNET_1=$(jq -r '.public_subnet_1' aws-deployment-state.json)
  PUBLIC_SUBNET_2=$(jq -r '.public_subnet_2' aws-deployment-state.json)
  
  ALB_ARN=$(aws elbv2 create-load-balancer \
    --name vpn-enterprise-alb \
    --subnets $PUBLIC_SUBNET_1 $PUBLIC_SUBNET_2 \
    --security-groups $ALB_SG \
    --scheme internet-facing \
    --type application \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)
  
  echo "ALB created: $ALB_ARN"
  ```

- [ ] **Create Target Group for Web**
  ```bash
  VPC_ID=$(jq -r '.vpc_id' aws-deployment-state.json)
  
  WEB_TG_ARN=$(aws elbv2 create-target-group \
    --name vpn-enterprise-web-tg \
    --protocol HTTP \
    --port 3000 \
    --vpc-id $VPC_ID \
    --health-check-enabled \
    --health-check-path / \
    --health-check-interval-seconds 30 \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)
  ```

- [ ] **Register EC2 Instance**
  ```bash
  aws elbv2 register-targets \
    --target-group-arn $WEB_TG_ARN \
    --targets Id=$INSTANCE_ID
  ```

- [ ] **Create Listener**
  ```bash
  aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$WEB_TG_ARN
  ```

- [ ] **Get ALB DNS Name**
  ```bash
  ALB_DNS=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns $ALB_ARN \
    --query 'LoadBalancers[0].DNSName' \
    --output text)
  
  echo "🌐 Access your app at: http://$ALB_DNS"
  ```

- [ ] **Wait for Target Health Check** (2-3 minutes)
  ```bash
  watch -n 5 'aws elbv2 describe-target-health \
    --target-group-arn $WEB_TG_ARN'
  # Wait until TargetHealth.State = "healthy"
  ```

**Checkpoint**: Load balancer configured! Try accessing the ALB DNS in your browser.

## 📊 Phase 5: Monitoring (20 minutes)

- [ ] **Create CloudWatch Log Group**
  ```bash
  aws logs create-log-group \
    --log-group-name /vpn-enterprise/application
  
  aws logs create-log-stream \
    --log-group-name /vpn-enterprise/application \
    --log-stream-name web-dashboard
  ```

- [ ] **Create CloudWatch Alarms**
  ```bash
  # High CPU alarm
  aws cloudwatch put-metric-alarm \
    --alarm-name vpn-enterprise-high-cpu \
    --alarm-description "Alert when CPU exceeds 80%" \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=InstanceId,Value=$INSTANCE_ID \
    --evaluation-periods 2
  
  # Low storage alarm
  aws cloudwatch put-metric-alarm \
    --alarm-name vpn-enterprise-low-storage \
    --alarm-description "Alert when RDS storage is low" \
    --metric-name FreeStorageSpace \
    --namespace AWS/RDS \
    --statistic Average \
    --period 300 \
    --threshold 2000000000 \
    --comparison-operator LessThanThreshold \
    --dimensions Name=DBInstanceIdentifier,Value=vpn-enterprise-db \
    --evaluation-periods 1
  ```

- [ ] **Set Up Billing Alarm** (Important!)
  ```bash
  # Create SNS topic for billing alerts
  aws sns create-topic --name billing-alerts
  
  # Subscribe your email
  aws sns subscribe \
    --topic-arn arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:billing-alerts \
    --protocol email \
    --notification-endpoint your-email@example.com
  
  # Create billing alarm
  aws cloudwatch put-metric-alarm \
    --alarm-name billing-alert-$50 \
    --alarm-description "Alert when charges exceed $50" \
    --metric-name EstimatedCharges \
    --namespace AWS/Billing \
    --statistic Maximum \
    --period 21600 \
    --threshold 50 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 1
  ```

## ✅ Verification & Testing (15 minutes)

- [ ] **Test Web Access**
  ```bash
  curl -I http://$ALB_DNS
  # Should return HTTP 200 OK
  ```

- [ ] **SSH into EC2** (from bastion or via SSM)
  ```bash
  # Get instance public IP (if in public subnet)
  # Or use AWS Systems Manager Session Manager
  aws ssm start-session --target $INSTANCE_ID
  ```

- [ ] **Check Application Logs**
  ```bash
  sudo tail -f /var/log/user-data.log
  sudo docker ps
  sudo docker logs vpn-enterprise-web-dev
  ```

- [ ] **Test Database Connection**
  ```bash
  # From EC2 instance
  RDS_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier vpn-enterprise-db \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)
  
  DB_PASSWORD=$(aws secretsmanager get-secret-value \
    --secret-id vpn-enterprise/db-password \
    --query SecretString --output text)
  
  # Test connection
  nc -zv $RDS_ENDPOINT 5432
  ```

- [ ] **Check CloudWatch Metrics**
  - [ ] EC2 CPU utilization visible
  - [ ] RDS metrics showing
  - [ ] ALB request count increasing

- [ ] **Verify All Services Running**
  ```bash
  # From EC2
  curl localhost:3000  # Web Dashboard
  curl localhost:5000/health  # API
  curl localhost:5001/health  # Python API
  ```

## 📸 Documentation

- [ ] **Take Screenshots**
  - [ ] VPC Dashboard
  - [ ] EC2 Running Instances
  - [ ] RDS Databases
  - [ ] Load Balancer
  - [ ] CloudWatch Dashboard

- [ ] **Save Configuration**
  ```bash
  # Export deployment state
  ./deploy.sh summary > deployment-summary.txt
  
  # Save endpoints
  echo "ALB DNS: $ALB_DNS" >> endpoints.txt
  echo "RDS Endpoint: $RDS_ENDPOINT" >> endpoints.txt
  ```

## 🎓 Post-Deployment Learning

- [ ] **Read AWS Documentation**
  - [ ] VPC User Guide
  - [ ] RDS Best Practices
  - [ ] ALB Guide

- [ ] **Understand Your Architecture**
  - [ ] Can you explain the traffic flow?
  - [ ] Where are the security boundaries?
  - [ ] What happens if one AZ fails?

- [ ] **Cost Optimization**
  - [ ] Set up AWS Cost Explorer
  - [ ] Review billing dashboard daily
  - [ ] Identify unused resources

## 🧹 Cleanup (When Done Testing)

- [ ] **Stop Services (Saves Money)**
  ```bash
  # Stop EC2 (not terminate)
  aws ec2 stop-instances --instance-ids $INSTANCE_ID
  
  # Modify RDS to stop automatically
  aws rds stop-db-instance --db-instance-identifier vpn-enterprise-db
  ```

- [ ] **Full Cleanup (Delete Everything)**
  ```bash
  # ⚠️ WARNING: This deletes ALL resources
  ./cleanup.sh
  # Type 'DELETE' to confirm
  ```

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't access ALB DNS | Check security groups, target health |
| EC2 won't start | Check user-data logs, IAM role |
| RDS connection timeout | Verify security group, EC2 in right subnet |
| High costs | Stop unused resources, check billing |
| SSH connection refused | Check key pair, security group rules |

## 📞 Support

- AWS Support: https://console.aws.amazon.com/support
- AWS Forums: https://forums.aws.amazon.com
- Documentation: https://docs.aws.amazon.com

---

## 🎉 Success Criteria

You've successfully deployed when:
- ✅ Can access web dashboard via ALB DNS
- ✅ API responds to health checks
- ✅ Database connections work
- ✅ CloudWatch shows metrics
- ✅ All target groups healthy
- ✅ No billing surprises

**Congratulations!** You've deployed a production-ready infrastructure on AWS! 🚀
