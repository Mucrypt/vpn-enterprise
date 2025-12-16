# Scripts Archive

This folder contains scripts that have been archived during the cleanup to maintain a streamlined development environment.

## Archived Scripts

### Database-Related Scripts

**`start-simple-database.sh`**
- **Reason**: Used `docker-compose.simple-db.yml` which was archived
- **Purpose**: Started PostgreSQL using the simple database setup
- **Replacement**: Use `../start-db-dev.sh` (working database setup)

### Development/Testing Scripts

**`setup-test-env.sh`**  
- **Reason**: Complex WSL/Docker setup script that's no longer needed
- **Purpose**: Set up Docker environment for testing in WSL
- **Status**: Current Docker setup working without this complexity

**`generate-client-cli.js`**
- **Reason**: Specialized client CLI generation, not core to current development
- **Purpose**: Generated CLI clients for API interaction
- **Status**: Can be restored if client CLI becomes needed

**`test-production.sh`**
- **Reason**: Specific production testing scenarios  
- **Purpose**: Comprehensive production API testing suite
- **Replacement**: Use `../test-api.sh` for current development testing

### Deployment Scripts

**`deploy-all.sh`** 
- **Reason**: Redundant with `deploy-vercel.sh`
- **Purpose**: Deploy both API and web to Vercel
- **Replacement**: Use `../deploy-vercel.sh` (more comprehensive)

**`deployment/` folder**
- **Reason**: References archived monitoring components (Grafana, Promtail)
- **Contents**: `build.sh`, `deploy.sh`, `health-check.sh`, `rollback.sh`
- **Purpose**: Docker-based deployment with monitoring stack
- **Status**: Available for production deployment if monitoring restored

## Active Scripts (Current Development)

The following scripts remain active and essential:

### Database Development
- `start-db-dev.sh` - **Primary database startup** (PostgreSQL + pgAdmin)
- `start-database-platform.sh` - Full database platform stack
- `stop-database-platform.sh` - Stop database platform

### Development Environment  
- `start-dev.sh` - Development environment (API + Web + Redis)
- `stop-dev.sh` - Stop development environment
- `quick-start.sh` - Project initialization and setup

### Deployment & CI
- `auto-deploy.sh` - **Primary deployment** (git + Vercel)
- `deploy-vercel.sh` - Vercel deployment (used by auto-deploy)
- `build-api-vercel.sh` - API build for Vercel

### Testing
- `test-api.sh` - **Current API testing**

### Git Operations
- `git/push.sh` - Git operations helper

## Restoration

To restore any archived script:
```bash
# Example: Restore production testing
mv scripts/archive/test-production.sh scripts/
```

## Current Workflow

**For database development:**
```bash
./start-db-dev.sh        # Start PostgreSQL + pgAdmin
./test-api.sh             # Test API functionality  
./auto-deploy.sh "message"  # Deploy changes
```

---
*Cleanup performed: $(date)*