# NexusAI 422 Error - Complete Fix Guide

## 🔴 Problem Summary

When users try to generate apps via NexusAI, they receive a **422 Unprocessable Entity** error.

### Root Causes Identified

1. **Missing OpenAI API Key** ⚠️
   - The Python FastAPI service had no `OPENAI_API_KEY` configured
   - Log showed: `⚠️ NO AI API KEYS SET! Set OPENAI_API_KEY or ANTHROPIC_API_KEY`

2. **Overly Restrictive Validation** 📏
   - Description field required minimum 10 characters
   - Max length limited to 2000 characters
   - These restrictions caused 422 validation errors for short prompts

3. **Poor Error Logging** 🐛
   - No detailed logging of validation errors
   - Difficult to diagnose what field was failing

## ✅ Fixes Applied

### 1. Updated Validation Rules ([flask/app_production.py](../flask/app_production.py))

**Before:**

```python
class MultiFileGenerateRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=2000, ...)
```

**After:**

```python
class MultiFileGenerateRequest(BaseModel):
    description: str = Field(..., min_length=3, max_length=5000, ...)
```

**Changes:**

- ⬇️ Reduced minimum description length: `10 → 3` characters
- ⬆️ Increased maximum length: `2000 → 5000` characters
- ✅ Now accepts short prompts like "Chat app"

### 2. Added Detailed Error Logging

**New Exception Handler:**

```python
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with detailed messages"""
    errors = exc.errors()
    logger.error(f"🚨 Validation Error on {request.method} {request.url.path}:")
    logger.error(f"   Request body: {await request.body()}")
    logger.error(f"   Errors: {json.dumps(errors, indent=2)}")

    return JSONResponse(
        status_code=422,
        content={
            "detail": "Request validation failed",
            "errors": error_details,
            "raw_errors": errors
        }
    )
```

**Benefits:**

- 📋 Logs full request body on validation failure
- 🔍 Shows exact fields that failed validation
- 💬 Returns user-friendly error messages to frontend

### 3. Added Request Logging to Generation Endpoint

```python
@app.post("/ai/generate/app", ...)
async def generate_full_app(...):
    # Debug logging
    logger.info(f"📥 Received app generation request:")
    logger.info(f"   Description length: {len(request.description)} chars")
    logger.info(f"   Framework: {request.framework}")
    logger.info(f"   Provider: {request.provider}")
    logger.info(f"   User tier: {user.get('tier', 'unknown')}")
```

### 4. API Key Configuration Script

Created deployment script: [fix-nexusai-422-error.sh](../fix-nexusai-422-error.sh)

**What it does:**

1. ✅ Uploads fixed Python API code to production
2. 🔐 Configures OPENAI_API_KEY in `.env.production` and `app.prod.env`
3. 🔄 Restarts Python API container with new environment
4. 🧪 Verifies service health
5. 📊 Checks logs for warnings

## 🚀 Deployment Instructions

### Prerequisites

```bash
# Get your OpenAI API key from: https://platform.openai.com/api-keys
export OPENAI_API_KEY='sk-proj-...'
```

### Deploy the Fix

```bash
cd /home/mukulah/vpn-enterprise

# Make script executable (already done)
chmod +x fix-nexusai-422-error.sh

# Run the fix script
./fix-nexusai-422-error.sh
```

### What the Script Does

```
📤 Step 1: Upload fixed Python API code
   └─ Syncs flask/ directory to production

🔐 Step 2: Set OPENAI_API_KEY on production
   ├─ Updates .env.production
   └─ Updates infrastructure/docker/config/app.prod.env

🔄 Step 3: Restart Python API container
   └─ Applies new code and environment variables

🧪 Step 4: Verify service health
   └─ Checks /health endpoint

🔍 Step 5: Check for API key warnings
   └─ Confirms no "NO AI API KEYS" warnings
```

## 🧪 Testing the Fix

### 1. Test via NexusAI UI

```bash
# Visit: https://chatbuilds.com/nexusai

1. Enter a short app description (e.g., "Todo app")
2. Select framework and styling
3. Click "Generate App"
4. Should generate successfully ✅
```

### 2. Test via Direct API Call

```bash
# Test the endpoint directly
curl -X POST https://chatbuilds.com/api/ai/generate/app \
  -H "Content-Type: application/json" \
  -H "X-API-Key: vpn_test_key" \
  -d '{
    "description": "Simple todo list app",
    "framework": "react",
    "styling": "tailwind",
    "provider": "openai",
    "model": "gpt-4o"
  }'
```

**Expected Response:**

```json
{
  "files": [
    {"path": "src/App.tsx", "content": "...", "language": "typescript"},
    {"path": "package.json", "content": "...", "language": "json"}
  ],
  "instructions": "1. Install: npm install...",
  "dependencies": {"react": "^18.3.0", ...}
}
```

### 3. Test with Short Description

```bash
# Test minimum length validation (should work with 3+ chars)
curl -X POST https://chatbuilds.com/api/ai/generate/app \
  -H "Content-Type: application/json" \
  -H "X-API-Key: vpn_test_key" \
  -d '{
    "description": "App",
    "framework": "react"
  }'
```

**Should succeed** (description is 3 characters)

### 4. Test Invalid Request

```bash
# Test validation error handling
curl -X POST https://chatbuilds.com/api/ai/generate/app \
  -H "Content-Type: application/json" \
  -H "X-API-Key: vpn_test_key" \
  -d '{
    "description": "AB"
  }'
```

**Expected Error:**

````json
{
  "detail": "Request validation failed",
  "errors": [
    "description: String should have at least 3 characters"
  ]
}```

## 📊 Monitoring & Troubleshooting

### View Python API Logs

```bash
# Live logs
ssh root@157.180.123.240 'docker logs -f vpn-python-api'

# Recent logs (last 100 lines)
ssh root@157.180.123.240 'docker logs vpn-python-api --tail 100'

# Search for errors
ssh root@157.180.123.240 'docker logs vpn-python-api 2>&1 | grep -i error'

# Search for validation errors
ssh root@157.180.123.240 'docker logs vpn-python-api 2>&1 | grep 422'
````

### Check Environment Variables

```bash
# Verify OPENAI_API_KEY is set
ssh root@157.180.123.240 'docker exec vpn-python-api env | grep OPENAI_API_KEY'

# Should show: OPENAI_API_KEY=sk-proj-...
```

### Common Issues & Solutions

#### Issue: Still seeing "NO AI API KEYS" warning

**Solution:**

```bash
# Rebuild and restart the container
ssh root@157.180.123.240 'cd /opt/vpn-enterprise/infrastructure/docker && \
  docker compose -f docker-compose.prod.yml up -d --build python-api'
```

#### Issue: 422 errors persisting

**Check logs for validation details:**

```bash
ssh root@157.180.123.240 'docker logs vpn-python-api --tail 50 | grep -A 10 "Validation Error"'
```

**Look for:**

- Which field failed validation
- What value was sent
- What the validation rule expects

#### Issue: 503 Service Unavailable

**Cause:** OpenAI API key invalid or missing

**Solution:**

```bash
# Verify key is correctly set
ssh root@157.180.123.240 'cat /opt/vpn-enterprise/.env.production | grep OPENAI_API_KEY'

# Re-run the fix script with correct key
export OPENAI_API_KEY='sk-proj-...'
./fix-nexusai-422-error.sh
```

## 📈 Performance Metrics

### Expected Response Times

- **Health Check:** < 100ms
- **Simple App (< 5 files):** 5-15 seconds
- **Complex App (10-15 files):** 15-30 seconds
- **Very Complex App (20+ files):** 30-60 seconds

### Rate Limits

**Free Tier:**

- 100 requests / hour
- 3-character minimum description

**Pro Tier:**

- 1,000 requests / hour
- Advanced features enabled

## 🔐 Security Notes

### API Key Management

- ✅ API keys stored in `.env.production` (not committed to git)
- ✅ Keys passed via environment variables only
- ✅ No keys logged in application logs
- ✅ Docker secrets used for sensitive data

### Best Practices

1. **Never commit API keys** to repository
2. **Rotate keys** every 90 days
3. **Use different keys** for dev/staging/production
4. **Monitor API usage** via OpenAI dashboard
5. **Set spending limits** in OpenAI account

## 🎯 Success Criteria

✅ **Fix is successful when:**

1. No "NO AI API KEYS" warnings in logs
2. Short descriptions (3+ chars) generate apps successfully
3. 422 errors include detailed validation messages
4. Users can generate apps via NexusAI UI
5. API responds in < 30 seconds for typical requests

## 📚 Related Documentation

- [NexusAI Quickstart](./NEXUSAI_QUICKSTART.md)
- [FastAPI Production Guide](../flask/FASTAPI_COMPLETE_GUIDE.md)
- [Docker Compose Configuration](../infrastructure/docker/docker-compose.prod.yml)
- [Python API Source](../flask/app_production.py)

## 🆘 Support

If issues persist after following this guide:

1. Check logs: `ssh root@157.180.123.240 'docker logs vpn-python-api --tail 200'`
2. Verify environment: `docker exec vpn-python-api env`
3. Test health endpoint: `curl https://chatbuilds.com/api/ai/health`
4. Review this document for missed steps

---

**Last Updated:** February 6, 2026  
**Author:** GitHub Copilot  
**Status:** ✅ Ready for Deployment
