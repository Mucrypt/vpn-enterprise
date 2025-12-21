#!/usr/bin/env bash
# Database Cleanup Script
# Performs maintenance tasks: VACUUM, ANALYZE, and old data cleanup

set -euo pipefail

DATABASE="${1:-postgres}"
DAYS_TO_KEEP="${2:-90}"

echo "🧹 Starting database cleanup: ${DATABASE}"

# Vacuum and analyze
echo "🔄 Running VACUUM ANALYZE..."
psql -U "${POSTGRES_USER:-postgres}" \
     -h "${POSTGRES_HOST:-postgres-primary}" \
     -p "${POSTGRES_PORT:-5432}" \
     -d "${DATABASE}" \
     -c "VACUUM ANALYZE;"

# Get database stats
echo ""
echo "📊 Database Statistics:"
psql -U "${POSTGRES_USER:-postgres}" \
     -h "${POSTGRES_HOST:-postgres-primary}" \
     -p "${POSTGRES_PORT:-5432}" \
     -d "${DATABASE}" \
     -c "SELECT 
            pg_size_pretty(pg_database_size('${DATABASE}')) as database_size,
            (SELECT count(*) FROM pg_stat_activity WHERE datname = '${DATABASE}') as active_connections,
            (SELECT count(*) FROM pg_stat_user_tables) as user_tables;"

# Clean up old audit logs (if table exists)
echo ""
echo "🗑️  Cleaning up old audit logs (older than ${DAYS_TO_KEEP} days)..."
psql -U "${POSTGRES_USER:-postgres}" \
     -h "${POSTGRES_HOST:-postgres-primary}" \
     -p "${POSTGRES_PORT:-5432}" \
     -d "${DATABASE}" \
     -c "DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '${DAYS_TO_KEEP} days';" \
     2>/dev/null || echo "No audit_logs table found (skipping)"

# Clean up old sessions (if table exists)
echo "🗑️  Cleaning up old sessions (older than 30 days)..."
psql -U "${POSTGRES_USER:-postgres}" \
     -h "${POSTGRES_HOST:-postgres-primary}" \
     -p "${POSTGRES_PORT:-5432}" \
     -d "${DATABASE}" \
     -c "DELETE FROM sessions WHERE expires_at < NOW() - INTERVAL '30 days';" \
     2>/dev/null || echo "No sessions table found (skipping)"

# Update statistics
echo ""
echo "📈 Updating table statistics..."
psql -U "${POSTGRES_USER:-postgres}" \
     -h "${POSTGRES_HOST:-postgres-primary}" \
     -p "${POSTGRES_PORT:-5432}" \
     -d "${DATABASE}" \
     -c "ANALYZE;"

# Check for bloat
echo ""
echo "🔍 Checking for table bloat..."
psql -U "${POSTGRES_USER:-postgres}" \
     -h "${POSTGRES_HOST:-postgres-primary}" \
     -p "${POSTGRES_PORT:-5432}" \
     -d "${DATABASE}" \
     -c "SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
            n_dead_tup as dead_tuples
        FROM pg_stat_user_tables 
        WHERE n_dead_tup > 1000
        ORDER BY n_dead_tup DESC 
        LIMIT 10;"

echo ""
echo "✅ Cleanup completed successfully!"
echo "💡 Tip: Run this script regularly via cron for optimal performance"
