#!/usr/bin/env bash
# Database Backup Script
# Usage: ./db-backup.sh [database_name] [backup_dir]

set -euo pipefail

DATABASE="${1:-postgres}"
BACKUP_DIR="${2:-/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DATABASE}_${TIMESTAMP}.sql.gz"

echo "🔄 Starting backup of database: ${DATABASE}"
echo "📁 Backup location: ${BACKUP_FILE}"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Perform backup with compression
pg_dump -U "${POSTGRES_USER:-postgres}" \
        -h "${POSTGRES_HOST:-postgres-primary}" \
        -p "${POSTGRES_PORT:-5432}" \
        -d "${DATABASE}" \
        --format=plain \
        --no-owner \
        --no-acl \
        | gzip > "${BACKUP_FILE}"

# Verify backup
if [ -f "${BACKUP_FILE}" ]; then
    SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "✅ Backup completed successfully: ${BACKUP_FILE} (${SIZE})"
    
    # Clean up old backups (keep last 30 days)
    find "${BACKUP_DIR}" -name "${DATABASE}_*.sql.gz" -mtime +30 -delete
    echo "🧹 Cleaned up backups older than 30 days"
else
    echo "❌ Backup failed!"
    exit 1
fi
