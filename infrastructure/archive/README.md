# Infrastructure Archive

This folder contains infrastructure files that have been archived during cleanup to maintain a clean development environment.

## Archived Components

### `docker-compose.simple-db.yml`
- **Reason for archival**: Redundant with working `docker-compose.db-dev.yml` in project root
- **Original purpose**: Simple PostgreSQL + Redis setup
- **Status**: Replaced by better working setup

### `monitoring/`
- **Reason for archival**: Overkill for current development needs
- **Contents**: Prometheus, Grafana, Promtail monitoring stack
- **Status**: Can be restored if monitoring becomes needed

### `self-hosted/`
- **Reason for archival**: Not needed for current database service development
- **Contents**: Hetzner deployment guides, self-hosting scripts
- **Status**: Available for future production deployment needs

## Active Infrastructure

The following files remain active in the infrastructure folder:
- `docker/docker-compose.dev.yml` - Development stack (API + Web + Redis)
- `docker/docker-compose.yml` - Production-like setup
- `docker/docker-compose.database-platform.yml` - Full platform stack
- `docker/Dockerfile.*` - Container build files
- `docker/nginx/` - Nginx configuration
- `docker/postgres/` - PostgreSQL configuration

## Restoration

To restore any archived component:
```bash
# Example: Restore monitoring
mv infrastructure/archive/monitoring infrastructure/
```

## Current Working Setup

The main database development setup is now:
- **File**: `docker-compose.db-dev.yml` (in project root)
- **Services**: PostgreSQL + pgAdmin + Adminer
- **Start command**: `./start-db-dev.sh`
- **Access**: pgAdmin at http://localhost:8080

---
*Cleanup performed: $(date)*