# NexusAI - Secure, Billable AI App Builder

## 🎯 Overview

NexusAI is a production-ready, credit-based AI application builder integrated with VPN Enterprise Dashboard. It features:

- **Authentication & Authorization** - Secure access control
- **Credit-Based Billing** - Pay-per-use model for AI and databases
- **Rate Limiting** - Prevent abuse and ensure fair usage
- **Multi-Tier Subscriptions** - Free, Pro, and Enterprise plans
- **Automated Database Provisioning** - Instant PostgreSQL with auto-schema
- **Usage Tracking** - Comprehensive analytics and billing logs

## 🔒 Security Architecture

### 1. Authentication Flow

```
User visits NexusAI → Check auth token → If expired/missing → Redirect to dashboard login
                                      → If valid → Load user profile + subscription
```

**Implementation:**

- Frontend: [`ProtectedRoute.tsx`](apps/nexusAi/chat-to-code-38/src/components/ProtectedRoute.tsx) - wraps all protected pages
- Service: [`authService.ts`](apps/nexusAi/chat-to-code-38/src/services/authService.ts) - handles auth state, token validation
- Backend: Uses existing `authMiddleware` from `@vpn-enterprise/auth`

### 2. Rate Limiting

**Prevents abuse with tiered limits:**

- **AI Generation**: 10/hour (Free), 50/hour (Pro), Unlimited (Enterprise)
- **Database Provisioning**: 5/day (Free), 50/day (Pro), Unlimited (Enterprise)
- **API Calls**: 100/minute across all tiers

**Implementation:**

- [`packages/api/src/middleware/rate-limit.ts`](packages/api/src/middleware/rate-limit.ts)
- Uses in-memory store (upgrade to Redis for production clusters)

### 3. Credit System

**Costs:**

- AI Generation: **10 credits** per app
- Database Provisioning: **20 credits** (one-time)
- Database Storage: **5 credits/GB/month** (ongoing)

**Implementation:**

- [`packages/api/src/middleware/billing.ts`](packages/api/src/middleware/billing.ts)
- Checks credits before operation
- Deducts on success
- Logs all transactions

## 💳 Subscription Tiers

| Feature            | Free      | Pro ($29/mo)          | Enterprise      |
| ------------------ | --------- | --------------------- | --------------- |
| AI Credits         | 100/month | 1,000/month           | Unlimited       |
| Databases          | 1 (1GB)   | Unlimited (10GB each) | Custom          |
| Apps               | 3         | Unlimited             | Unlimited       |
| Templates          | Basic     | Premium               | Custom          |
| Support            | Community | Priority              | Dedicated + SLA |
| Team Collaboration | ❌        | ✅                    | ✅              |
| Custom Domains     | ❌        | ✅                    | ✅              |

## 📊 Database Schema

**New Tables:**

- `user_subscriptions` - Plan details, credits, quotas
- `billing_transactions` - Credit usage audit log
- `database_usage` - Storage and query tracking
- `nexusai_generation_logs` - AI generation analytics

**Migration:**

```bash
psql platform_db < packages/database/migrations/005_nexusai_billing.sql
```

## 🚀 Deployment Guide

### 1. Run Database Migrations

```bash
cd /opt/vpn-enterprise
psql -U platform_admin -d platform_db -f packages/database/migrations/005_nexusai_billing.sql
```

### 2. Configure Environment Variables

Add to `infrastructure/docker/config/app.prod.env`:

```env
# NexusAI Billing
NEXUSAI_BILLING_ENABLED=true
NEXUSAI_AI_COST=10
NEXUSAI_DB_COST=20
NEXUSAI_STORAGE_COST=5

# Stripe (for Pro/Enterprise)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Rebuild Services

```bash
cd infrastructure/docker
docker compose -f docker-compose.prod.yml up -d --build api nexusai
```

### 4. Verify Deployment

1. Visit https://chatbuilds.com/nexusai
2. Try to access builder without login → Should redirect to login
3. Login → Should show user dropdown with credits
4. Generate an app → Credits should be deducted
5. Check database: `SELECT * FROM billing_transactions;`

## 🔧 API Changes

### Protected Endpoints

**Before:** Open to anyone with appId
**After:** Requires authentication + credits

```typescript
// POST /api/v1/generated-apps - Save app (requires 10 credits)
router.post(
  '/',
  authMiddleware,
  rateLimitPresets.aiGeneration,
  requireCreditsForAI(),
  async (req, res) => {
    // ... save app logic
  },
)

// POST /api/v1/generated-apps/:appId/database - Provision DB (requires 20 credits)
router.post(
  '/:appId/database',
  authMiddleware,
  rateLimitPresets.databaseProvisioning,
  requireCreditsForDatabase(),
  async (req, res) => {
    // ... provision logic
  },
)
```

### New Endpoints

```typescript
// GET /api/v1/billing/credits - Check credit balance
GET /api/v1/billing/credits
Response: { credits: 85, limit: 100, plan: 'free' }

// GET /api/v1/billing/transactions - Transaction history
GET /api/v1/billing/transactions?limit=50
Response: [{ id, amount, operation, created_at, ... }]

// GET /api/v1/billing/usage - Usage statistics
GET /api/v1/billing/usage
Response: { apps: 2, databases: 1, storage_gb: 0.5 }
```

## 🎨 Frontend Components

### Smart Navbar

- Shows user avatar + credits badge when logged in
- "Upgrade" button for free users
- Dropdown: Dashboard, Billing, Settings, Logout

### Protected Pages

- All builder pages wrapped in `<ProtectedRoute>`
- Auto-redirects to dashboard login with return URL
- Syncs auth state with dashboard via cookies

### Landing Page

- Public homepage at `/nexusai`
- Features, pricing, CTA
- No auth required

## 📈 Monitoring & Analytics

### Track These Metrics

1. **User Acquisition**

   ```sql
   SELECT DATE(created_at), COUNT(*)
   FROM user_subscriptions
   GROUP BY DATE(created_at)
   ORDER BY DATE(created_at) DESC;
   ```

2. **Revenue (MRR)**

   ```sql
   SELECT
     plan_type,
     COUNT(*) as users,
     CASE plan_type
       WHEN 'pro' THEN COUNT(*) * 29
       WHEN 'enterprise' THEN COUNT(*) * 299
       ELSE 0
     END as mrr
   FROM user_subscriptions
   WHERE subscription_status = 'active'
   GROUP BY plan_type;
   ```

3. **Credit Usage**

   ```sql
   SELECT
     operation,
     COUNT(*) as count,
     ABS(SUM(amount)) as total_credits
   FROM billing_transactions
   WHERE created_at > NOW() - INTERVAL '30 days'
   GROUP BY operation;
   ```

4. **Conversion Funnel**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE plan_type = 'free') as free_users,
     COUNT(*) FILTER (WHERE plan_type = 'pro') as pro_users,
     ROUND(100.0 * COUNT(*) FILTER (WHERE plan_type = 'pro') / COUNT(*), 2) as conversion_rate
   FROM user_subscriptions;
   ```

## 🛡️ Security Checklist

- [x] Authentication required for all builder pages
- [x] Rate limiting on all endpoints
- [x] Credit checks before expensive operations
- [x] SQL injection prevention (parameterized queries)
- [x] XSS protection (React escapes by default)
- [x] CSRF protection (SameSite cookies)
- [x] Audit logging for all transactions
- [x] Secure credential storage (environment variables)

## 🚨 Troubleshooting

### Issue: Users not redirected to login

**Solution:** Check CORS settings and cookie domain

```typescript
// In packages/api/src/app.ts
app.use(
  cors({
    origin: ['https://chatbuilds.com', 'https://www.chatbuilds.com'],
    credentials: true,
  }),
)
```

### Issue: Credits not deducting

**Solution:** Check migration ran successfully

```sql
SELECT * FROM user_subscriptions WHERE user_id = 'YOUR_USER_ID';
```

### Issue: Rate limit errors

**Solution:** Adjust limits in `rate-limit.ts` or upgrade user's plan

## 📞 Support

- **Documentation**: https://chatbuilds.com/docs/nexusai
- **API Reference**: https://chatbuilds.com/docs/api
- **Issues**: GitHub Issues
- **Enterprise Support**: support@chatbuilds.com

---

**Built with ❤️ by the VPN Enterprise team**
