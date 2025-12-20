# N8N Workflow Automation - Integration Guide

## Overview

n8n is a powerful workflow automation tool integrated into VPN Enterprise. It allows you to:
- Automate business processes
- Connect APIs without code
- Build complex integrations
- Schedule tasks and monitor systems
- Process data and send notifications

## Quick Start

### Development Environment

```bash
# Start n8n with the dev stack
./scripts/start-dev.sh

# Access n8n at:
# http://localhost:5678
```

### Production Deployment

```bash
# Start full production stack with n8n
cd infrastructure/docker
docker compose up -d

# Access n8n at:
# https://n8n.yourdomain.com (configure DNS first)
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# n8n Authentication
N8N_USER=admin
N8N_PASSWORD=your_secure_password

# n8n Database
N8N_DB_NAME=n8n

# Security Keys (generate unique values)
N8N_ENCRYPTION_KEY=your_32_char_encryption_key
N8N_JWT_SECRET=your_32_char_jwt_secret

# Domain (production)
N8N_HOST=n8n.yourdomain.com

# Timezone
TIMEZONE=UTC
```

### Generate Secure Keys

```bash
# Generate encryption key
openssl rand -base64 32

# Generate JWT secret
openssl rand -base64 32
```

## Database Setup

n8n uses PostgreSQL for data persistence. The database is automatically created on first run.

```sql
-- Create n8n database (run once)
CREATE DATABASE n8n;
```

## Architecture

### Services

- **Container**: `vpn-n8n` (dev) / `n8n` (production)
- **Port**: 5678 (internal), proxied through nginx
- **Network**: Connected to vpn-network
- **Volumes**: 
  - `n8n-data`: Persistent n8n configuration
  - `n8n-workflows`: Custom workflows directory

### Data Flow

```
User → Nginx (80/443) → n8n (5678)
n8n → PostgreSQL (database)
n8n → Redis (caching/queues)
n8n → API/External Services (webhooks)
```

## Use Cases for VPN Enterprise

### 1. User Management Automation

**Workflow**: New User Onboarding
```
Trigger: New user signup webhook
→ Create VPN credentials
→ Send welcome email
→ Add to billing system
→ Log to monitoring
```

### 2. Billing Automation

**Workflow**: Subscription Management
```
Schedule: Daily at 00:00
→ Check expiring subscriptions
→ Send renewal reminders
→ Process payments
→ Update user access
→ Generate invoices
```

### 3. Monitoring & Alerts

**Workflow**: System Health Check
```
Schedule: Every 5 minutes
→ Check API status
→ Monitor database performance
→ Verify VPN servers
→ Send alerts if issues detected
```

### 4. Database Backups

**Workflow**: Automated Backups
```
Schedule: Daily at 02:00
→ Trigger database backup
→ Compress backup files
→ Upload to cloud storage
→ Clean old backups
→ Send status notification
```

### 5. Customer Support

**Workflow**: Ticket Management
```
Trigger: New support ticket
→ Categorize issue
→ Assign to team member
→ Create Jira/Linear ticket
→ Notify on Slack
```

## API Integration Examples

### Webhook to VPN Enterprise API

```json
{
  "method": "POST",
  "url": "http://api:3000/api/v1/users",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{$env.API_TOKEN}}"
  },
  "body": {
    "email": "{{$json.email}}",
    "name": "{{$json.name}}"
  }
}
```

### PostgreSQL Query

```javascript
// n8n PostgreSQL node
SELECT * FROM tenants 
WHERE status = 'active' 
AND expires_at < NOW() + INTERVAL '7 days';
```

### Send Notification

```json
{
  "method": "POST",
  "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "body": {
    "text": "⚠️ {{$json.count}} subscriptions expiring this week"
  }
}
```

## Security Best Practices

### 1. Authentication

- Always use strong passwords
- Enable basic auth in production
- Consider adding IP whitelist in nginx

### 2. Credentials Management

- Store sensitive data in n8n credentials vault
- Never hardcode API keys in workflows
- Use environment variables for configuration

### 3. Network Security

```nginx
# Add IP whitelist in nginx/conf.d/n8n.conf
location / {
    allow 10.0.0.0/8;
    allow 172.16.0.0/12;
    deny all;
    
    proxy_pass http://n8n_backend;
}
```

### 4. SSL/TLS

```bash
# Generate SSL certificate (Let's Encrypt)
certbot certonly --standalone -d n8n.yourdomain.com

# Update nginx configuration
ssl_certificate /etc/letsencrypt/live/n8n.yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/n8n.yourdomain.com/privkey.pem;
```

## Workflow Management

### Export Workflows

```bash
# From n8n UI: Settings → Export
# Save to: n8n-workflows/production/

# Or via API:
curl -X GET http://localhost:5678/api/v1/workflows \
  -u admin:password
```

### Import Workflows

```bash
# From n8n UI: Import
# Load from: n8n-workflows/

# Or via API:
curl -X POST http://localhost:5678/api/v1/workflows/import \
  -u admin:password \
  -H "Content-Type: application/json" \
  -d @workflow.json
```

### Backup Workflows

```bash
# Backup all workflows
docker exec vpn-n8n n8n export:workflow \
  --backup --output=/home/node/workflows/backup

# Backup single workflow
docker exec vpn-n8n n8n export:workflow \
  --id=1 --output=/home/node/workflows/backup
```

## Monitoring

### Health Check

```bash
# Check n8n status
curl http://localhost:5678/healthz

# Expected response: {"status":"ok"}
```

### Logs

```bash
# Development
docker logs -f vpn-n8n-dev

# Production
docker logs -f vpn-n8n

# Follow logs with grep
docker logs -f vpn-n8n | grep ERROR
```

### Metrics

n8n exposes Prometheus metrics at `/metrics` endpoint:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'n8n'
    static_configs:
      - targets: ['n8n:5678']
```

## Troubleshooting

### Cannot Connect to Database

```bash
# Check PostgreSQL connection
docker exec vpn-n8n wget -q -O- http://localhost:5678/healthz

# Verify database credentials
docker exec vpn-n8n env | grep DB_

# Recreate database
docker exec postgres psql -U postgres -c "DROP DATABASE n8n;"
docker exec postgres psql -U postgres -c "CREATE DATABASE n8n;"
docker restart vpn-n8n
```

### Workflows Not Executing

```bash
# Check execution logs
docker logs vpn-n8n | grep "Workflow execution"

# Verify webhook URLs
curl -X POST http://localhost:5678/webhook-test/test \
  -d '{"test":"data"}'

# Restart n8n
docker restart vpn-n8n
```

### Performance Issues

```bash
# Check resource usage
docker stats vpn-n8n

# Increase memory limits in docker-compose.yml
resources:
  limits:
    memory: 2G  # Increase from 1G
```

## Advanced Configuration

### Custom Nodes

```bash
# Install custom nodes
docker exec vpn-n8n npm install n8n-nodes-custom-package

# Restart n8n
docker restart vpn-n8n
```

### Environment Variables

```env
# Increase payload size (default 16MB)
N8N_PAYLOAD_SIZE_MAX=32

# Enable metrics
N8N_METRICS=true

# Execution timeout (seconds)
EXECUTIONS_TIMEOUT=300

# Max execution time (seconds)
EXECUTIONS_TIMEOUT_MAX=600
```

## Resources

- **Official Docs**: https://docs.n8n.io
- **Community Forum**: https://community.n8n.io
- **Workflow Templates**: https://n8n.io/workflows
- **GitHub**: https://github.com/n8n-io/n8n

## Support

For n8n integration issues with VPN Enterprise:
1. Check this documentation
2. Review n8n logs: `docker logs vpn-n8n`
3. Consult official n8n docs
4. Contact VPN Enterprise support team

---

**Last Updated**: December 2025  
**Version**: 1.0
