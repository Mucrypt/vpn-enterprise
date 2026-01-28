# Database Platform Admin - Deployment Guide

## What's New

Production-ready admin dashboard at `/databases/admin` with two management areas:

### 1. Database Projects Management (Primary Focus)
- **View all database projects** created by users
- **Delete database projects** with full cleanup:
  - Drops the PostgreSQL database
  - Removes the database user/role
  - Cleans up tenant_members
  - Removes tenant record
- Search and filter projects
- View project details (owner, region, plan, etc.)

### 2. Supabase User Management
- **View all Supabase users** (authentication layer)
- **Promote users to admin** role
- View user activity (created date, last sign-in)
- Protected: Cannot modify admin/super_admin users
- Search and filter users

## Architecture

```
┌─────────────────────────────────────────────────┐
│         Supabase Auth (User Management)         │
│  - Users sign up/login                          │
│  - Roles: user, admin, super_admin              │
│  - Stored in auth.users table                   │
└─────────────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────┐
│    Platform Database (Project Management)       │
│  - Each user can create database projects       │
│  - Stored in public.tenants table               │
│  - tenant_members links users to projects       │
│  - Each project = isolated PostgreSQL database  │
└─────────────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────┐
│       Tenant Databases (User Projects)          │
│  - tenant_xxxxx databases                       │
│  - tenant_xxxxx_owner role/user                 │
│  - Fully isolated per project                   │
└─────────────────────────────────────────────────┘
```

## Changes Made

### Frontend (Web Dashboard)

1. **Database Projects Tab** (`/databases/admin`)
   - Shows all tenant database projects
   - **DELETE button** for each project
   - Confirmation dialog explaining cascade effects
   - Real-time UI updates after deletion

2. **Platform Users Tab**
   - Shows all Supabase authenticated users
   - **"Promote" button** to make users admins
   - Role badges (green=admin, gray=user)
   - Protected status for existing admins

### Backend (API)

3. **Tenant Deletion** (`DELETE /api/v1/admin/tenants/:tenantId`)
   - Terminates active connections
   - Drops PostgreSQL database
   - Drops database role/user
   - Removes tenant_members entries
   - Deletes tenant record
   - Wrapped in transaction for safety

4. **User Role Management** (`PATCH /api/v1/admin/users/:userId/role`)
   - Updates user role in Supabase auth.users metadata
   - Validates role (user, admin, super_admin)
   - Immediate effect on next authentication

### Safety Features

- **Transaction Safety**: All operations wrapped in BEGIN/COMMIT/ROLLBACK
- **Connection Termination**: Kills active connections before dropping database
- **Admin Protection**: Cannot modify admin/super_admin users
- **Confirmation Dialogs**: Clear warnings about irreversible actions
- **Cascade Cleanup**: Automatically removes all related records

## How to Deploy

### Option 1: Pull on Hetzner Server (Recommended)

```bash
# SSH into your server
ssh root@chatbuilds.com

# Navigate to project directory
cd /opt/vpn-enterprise

# Pull latest changes
git pull origin main

# Rebuild and restart containers
docker compose -f infrastructure/docker/docker-compose.prod.yml down
docker compose -f infrastructure/docker/docker-compose.prod.yml up -d --build

# Check logs to verify
docker logs vpn-api --tail 50
docker logs vpn-web --tail 50
```

### Option 2: Manual Verification

If you want to verify before deploying:

```bash
# Check what commits are on server vs GitHub
cd /opt/vpn-enterprise
git fetch origin
git log HEAD..origin/main --oneline

# You should see commits:
# f2011e6 - feat: Add user management UI to admin dashboard
# [previous commits if not deployed yet]
```

## Testing the Feature

### 1. Access Admin Dashboard

```
1. Login to https://chatbuilds.com with admin account
2. Go to /databases/admin
3. You should see two tabs: "Database Projects (X)" and "Platform Users (Y)"
```

### 2. Manage Database Projects

```
1. "Database Projects" tab should be active by default
2. See list of all database projects with:
   - Project name & subdomain
   - Region badge (us-east-1, eu-west-3, etc.)
   - Plan type (free/premium)
   - Database name (tenant_xxxxx)
   - Owner email
   - Delete button (red trash icon)
3. Click Delete button on a test project
4. Confirmation dialog appears explaining:
   - Database will be dropped
   - All project data will be lost
   - Cannot be undone
5. Confirm deletion
6. Project disappears from list
7. Database is actually dropped from PostgreSQL
```

### 3. View Supabase Users

```
1. Click "Platform Users" tab
2. See list of all authenticated users with:
   - Email address
   - Role badge (admin=green, user=gray)
   - Created date
   - Last sign-in date
   - Action button (Promote or Protected)
```

### 4. Promote User to Admin

```
1. Find a regular user (not already admin)
2. Click "Promote" button
3. User's role updates to "admin"
4. Badge changes to green
5. Button changes to "Protected"
6. Next time user logs in, they have admin access
```

### 5. Test Search & Filter

```
1. In Database Projects tab:
   - Search by project name, subdomain, owner email
   - Results update in real-time
2. In Platform Users tab:
   - Search by email or role
   - Filter users instantly
```

### 6. Verify Database Cleanup

```bash
# After deleting a project, verify it's gone
docker exec vpn-postgres psql -U platform_admin -d platform_db -c "
  SELECT database FROM pg_database WHERE datname LIKE 'tenant_%';
"

# Should NOT see the deleted tenant database
# Also check roles
docker exec vpn-postgres psql -U platform_admin -d platform_db -c "
  SELECT rolname FROM pg_roles WHERE rolname LIKE 'tenant_%';
"
# Deleted database role should be gone too
```

## Database Impact

### When you DELETE a database project:

```sql
-- 1. Terminate active connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'tenant_xxxxx';

-- 2. Drop the database
DROP DATABASE "tenant_xxxxx";

-- 3. Drop the database user/role
DROP ROLE "tenant_xxxxx_owner";

-- 4. Remove tenant memberships
DELETE FROM public.tenant_members WHERE tenant_id = '<tenant-id>';

-- 5. Remove tenant record
DELETE FROM public.tenants WHERE id = '<tenant-id>';
```

### When you UPDATE a user's role:

```sql
-- Update role in Supabase auth metadata
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
),
updated_at = NOW()
WHERE id = '<user-id>';

-- User now has admin access on next login
```

## API Endpoints

### Delete Database Project
```http
DELETE /api/v1/admin/tenants/{tenantId}
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Project \"My Project\" deleted successfully",
  "deletedDatabase": "tenant_a1b2c3d4_e5f6_7890_abcd_ef1234567890",
  "deletedUser": "tenant_a1b2c3d4_e5f6_7890_abcd_ef1234567890_owner"
}
```

### Update User Role
```http
PATCH /api/v1/admin/users/{userId}/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "admin"
}

Response:
{
  "success": true,
  "message": "User role updated to admin",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

## Troubleshooting

### "Unable to verify your identity" still appearing?

This issue is fixed in the latest deployment. Make sure you've deployed:

```bash
cd /opt/vpn-enterprise
git log --oneline -10

# Look for these commits:
# 904539d - fix: Move delete functionality to Database Projects...
# f2011e6 - feat: Add user management UI to admin dashboard
# 5c6c45c - [getAuthToken commit]

# If missing, pull and rebuild
git pull origin main
docker compose -f infrastructure/docker/docker-compose.prod.yml up -d --build
```

### Delete button not working on Database Projects?

Check API logs:

```bash
docker logs vpn-api --tail 100 | grep "admin/tenants"
```

Expected: DELETE request with status 200

If you see connection errors dropping the database:
- Ensure no active connections to the database
- Check if database name is correct in connection_info
- Verify platform_admin has DROP DATABASE permission

### Promote button not updating user role?

Check if role is actually updated:

```sql
-- Connect to platform_db
docker exec vpn-postgres psql -U platform_admin -d platform_db -c "
  SELECT email, raw_user_meta_data->>'role' as role 
  FROM auth.users 
  WHERE email = 'user@example.com';
"
```

If role shows correctly but user doesn't have admin access:
- Have user log out and log back in
- Check middleware is reading role from raw_user_meta_data
- Verify cookies are being set with user_role

### Database not being dropped?

If database persists after deletion:

```bash
# Manually check if database exists
docker exec vpn-postgres psql -U platform_admin -d platform_db -c "
  SELECT datname FROM pg_database WHERE datname LIKE 'tenant_%';
"

# Check for active connections blocking drop
docker exec vpn-postgres psql -U platform_admin -d platform_db -c "
  SELECT pid, usename, datname, state
  FROM pg_stat_activity
  WHERE datname LIKE 'tenant_%';
"

# If connections exist, terminate them
docker exec vpn-postgres psql -U platform_admin -d platform_db -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = 'tenant_xxxxx' AND pid <> pg_backend_pid();
"

# Then drop manually
docker exec vpn-postgres psql -U platform_admin -d platform_db -c "
  DROP DATABASE \"tenant_xxxxx\";
"
```

## Rollback Plan

If something goes wrong:

```bash
cd /opt/vpn-enterprise

# Rollback to previous commit
git reset --hard 9e26cd7

# Rebuild containers
docker compose -f infrastructure/docker/docker-compose.prod.yml up -d --build
```

Note: This version had user deletion instead of project deletion. If you need to go back further:
```bash
git reset --hard b46b5cf  # Before user management feature
```

## Next Steps

After deployment, you can:

1. **Clean up test projects** safely from the Database Projects tab
2. **Promote trusted users to admin** from the Platform Users tab
3. **Monitor project creation** - see who creates what and when
4. **Manage abandoned projects** - delete projects that are no longer needed
5. **Track user activity** - see last sign-in times

### Future Enhancements

Potential features to add:
- **Project statistics**: Storage usage, connection count, query metrics
- **User invitation system**: Invite users via email with specific roles
- **Audit logs**: Track all admin actions (deletions, role changes)
- **Soft delete**: Mark projects as deleted but keep backup for 30 days
- **Bulk operations**: Delete multiple projects at once
- **Usage quotas**: Set limits per user or plan type
- **Billing integration**: Track project costs and usage
- **Notification system**: Email users when their project is deleted

### Monitoring Recommendations

Set up alerts for:
- Failed database drops (check API logs)
- Orphaned databases (exist but not in tenants table)
- Users with excessive projects (potential abuse)
- Projects with no recent activity (candidates for cleanup)

## Support

If you encounter issues:

1. Check docker logs: `docker logs vpn-api` and `docker logs vpn-web`
2. Verify database connection: `docker exec vpn-postgres psql -U platform_admin -d platform_db -c "\dt"`
3. Check commit history: `git log --oneline -5`
4. Review API responses in browser DevTools Network tab
5. Test manually via SQL if API fails

**Key Commits:**
- `904539d` - fix: Move delete functionality to Database Projects
- `f2011e6` - feat: Add user management UI to admin dashboard
- `9e26cd7` - docs: Add user management deployment guide

**Branch:** main
**Date:** January 28, 2026
