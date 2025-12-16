#!/bin/bash

# ==============================================
# VPN ENTERPRISE - Simple Database Starter
# ==============================================

set -e

echo "🚀 Starting PostgreSQL Database for VPN Enterprise..."

# Navigate to the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Set default PostgreSQL admin password if not set
if [ -z "$POSTGRES_ADMIN_PASSWORD" ]; then
    export POSTGRES_ADMIN_PASSWORD="platform_admin_password"
    echo "🔒 Using default PostgreSQL admin password"
fi

echo "🐳 Starting database services..."
echo "   - PostgreSQL (port 5433)"
echo "   - Redis (port 6379)"

# Start the simple database stack
docker-compose -f infrastructure/docker/docker-compose.simple-db.yml up -d

echo "⏳ Waiting for services to be ready..."
sleep 15

# Check if PostgreSQL is ready
echo "🔍 Checking PostgreSQL connection..."
docker-compose -f infrastructure/docker/docker-compose.simple-db.yml exec -T postgres-primary pg_isready -U platform_admin -d platform_db || echo "⚠️ PostgreSQL not ready yet, may need a few more seconds"

echo ""
echo "✅ Database Started Successfully!"
echo ""
echo "📊 Connection Details:"
echo "   • Host: localhost"
echo "   • Port: 5433"
echo "   • Database: platform_db"
echo "   • Username: platform_admin"
echo "   • Password: $POSTGRES_ADMIN_PASSWORD"
echo ""
echo "🔧 Connect with psql:"
echo "   psql -h localhost -p 5433 -U platform_admin -d platform_db"
echo ""
echo "🛑 To stop: docker-compose -f infrastructure/docker/docker-compose.simple-db.yml down"