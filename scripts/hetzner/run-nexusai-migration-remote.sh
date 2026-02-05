#!/usr/bin/env bash
# Run NexusAI migration on Hetzner production server

set -euo pipefail

HETZNER_HOST="root@157.180.123.240"
SSH_KEY="${HOME}/.ssh/id_ed25519"
MIGRATION_FILE="packages/database/migrations/004_nexusai_generated_apps.sql"

echo "🚀 Running NexusAI Migration on Hetzner Server"
echo "=============================================="

# Check if migration file exists locally
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "✓ Found migration file: $MIGRATION_FILE"
echo ""

# Copy migration file to Hetzner server
echo "📦 Copying migration file to Hetzner..."
scp -i "$SSH_KEY" "$MIGRATION_FILE" "${HETZNER_HOST}:/tmp/nexusai_migration.sql"

if [ $? -ne 0 ]; then
    echo "❌ Failed to copy migration file"
    exit 1
fi

echo "✓ Migration file copied successfully"
echo ""

# Run migration on Hetzner
echo "🔧 Running migration on production database..."
echo ""

ssh -i "$SSH_KEY" "$HETZNER_HOST" << 'ENDSSH'
set -e

# Check which postgres container is running
if docker ps --format '{{.Names}}' | grep -q "^vpn-postgres$"; then
    POSTGRES_CONTAINER="vpn-postgres"
    echo "✓ Found production container: vpn-postgres"
elif docker ps --format '{{.Names}}' | grep -q "^dbplatform-postgres-primary$"; then
    POSTGRES_CONTAINER="dbplatform-postgres-primary"
    echo "✓ Found database platform container: dbplatform-postgres-primary"
else
    echo "❌ No postgres container running"
    echo "Available containers:"
    docker ps --format '{{.Names}}'
    exit 1
fi

POSTGRES_USER="platform_admin"
POSTGRES_DB="platform_db"

echo ""
echo "Container: $POSTGRES_CONTAINER"
echo "Database: $POSTGRES_DB"
echo "User: $POSTGRES_USER"
echo ""

# Copy migration file into container
docker cp /tmp/nexusai_migration.sql "${POSTGRES_CONTAINER}:/tmp/migration.sql"

# Run migration
echo "Running migration SQL..."
docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /tmp/migration.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Verifying tables:"
    docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt nexusai_*"
    
    echo ""
    echo "Tables created:"
    echo "  ✓ nexusai_generated_apps - Store app metadata"
    echo "  ✓ nexusai_app_files - Store app files and code"
    echo ""
    echo "Helper function:"
    echo "  ✓ get_nexusai_app_stats(app_uuid) - Get app statistics"
else
    echo "❌ Migration failed"
    exit 1
fi

# Cleanup
rm -f /tmp/migration.sql
docker exec "$POSTGRES_CONTAINER" rm -f /tmp/migration.sql

ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 NexusAI migration completed on Hetzner!"
    echo ""
    echo "Next steps:"
    echo "  1. Test app generation from nexusAI frontend"
    echo "  2. Verify apps are stored in database"
    echo "  3. Check that app files are retrievable"
else
    echo ""
    echo "❌ Migration failed on remote server"
    exit 1
fi

# Cleanup local temp files
rm -f /tmp/nexusai_migration.sql

