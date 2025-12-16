#!/bin/bash

# ==============================================
# VPN ENTERPRISE - Database Platform Stopper
# ==============================================

echo "🛑 Stopping VPN Enterprise Database Platform..."

cd infrastructure/docker

# Stop the database platform stack
docker-compose -f docker-compose.database-platform.yml down

echo "✅ Database Platform Stopped Successfully!"
echo ""
echo "💡 To start again, run: ./start-database-platform.sh"