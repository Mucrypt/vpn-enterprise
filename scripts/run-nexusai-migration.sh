#!/bin/bash

# Script to run NexusAI database migration
# This creates the tables needed to store generated apps

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}NexusAI Database Migration${NC}"
echo "=========================================="

# Determine which database to use
echo -e "${BLUE}Select database platform:${NC}"
echo "1) Docker Postgres (dbplatform-postgres-primary)"
echo "2) Supabase (Cloud)"
echo ""
read -p "Enter choice [1-2]: " DB_CHOICE

if [ "$DB_CHOICE" == "1" ]; then
    # Docker Postgres Migration
    echo -e "${GREEN}✓ Using Docker Postgres${NC}"
    
    # Detect which postgres container is running
    if docker ps | grep -q "vpn-postgres"; then
        POSTGRES_CONTAINER="vpn-postgres"
        POSTGRES_USER="postgres"
        POSTGRES_DB="vpn_enterprise"
        echo -e "${BLUE}Detected production container: $POSTGRES_CONTAINER${NC}"
    elif docker ps | grep -q "dbplatform-postgres-primary"; then
        POSTGRES_CONTAINER="dbplatform-postgres-primary"
        POSTGRES_USER="platform_admin"
        POSTGRES_DB="platform_db"
        echo -e "${BLUE}Detected dev container: $POSTGRES_CONTAINER${NC}"
    else
        echo -e "${RED}Error: No postgres container is running${NC}"
        echo "Looked for: vpn-postgres or dbplatform-postgres-primary"
        exit 1
    fi
    
    # Migration file
    MIGRATION_FILE="packages/database/migrations/004_generated_apps.sql"
    
    if [ ! -f "$MIGRATION_FILE" ]; then
        echo -e "${RED}Error: Migration file not found: $MIGRATION_FILE${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Running migration in Docker container...${NC}"
    echo ""
    
    # Copy migration file to container and execute
    docker cp "$MIGRATION_FILE" $POSTGRES_CONTAINER:/tmp/migration.sql
    
    docker exec -i $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB <<EOF
\i /tmp/migration.sql
EOF
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓ Migration completed successfully!${NC}"
        echo ""
        echo "Tables created:"
        echo "  - nexusai_generated_apps"
        echo "  - nexusai_app_files"
        echo ""
        
        # Verify tables exist
        docker exec -i $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB -c "\dt nexusai_*"
    else
        echo -e "${RED}✗ Migration failed${NC}"
        exit 1
    fi
    
elif [ "$DB_CHOICE" == "2" ]; then
    # Supabase Migration
    echo -e "${GREEN}✓ Using Supabase (Cloud)${NC}"
    
    # Load environment variables
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    else
        echo -e "${RED}Error: .env file not found${NC}"
        exit 1
    fi
    
    # Check if required env vars are set
    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        echo -e "${RED}Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY${NC}"
        exit 1
    fi
    
    # Extract project ID from Supabase URL
    PROJECT_REF=$(echo $SUPABASE_URL | sed 's/https:\/\///' | sed 's/.supabase.co//')
    
    echo -e "${GREEN}✓ Supabase Project: $PROJECT_REF${NC}"
    echo ""
    
    # Migration file
    MIGRATION_FILE="packages/database/migrations/004_generated_apps.sql"
    
    if [ ! -f "$MIGRATION_FILE" ]; then
        echo -e "${RED}Error: Migration file not found: $MIGRATION_FILE${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Running migration: 004_generated_apps.sql${NC}"
    echo ""
    
    # Read migration file
    SQL_CONTENT=$(cat "$MIGRATION_FILE")
    
    # Execute migration using Supabase API
    RESPONSE=$(curl -s -o /tmp/migration_response.json -w "%{http_code}" -X POST \
        "$SUPABASE_URL/rest/v1/rpc/exec" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"query\": $(echo "$SQL_CONTENT" | jq -Rs .)}")
    
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "204" ]; then
        echo -e "${GREEN}✓ Migration completed successfully!${NC}"
        echo ""
        echo "Tables created:"
        echo "  - nexusai_generated_apps"
        echo "  - nexusai_app_files"
        echo ""
        echo "Row-level security policies enabled."
    else
        echo -e "${RED}✗ Migration failed with HTTP $RESPONSE${NC}"
        echo "Response:"
        cat /tmp/migration_response.json
        exit 1
    fi
    
else
    echo -e "${RED}Invalid choice${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Migration Complete!"
echo "==========================================${NC}"
