#!/bin/bash

# ==============================================
# VPN Enterprise - Database Development Setup
# ==============================================
# This script sets up PostgreSQL + pgAdmin with web interface

set -e

echo "🚀 Starting VPN Enterprise Database Development Environment..."

# Function to check if Docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker not found. Please install Docker Desktop."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        echo "⚠️  Docker daemon not running."
        echo "📋 Please start Docker Desktop and ensure WSL2 integration is enabled:"
        echo "   1. Open Docker Desktop"
        echo "   2. Go to Settings > Resources > WSL Integration" 
        echo "   3. Enable integration with your WSL2 distro"
        echo "   4. Apply & Restart"
        exit 1
    fi
}

# Function to start database services
start_database() {
    echo "🐳 Starting PostgreSQL + pgAdmin services..."
    
    # Stop any existing containers
    docker-compose -f docker-compose.db-dev.yml down 2>/dev/null || true
    
    # Start services
    docker-compose -f docker-compose.db-dev.yml up -d
    
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 10
    
    # Wait for PostgreSQL to be healthy
    for i in {1..30}; do
        if docker exec vpn-postgres-dev pg_isready -U platform_admin -d platform_db; then
            echo "✅ PostgreSQL is ready!"
            break
        fi
        echo "⏳ Waiting for PostgreSQL... ($i/30)"
        sleep 2
    done
}

# Function to display access information
show_access_info() {
    echo ""
    echo "🎉 Database Development Environment Ready!"
    echo ""
    echo "📊 Web-based Database Management:"
    echo "   • pgAdmin (Full-featured):  http://localhost:8080"
    echo "     - Email: admin@vpnenterprise.com"
    echo "     - Password: admin123"
    echo "     - PostgreSQL connection is pre-configured"
    echo ""
    echo "   • Adminer (Lightweight):   http://localhost:8081"
    echo "     - Server: postgres"
    echo "     - Username: platform_admin" 
    echo "     - Password: platform_admin_password"
    echo "     - Database: platform_db"
    echo ""
    echo "🔌 Direct Database Connection:"
    echo "   • Host: localhost"
    echo "   • Port: 5433"
    echo "   • Database: platform_db"
    echo "   • Username: platform_admin"
    echo "   • Password: platform_admin_password"
    echo ""
    echo "💡 Sample Tables Created:"
    echo "   • users (with sample data)"
    echo "   • posts (ready for testing)"
    echo ""
    echo "🔧 Useful Commands:"
    echo "   • View logs: docker-compose -f docker-compose.db-dev.yml logs -f"
    echo "   • Stop services: docker-compose -f docker-compose.db-dev.yml down"
    echo "   • Connect via psql: psql -h localhost -p 5433 -U platform_admin -d platform_db"
    echo ""
    echo "🌐 Your API should now connect successfully!"
    echo "   Test at: http://localhost:5000/api/v1/tenants"
}

# Main execution
check_docker
start_database
show_access_info