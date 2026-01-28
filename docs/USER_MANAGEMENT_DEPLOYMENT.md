# User Management Feature - Deployment Guide

## What's New

Production-ready user management UI has been added to the admin dashboard at `/databases/admin`. Admins can now:

- **View all platform users** with their email, role, and activity
- **Delete test users** safely with automatic cascade cleanup
- **Switch between tabs**: Database Projects | Platform Users
- **Search and filter** both projects and users
- **Protection**: Admin users cannot be deleted accidentally

## Changes Made

### Frontend (Web Dashboard)

1. **Admin Dashboard Enhanced** (`/databases/admin`)
   - Added tabs: "Database Projects" and "Platform Users"
   - User table shows: email, role, created date, last sign-in, actions
   - Delete button with confirmation dialog
   - Search works across both tabs
   - Real-time state management after deletion

2. **Server Component** (`apps/web-dashboard/app/databases/admin/page.tsx`)
   - Now fetches both tenants AND users
   - Passes `initialUsers` prop to client component

### Backend (API)

3. **Admin User Routes** (`packages/api/src/routes/admin/users.ts`)
   - `GET /api/v1/admin/users` - List all users with tenant counts
   - `GET /api/v1/admin/users/:userId` - Get user details
   - `DELETE /api/v1/admin/users/:userId` - Delete user with cascade cleanup

4. **Admin Tenant Routes** (`packages/api/src/routes/admin/tenants.ts`)
   - `GET /api/v1/admin/tenants` - List all tenants with owner info

5. **App Integration** (`packages/api/src/app.ts`)
   - Mounted admin routes at `/api/v1/admin`
   - All endpoints protected by `authMiddleware` + `adminMiddleware`

### Safety Features

- **Admin Protection**: Cannot delete users with `admin` or `super_admin` roles
- **Cascade Cleanup**: Automatically removes:
  - User account from `auth.users`
  - All entries in `tenant_members`
  - Marks orphaned tenants as `deleted`
- **Confirmation Dialog**: Warns about cascade effects before deletion
- **Transaction Safety**: Uses database transactions - either all succeeds or nothing changes

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
3. You should see two tabs: "Database Projects" and "Platform Users"
```

### 2. View Users

```
1. Click "Platform Users" tab
2. See list of all users with:
   - Email address
   - Role badge (admin = green, user = gray)
   - Created date
   - Last sign-in date
   - Delete button
```

### 3. Test Search

```
1. Type in search box
2. Should filter users by email or role
3. Switch to "Database Projects" tab
4. Search should now filter projects
```

### 4. Delete Test User

```
1. Find a test user (NOT an admin)
2. Click "Delete" button
3. Confirmation dialog appears:
   - Shows user email
   - Warns about cascade effects
   - Cannot be undone
4. Click OK to confirm
5. User should disappear from list
6. Check database: user removed from auth.users and tenant_members
```

### 5. Try to Delete Admin (Should Fail)

```
1. Try to delete a user with admin/super_admin role
2. API should return 403 Forbidden
3. User should see error: "Admin users cannot be deleted"
```

## Database Impact

When you delete a user, these changes happen:

```sql
-- 1. Removed from tenant_members
DELETE FROM public.tenant_members WHERE user_id = '<user-id>';

-- 2. Orphaned tenants marked deleted
UPDATE public.tenants 
SET status = 'deleted', updated_at = NOW()
WHERE id IN (SELECT tenant_id FROM tenant_members WHERE user_id = '<user-id>' AND role = 'owner')
  AND NOT EXISTS (SELECT 1 FROM tenant_members WHERE tenant_id = tenants.id);

-- 3. User deleted
DELETE FROM auth.users WHERE id = '<user-id>';
```

## API Endpoints

### List All Users
```http
GET /api/v1/admin/users
Authorization: Bearer <token>

Response:
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "user",
      "created_at": "2025-01-20T...",
      "last_sign_in_at": "2025-01-21T...",
      "tenant_count": 2
    }
  ],
  "total": 5
}
```

### Delete User
```http
DELETE /api/v1/admin/users/{userId}
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "User user@example.com deleted successfully",
  "deletedTenantMemberships": 2,
  "orphanedTenants": [
    { "id": "...", "name": "Test Project", "db_name": "tenant_xxx" }
  ]
}
```

### List All Tenants (for admin)
```http
GET /api/v1/admin/tenants
Authorization: Bearer <token>

Response:
{
  "tenants": [
    {
      "id": "uuid",
      "name": "Project Name",
      "subdomain": "project-slug",
      "region": "us-east-1",
      "plan_type": "free",
      "owner_email": "owner@example.com",
      "created_at": "2025-01-20T..."
    }
  ],
  "total": 10
}
```

## Troubleshooting

### "Unable to verify your identity" still appearing?

```bash
# Ensure you deployed the auth fix commits too:
cd /opt/vpn-enterprise
git log --oneline -10

# Look for these commits:
# f2011e6 - feat: Add user management UI to admin dashboard
# b46b5cf - [previous auth fix commit]
# 5c6c45c - [getAuthToken commit]

# If missing, pull and rebuild
git pull origin main
docker compose -f infrastructure/docker/docker-compose.prod.yml up -d --build
```

### API returning 403 Forbidden?

Check your user role in database:

```sql
-- Connect to platform_db
SELECT email, raw_user_meta_data->>'role' as role 
FROM auth.users 
WHERE email = 'your-email@example.com';

-- If role is not 'admin' or 'super_admin', update it:
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'your-email@example.com';
```

### Users tab empty or not loading?

Check API logs:

```bash
docker logs vpn-api --tail 100 | grep "admin/users"
```

Expected: No errors, status 200

### Delete button not working?

Check browser console for errors:
```javascript
// Should see fetch to:
// https://chatbuilds.com/api/v1/admin/users/<user-id>
// Method: DELETE
// Authorization: Bearer <token>
```

If token missing, ensure you're logged in and cookies are set.

## Rollback Plan

If something goes wrong:

```bash
cd /opt/vpn-enterprise

# Rollback to previous commit
git reset --hard b46b5cf

# Rebuild containers
docker compose -f infrastructure/docker/docker-compose.prod.yml up -d --build
```

No database migrations were added, so no schema changes to revert.

## Next Steps

After deployment, you can:

1. **Clean up test users** safely from the UI
2. **Monitor user activity** - see last sign-in times
3. **Manage user roles** - upgrade users to admin if needed (via SQL for now)
4. **Track project ownership** - see which users own which projects

Future enhancements could include:
- Bulk user deletion
- User role editing from UI
- Email notifications on user deletion
- User audit logs
- Soft delete with restore option

## Support

If you encounter issues:

1. Check docker logs: `docker logs vpn-api` and `docker logs vpn-web`
2. Verify database connection: `docker exec vpn-postgres psql -U platform_admin -d platform_db -c "\dt"`
3. Check commit history: `git log --oneline -5`
4. Review API responses in browser DevTools Network tab

Commit: f2011e6
Branch: main
Date: $(date)
