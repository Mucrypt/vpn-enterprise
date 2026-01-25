#!/bin/bash
# ==============================================
# VPN ENTERPRISE - SECRETS SETUP SCRIPT
# ==============================================
# Helps developers set up secrets for the first time

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SECRETS_DIR="$ROOT_DIR/infrastructure/docker/secrets"
CONFIG_DIR="$ROOT_DIR/infrastructure/docker/config"

echo "🔐 VPN Enterprise - Secrets Setup"
echo "=================================="
echo ""

echo "📁 Checking secrets directory..."
cd "$SECRETS_DIR"

# Function to create secret file
create_secret() {
    local secret_name=$1
    local example_file="${secret_name}.example"
    local secret_file="${secret_name}"
    
    if [ ! -f "$example_file" ]; then
        echo "⚠️  Warning: ${example_file} not found, skipping..."
        return
    fi
    
    if [ -f "$secret_file" ]; then
        echo "✅ ${secret_file} already exists"
        read -p "   Overwrite? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return
        fi
    fi
    
    echo "📝 Creating ${secret_file}..."
    
    # Ask if user wants to generate random or copy from example
    echo "   Choose option:"
    echo "   1) Generate random secure value (recommended)"
    echo "   2) Copy from example file"
    echo "   3) Enter manually"
    read -p "   Selection (1-3): " -n 1 -r choice
    echo ""
    
    case $choice in
        1)
            if [[ "$secret_name" == *"key"* ]]; then
                # For encryption keys, use hex
                openssl rand -hex 32 > "$secret_file"
                echo "   ✅ Generated random hex key (64 chars)"
            else
                # For passwords, use base64
                openssl rand -base64 32 > "$secret_file"
                echo "   ✅ Generated random password (base64)"
            fi
            ;;
        2)
            cp "$example_file" "$secret_file"
            echo "   ⚠️  Copied from example (change this for production!)"
            ;;
        3)
            read -p "   Enter value: " -r manual_value
            echo "$manual_value" > "$secret_file"
            echo "   ✅ Saved manual value"
            ;;
        *)
            echo "   ⚠️  Invalid choice, skipping..."
            return
            ;;
    esac
    
    # Set permissions.
    # NOTE: On non-Swarm Docker Compose, secrets may be bind-mounted with the same
    # permissions as the source file. Some containers (like n8n) run as a non-root
    # user and must be able to read their *_FILE secrets.
    if [[ "$secret_name" == "n8n_encryption_key" ]]; then
        chmod 644 "$secret_file"
        echo "   🔒 Set permissions to 644 (readable by container user)"
        echo "   ℹ️  If you prefer tighter host permissions, use ACLs instead (see docs/DOCKER_SECRETS_CONFIG.md)"
    else
        chmod 600 "$secret_file"
        echo "   🔒 Set permissions to 600 (owner read/write only)"
    fi
}

echo ""
echo "🔐 Setting up secrets..."
echo "========================"
echo ""

# Create each secret
create_secret "db_password"
echo ""
create_secret "redis_password"
echo ""
create_secret "n8n_encryption_key"
echo ""
create_secret "api_key"

echo ""
echo "=================================="
echo "✅ Secrets setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Review created secrets: ls -la $SECRETS_DIR/"
echo "   2. Update .env file with non-secret configs"
echo "   3. Start services:"
echo "      Development: cd infrastructure/docker && docker compose -f docker-compose.dev.yml up -d"
echo "      Production:  cd infrastructure/docker && docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "⚠️  IMPORTANT: Never commit actual secret files to git!"
echo "   Only .example files should be committed."
echo ""
