# Admin Panels Organization Guide

## Overview

The VPN Enterprise platform has two distinct admin panels serving different purposes, both following the same dark theme design language.

---

## 1. Super Admin Panel

**Location:** `/dashboard/admin`  
**Purpose:** System-wide VPN infrastructure management

### Features:

- **System Overview Dashboard**
  - Total Servers monitoring
  - Total Users count
  - Active Connections tracking
  - Data Transfer statistics

- **Quick Actions Hub**
  - Navigate to Database Platform
  - Access Organizations management
  - Monitor Realtime services
  - Manage N8N Workflows
  - Create Test VPN Clients
  - View System Alerts
  - Access Security settings
  - Backup Data management

- **System Configuration**
  - **General Settings:** Maintenance mode, Auto-scaling, Email notifications
  - **Security Settings:** 2FA enforcement, IP whitelist, Audit logging
  - **API Configuration:** API key management and documentation
  - **Database Management:** Backup, restore, and maintenance operations

- **System Health Monitoring**
  - API Status (Operational/Down)
  - Database Health (Connection pool status)
  - VPN Servers Status (Online/Offline, Load average)

- **VPN Client Management**
  - Quick test client creation
  - QR code generation for mobile import
  - Configuration file download
  - WireGuard configuration management

### Sub-sections:

- `/dashboard/admin/organizations` - Organization management
- `/dashboard/admin/realtime` - Realtime services monitoring
- `/dashboard/admin/n8n` - N8N workflow automation

---

## 2. Database Platform Admin

**Location:** `/databases/admin`  
**Purpose:** Supabase-like Database-as-a-Service platform management

### Features:

- **Platform Statistics**
  - Total Database Projects
  - Free Plans count
  - Premium Plans count
  - Active Regions count

- **Database Projects Management**
  - View all tenant database projects
  - Filter by name, subdomain, email, or ID
  - See project details (region, plan type, database info)
  - View owner information
  - Delete database projects (with cascade cleanup)

- **Platform Users Management (Full CRUD)**
  - View all Supabase auth.users
  - Create new users with email, password, and role
  - Update user roles (user/admin/super_admin)
  - Delete users (with cascade cleanup)
  - View user activity (created date, last sign-in)
  - Search and filter users

- **Multi-Region Support**
  - US East (us-east-1)
  - EU West (eu-west-3)
  - Asia Pacific Northeast (ap-northeast-1)
  - Asia Pacific Southeast (ap-southeast-1)

### Key Operations:

1. **Create User:**
   - Email validation
   - Password strength requirement (8+ characters)
   - Role assignment (user/admin/super_admin)
   - Automatic password hashing (bcrypt)

2. **Update User Role:**
   - Inline role dropdown selector
   - Instant updates with toast notifications
   - Role validation

3. **Delete User:**
   - Admin protection (cannot delete admins)
   - Cascade cleanup:
     - Remove user account
     - Remove tenant memberships
     - Mark orphaned tenants as deleted
   - Confirmation dialog with details

4. **Delete Project:**
   - Drops PostgreSQL database
   - Drops database role
   - Removes tenant metadata
   - Cleans up tenant_members table
   - Confirmation dialog with impact details

---

## Navigation Flow

### From Main Dashboard:

1. **Regular User:** `/dashboard` → Access to personal resources
2. **Admin User:** `/dashboard/admin` → System administration hub
3. **Database Admin:** `/databases/admin` → Database platform control

### Between Admin Panels:

- **Super Admin → Database Platform:**  
  Click "Database Platform" in Quick Actions → Navigates to `/databases/admin`

- **Database Platform → Super Admin:**  
  Use browser navigation or sidebar menu → Go back to `/dashboard/admin`

---

## Design Theme

Both admin panels share a consistent **dark theme** design language:

### Color Palette:

- **Background:** `#0a0a0a` (page), `#1e1e1e` (cards)
- **Borders:** `border-gray-800` (#1f2937)
- **Text:**
  - Primary: `text-white`
  - Secondary: `text-gray-400`
  - Muted: `text-gray-500`
- **Accent:** `emerald-500/600` (#10b981 / #059669)
- **Success:** `emerald` shades
- **Warning:** `yellow` shades
- **Error:** `red` shades
- **Info:** `blue` and `purple` shades

### UI Components:

- **Cards:** Dark background with subtle gray borders
- **Buttons:**
  - Primary: Emerald with hover states
  - Outline: Gray borders with hover transitions
- **Inputs:** Dark backgrounds with gray borders
- **Badges:** Color-coded by status/type
- **Toast Notifications:** Consistent styling with theme
- **Modals/Dialogs:** Dark overlays with themed content
- **Tables:** Dark rows with hover effects
- **Icons:** Color-coded by function (emerald for success, red for danger, etc.)

### Status Indicators:

- **Operational/Healthy:** Green with pulse animation
- **Warning:** Yellow/Orange
- **Error/Down:** Red
- **Info:** Blue/Purple

---

## Access Control

### Super Admin Panel (`/dashboard/admin`):

- **Required Role:** `super_admin`, `superadmin`, `admin`, `administrator`
- **Protected Route:** ✅ Yes (via `ProtectedRoute` component)
- **Authentication:** JWT token in cookies

### Database Platform Admin (`/databases/admin`):

- **Required Role:** `super_admin` or `admin`
- **Protected Route:** ✅ Yes (middleware checks)
- **Authentication:** JWT token + role validation
- **API Protection:** All endpoints require admin middleware

---

## Best Practices

### For Admins:

1. **Regular Monitoring:** Check System Health dashboard daily
2. **User Management:** Review and update user roles periodically
3. **Database Cleanup:** Remove orphaned projects and users
4. **Backup Strategy:** Schedule regular database backups
5. **Security:** Enable 2FA, IP whitelist, and audit logging

### For Developers:

1. **Theme Consistency:** Always use the dark theme palette
2. **Component Reuse:** Use existing Shadcn UI components
3. **Error Handling:** Provide clear toast notifications
4. **API Design:** Follow RESTful patterns with proper status codes
5. **Security:** Validate all inputs, check roles, log actions

---

## Quick Reference

### Key URLs:

- Super Admin: `/dashboard/admin`
- Database Admin: `/databases/admin`
- Organizations: `/dashboard/admin/organizations`
- Realtime Monitor: `/dashboard/admin/realtime`
- N8N Workflows: `/dashboard/admin/n8n`

### API Endpoints:

- **Users:** `/api/v1/admin/users` (GET, POST, PATCH, DELETE)
- **Tenants:** `/api/v1/admin/tenants` (GET, DELETE)
- **Stats:** `/api/v1/admin/stats` (GET)

### Key Files:

- **Super Admin:** `apps/web-dashboard/app/dashboard/admin/page.tsx`
- **Database Admin:** `apps/web-dashboard/app/databases/admin/database-platform-admin.tsx`
- **User Routes:** `packages/api/src/routes/admin/users.ts`
- **Tenant Routes:** `packages/api/src/routes/admin/tenants.ts`

---

## Troubleshooting

### Users Not Loading:

1. Check API endpoint is responding
2. Verify auth token is present
3. Check role permissions
4. Review browser console for errors
5. Check API logs for server-side errors

### Cannot Delete User/Project:

1. Verify admin role
2. Check for cascade dependencies
3. Review database constraints
4. Check API response for specific error

### Theme Not Applying:

1. Clear browser cache
2. Check Tailwind classes are correct
3. Verify component props
4. Check for CSS conflicts

---

## Future Enhancements

### Planned Features:

- [ ] User activity logs viewer
- [ ] Advanced filtering and sorting
- [ ] Bulk operations (delete multiple users/projects)
- [ ] Export data to CSV/JSON
- [ ] Email notification system for admin actions
- [ ] Real-time status updates via WebSocket
- [ ] Advanced analytics dashboard
- [ ] Role-based permissions customization
- [ ] Audit trail viewer
- [ ] Database metrics and performance monitoring

---

**Last Updated:** January 28, 2026  
**Version:** 1.0  
**Maintainer:** VPN Enterprise Dev Team
