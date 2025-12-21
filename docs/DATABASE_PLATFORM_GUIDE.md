# VPN Enterprise - Database Platform Guide

Complete guide for running the Database-as-a-Service platform with PostgreSQL, pgAdmin, and SQL Editor.

## 🚀 Quick Start

```bash
# Start the entire database platform
./scripts/start-database-platform.sh

# Stop the platform
./scripts/stop-database-platform.sh
```

## 📊 Access Points

After starting the platform, access these services:

| Service | URL | Purpose |
|---------|-----|---------|
| **Web Dashboard** | http://localhost:3001 | SQL Editor & Management UI |
| **Database Platform API** | http://localhost:3002 | REST API for database operations |
| **pgAdmin** | http://localhost:8081 | Professional PostgreSQL admin tool |
| **PostgreSQL Primary** | localhost:5433 | Direct database connection |
| **PostgreSQL Replica** | Internal only | Read-only replica |
| **PgBouncer** | Internal only | Connection pooler |

## 🔑 Default Credentials

### PostgreSQL Database
- **Host**: localhost
- **Port**: 5433 (external) / 5432 (internal)
- **Database**: postgres
- **Username**: postgres
- **Password**: Set in `.env` as `POSTGRES_PASSWORD`

### pgAdmin Web Interface
- **URL**: http://localhost:8081
- **Email**: admin@platform.com (or `PGADMIN_EMAIL` from `.env`)
- **Password**: admin (or `PGADMIN_PASSWORD` from `.env`)

### Pre-configured PostgreSQL Connections in pgAdmin
1. **Primary Database** - Direct connection to main PostgreSQL
2. **Replica Database** - Read-only replica for load distribution
3. **via PgBouncer** - Connection through the pooler

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                   │
│                  (Port 80, 443, 5432)                    │
└───────────┬─────────────────────────────────┬───────────┘
            │                                 │
    ┌───────▼──────┐                 ┌────────▼────────┐
    │  Web Dashboard│                 │   API Server    │
    │  (Port 3001)  │                 │  (Port 3002)    │
    │  SQL Editor   │                 │  REST API       │
    └───────────────┘                 └─────────────────┘
                                              │
                    ┌─────────────────────────┼──────────────────┐
                    │                         │                  │
            ┌───────▼────────┐       ┌────────▼─────────┐  ┌────▼─────┐
            │   PgBouncer    │       │  PostgreSQL      │  │  Redis   │
            │ Connection Pool│       │    Primary       │  │  Cache   │
            └───────┬────────┘       │  (Port 5433)     │  └──────────┘
                    │                └──────────┬───────┘
                    │                           │
                    │                  ┌────────▼─────────┐
                    └─────────────────▶│  PostgreSQL      │
                                       │    Replica       │
                                       │  (Read-Only)     │
                                       └──────────────────┘
```

## 🛠️ Service Details

### 1. PostgreSQL Primary
- Full read/write database
- Port: 5433 (external access)
- Data persistence: `postgres-primary-data` volume
- Configuration: `infrastructure/docker/postgres/postgresql.conf`

### 2. PostgreSQL Replica
- Read-only copy of primary
- Automatically synced via streaming replication
- Used for load distribution

### 3. PgBouncer
- Connection pooling layer
- Reduces database connection overhead
- Pool modes: transaction, session, statement

### 4. pgAdmin
- Professional PostgreSQL management tool
- Visual query builder
- Schema design tools
- Server group management
- Port: 8081 (no conflict with NexusAI on 8080)

### 5. Database Platform API
- RESTful API for database operations
- Port: 3002
- Health check: http://localhost:3002/health

### 6. Web Dashboard
- Custom SQL Editor with syntax highlighting
- Database schema browser
- Table management
- Real-time query execution

### 7. Redis
- Session storage
- Query result caching
- Job queue management

## 🔧 Configuration

### Environment Variables (.env)

```bash
# PostgreSQL
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=postgres
POSTGRES_USER=postgres

# pgAdmin
PGADMIN_EMAIL=admin@platform.com
PGADMIN_PASSWORD=admin_secure_password

# API
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres-primary:5432/postgres

# Redis
REDIS_PASSWORD=redis_secure_password
REDIS_HOST=redis
REDIS_PORT=6379
```

### Port Configuration

| Port | Service | Can Change? |
|------|---------|------------|
| 3001 | Web Dashboard | ✅ Yes |
| 3002 | API Server | ✅ Yes |
| 5433 | PostgreSQL | ✅ Yes (change to avoid conflicts) |
| 8081 | pgAdmin | ✅ Yes (currently avoids 8080 conflict) |
| 6379 | Redis | ✅ Yes |

**Port Conflict Resolution**: pgAdmin is on port 8081 to avoid conflict with NexusAI (port 8080) and N8N (port 5678).

## 📝 Usage Examples

### Using pgAdmin

1. **Access**: Open http://localhost:8081
2. **Login**: Use credentials from `.env` (default: admin@platform.com / admin)
3. **Connect to Database**:
   - Server is pre-configured as "VPN Enterprise Database Platform - Primary"
   - Password will be requested (use `POSTGRES_PASSWORD` from `.env`)

### Using Direct PostgreSQL Connection

```bash
# Using psql
psql -h localhost -p 5433 -U postgres -d postgres

# Using connection string
postgresql://postgres:password@localhost:5433/postgres
```

### Using the Web Dashboard

1. Navigate to http://localhost:3001/databases
2. Select database and schema from sidebar
3. Write SQL queries in the editor
4. Execute with Ctrl+Enter or Run button

### Using the API

```bash
# Health check
curl http://localhost:3002/health

# List databases (requires authentication)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3002/api/v1/databases

# Execute query
curl -X POST http://localhost:3002/api/v1/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "SELECT version();"}'
```

## 🔍 Monitoring & Logs

### View All Logs
```bash
docker compose -f infrastructure/docker/docker-compose.database-platform.yml logs -f
```

### View Specific Service Logs
```bash
# PostgreSQL Primary
docker logs dbplatform-postgres-primary -f

# pgAdmin
docker logs dbplatform-pgadmin -f

# API Server
docker logs dbplatform-api -f

# Web Dashboard
docker logs dbplatform-web -f
```

### Check Service Status
```bash
docker compose -f infrastructure/docker/docker-compose.database-platform.yml ps
```

## 🐛 Troubleshooting

### pgAdmin Won't Start (Port 8081 Conflict)

```bash
# Check what's using port 8081
sudo lsof -i :8081

# Or use docker
docker ps | grep 8081

# Stop conflicting service or change pgAdmin port in docker-compose.database-platform.yml
```

### PostgreSQL Connection Refused

```bash
# Check if PostgreSQL is running
docker logs dbplatform-postgres-primary

# Wait for it to be ready
docker exec dbplatform-postgres-primary pg_isready -U postgres

# Test connection
psql -h localhost -p 5433 -U postgres -d postgres
```

### API Not Responding

```bash
# Check API logs
docker logs dbplatform-api -f

# Check health endpoint
curl http://localhost:3002/health

# Restart API
docker restart dbplatform-api
```

### pgAdmin "Too Many Login Attempts"

```bash
# Clear pgAdmin data and restart
docker compose -f infrastructure/docker/docker-compose.database-platform.yml down
docker volume rm vpn-enterprise_pgadmin-data
docker compose -f infrastructure/docker/docker-compose.database-platform.yml up -d pgadmin
```

## 🔐 Security Best Practices

1. **Change Default Passwords**: Update all passwords in `.env` before production
2. **Use Strong Passwords**: Generate secure passwords for PostgreSQL and pgAdmin
3. **Restrict Access**: Use firewall rules to limit who can access ports 5433 and 8081
4. **Enable SSL**: Configure SSL certificates in nginx for HTTPS
5. **Regular Backups**: Set up automated backups of PostgreSQL data
6. **Update Regularly**: Keep Docker images updated

## 🚀 Production Deployment

### Additional Steps for Production

1. **SSL/TLS Configuration**
   ```bash
   # Add SSL certificates
   cp your-cert.crt infrastructure/docker/nginx/ssl/
   cp your-key.key infrastructure/docker/nginx/ssl/
   ```

2. **Database Backups**
   ```bash
   # Manual backup
   docker exec dbplatform-postgres-primary pg_dump -U postgres postgres > backup.sql
   
   # Restore
   docker exec -i dbplatform-postgres-primary psql -U postgres postgres < backup.sql
   ```

3. **Monitoring Setup**
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3000 (via nginx proxy)

4. **Resource Limits**
   - Set CPU/memory limits in docker-compose.database-platform.yml
   - Configure PostgreSQL `shared_buffers`, `work_mem`, etc.

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)
- [PgBouncer Documentation](https://www.pgbouncer.org/)
- [Project README](../../README.md)

## 🆘 Support

For issues or questions:
1. Check logs: `docker compose logs -f`
2. Review configuration files in `infrastructure/docker/`
3. Check network connectivity between containers
4. Verify environment variables in `.env`
