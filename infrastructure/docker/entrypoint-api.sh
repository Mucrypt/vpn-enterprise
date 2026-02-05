#!/bin/sh
# ==============================================
# API Container Entrypoint Script
# ==============================================
# Handles Docker socket permissions for terminal system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Starting VPN Enterprise API..."

# Check if Docker socket exists and handle permissions
if [ -e /var/run/docker.sock ]; then
    echo "Docker socket detected - configuring for terminal system..."
    
    # Get the GID of the Docker socket from the host
    DOCKER_SOCK_GID=$(stat -c '%g' /var/run/docker.sock)
    echo "Host Docker socket GID: $DOCKER_SOCK_GID"
    
    # Check if docker group exists, if not create it
    if ! getent group docker > /dev/null 2>&1; then
        echo "Creating docker group with GID $DOCKER_SOCK_GID..."
        addgroup -g "$DOCKER_SOCK_GID" docker
    else
        # Update existing docker group GID to match host
        CURRENT_GID=$(getent group docker | cut -d: -f3)
        if [ "$CURRENT_GID" != "$DOCKER_SOCK_GID" ]; then
            echo "Updating docker group GID from $CURRENT_GID to $DOCKER_SOCK_GID..."
            delgroup docker 2>/dev/null || true
            addgroup -g "$DOCKER_SOCK_GID" docker
        fi
    fi
    
    # Add nodejs user to docker group if not already added
    if ! id -nG nodejs | grep -qw docker; then
        echo "Adding nodejs user to docker group..."
        addgroup nodejs docker
    fi
    
    echo -e "${GREEN}✓ Docker socket configured successfully${NC}"
    echo "Terminal system will be available"
else
    echo -e "${YELLOW}⚠ Docker socket not found${NC}"
    echo "Terminal system will not be available"
    echo "To enable: mount /var/run/docker.sock in docker-compose.yml"
fi

# Test Docker access (as nodejs user)
echo "Testing Docker access..."
if su-exec nodejs docker version > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker CLI accessible${NC}"
else
    echo -e "${YELLOW}⚠ Docker CLI not accessible - terminal features may be limited${NC}"
fi

echo "Starting Node.js application..."
echo "---"

# Execute the main command as nodejs user
exec su-exec nodejs "$@"
