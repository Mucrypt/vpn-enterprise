# Nginx (reverse proxy) — VPN Enterprise

This directory contains nginx configurations for different deployment scenarios. Configurations are optimized for performance, security, and the specific needs of the VPN Enterprise platform.

> **Note**: Nginx configurations updated and cleaned up (Dec 2024). Service names synchronized with docker-compose files.

## 📁 File Structure

### Main Configurations
- **`nginx.conf`** — Standard production configuration with security headers, rate limiting, and caching
- **`nginx-database.conf`** — Specialized configuration for database-as-a-service platform with PostgreSQL TCP proxy

### Virtual Host Configurations (`conf.d/`)
- **`default.conf`** — Standard production server configuration  
- **`database-platform.conf`** — Database platform server with specialized endpoints and rate limiting
- **`dev.conf`** — Development configuration (HTTP only, relaxed CORS)

### SSL/TLS (`ssl/`)
- **`cert.pem`** — SSL certificate (self-signed for development)
- **`key.pem`** — Private key for SSL certificate
- **`.gitkeep`** — Ensures directory exists in repository

## 🔧 Configuration Details

### Service Mapping
- **Development** (`dev.conf`): `api-dev:5000`, `web-dev:3000`
- **Database Platform** (`database-platform.conf`): `dbplatform-*:300X`
- **Standard Production** (`default.conf`): `dbplatform-api:3000`, `dbplatform-web:3001`

### Rate Limiting Zones
- **API General**: 30 req/sec with burst 50
- **Database Queries**: 50 req/sec with burst 100  
- **Authentication**: 5 req/min with burst 5
- **Provisioning**: 10 req/sec with burst 10

### SSL/TLS Security
- **Protocols**: TLS 1.2, TLS 1.3 only
- **Ciphers**: Modern ECDHE ciphers with forward secrecy
- **HSTS**: Enabled with 1-year max-age
- **Certificate**: Self-signed for development (replace for production)

## 🚀 Common Operations

### Development
```bash
# Start development stack with nginx
./scripts/start-dev.sh

# Access via nginx proxy
curl http://localhost/api/health
```

### Database Platform
```bash  
# Start database platform stack
./scripts/start-database-platform.sh

# Access database platform
curl http://localhost/api/v1/tenants/
```

### Production Operations
```bash
# Reload nginx after config changes
docker compose exec dbplatform-nginx nginx -s reload

# Test nginx configuration
docker compose exec dbplatform-nginx nginx -t

# View nginx logs
docker compose logs dbplatform-nginx
```

### Adding New Services
1. Add upstream definition in appropriate `nginx*.conf`
2. Add location block in appropriate `conf.d/*.conf`
3. Configure rate limiting if needed
4. Test with `nginx -t`

Security & TLS

- For production, use certificates issued by a trusted CA (Let's Encrypt or internal CA). Do not commit cert private keys to the repo.
- Automate certificate renewal with an ACME client and ensure the renewed certs are mounted into the `nginx` container.

Notes for developers

- The dev compose file does not include the nginx service by default (the dev compose targets API and web directly). Use the production compose to test full reverse-proxy behaviour.

Example nginx snippet (proxying `/api` to an upstream):

```nginx
location /api/ {
  proxy_pass http://api:3000/;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

End of nginx README
