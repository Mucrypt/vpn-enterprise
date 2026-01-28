# Deployment Checklist

## Latest Changes to Deploy

### Critical Fixes (Must Deploy Now!)

1. **Auth Token Fix** (Commit: 5c6c45c)
   - Adds Authorization header to `/api/v1/tenants/self`
   - Fixes "Unable to verify your identity" error
   - **Status: ❌ NOT DEPLOYED ON SERVER**

2. **API URL Fix** (Commit: b69b5dd)
   - Changes from `localhost:3001` → `localhost:5000` / `http://api:5000`
   - Fixes database page not loading after project creation
   - **Status: ❌ NOT DEPLOYED ON SERVER**

3. **Redirect Loop Fix** (Commit: bc3e98f)
   - Prevents wizard from staying open after project creation
   - Uses `window.location.href` for hard navigation
   - **Status: ❌ NOT DEPLOYED ON SERVER**

## Deployment Commands

Run these on your Hetzner server:

```bash
# SSH into your server
ssh root@your-server-ip

# Navigate to project
cd /opt/vpn-enterprise

# Pull latest code
git pull origin main

# Verify you're on the latest commit
git log --oneline -1
# Should show: b69b5dd Fix server-side API URL...

# Rebuild and restart containers
cd infrastructure/docker
docker compose -f docker-compose.prod.yml up -d --build

# Watch logs to verify no errors
docker logs vpn-web --tail=50 -f
docker logs vpn-api --tail=50 -f
```

## How to Test After Deployment

### Test 1: Auth Token (Should Fix "Unable to verify your identity")

1. Login as normal user
2. Go to /databases
3. Should see wizard
4. Fill in project details
5. Click "Create project" on step 3
6. **Should NOT see "Unable to verify your identity" error** ✅
7. Should see "Project created" on step 4

### Test 2: Navigation (Should open database editor)

1. After creating project, click "Go to database"
2. **Should redirect to database editor** ✅
3. Should see SQL Editor interface
4. Should NOT redirect back to wizard

### Test 3: Existing Projects (No redirect loop)

1. User with existing project clicks "Databases"
2. **Should go directly to database editor** ✅
3. Should NOT see wizard flash/flicker

## Current Server Status

**Last Deployed Commit:** Unknown (user needs to check)
**Latest Available Commit:** b69b5dd

**Deployment Needed:** ✅ YES - Critical auth and navigation fixes

---

## If Issues Persist After Deployment

1. **Clear browser cookies** - Old tokens might be cached
2. **Check server logs:**
   ```bash
   docker logs vpn-api --tail=100 | grep -i "auth\|tenant"
   ```
3. **Verify environment variables:**
   ```bash
   docker exec vpn-api env | grep -E "NODE_ENV|TENANTS_SOURCE|SUPABASE"
   ```
4. **Check if user exists in database:**
   ```bash
   docker exec -i vpn-postgres psql -U platform_admin -d platform_db -c "SELECT id, email, role FROM users LIMIT 5;"
   ```
