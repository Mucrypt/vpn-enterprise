# 🚀 Quick Deployment Command

## One-Command Deploy (Recommended)

```bash
cd /home/mukulah/vpn-enterprise && ./deploy-billing-fix.sh
```

This script will:
1. ✅ Check environment variables
2. ✅ Build the API
3. ✅ Rebuild Docker containers
4. ✅ Start all services
5. ✅ Verify everything is working

---

## Alternative: Manual Deploy

```bash
cd /home/mukulah/vpn-enterprise/infrastructure/docker
docker-compose down
docker-compose build --no-cache api web-dashboard
docker-compose up -d
docker-compose logs -f
```

---

## Quick Test

After deployment, test in browser:

1. Visit: `https://chatbuilds.com/dashboard/billing`
2. Open DevTools (F12) → Console tab
3. Verify NO errors:
   - ✅ No Stripe errors
   - ✅ No 404 errors
   - ✅ No 500 errors

---

## Rollback (if needed)

```bash
cd /home/mukulah/vpn-enterprise
git stash  # Save current changes
git checkout main  # Go back to last working version
cd infrastructure/docker
docker-compose restart
```

---

## Get Help

- Full guide: `cat BILLING_DEPLOYMENT_GUIDE.md`
- Summary: `cat BILLING_FIXES_SUMMARY.md`
- Logs: `docker-compose logs -f api web-dashboard`
