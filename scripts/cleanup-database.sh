#!/bin/bash
# Database cleanup script for development/testing
# WARNING: This will delete user data. Use with caution!

set -e

echo "🗑️  Database Cleanup Script"
echo "=========================="
echo ""

# Check if running on server
if [ ! -f "/.dockerenv" ] && [ -z "$SSH_CONNECTION" ]; then
    echo "⚠️  This script should be run on your server where Docker is running"
    echo "Usage: ssh into server, then run: bash scripts/cleanup-database.sh"
    exit 1
fi

echo "This will delete:"
echo "  - All regular users (keeps admins)"
echo "  - All tenant projects"
echo "  - All tenant memberships"
echo ""
read -p "Are you sure? (type 'yes' to continue): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🔍 Listing current users..."
docker exec -i vpn-postgres psql -U platform_admin -d platform_db << 'SQL'
SELECT id, email, role FROM users ORDER BY created_at;
SQL

echo ""
read -p "Enter user email to DELETE (or 'all' to delete all non-admin users, 'cancel' to stop): " user_input

if [ "$user_input" = "cancel" ]; then
    echo "Cancelled."
    exit 0
fi

if [ "$user_input" = "all" ]; then
    echo ""
    echo "🗑️  Deleting all non-admin users and their data..."
    
    docker exec -i vpn-postgres psql -U platform_admin -d platform_db << 'SQL'
    BEGIN;
    
    -- Delete tenant memberships for non-admin users
    DELETE FROM tenant_members 
    WHERE user_id IN (
        SELECT id FROM users 
        WHERE role NOT IN ('admin', 'super_admin')
    );
    
    -- Delete tenants owned only by non-admin users
    DELETE FROM tenants 
    WHERE id IN (
        SELECT DISTINCT t.id 
        FROM tenants t
        LEFT JOIN tenant_members tm ON t.id = tm.tenant_id
        LEFT JOIN users u ON tm.user_id = u.id
        WHERE u.role NOT IN ('admin', 'super_admin') OR u.id IS NULL
    );
    
    -- Delete non-admin users
    DELETE FROM users 
    WHERE role NOT IN ('admin', 'super_admin');
    
    COMMIT;
    
    SELECT 'Cleanup complete!' as status;
    SELECT COUNT(*) as remaining_users FROM users;
SQL
    
else
    echo ""
    echo "🗑️  Deleting user: $user_input"
    
    docker exec -i vpn-postgres psql -U platform_admin -d platform_db << SQL
    BEGIN;
    
    -- Get user ID
    DO \$\$
    DECLARE
        target_user_id UUID;
    BEGIN
        SELECT id INTO target_user_id FROM users WHERE email = '$user_input';
        
        IF target_user_id IS NULL THEN
            RAISE EXCEPTION 'User not found: $user_input';
        END IF;
        
        -- Delete tenant memberships
        DELETE FROM tenant_members WHERE user_id = target_user_id;
        
        -- Delete tenants where user is the only member
        DELETE FROM tenants WHERE id IN (
            SELECT t.id FROM tenants t
            LEFT JOIN tenant_members tm ON t.id = tm.tenant_id
            WHERE tm.user_id IS NULL OR tm.user_id = target_user_id
        );
        
        -- Delete the user
        DELETE FROM users WHERE id = target_user_id;
        
        RAISE NOTICE 'User deleted: $user_input';
    END \$\$;
    
    COMMIT;
SQL
    
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "🔍 Remaining users:"
docker exec -i vpn-postgres psql -U platform_admin -d platform_db << 'SQL'
SELECT email, role, created_at FROM users ORDER BY created_at;
SQL

echo ""
echo "🔍 Remaining tenants:"
docker exec -i vpn-postgres psql -U platform_admin -d platform_db << 'SQL'
SELECT id, name, created_at FROM tenants ORDER BY created_at;
SQL
