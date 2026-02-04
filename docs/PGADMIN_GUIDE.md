# pgAdmin Access Guide

## Overview

pgAdmin4 is a full-featured PostgreSQL database management tool integrated into the VPN Enterprise platform. It provides a visual interface to manage your `platform_db` database, view tables, run queries, and perform backups.

## Accessing pgAdmin

### From Web Dashboard (Recommended)

1. Login to the web dashboard at `https://chatbuilds.com`
2. Navigate to **Dashboard** → **Admin** page
3. In the "Quick Actions" section, click on **pgAdmin** button
4. pgAdmin will open in a new tab at `https://chatbuilds.com/pgadmin`

### Direct URL Access

- **Production**: `https://chatbuilds.com/pgadmin`
- **Note**: Only accessible to users with **admin** or **super_admin** roles

## Login Credentials

### Default Credentials (from docker-compose.prod.yml)

- **Email**: `admin@vpnenterprise.com` (or value from `PGADMIN_EMAIL` env var)
- **Password**: `admin` (or value from `PGADMIN_PASSWORD` env var)

**⚠️ IMPORTANT**: Change these default credentials in production!

### Change pgAdmin Password

1. Login to pgAdmin
2. Click on your email in top right → **Change Password**
3. Enter new password and save

## Connecting to Platform Database

pgAdmin is pre-configured with the platform database connection through `servers.json`:

### Pre-configured Connection

- **Name**: VPN Platform DB
- **Host**: `vpn-postgres`
- **Port**: `5432`
- **Database**: `platform_db`
- **Username**: `platform_admin`
- **Password**: Stored in Docker secret at `/run/secrets/db_password`

### First Time Connection

1. After logging in to pgAdmin, expand **Servers** in the left panel
2. Click on **VPN Platform DB**
3. Enter the database password when prompted
4. Click **Save password** for convenience

## Common Tasks

### View Tables

1. Expand: **Servers** → **VPN Platform DB** → **Databases** → **platform_db** → **Schemas** → **public** → **Tables**
2. Right-click any table → **View/Edit Data** → **All Rows**

### Run Custom Queries

1. Right-click **platform_db** → **Query Tool**
2. Write your SQL query
3. Press **F5** or click **Execute** button

### Backup Database

1. Right-click **platform_db** → **Backup...**
2. Choose backup format (Custom, Tar, Plain, Directory)
3. Select backup options
4. Click **Backup**
5. File will be saved to `/var/lib/pgadmin/storage/` in container

### Restore Database

1. Right-click **platform_db** → **Restore...**
2. Select backup file
3. Configure restore options
4. Click **Restore**

## Security Features

### Admin Authentication

- pgAdmin access is protected by nginx `auth_request` directive
- Only users logged into the dashboard with admin/super_admin role can access
- Uses the same `access_token` cookie from dashboard login

### Network Isolation

- pgAdmin runs in Docker network `vpn-network`
- Not directly exposed to internet
- Only accessible via nginx reverse proxy

### Session Management

- pgAdmin sessions are independent from dashboard sessions
- Close pgAdmin tab when done to save resources
- Sessions expire based on pgAdmin's internal timeout

## Troubleshooting

### Cannot Access pgAdmin

**Symptom**: 403 Forbidden or redirect to login

**Solutions**:

1. Ensure you're logged into the web dashboard first
2. Verify your user role is `admin` or `super_admin`
3. Check that `access_token` cookie exists in browser
4. Clear browser cookies and login again

### Cannot Connect to Database

**Symptom**: "could not connect to server" error

**Solutions**:

1. Verify postgres container is running:
   ```bash
   docker ps | grep vpn-postgres
   ```
2. Check postgres health:
   ```bash
   docker exec vpn-postgres pg_isready -U platform_admin
   ```
3. Verify database password in docker secret:
   ```bash
   docker exec vpn-postgres cat /run/secrets/db_password
   ```

### pgAdmin UI Not Loading

**Symptom**: Blank page or stuck loading

**Solutions**:

1. Check pgAdmin container logs:
   ```bash
   docker logs vpn-pgadmin
   ```
2. Restart pgAdmin container:
   ```bash
   docker compose -f infrastructure/docker/docker-compose.prod.yml restart pgadmin
   ```
3. Check nginx error logs:
   ```bash
   docker logs vpn-nginx | grep pgadmin
   ```

### Forgot pgAdmin Password

**Solution**: Reset via environment variables

```bash
# Edit docker-compose.prod.yml
PGADMIN_DEFAULT_PASSWORD=new_password_here

# Recreate pgAdmin container
docker compose -f infrastructure/docker/docker-compose.prod.yml up -d --force-recreate pgadmin
```

## Performance Tips

### Large Query Results

- Use **LIMIT** clause for large tables
- Enable query pagination in preferences
- Use **Data Export** feature for large datasets

### Connection Pooling

- pgAdmin maintains connection pool to database
- Disconnect when not in use to free resources
- Default max connections: 100 (configurable in postgresql.conf)

## Advanced Configuration

### Custom Server Configuration

Edit `infrastructure/docker/postgres/servers.json`:

```json
{
  "Servers": {
    "1": {
      "Name": "VPN Platform DB",
      "Group": "Production",
      "Host": "vpn-postgres",
      "Port": 5432,
      "MaintenanceDB": "platform_db",
      "Username": "platform_admin",
      "SSLMode": "prefer"
    }
  }
}
```

### Environment Variables

See `infrastructure/docker/docker-compose.prod.yml`:

- `PGADMIN_DEFAULT_EMAIL`: Default login email
- `PGADMIN_DEFAULT_PASSWORD`: Default login password
- `PGADMIN_CONFIG_SERVER_MODE`: Run in server mode (multi-user)
- `SCRIPT_NAME`: Base path for reverse proxy (`/pgadmin`)

## Resources

- [pgAdmin Documentation](https://www.pgadmin.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Nginx Reverse Proxy Guide](./NGINX_COMPLETE_GUIDE.md)
