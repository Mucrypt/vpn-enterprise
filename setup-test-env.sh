#!/bin/bash

echo "Setting up test environment for VPN Enterprise API..."

# Check if Docker Desktop is accessible
echo "Checking Docker Desktop..."

# Method 1: Try accessing Docker Desktop directly
export DOCKER_HOST=""
unset DOCKER_HOST

# Try the Docker Desktop named pipe
if command -v docker.exe >/dev/null 2>&1; then
    echo "Found docker.exe, trying Windows Docker..."
    docker.exe ps > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Docker Desktop accessible via docker.exe"
        alias docker='docker.exe'
        alias docker-compose='docker-compose.exe'
        export DOCKER_AVAILABLE=1
    else
        echo "❌ docker.exe not accessible"
    fi
fi

# Method 2: Try Docker from Windows path
if [ -z "$DOCKER_AVAILABLE" ] && [ -f "/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe" ]; then
    echo "Trying Docker from Windows Program Files..."
    "/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe" ps > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Docker Desktop accessible via Windows path"
        alias docker='"/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe"'
        alias docker-compose='"/mnt/c/Program Files/Docker/Docker/resources/bin/docker-compose.exe"'
        export DOCKER_AVAILABLE=1
    else
        echo "❌ Docker from Windows path not accessible"
    fi
fi

# Method 3: Try existing docker command with context switch
if [ -z "$DOCKER_AVAILABLE" ]; then
    echo "Trying existing docker command with context switch..."
    docker context use desktop-linux > /dev/null 2>&1
    unset DOCKER_HOST
    docker ps > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Docker accessible via context switch"
        export DOCKER_AVAILABLE=1
    else
        echo "❌ Docker context switch failed"
    fi
fi

if [ "$DOCKER_AVAILABLE" = "1" ]; then
    echo "🎉 Docker is available! Starting database platform..."
    cd /home/mukulah/vpn-enterprise/infrastructure/docker
    docker-compose -f docker-compose.dev.yml up -d --build
    echo "Waiting for services to start..."
    sleep 10
    echo "Services status:"
    docker-compose -f docker-compose.dev.yml ps
else
    echo "⚠️  Docker not accessible. Will test API with mock data."
    echo "To enable Docker:"
    echo "1. Open Docker Desktop"
    echo "2. Go to Settings > Resources > WSL Integration"
    echo "3. Enable integration with your Ubuntu distribution"
    echo "4. Click 'Apply & Restart'"
fi

echo "Setup complete!"