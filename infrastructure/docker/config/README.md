# Docker Config Files

Environment-specific configuration files for different deployment environments.

## Files

- `app.dev.env` - Development environment configuration
- `app.prod.env` - Production environment configuration

## Usage

These files contain **non-sensitive** configuration values that vary between environments:

- Service URLs
- Database hosts/ports
- Feature flags
- Logging levels
- CORS settings

**Sensitive values** (passwords, keys) should go in `/secrets/` directory.

## How to Use

In `docker-compose.yml`:

```yaml
services:
  api-dev:
    env_file:
      - ../../.env                    # Root environment variables
      - ./config/app.dev.env          # Development config
```

## Adding New Config Values

1. Add to both `app.dev.env` and `app.prod.env`
2. Document the purpose in comments
3. Use appropriate values for each environment
4. Never add passwords or API keys here - use secrets instead
