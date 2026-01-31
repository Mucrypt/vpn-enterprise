# 🎯 NexusAI Integration - Quick Start Guide

## ✅ Integration Complete!

Your NexusAI chat-to-code platform is now live and integrated with your production AI infrastructure.

---

## 🚀 Access Your Platform

**NexusAI Application:**
```
https://chatbuilds.com/nexusai/
```

**API Key Required:** You'll need a VPN Enterprise AI API key to use the features.

---

## 🔑 Get Your API Key (30 seconds)

### Step 1: Create API Key
SSH into your server and run:

```bash
ssh root@157.180.123.240

docker exec vpn-python-api curl -X POST \
  http://localhost:5001/auth/create-key \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "your-tenant-name",
    "user_id": "your-username",
    "name": "My NexusAI Key",
    "quota_requests_per_hour": 1000
  }'
```

### Step 2: Copy Your Key
The response will include your API key:
```json
{
  "api_key": "vpn_abc123...",
  "tier": "free",
  "rate_limit": {
    "requests": 100,
    "window": 3600
  }
}
```

### Step 3: Add to NexusAI
1. Visit https://chatbuilds.com/nexusai/
2. Paste your API key in the key manager
3. Click "Save"
4. Start building! 🎉

---

## 💡 What You Can Build

### 1. Generate React Components
```
"Create a responsive navbar with logo, menu items, and user dropdown"
```

**Result:** Full TypeScript component with Tailwind CSS

### 2. Build Complete Apps
```
"Build a task management app like Trello with boards, lists, and cards"
```

**Result:** Complete app structure with routing and components

### 3. Create Database Schemas
```
"E-commerce database with products, orders, customers, and payments"
```

**Result:** Complete PostgreSQL schema with relationships

### 4. Generate APIs
```
"REST API for blog posts with CRUD operations and auth"
```

**Result:** Express.js endpoints with TypeScript and validation

### 5. Fix & Optimize Code
```
"Fix this code: const [count setCount] = useState(0);"
```

**Result:** Fixed code with explanation

---

## 📊 Your Current Setup

**Services Running:**
- ✅ NexusAI (React SPA) - Port 80
- ✅ Python AI API (4 workers) - Port 5001
- ✅ Ollama LLM (llama3.2:1b) - Port 11434
- ✅ Redis (caching) - Port 6379
- ✅ PostgreSQL (data) - Port 5432
- ✅ Nginx (proxy) - Port 443

**Performance:**
- 🚀 Sub-second AI responses (cached)
- ⚡ 4 concurrent workers
- 💾 1-hour response caching
- 🔐 API key authentication
- 📈 Usage tracking per tenant

**Limits:**
- Free Tier: 100 requests/hour
- Pro Tier: 1,000 requests/hour
- Enterprise: 10,000 requests/hour

---

## 🎨 Example Usage

### In Browser Console
```javascript
// Import AI service
import { aiService } from '@/services/aiService';

// Set your API key
aiService.setAPIKey('vpn_abc123...');

// Generate a component
const code = await aiService.generateComponent(
  "A login form with email and password"
);
console.log(code);

// Generate SQL
const sql = await aiService.sqlAssist({
  query: "Get all users who signed up this month",
  action: "generate"
});
console.log(sql);

// Check usage
const usage = await aiService.getUsage();
console.log(`${usage.requests_remaining} requests remaining`);
```

---

## 📚 Documentation

**Detailed Guides:**
- [AI Service Ready](./AI_SERVICE_READY.md) - AI API documentation
- [NexusAI Integration](./NEXUSAI_INTEGRATION.md) - Complete integration guide

**Quick Links:**
- API Docs: https://chatbuilds.com/api/docs
- Health Check: https://chatbuilds.com/api/health
- Usage Stats: `GET /usage` (requires API key)

---

## 🔧 Troubleshooting

### Issue: "API key invalid"
**Solution:** Verify your key format starts with `vpn_` and was created successfully.

### Issue: "Rate limit exceeded"
**Solution:** Check your usage: `curl http://vpn-python-api:5001/usage -H "X-API-Key: your_key"`

### Issue: "NexusAI not loading"
**Solution:** Check services: `docker ps | grep -E "nexusai|python-api|ollama"`

### Issue: "Slow AI responses"
**Solution:** First request is slower (hits Ollama), subsequent identical requests are cached and instant.

---

## 🎯 Next Steps

1. **Try the Examples** - Test component generation, app building, SQL assistance
2. **Upgrade Tier** - Contact admin to increase your rate limit
3. **Add More Models** - Install codellama:7b or mistral:7b for specialized tasks
4. **Enable Streaming** - Get real-time responses as they generate
5. **Build Your App** - Start creating with NexusAI!

---

## 🎉 You're Ready!

Everything is set up and production-ready. Visit:

👉 **https://chatbuilds.com/nexusai/**

Start building apps through conversation! 🚀

---

*Last Updated: January 31, 2026*
*Status: ✅ OPERATIONAL*
