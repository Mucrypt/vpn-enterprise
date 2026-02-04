# 🔄 Stripe Mode Toggle - World-Class Edition

A professional-grade utility for seamlessly switching between Stripe test and live modes across your entire infrastructure.

## 🎯 Features

- ✅ **One Command Operation** - Switch modes with a single command
- ✅ **Automatic Backups** - Every change creates a timestamped backup
- ✅ **Production Sync** - Automatically updates production servers
- ✅ **Safety Checks** - Requires explicit confirmation for live mode
- ✅ **Status Monitoring** - Check current mode anytime
- ✅ **Beautiful UI** - Color-coded output with emojis
- ✅ **Error Handling** - Robust error detection and reporting
- ✅ **SSH Integration** - Updates remote servers securely
- ✅ **Docker Support** - Updates secrets and restarts containers
- ✅ **Zero Downtime** - Smart container restart strategy

## 🚀 Quick Start

```bash
# Make script executable (first time only)
chmod +x scripts/stripe-mode-toggle.sh

# Check current status
./scripts/stripe-mode-toggle.sh status

# Switch to test mode (safe for development)
./scripts/stripe-mode-toggle.sh test

# Switch to live mode (requires 'LIVE' confirmation)
./scripts/stripe-mode-toggle.sh live

# Show help
./scripts/stripe-mode-toggle.sh help
```

## 📋 Commands

| Command  | Description                | Safety Level             |
| -------- | -------------------------- | ------------------------ |
| `test`   | Switch to test mode        | 🟢 Safe                  |
| `live`   | Switch to live mode        | 🔴 Requires confirmation |
| `status` | Show current configuration | 🟢 Read-only             |
| `help`   | Display usage guide        | 🟢 Read-only             |

## 🎬 Usage Examples

### Development Workflow

```bash
# Start development with test mode
./scripts/stripe-mode-toggle.sh test

# Test your payment flow with test cards:
# - 4242 4242 4242 4242 (Success)
# - 4000 0000 0000 0002 (Declined)
# - 4000 0025 0000 3155 (3DS Auth)

# Check everything is working
./scripts/stripe-mode-toggle.sh status
```

### Production Deployment

```bash
# Before going live, verify test mode works
./scripts/stripe-mode-toggle.sh test
# ... test thoroughly ...

# Switch to live mode (will ask for confirmation)
./scripts/stripe-mode-toggle.sh live
# Type 'LIVE' to confirm

# Verify live mode is active
./scripts/stripe-mode-toggle.sh status
```

### Emergency Rollback

```bash
# Quick rollback to test mode if issues arise
./scripts/stripe-mode-toggle.sh test

# Check backups if needed
ls -lh .stripe-backups/
```

## 🔧 What It Does

### When Switching Modes

The script automatically performs these operations:

1. **Creates Backup**
   - Timestamps: `env_backup_test_20260204_183045.env`
   - Stored in: `.stripe-backups/`

2. **Updates Local Environment**
   - `STRIPE_SECRET_KEY` → New secret key
   - `STRIPE_PUBLISHABLE_KEY` → New publishable key
   - `STRIPE_WEBHOOK_SECRET` → New webhook secret
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → New frontend key

3. **Updates Production Server** (if SSH available)
   - Docker secret file: `/opt/vpn-enterprise/infrastructure/docker/secrets/stripe_secret_key`
   - Production .env: `/opt/vpn-enterprise/.env`
   - Restarts containers: `api` and `web`

4. **Verifies Deployment**
   - Checks API logs for "Stripe initialized"
   - Confirms container health

## 📁 File Structure

```
vpn-enterprise/
├── scripts/
│   ├── stripe-mode-toggle.sh       # Main script
│   └── STRIPE_MODE_TOGGLE.md       # This file
├── .env                             # Local environment (updated)
├── .stripe-backups/                 # Automatic backups
│   ├── env_backup_test_20260204_183045.env
│   └── env_backup_live_20260204_190230.env
└── infrastructure/
    └── docker/
        └── secrets/
            └── stripe_secret_key    # Production secret (updated)
```

## 🔐 Security Features

### Test Mode

- ✅ No confirmation required
- ✅ Uses Stripe test keys
- ✅ Safe for development
- ✅ Free test transactions

### Live Mode

- ⚠️ Requires typing "LIVE" to confirm
- ⚠️ Uses real Stripe keys
- ⚠️ Charges real money
- ⚠️ Clear warnings displayed

### Backup System

- Automatic backup before every change
- Timestamped filenames
- Never overwrites existing backups
- Easy restore: `cp .stripe-backups/env_backup_*.env .env`

## 🌐 Production Server Integration

The script automatically detects and updates your production server:

- **Server**: `root@157.180.123.240`
- **Path**: `/opt/vpn-enterprise`
- **Method**: SSH with key authentication
- **Containers**: Docker Compose (prod mode)

### SSH Requirements

Ensure you can SSH to production without password:

```bash
# Test SSH connection
ssh root@157.180.123.240 exit

# If prompted for password, set up SSH keys:
ssh-copy-id root@157.180.123.240
```

## 🎨 Output Examples

### Status Check

```
╔════════════════════════════════════════════════════════════╗
║  🔄 STRIPE MODE TOGGLE - Professional Edition        ║
╚════════════════════════════════════════════════════════════╝

▶ Current Configuration Status

Mode: TEST MODE 🧪
Secret Key: sk_test_51OmeWZKQ56f...00Q0GYYNOm
Publishable Key: pk_test_51OmeWZKQ56f...00Dp1LuhDc
────────────────────────────────────────────────────────────
```

### Switching Modes

```
▶ Switching from test mode to live mode
────────────────────────────────────────────────────────────

▶ Updating local .env file to live mode...
✅ Backup created: env_backup_live_20260204_183045.env
✅ Local .env file updated to live mode

▶ Updating production server to live mode...
✅ SSH connection established
ℹ️  Updating Docker secret file...
✅ Docker secret updated
ℹ️  Updating production .env file...
✅ Production .env updated
```

## 🐛 Troubleshooting

### SSH Connection Issues

```bash
# Test SSH manually
ssh root@157.180.123.240 exit

# Check SSH key permissions
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub
```

### Script Permission Issues

```bash
# Make script executable
chmod +x scripts/stripe-mode-toggle.sh

# Check file permissions
ls -lh scripts/stripe-mode-toggle.sh
```

### Backup Restoration

```bash
# List available backups
ls -lh .stripe-backups/

# Restore from backup
cp .stripe-backups/env_backup_test_20260204_183045.env .env

# Verify restoration
./scripts/stripe-mode-toggle.sh status
```

## 📊 Status Indicators

| Indicator    | Meaning                                |
| ------------ | -------------------------------------- |
| 🧪 TEST MODE | Safe test environment active           |
| 💰 LIVE MODE | Production mode with real transactions |
| ✅           | Operation successful                   |
| ❌           | Operation failed                       |
| ⚠️           | Warning or caution                     |
| ℹ️           | Informational message                  |

## 🔄 Update Script

To update the script with new keys or configuration:

```bash
# Edit the script
nano scripts/stripe-mode-toggle.sh

# Update these sections:
# - TEST_KEYS array (lines 40-44)
# - LIVE_KEYS array (lines 46-50)
# - PROD_SERVER (line 31)
```

## 🚨 Emergency Procedures

### Quick Rollback to Test Mode

```bash
./scripts/stripe-mode-toggle.sh test
```

### Manual Production Rollback

```bash
# SSH to production
ssh root@157.180.123.240

# Update secret
cd /opt/vpn-enterprise/infrastructure/docker/secrets
echo -n "sk_test_YOUR_KEY" > stripe_secret_key

# Update .env
cd /opt/vpn-enterprise
nano .env  # Change NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Restart containers
cd infrastructure/docker
docker compose -f docker-compose.prod.yml up -d --force-recreate api web
```

## 📝 Changelog

### Version 1.0.0 (2026-02-04)

- Initial release
- Test/Live mode switching
- Automatic backups
- Production server integration
- Docker secret management
- Beautiful CLI interface
- Comprehensive error handling

## 🤝 Contributing

To improve this script:

1. Edit `scripts/stripe-mode-toggle.sh`
2. Test thoroughly with `./scripts/stripe-mode-toggle.sh status`
3. Update this documentation
4. Commit changes with clear message

## 📄 License

Part of VPN Enterprise Platform - Internal Tool

---

**Created by**: VPN Enterprise Team  
**Last Updated**: February 4, 2026  
**Version**: 1.0.0

For support or questions, check the main project documentation or contact the development team.
