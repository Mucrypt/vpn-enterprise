# Database Module

Manages database infrastructure for VPN Enterprise.

## Features

- **RDS PostgreSQL**: Managed relational database
- **ElastiCache Redis**: Managed in-memory cache
- **Secrets Manager**: Secure credential storage
- **CloudWatch Alarms**: Monitoring and alerting
- **Automated Backups**: Daily backups with retention
- **Encryption**: At-rest and in-transit encryption

## Resources Created

### RDS PostgreSQL
- DB instance with configurable size
- DB subnet group (Multi-AZ)
- Parameter group with logging enabled
- Automated backups
- CloudWatch alarms for CPU and storage

### ElastiCache Redis
- Replication group with configurable nodes
- Subnet group
- Parameter group with LRU eviction
- Auth token for security
- CloudWatch alarms for CPU and memory

### Security
- Passwords stored in AWS Secrets Manager
- Encryption at rest
- Encryption in transit (TLS)
- Restricted security groups

## Usage

```hcl
module "database" {
  source = "../../modules/database"
  
  environment  = "dev"
  project_name = "vpn-enterprise"
  
  # From networking module
  db_subnet_ids          = module.networking.private_db_subnet_ids
  db_security_group_id   = module.networking.db_security_group_id
  cache_security_group_id = module.networking.cache_security_group_id
  
  # RDS configuration
  db_instance_class        = "db.t3.micro"
  db_allocated_storage     = 20
  db_multi_az             = false
  db_backup_retention_days = 7
  
  # Redis configuration
  redis_node_type         = "cache.t3.micro"
  redis_num_cache_nodes   = 1
  redis_snapshot_retention_days = 5
  
  tags = {
    Owner = "DevTeam"
  }
}
```

## Outputs

Access database endpoints and credentials:

```hcl
# RDS
output "database_endpoint" {
  value = module.database.rds_endpoint
}

output "database_secret" {
  value = module.database.rds_secret_arn
}

# Redis
output "redis_endpoint" {
  value = module.database.redis_endpoint
}

output "redis_secret" {
  value = module.database.redis_secret_arn
}
```

## Environment-Specific Configurations

### Dev
- db.t3.micro (1 vCPU, 1 GB RAM)
- cache.t3.micro (2 vCPU, 0.5 GB RAM)
- Single AZ
- 7-day backups
- **Cost**: ~€15/month RDS + €12/month Redis = €27/month

### Staging
- db.t3.small (2 vCPU, 2 GB RAM)
- cache.t3.small (2 vCPU, 1.55 GB RAM)
- Multi-AZ
- 14-day backups
- **Cost**: ~€40/month RDS + €30/month Redis = €70/month

### Production
- db.t3.medium (2 vCPU, 4 GB RAM)
- cache.t3.medium (2 vCPU, 3.09 GB RAM)
- Multi-AZ with automatic failover
- 30-day backups
- Deletion protection
- **Cost**: ~€80/month RDS + €60/month Redis = €140/month

## Accessing Credentials

Credentials are stored in AWS Secrets Manager:

```bash
# Get RDS password
aws secretsmanager get-secret-value \
  --secret-id vpn-enterprise-dev-db-password \
  --query SecretString \
  --output text | jq -r '.password'

# Get Redis auth token
aws secretsmanager get-secret-value \
  --secret-id vpn-enterprise-dev-redis-auth-token \
  --query SecretString \
  --output text | jq -r '.auth_token'
```

## Connecting to Databases

### PostgreSQL
```bash
# Get connection details
terraform output rds_endpoint

# Connect via psql
psql "postgresql://dbadmin:<password>@<endpoint>/vpnenterprise"
```

### Redis
```bash
# Get connection details
terraform output redis_endpoint

# Connect via redis-cli
redis-cli -h <endpoint> -p 6379 --tls --askpass
```

## Monitoring

CloudWatch alarms created:
- RDS CPU > 80% for 10 minutes
- RDS Free Storage < 5 GB
- Redis CPU > 75% for 10 minutes
- Redis Memory > 80%

View in AWS Console:
```
https://console.aws.amazon.com/cloudwatch/home?region=eu-north-1#alarmsV2:
```

## Backup & Recovery

### RDS Backups
- Automated daily backups during backup window (3-4 AM UTC)
- Point-in-time recovery enabled
- Retention: 7 days (dev), 14 days (staging), 30 days (prod)

### Redis Snapshots
- Daily snapshots during snapshot window (2-3 AM UTC)
- Retention: 5 days (dev), 7 days (staging), 14 days (prod)

## Maintenance

- RDS maintenance window: Monday 4-5 AM UTC
- Redis maintenance window: Sunday 3-4 AM UTC

## Security Features

✅ **Encryption**
- At-rest encryption (AWS KMS)
- In-transit encryption (TLS)

✅ **Network Security**
- Deployed in private subnets
- Security groups restrict access to app tier only
- No public access

✅ **Credential Management**
- Auto-generated strong passwords
- Stored in Secrets Manager
- Automatic rotation support

✅ **Audit Logging**
- RDS query logging enabled
- CloudWatch Logs integration

## Cost Optimization

### Dev Environment
- Use smallest instance sizes
- Single AZ deployment
- Shorter backup retention

### Savings Tips
1. Stop RDS instances when not in use (dev only)
2. Use Reserved Instances for production
3. Enable storage autoscaling to avoid over-provisioning
4. Monitor and right-size instances

## Troubleshooting

### Connection Issues
```bash
# Check security groups
aws ec2 describe-security-groups --group-ids <sg-id>

# Test connectivity from EC2
telnet <rds-endpoint> 5432
telnet <redis-endpoint> 6379
```

### Performance Issues
```bash
# Check RDS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=<instance-id>

# Check Redis metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ElastiCache \
  --metric-name DatabaseMemoryUsagePercentage \
  --dimensions Name=ReplicationGroupId,Value=<replication-group-id>
```

## Migration Guide

### From Local PostgreSQL
```bash
# Dump local database
pg_dump local_db > dump.sql

# Restore to RDS
psql "postgresql://dbadmin:<password>@<rds-endpoint>/vpnenterprise" < dump.sql
```

### From Local Redis
```bash
# Use redis-cli to migrate
redis-cli --rdb dump.rdb
# Then restore to ElastiCache via application code
```
