#!/bin/bash

# ==============================================
# VPN ENTERPRISE - Database Platform Starter
# ==============================================
# This script starts the complete database platform with PostgreSQL and SQL editor

set -e

echo "🚀 Starting VPN Enterprise Database Platform..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found in root directory"
    echo "📋 Please copy .env.example to .env and configure your variables"
    exit 1
fi

# Set default PostgreSQL admin password if not set
if [ -z "$POSTGRES_ADMIN_PASSWORD" ]; then
    export POSTGRES_ADMIN_PASSWORD="platform_admin_password"
    echo "🔒 Using default PostgreSQL admin password. Change POSTGRES_ADMIN_PASSWORD in .env for production."
fi

# Navigate to infrastructure/docker directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo "🐳 Starting database platform services..."
echo "   - PostgreSQL Primary (port 5433)"
echo "   - PostgreSQL Replica"
echo "   - PgBouncer (connection pooler)"
echo "   - Redis (caching)"
echo "   - API Server (port 3000)"
echo "   - Web Dashboard with SQL Editor (port 3001)"
echo "   - Nginx (proxy)"

# Start the database platform stack
docker-compose -f infrastructure/docker/docker-compose.database-platform.yml up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check if PostgreSQL is ready
echo "🔍 Checking PostgreSQL connection..."
docker-compose -f infrastructure/docker/docker-compose.database-platform.yml exec -T postgres-primary pg_isready -U platform_admin -d platform_db

# Check if API is healthy
echo "🔍 Checking API health..."
curl -f http://localhost:3000/health || echo "⚠️ API health check failed"

# Check if Web Dashboard is healthy
echo "🔍 Checking Web Dashboard..."
curl -f http://localhost:3001/health || echo "⚠️ Dashboard health check failed"

echo ""
echo "✅ Database Platform Started Successfully!"
echo ""
echo "📊 Access Points:"
echo "   • Web Dashboard (SQL Editor): http://localhost:3001/dashboard/databases"
echo "   • API Server: http://localhost:3000"
echo "   • PostgreSQL Direct: localhost:5433"
echo "   • Database: platform_db"
echo "   • Username: platform_admin"
echo "   • Password: $POSTGRES_ADMIN_PASSWORD"
echo ""
echo "🔧 Useful Commands:"
echo "   • View logs: docker-compose -f infrastructure/docker/docker-compose.database-platform.yml logs -f"
echo "   • Stop services: docker-compose -f infrastructure/docker/docker-compose.database-platform.yml down"
echo "   • Connect to PostgreSQL: psql -h localhost -p 5433 -U platform_admin -d platform_db"
echo ""
echo "📝 SQL Editor is available at: http://localhost:3001/dashboard/databases"