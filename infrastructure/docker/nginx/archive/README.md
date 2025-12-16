# Nginx Archive

This folder contains nginx configuration files that have been archived during cleanup.

## Archived Files

### `default.conf`
- **Reason**: Replaced with more specific `database-platform.conf`  
- **Purpose**: Generic production server configuration
- **Status**: Available for restoration if generic config needed

The `default.conf` was a generic production configuration. It has been replaced with `database-platform.conf` which provides:
- Better service name mapping for database platform
- Specialized rate limiting for database operations  
- Proper endpoints for tenant management and provisioning
- TCP proxy configuration for PostgreSQL access

## Restoration

To restore the generic configuration:
```bash
mv nginx/archive/default.conf nginx/conf.d/
```

---
*Archived during nginx cleanup: $(date)*