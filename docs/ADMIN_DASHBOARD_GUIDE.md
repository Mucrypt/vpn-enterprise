# Admin Dashboard - Complete Guide

> **World-class platform administration center**  
> Full CRUD operations for users and database projects

---

## 🎯 Overview

The Admin Dashboard at `/databases/admin` is your **central control center** for managing the entire VPN Enterprise platform. It provides comprehensive tools for:

- 👥 **User Management** - Create, update, delete, and manage roles
- 🗄️ **Database Projects** - Monitor and manage user-created projects
- 🔐 **Access Control** - Grant and revoke admin privileges
- 📊 **Analytics** - View platform statistics and usage metrics

---

## 🚀 Quick Start

### Access Requirements

```
✅ Admin Role: user_role = 'admin' OR 'super_admin'
✅ Authentication: Valid JWT token in cookies
✅ URL: https://chatbuilds.com/databases/admin
```

### First Time Setup

```sql
-- Promote your account to admin
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'your-email@example.com';
```

---

## 📱 Features

### 1. User Management Tab

#### Create New User

**Steps:**
1. Click **"Create User"** button (top right)
2. Fill in the form:
   - **Email**: User's email address
   - **Password**: Minimum 8 characters
   - **Role**: user | admin | super_admin
3. Click **"Create User"**

**Form Validation:**
- ✅ Email format check
- ✅ Password length ≥ 8 characters
- ✅ Role must be valid value
- ✅ Email uniqueness check

**What Happens:**
```sql
INSERT INTO auth.users (email, encrypted_password, raw_user_meta_data)
VALUES ($email, crypt($password, gen_salt('bf')), '{"role": "$role"}');
```

**Success Response:**
```
✅ User created successfully
Shows: email, role, created_at
```

---

#### Update User Role

**Steps:**
1. Find user in the table
2. Click role dropdown
3. Select new role:
   - **User** - Can create own projects
   - **Admin** - Can access admin dashboard
   - **Super Admin** - Full platform control (protected)
4. Role updates immediately

**Visual Indicators:**
- 🟢 Green badge = Admin/Super Admin
- ⚪ Gray badge = Regular User
- 🛡️ Shield icon = Protected account

**API Call:**
```http
PATCH /api/v1/admin/users/{userId}/role
{
  "role": "admin"
}
```

---

#### Delete User

**Steps:**
1. Find user in table
2. Click red **Trash** icon
3. Confirm deletion in dialog

**Safety Checks:**
- ❌ Cannot delete admin/super_admin users
- ⚠️ Confirmation dialog explains cascade effects
- 🔄 Removes tenant memberships
- 📊 Marks orphaned projects as deleted

**What Gets Deleted:**
```
1. User account (auth.users)
2. All tenant_members entries
3. Orphaned tenant projects marked 'deleted'
```

---

### 2. Database Projects Tab

#### View All Projects

**Columns Displayed:**
- **Project** - Name, subdomain, owner email
- **Region** - Geographic location (🇺🇸 🇪🇺 🇸🇬 🇯🇵)
- **Plan** - free | premium
- **Database** - PostgreSQL database name
- **Created** - Project creation date
- **Actions** - View, Delete buttons

#### Delete Database Project

**Steps:**
1. Find project in table
2. Click red **Trash** icon
3. Confirm deletion

**Complete Cleanup:**
```sql
-- 1. Terminate connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'tenant_xxxxx';

-- 2. Drop database
DROP DATABASE "tenant_xxxxx";

-- 3. Drop role
DROP ROLE "tenant_xxxxx_owner";

-- 4. Remove metadata
DELETE FROM tenant_members WHERE tenant_id = $id;
DELETE FROM tenants WHERE id = $id;
```

---

## 🎨 UI/UX Features

### Professional Design

**Visual Elements:**
- ✨ Avatar icons with user initials
- 🛡️ Shield badges for admin users
- 📅 Calendar icons for dates
- ⚡ Activity indicators for last sign-in
- 🎯 Color-coded roles and status

**Interactions:**
- Hover effects on all buttons
- Smooth transitions
- Loading spinners for async ops
- Disabled states during operations

### Toast Notifications

**Success Notifications:**
```
✅ User created successfully
✅ Role updated to admin
✅ Project deleted successfully
```

**Error Notifications:**
```
❌ Email and password are required
❌ Cannot delete admin users
❌ Failed to create user: [reason]
```

**Auto-dismiss:** 5 seconds

---

## 🔒 Security & Safety

### Role-Based Access Control

**Middleware Protection:**
```typescript
authMiddleware → Verifies JWT token
adminMiddleware → Checks user role = 'admin' | 'super_admin'
```

**Protected Actions:**
- ❌ Cannot modify super_admin users
- ❌ Cannot delete admin users
- ❌ Regular users cannot access /databases/admin

### Input Validation

**Email:**
- Valid format check
- Uniqueness validation
- Case-insensitive storage

**Password:**
- Minimum 8 characters
- Bcrypt hashing (strength 10)
- Never logged or exposed

**Role:**
- Enum validation: user | admin | super_admin
- Stored in raw_user_meta_data JSON

### Confirmation Dialogs

**Delete User:**
```
⚠️ Delete user user@example.com?

This will:
• Remove the user account
• Remove all tenant memberships
• Mark orphaned tenants as deleted

This cannot be undone.

[Cancel] [Delete]
```

**Delete Project:**
```
⚠️ Delete project "My Project"?

This will:
• Drop the database tenant_xxxxx
• Remove all project data
• Remove tenant memberships

This cannot be undone.

[Cancel] [Delete]
```

---

## 📊 Statistics Dashboard

**Metrics Displayed:**

```
┌─────────────────┐  ┌─────────────────┐
│ Total Projects  │  │ Free Plans      │
│      42         │  │      38         │
└─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐
│ Premium Plans   │  │ Regions         │
│       4         │  │       3         │
└─────────────────┘  └─────────────────┘
```

**Regional Distribution:**
```
us-east-1  ████████████████████ 25
eu-west-3  ██████████ 12
ap-south-1 █████ 5
```

---

## 🔧 API Reference

### User Management

#### List All Users
```http
GET /api/v1/admin/users
Authorization: Bearer {token}

Response:
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "user",
      "created_at": "2025-01-28T...",
      "last_sign_in_at": "2025-01-28T...",
      "tenant_count": 2
    }
  ],
  "total": 25
}
```

#### Create User
```http
POST /api/v1/admin/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "role": "user"
}

Response:
{
  "success": true,
  "message": "User newuser@example.com created successfully",
  "user": {
    "id": "uuid",
    "email": "newuser@example.com",
    "role": "user",
    "created_at": "2025-01-28T..."
  }
}
```

#### Update User Role
```http
PATCH /api/v1/admin/users/{userId}/role
Authorization: Bearer {token}
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

#### Delete User
```http
DELETE /api/v1/admin/users/{userId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "User user@example.com deleted successfully",
  "deletedTenantMemberships": 3,
  "orphanedTenants": [
    {
      "id": "...",
      "name": "Project Name",
      "db_name": "tenant_xxxxx"
    }
  ]
}
```

### Project Management

#### List All Projects
```http
GET /api/v1/admin/tenants
Authorization: Bearer {token}

Response:
{
  "tenants": [
    {
      "id": "uuid",
      "name": "My Project",
      "subdomain": "my-project",
      "region": "us-east-1",
      "plan_type": "free",
      "owner_email": "owner@example.com",
      "db_name": "tenant_xxxxx",
      "created_at": "2025-01-28T..."
    }
  ],
  "total": 42
}
```

#### Delete Project
```http
DELETE /api/v1/admin/tenants/{tenantId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Project \"My Project\" deleted successfully",
  "deletedDatabase": "tenant_xxxxx",
  "deletedUser": "tenant_xxxxx_owner"
}
```

---

## 🚀 Deployment

### Deploy to Production

```bash
# SSH into server
ssh root@chatbuilds.com

# Pull latest changes
cd /opt/vpn-enterprise
git pull origin main

# Rebuild containers
docker compose -f infrastructure/docker/docker-compose.prod.yml down
docker compose -f infrastructure/docker/docker-compose.prod.yml up -d --build

# Verify
docker logs vpn-api --tail 50
docker logs vpn-web --tail 50
```

### Verify Deployment

```bash
# Check admin access
curl -X GET https://chatbuilds.com/databases/admin \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -I

# Should return 200 OK

# Test create user endpoint
curl -X POST https://chatbuilds.com/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "role": "user"
  }'
```

---

## 🐛 Troubleshooting

### Issue: Cannot Access Admin Dashboard

**Symptoms:** Redirected to /databases or 403 Forbidden

**Solution:**
```sql
-- Check your role
SELECT email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'your-email@example.com';

-- If role is NULL or 'user', update it
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'your-email@example.com';

-- Log out and log back in
```

### Issue: Create User Button Not Working

**Symptoms:** Button click does nothing or shows error

**Check:**
1. Browser console for errors
2. Network tab for API requests
3. Token expiry

**Fix:**
```bash
# Check API logs
docker logs vpn-api --tail 100 | grep "POST /api/v1/admin/users"

# Look for errors
docker logs vpn-api --tail 100 | grep "error"
```

### Issue: User Created But Cannot Login

**Symptoms:** User appears in table but login fails

**Solution:**
```sql
-- Check if user was created properly
SELECT id, email, encrypted_password IS NOT NULL as has_password
FROM auth.users
WHERE email = 'newuser@example.com';

-- If no password, user creation failed
-- Delete and recreate
DELETE FROM auth.users WHERE email = 'newuser@example.com';
-- Then create again via UI
```

### Issue: Cannot Delete Project

**Symptoms:** Delete fails with error

**Common Causes:**
1. Active connections to database
2. Permission issues
3. Database already dropped

**Fix:**
```sql
-- Terminate connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'tenant_xxxxx'
  AND pid <> pg_backend_pid();

-- Try delete again via UI

-- If still fails, manual cleanup
DROP DATABASE IF EXISTS "tenant_xxxxx";
DROP ROLE IF EXISTS "tenant_xxxxx_owner";
DELETE FROM tenant_members WHERE tenant_id = 'uuid';
DELETE FROM tenants WHERE id = 'uuid';
```

---

## 📈 Best Practices

### User Management

✅ **DO:**
- Create users with strong passwords
- Assign appropriate roles (principle of least privilege)
- Review user list regularly
- Remove inactive users

❌ **DON'T:**
- Share admin credentials
- Create users with weak passwords
- Give everyone admin access
- Keep test users in production

### Project Management

✅ **DO:**
- Monitor project creation patterns
- Delete abandoned projects
- Check regional distribution
- Review storage usage

❌ **DON'T:**
- Delete active projects without user consent
- Ignore orphaned databases
- Allow unlimited project creation

### Security

✅ **DO:**
- Log all admin actions (future enhancement)
- Use HTTPS in production
- Rotate admin credentials regularly
- Monitor failed login attempts

❌ **DON'T:**
- Expose admin endpoints publicly
- Log sensitive data (passwords, tokens)
- Skip confirmation dialogs
- Ignore security alerts

---

## 🎓 Training Guide

### For New Admins

**Week 1: Observation**
- Access admin dashboard
- Browse users and projects
- Understand role system
- Review statistics

**Week 2: User Management**
- Create test user
- Update user roles
- Practice search/filter
- Delete test user

**Week 3: Project Management**
- View project details
- Monitor regional distribution
- Understand database structure
- Practice project deletion (test only)

**Week 4: Advanced**
- Handle user requests
- Troubleshoot issues
- Clean up old projects
- Generate usage reports

---

## 🔮 Future Enhancements

### Planned Features

**User Management:**
- [ ] Bulk user import (CSV)
- [ ] Email invitations
- [ ] Password reset links
- [ ] User suspension (soft delete)
- [ ] Login history tracking

**Project Management:**
- [ ] Usage metrics (queries, connections)
- [ ] Storage quotas
- [ ] Backup management
- [ ] Project transfer between users
- [ ] Scheduled cleanups

**Analytics:**
- [ ] Usage dashboards
- [ ] Cost tracking
- [ ] Performance metrics
- [ ] Activity logs
- [ ] Export reports (PDF, CSV)

**Notifications:**
- [ ] Email alerts for admin actions
- [ ] Slack integration
- [ ] User signup notifications
- [ ] Error alerts

---

## 📞 Support

### Getting Help

**Documentation:**
- [Database Schema](./DATABASE_SCHEMA.md)
- [Deployment Guide](./USER_MANAGEMENT_DEPLOYMENT.md)
- [API Reference](./api/README.md)

**Troubleshooting:**
1. Check browser console
2. Review API logs: `docker logs vpn-api`
3. Verify database: `psql -U platform_admin platform_db`
4. Test API endpoints with curl

**Contact:**
- GitHub Issues: [vpn-enterprise/issues](https://github.com/Mucrypt/vpn-enterprise/issues)
- Email: support@chatbuilds.com

---

## 📝 Changelog

### v1.0.0 (2025-01-28)
**Complete Admin Dashboard Implementation**

✅ Full CRUD operations for users
✅ Database project management
✅ Role-based access control
✅ Toast notifications
✅ Form validation
✅ Professional UI/UX
✅ Production-ready security

---

**Built with ❤️ for VPN Enterprise Platform**

*Last updated: January 28, 2026*
