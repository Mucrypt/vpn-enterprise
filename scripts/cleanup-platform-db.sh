#!/bin/bash
# Platform DB Cleanup Script
# Removes redundant tables from platform_db

set -e

echo "🔍 Platform DB Cleanup Script"
echo "================================"
echo ""

# Check if running on production
read -p "⚠️  This will modify platform_db. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "📋 Current table status:"
docker exec vpn-postgres psql -U platform_admin -d platform_db -c "
SELECT 
    'tenants' as table_name, 
    (SELECT COUNT(*) FROM tenants) as record_count
UNION ALL
SELECT 
    'tenant_members', 
    (SELECT COUNT(*) FROM tenant_members)
UNION ALL
SELECT 
    'users (platform)', 
    (SELECT COUNT(*) FROM users)
UNION ALL
SELECT 
    'user (N8N)', 
    (SELECT COUNT(*) FROM \"user\");
"

echo ""
echo "🗑️  Dropping redundant 'users' table (empty, use Supabase instead)..."
docker exec vpn-postgres psql -U platform_admin -d platform_db -c "
DROP TABLE IF EXISTS users CASCADE;
"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 Remaining VPN Enterprise tables:"
docker exec vpn-postgres psql -U platform_admin -d platform_db -c "
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('tenants', 'tenant_members')
ORDER BY table_name;
"

echo ""
echo "💡 Note: All user authentication is handled by Supabase."
echo "   N8N tables are preserved for workflow automation."
