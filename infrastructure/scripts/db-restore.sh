#!/usr/bin/env bash
# Database Restore Script
# Usage: ./db-restore.sh [backup_file] [target_database]

set -euo pipefail

BACKUP_FILE="${1:-}"
TARGET_DB="${2:-postgres}"

if [ -z "${BACKUP_FILE}" ]; then
    echo "❌ Error: Backup file not specified"
    echo "Usage: ./db-restore.sh [backup_file] [target_database]"
    echo ""
    echo "Available backups:"
    ls -lh /backups/*.sql.gz 2>/dev/null || echo "No backups found in /backups"
    exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "❌ Error: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo "🔄 Restoring database: ${TARGET_DB}"
echo "📁 From backup: ${BACKUP_FILE}"
echo ""
read -p "⚠️  This will overwrite ${TARGET_DB}. Continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

# Drop existing connections
echo "🔌 Terminating existing connections..."
psql -U "${POSTGRES_USER:-postgres}" \
     -h "${POSTGRES_HOST:-postgres-primary}" \
     -p "${POSTGRES_PORT:-5432}" \
     -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${TARGET_DB}' AND pid <> pg_backend_pid();" \
     postgres

# Drop and recreate database
echo "🗑️  Dropping database: ${TARGET_DB}"
psql -U "${POSTGRES_USER:-postgres}" \
     -h "${POSTGRES_HOST:-postgres-primary}" \
     -p "${POSTGRES_PORT:-5432}" \
     -c "DROP DATABASE IF EXISTS ${TARGET_DB};" \
     postgres

echo "🆕 Creating database: ${TARGET_DB}"
psql -U "${POSTGRES_USER:-postgres}" \
     -h "${POSTGRES_HOST:-postgres-primary}" \
     -p "${POSTGRES_PORT:-5432}" \
     -c "CREATE DATABASE ${TARGET_DB};" \
     postgres

# Restore from backup
echo "📥 Restoring from backup..."
if [[ "${BACKUP_FILE}" == *.gz ]]; then
    gunzip -c "${BACKUP_FILE}" | psql -U "${POSTGRES_USER:-postgres}" \
                                       -h "${POSTGRES_HOST:-postgres-primary}" \
                                       -p "${POSTGRES_PORT:-5432}" \
                                       -d "${TARGET_DB}"
else
    psql -U "${POSTGRES_USER:-postgres}" \
         -h "${POSTGRES_HOST:-postgres-primary}" \
         -p "${POSTGRES_PORT:-5432}" \
         -d "${TARGET_DB}" \
         -f "${BACKUP_FILE}"
fi

echo "✅ Restore completed successfully!"
