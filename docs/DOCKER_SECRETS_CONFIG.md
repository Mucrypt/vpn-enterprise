# Docker Secrets & Configuration Management

Complete guide for managing sensitive data and environment-specific configurations in VPN Enterprise.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Directory Structure](#directory-structure)
- [Secrets Management](#secrets-management)
- [Configuration Files](#configuration-files)
- [Environment-Specific Deployment](#environment-specific-deployment)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

This project uses **Docker Secrets** for sensitive data and **environment-specific config files** for non-sensitive settings.

### Why This Approach?

| Method | Use Case | Security | Example |
|--------|----------|----------|---------|
| **Docker Secrets** | Passwords, keys, tokens | ✅ Encrypted, mounted as files | Database passwords, API keys |
| **Config Files** | Environment settings | ⚠️ Not encrypted | Log levels, feature flags, URLs |
| **Environment Variables** | Runtime overrides | ⚠️ Visible in `docker inspect` | `NODE_ENV=production` |

## Quick Start

### 1. Setup Secrets (First Time)

```bash
# Navigate to secrets directory
cd infrastructure/docker/secrets

# Copy example files
cp db_password.example db_password
cp redis_password.example redis_password
cp n8n_encryption_key.example n8n_encryption_key
cp api_key.example api_key

# Edit each file with strong passwords
# For production, use randomly generated values:
openssl rand -base64 32 > db_password
openssl rand -base64 32 > redis_password
openssl rand -hex 64 > n8n_encryption_key
openssl rand -hex 32 > api_key
```

### 2. Start Services

**Development:**
```bash
cd infrastructure/docker
docker compose -f docker-compose.dev.yml up -d
```

**Production:**
```bash
cd infrastructure/docker
docker compose -f docker-compose.prod.yml up -d
```

**Database Platform:**
```bash
docker compose -f docker-compose.db-dev.yml up -d
```

## Directory Structure

```
infrastructure/docker/
├── secrets/                    # ❗ NEVER COMMIT ACTUAL SECRETS
│   ├── .gitkeep
│   ├── README.md
│   ├── db_password.example     # ✅ Commit examples only
│   ├── redis_password.example
│   ├── n8n_encryption_key.example
│   ├── api_key.example
│   ├── db_password             # ❌ Git ignored
│   ├── redis_password          # ❌ Git ignored
│   ├── n8n_encryption_key      # ❌ Git ignored
│   └── api_key                 # ❌ Git ignored
│
├── config/                     # ✅ Safe to commit (no secrets)
│   ├── README.md
│   ├── app.dev.env            # Development configuration
│   └── app.prod.env           # Production configuration
│
├── docker-compose.dev.yml     # Development stack
├── docker-compose.prod.yml    # Production stack
└── docker-compose.db-dev.yml  # Database platform
```

## Secrets Management

### Available Secrets

| Secret File | Purpose | Used By Services |
|-------------|---------|------------------|
| `db_password` | PostgreSQL admin password | postgres, api, python-api |
| `redis_password` | Redis authentication | redis, api, python-api, n8n |
| `n8n_encryption_key` | N8N credential encryption | n8n |
| `api_key` | Internal API authentication | api, python-api |

### How Secrets Work

1. **File Creation**: Secrets are stored as plain text files in `infrastructure/docker/secrets/`
2. **Mount Location**: Docker mounts secrets to `/run/secrets/` inside containers
3. **Access Control**: Only services that declare a secret get access to it
4. **Reading Secrets**: Applications read from `/run/secrets/secret_name`

#### File permissions (important for Docker Compose)

In Docker Swarm, secrets are mounted with safe, readable permissions inside containers.
When using **Docker Compose with `secrets: file:`**, some setups mount secrets from local
files in a way that preserves host file permissions. If a container runs as a non-root user
(for example `n8nio/n8n`), it must be able to read its secret file.

If you see errors like `EACCES: permission denied, open '/run/secrets/n8n_encryption_key'`:

- Quick fix: `chmod 644 infrastructure/docker/secrets/n8n_encryption_key` and recreate the container.
- Tighter fix: keep `chmod 600` and grant read via ACL to the container UID (often `1000`):
   - `sudo apt-get install -y acl`
   - `docker run --rm --entrypoint id n8nio/n8n:latest`
   - `sudo setfacl -m u:1000:r infrastructure/docker/secrets/n8n_encryption_key`

### Accessing Secrets in Code

**Node.js/TypeScript:**
```typescript
import { readFileSync } from 'fs';

const apiKey = process.env.API_KEY_FILE 
  ? readFileSync(process.env.API_KEY_FILE, 'utf8').trim()
  : process.env.API_KEY;
```

**Python/FastAPI:**
```python
import os

def read_secret(secret_name: str) -> str:
    secret_file = os.getenv(f'{secret_name.upper()}_FILE')
    if secret_file:
        with open(secret_file, 'r') as f:
            return f.read().strip()
    return os.getenv(secret_name.upper(), '')

# Usage
db_password = read_secret('db_password')
api_key = read_secret('api_key')
```

## Configuration Files

### Development Config (`config/app.dev.env`)

Non-sensitive settings for local development:

```env
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug
DB_HOST=vpn-postgres-dev
REDIS_HOST=vpn-redis-dev
ENABLE_HOT_RELOAD=true
ENABLE_SWAGGER_UI=true
```

### Production Config (`config/app.prod.env`)

Optimized settings for production:

```env
NODE_ENV=production
DEBUG=false
LOG_LEVEL=info
DB_HOST=vpn-postgres
REDIS_HOST=vpn-redis
ENABLE_HOT_RELOAD=false
ENABLE_SWAGGER_UI=false
SESSION_COOKIE_SECURE=true
RATE_LIMIT_MAX_REQUESTS=100
```

### Loading Order

Docker Compose loads environment variables in this priority (last wins):

1. `env_file: ../../.env` (root environment)
2. `env_file: ./config/app.dev.env` (environment-specific)
3. `environment:` (inline overrides)

## Environment-Specific Deployment

### Development

```bash
cd infrastructure/docker
docker compose -f docker-compose.dev.yml up -d
```

**Features:**
- Hot reload enabled
- Debug endpoints exposed
- SQLite for N8N (simpler)
- Swagger UI enabled
- Lower resource limits
- Verbose logging

### Production

```bash
cd infrastructure/docker
docker compose -f docker-compose.prod.yml up -d
```

**Features:**
- PostgreSQL for N8N
- Resource limits enforced
- Health checks enabled
- Log rotation configured
- SSL/TLS required
- Rate limiting enabled

### Database Platform

```bash
docker compose -f docker-compose.db-dev.yml up -d
```

**Access:**
- pgAdmin: http://localhost:8082
- Adminer: http://localhost:8081

## Security Best Practices

### ✅ DO

1. **Use Strong Passwords**
   ```bash
   # Generate 32-character passwords
   openssl rand -base64 32
   ```

2. **Rotate Secrets Regularly**
   - Update secret files
   - Restart affected services
   - Document rotation date

3. **Restrict File Permissions**
   ```bash
   chmod 600 infrastructure/docker/secrets/*
   ```

4. **Use Different Secrets Per Environment**
   - Dev secrets != Staging secrets != Production secrets
   - Never reuse passwords

5. **Backup Encrypted**
   ```bash
   # Encrypt secrets before backup
   tar -czf secrets.tar.gz secrets/
   gpg --encrypt secrets.tar.gz
   ```

### ❌ DON'T

1. **Never Commit Actual Secrets**
   - Only commit `.example` files
   - Check `.gitignore` is configured correctly

2. **Avoid Environment Variables for Secrets**
   ```bash
   # ❌ Bad: Visible in docker inspect
   environment:
     - DB_PASSWORD=plain_text_password
   
   # ✅ Good: Use secrets
   secrets:
     - db_password
   ```

3. **Don't Hardcode Secrets**
   ```javascript
   // ❌ Bad
   const password = 'my_secret_password';
   
   // ✅ Good
   const password = readFileSync('/run/secrets/db_password', 'utf8');
   ```

4. **Don't Share Secrets via Chat/Email**
   - Use secure password managers
   - Share via encrypted channels

## Troubleshooting

### Issue: Container can't read secret

**Symptoms:**
```
Error: ENOENT: no such file or directory, open '/run/secrets/db_password'
```

**Solution:**
1. Check secret file exists:
   ```bash
   ls -la infrastructure/docker/secrets/db_password
   ```

2. Verify service declares secret:
   ```yaml
   services:
     api:
       secrets:
         - db_password  # Must be declared
   ```

3. Check secrets definition:
   ```yaml
   secrets:
     db_password:
       file: ./secrets/db_password  # Path must be correct
   ```

### Issue: Permission denied reading secret

**Symptoms:**
```
Error: EACCES: permission denied, open '/run/secrets/db_password'
```

**Solution:**
```bash
chmod 644 infrastructure/docker/secrets/db_password
```

### Issue: Wrong password being used

**Check secret content:**
```bash
cat infrastructure/docker/secrets/db_password
```

**Check what container sees:**
```bash
docker exec vpn-api-dev cat /run/secrets/api_key
```

### Issue: Service using old secret

**Force recreation:**
```bash
docker compose down
docker compose up -d --force-recreate
```

## Viewing Active Configuration

```bash
# View service environment (secrets not visible)
docker exec vpn-api-dev env | grep -E 'NODE_ENV|LOG_LEVEL|DEBUG'

# View loaded secrets (redacted in logs)
docker exec vpn-api-dev ls -la /run/secrets/

# Check secret file content
docker exec vpn-python-api-dev cat /run/secrets/api_key
```

## Production Deployment Checklist

- [ ] Generate strong random secrets (32+ characters)
- [ ] Update all `.example` files with production values
- [ ] Remove `.example` suffix from secret files
- [ ] Set strict file permissions (`chmod 600`)
- [ ] Update `config/app.prod.env` with production URLs
- [ ] Create `.env.production` file
- [ ] Configure SSL certificates
- [ ] Test secrets rotation procedure
- [ ] Document secret backup process
- [ ] Enable log rotation
- [ ] Configure health check alerts

## Further Reading

- [Docker Secrets Documentation](https://docs.docker.com/engine/swarm/secrets/)
- [Environment Variables Best Practices](https://12factor.net/config)
- [OWASP Secret Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
