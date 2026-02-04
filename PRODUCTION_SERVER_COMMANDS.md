# 🚀 Production Server Quick Commands

## Your Production Setup

- **Server**: Hetzner (157.180.123.240)
- **Project Path**: `/opt/vpn-enterprise`
- **Domain**: https://chatbuilds.com
- **Compose File**: `docker-compose.prod.yml`

---

## ✅ Containers Are Already Rebuilt!

Good news! Your containers were successfully rebuilt with the billing fixes. Now you just need to verify everything is working.

---

## 🔍 Verify Everything is Working

### 1. Check Container Status

```bash
cd /opt/vpn-enterprise/infrastructure/docker
docker compose -f docker-compose.prod.yml ps
```

### 2. Check API Logs

```bash
docker compose -f docker-compose.prod.yml logs -f api
```

_Press Ctrl+C to exit_

### 3. Check Web Dashboard Logs

```bash
docker compose -f docker-compose.prod.yml logs -f web
```

_Press Ctrl+C to exit_

### 4. Test Billing Endpoint

```bash
# From inside the API container
docker exec vpn-api curl -f http://localhost:3000/api/v1/billing/services

# Or via nginx
curl -f http://localhost/api/v1/billing/services
```

---

## 🌐 Test in Browser

1. **Open**: https://chatbuilds.com/dashboard/billing
2. **Open DevTools**: Press F12
3. **Check Console**: Should see NO errors:
   - ✅ No Stripe errors
   - ✅ No 404 errors
   - ✅ No 500 errors

---

## 🔧 If You Need to Restart

### Restart Specific Service

```bash
cd /opt/vpn-enterprise/infrastructure/docker
docker compose -f docker-compose.prod.yml restart api
docker compose -f docker-compose.prod.yml restart web
```

### Restart Everything

```bash
cd /opt/vpn-enterprise/infrastructure/docker
docker compose -f docker-compose.prod.yml restart
```

---

## ⚠️ Environment Variables

Your containers showed these warnings during build:

```
WARN[0000] The "NEXT_PUBLIC_API_URL" variable is not set
WARN[0000] The "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" variable is not set
```

### To Fix This:

1. **Create/Update `.env` file**:

```bash
cd /opt/vpn-enterprise
nano .env
```

2. **Add these lines**:

```env
NEXT_PUBLIC_API_URL=https://chatbuilds.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51QfVgdDfCqb8ZcAhxF0VlB6zdkpwJe9Fj3FQNM9Oj3CaBxrKT0VzjzRWc8Yqzh0YW7B2X3Y4Z5A6B7C8D9E0F
```

3. **Rebuild ONLY the web container** (quick):

```bash
cd /opt/vpn-enterprise/infrastructure/docker
docker compose -f docker-compose.prod.yml up -d --build --no-deps web
```

---

## 📊 Check Service Health

```bash
# Check API health
curl http://localhost:3000/health

# Check nginx
curl http://localhost/health

# Check billing endpoint
curl http://localhost:3000/api/v1/billing/services | jq
```

---

## 🎯 Expected Results

After the containers are running, you should be able to:

- ✅ Visit https://chatbuilds.com/dashboard/billing
- ✅ See pricing plans load correctly
- ✅ See transaction history (empty is OK)
- ✅ No console errors in browser
- ✅ Stripe integration loads (if key is configured)

---

## 📝 Quick Deploy Script (For Future Updates)

The fixed deployment script is now at:

```bash
/opt/vpn-enterprise/deploy-billing-fix.sh
```

It will work from `/opt/vpn-enterprise` now. To use it:

```bash
cd /opt/vpn-enterprise
./deploy-billing-fix.sh
```

---

## 🆘 Troubleshooting

### Billing page shows errors?

```bash
# Check API logs for errors
docker compose -f docker-compose.prod.yml logs api | grep -i error

# Check web logs
docker compose -f docker-compose.prod.yml logs web | grep -i error
```

### Containers not running?

```bash
# See what's wrong
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100
```

### Need to rollback?

```bash
cd /opt/vpn-enterprise
git log --oneline -5  # Find previous commit
git checkout <commit-hash>
cd infrastructure/docker
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 📞 Next Steps

1. ✅ Containers are built - **DONE**
2. ⏭️ Test the billing page in browser
3. ⏭️ Check for any console errors
4. ⏭️ If everything works, you're done!
5. ⏭️ If there are environment variable warnings, add `.env` file and rebuild web container
