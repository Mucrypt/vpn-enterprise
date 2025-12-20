# N8N Workflow Automation Directory

This directory stores custom n8n workflows that can be imported/exported.

## Usage

1. **Export workflows**: Save workflows from n8n UI as JSON files here
2. **Import workflows**: Load JSON files from this directory into n8n
3. **Version control**: Workflows are tracked in git for team collaboration

## Directory Structure

```
n8n-workflows/
├── README.md (this file)
├── examples/          # Example workflow templates
├── production/        # Production-ready workflows
└── templates/         # Reusable workflow templates
```

## Common Workflow Use Cases

- **API Integrations**: Connect VPN Enterprise API with external services
- **Database Automation**: Automated database backups, cleanup, migrations
- **Monitoring & Alerts**: Send notifications when system events occur
- **User Management**: Automated user provisioning and deprovisioning
- **Billing Automation**: Process payments, send invoices, update subscriptions
- **Data Synchronization**: Sync data between services
- **Report Generation**: Scheduled reports and analytics

## Accessing n8n

- **Development**: http://localhost:5678
- **Production**: https://n8n.yourdomain.com
- **Default Credentials**: 
  - Username: admin (set via N8N_USER env var)
  - Password: (set via N8N_PASSWORD env var)

## Security Notes

- Always use strong passwords for N8N_PASSWORD
- Enable HTTPS in production
- Restrict network access using firewall rules
- Regularly backup n8n data volume
- Use environment variables for sensitive credentials in workflows
