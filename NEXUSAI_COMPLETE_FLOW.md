# 🎯 NexusAI → Flask API → Ollama Integration - Complete Flow

**Last Updated:** January 31, 2026  
**Status:** ✅ FULLY INTEGRATED & OPERATIONAL

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       User Browser                               │
│            (https://chatbuilds.com/nexusai)                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ 1. User types message & clicks Send
                            │    Headers: X-API-Key: vpn_xxx
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                           │
│                  (Port 443 - SSL/TLS)                            │
│                                                                   │
│  Routes: /nexusai/*  →  vpn-nexusai:80                          │
│          /api/ai/*   →  vpn-python-api:5001                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                ┌───────────┴──────────┐
                │                      │
                ▼                      ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│    NexusAI Frontend      │   │   Flask Python API       │
│   (React + TypeScript)   │   │  (FastAPI + Gunicorn)    │
│   Container: nexusai     │   │  Container: python-api   │
│   Port: 80               │   │  Port: 5001              │
│                          │   │                          │
│ • Collects user input    │   │ • Validates X-API-Key    │
│ • Stores API key in LS   │   │ • Checks rate limits     │
│ • Sends to /api/ai/*     │   │ • Caches responses       │
│ • Displays responses     │   │ • Calls Ollama API       │
└──────────────────────────┘   └──────────┬───────────────┘
                                           │
                                           │ 2. Forward prompt
                                           │    to Ollama
                                           ▼
                                ┌──────────────────────────┐
                                │    Ollama LLM Engine     │
                                │   Container: ollama      │
                                │   Port: 11434            │
                                │                          │
                                │ • Runs llama3.2:1b       │
                                │ • Generates response     │
                                │ • Returns to Flask API   │
                                └──────────┬───────────────┘
                                           │
                                           │ 3. Response flows back
                                           ▼
                                  User sees AI response!
```

---

## 🔌 Data Flow Sequence

### Step 1: User Input → NexusAI Frontend

**Location:** `apps/nexusAi/chat-to-code-38/src/components/HeroSection.tsx`

```typescript
// User types message and clicks Send
const handleSend = async () => {
  const userMessage = inputValue

  // Add to chat history
  setMessages((prev) => [...prev, { role: 'user', content: userMessage }])

  // Call AI service
  const response = await aiService.generate({
    prompt: userMessage,
    model: 'llama3.2:1b',
    temperature: 0.7,
    max_tokens: 2000,
  })

  // Display AI response
  setMessages((prev) => [
    ...prev,
    {
      role: 'assistant',
      content: response.response,
    },
  ])
}
```

**Key Fix:** `new AIService(undefined, true)` - **Must use `usePublicAPI = true`** for browser access!

---

### Step 2: AI Service → HTTP Request

**Location:** `apps/nexusAi/chat-to-code-38/src/services/aiService.ts`

```typescript
export class AIService {
  constructor(apiKey?: string, usePublicAPI = false) {
    // Use public URL for browser, internal for server
    this.baseURL = usePublicAPI
      ? 'https://chatbuilds.com/api/ai' // ← Public URL
      : 'http://vpn-python-api:5001' // ← Docker internal
  }

  async generate(request: AIGenerateRequest) {
    const response = await fetch(`${this.baseURL}/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey, // ← Critical: X-API-Key header
      },
      body: JSON.stringify({
        prompt: request.prompt,
        model: request.model,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
      }),
    })

    return response.json()
  }
}
```

**Environment Variables:**

```bash
# .env.production
VITE_AI_API_URL=https://chatbuilds.com/api/ai  # ← Browser accessible
VITE_PUBLIC_AI_API_URL=https://chatbuilds.com/api/ai
```

---

### Step 3: Nginx Routing

**Location:** `infrastructure/docker/nginx/prod/conf.d/00-router.conf`

```nginx
# Python AI API - must come BEFORE /api/ to match first!
location ^~ /api/ai/ {
    set $python_api_upstream python-api:5001;

    # Strip /api prefix before forwarding to Python API
    rewrite ^/api/ai/(.*)$ /ai/$1 break;

    proxy_pass http://$python_api_upstream;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-API-Key $http_x_api_key;  # Forward API key

    proxy_connect_timeout 60s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    proxy_buffering off;
}
```

**URL Transformation:**

```
Browser:  https://chatbuilds.com/api/ai/generate
  ↓
Nginx:    http://python-api:5001/ai/generate
```

---

### Step 4: Flask API Authentication & Rate Limiting

**Location:** `flask/app_production.py`

```python
async def verify_token(
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")  # ← NEW!
) -> Dict[str, Any]:
    """Verify JWT token or API key (supports both headers)"""

    # Try X-API-Key header first (preferred by NexusAI)
    if x_api_key:
        if x_api_key.startswith("vpn_"):
            return {
                "tier": "pro",
                "user_id": hashlib.md5(x_api_key.encode()).hexdigest()[:8],
                "tenant_id": "nexusai"
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid API key format")

    # Fall back to Authorization: Bearer header
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        if token.startswith("vpn_"):
            return {
                "tier": "pro",
                "user_id": hashlib.md5(token.encode()).hexdigest()[:8],
                "tenant_id": "nexusai"
            }

    # Anonymous access (limited)
    return {"tier": "free", "user_id": "anonymous"}
```

**Rate Limiting:**

```python
# Free tier: 100 requests/hour
# Pro tier: 1000 requests/hour
# Enterprise: 10000 requests/hour

rate_check = await check_rate_limit(
    user.get("user_id", "anonymous"),
    user.get("tier", "free")
)

if not rate_check["allowed"]:
    raise HTTPException(
        status_code=429,
        detail=f"Rate limit exceeded. Reset at {rate_check['window_reset']}"
    )
```

---

### Step 5: Flask → Ollama Communication

**Location:** `flask/app_production.py` - `/ai/generate` endpoint

```python
@app.post("/ai/generate", response_model=AIResponse)
async def generate_ai_response(
    request: AIRequest,
    user: Dict[str, Any] = Depends(verify_token)
):
    """Generate AI response with caching and rate limiting"""

    # Check Redis cache first
    if request.use_cache:
        cache_key = generate_cache_key(
            "ai:generate",
            prompt=request.prompt,
            model=request.model,
            temp=request.temperature
        )
        cached_response = await get_from_cache(cache_key)
        if cached_response:
            logger.info(f"✅ Cache hit for user {user.get('user_id')}")
            return AIResponse(**cached_response, cached=True)

    # Call Ollama API
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"http://vpn-ollama:11434/api/generate",  # ← Ollama endpoint
            json={
                "model": request.model,
                "prompt": request.prompt,
                "stream": False,
                "options": {"temperature": request.temperature}
            }
        )

        data = response.json()
        result = {
            "response": data.get("response", ""),
            "model": request.model,
            "eval_count": data.get("eval_count"),
            "total_duration_ms": data.get("total_duration", 0) / 1e6
        }

        # Cache result for future requests
        if request.use_cache:
            await set_in_cache(cache_key, result, ttl=3600)

        return AIResponse(**result, cached=False)
```

**Ollama Configuration:**

- **Container:** vpn-ollama
- **Port:** 11434 (internal Docker network only)
- **Models Loaded:** llama3.2:1b (default), codellama:7b (for code)
- **Access:** Internal only - not exposed to internet

---

### Step 6: Response Flow Back

```
Ollama generates response
  ↓
Flask API receives JSON
  ↓
Caches in Redis (if enabled)
  ↓
Returns to browser via nginx
  ↓
NexusAI displays in chat UI
```

---

## 🔑 Authentication Flow

### Method 1: X-API-Key Header (Recommended for NexusAI)

```http
POST /api/ai/generate HTTP/1.1
Host: chatbuilds.com
Content-Type: application/json
X-API-Key: vpn_2hrUOubvcBqlrysKkGOe4CBv5_sTi7QEgNLhp7S2WrI

{
  "prompt": "Explain VPN",
  "model": "llama3.2:1b"
}
```

### Method 2: Authorization Bearer (Alternative)

```http
POST /api/ai/generate HTTP/1.1
Host: chatbuilds.com
Content-Type: application/json
Authorization: Bearer vpn_2hrUOubvcBqlrysKkGOe4CBv5_sTi7QEgNLhp7S2WrI

{
  "prompt": "Explain VPN",
  "model": "llama3.2:1b"
}
```

### Method 3: Anonymous (Limited)

```http
POST /api/ai/generate HTTP/1.1
Host: chatbuilds.com
Content-Type: application/json

{
  "prompt": "Explain VPN",
  "model": "llama3.2:1b"
}
```

**Tier:** Free (100 requests/hour)

---

## 💾 Caching Strategy

### Three-Level Cache

1. **Memory Cache** (in-memory dict)
   - Fastest, but lost on restart
   - Used as fallback if Redis unavailable

2. **Redis Cache** (primary)
   - Persistent across restarts
   - TTL: 1 hour (configurable)
   - Key format: `ai:generate:<hash>`

3. **No Cache** (bypass)
   - Set `use_cache: false` in request
   - Forces fresh generation

### Cache Key Generation

```python
def generate_cache_key(prefix: str, **kwargs) -> str:
    key_parts = [prefix] + [f"{k}:{v}" for k, v in sorted(kwargs.items())]
    key_string = ":".join(key_parts)
    return hashlib.md5(key_string.encode()).hexdigest()

# Example:
# prompt="Hello", model="llama3.2:1b", temp=0.7
# → ai:generate:a3f2b1c9d8e7f6g5h4i3j2k1
```

---

## 🚦 Rate Limiting

### Implementation

```python
rate_limit_store: Dict[str, List[float]] = {}

async def check_rate_limit(identifier: str, tier: str = "free"):
    limit_config = RATE_LIMITS.get(tier)
    max_requests = limit_config["requests"]
    window = limit_config["window"]  # 3600 seconds = 1 hour

    current_time = time.time()
    key = f"ratelimit:{identifier}"

    # Remove expired timestamps
    rate_limit_store[key] = [
        ts for ts in rate_limit_store[key]
        if current_time - ts < window
    ]

    requests_used = len(rate_limit_store[key])
    remaining = max_requests - requests_used

    if remaining <= 0:
        return {
            "allowed": False,
            "requests_used": requests_used,
            "requests_limit": max_requests,
            "window_reset": datetime.fromtimestamp(
                rate_limit_store[key][0] + window
            ).isoformat()
        }

    rate_limit_store[key].append(current_time)
    return {"allowed": True, "requests_remaining": remaining}
```

### Rate Limits by Tier

| Tier       | Requests/Hour | Monthly Limit |
| ---------- | ------------- | ------------- |
| Free       | 100           | 3,000         |
| Pro        | 1,000         | 30,000        |
| Enterprise | 10,000        | 300,000       |
| Unlimited  | 1,000,000     | ∞             |

---

## 🎨 UI Components

### Chat Interface

**File:** `apps/nexusAi/chat-to-code-38/src/components/HeroSection.tsx`

```tsx
{
  /* Messages Display */
}
{
  messages.length > 0 && (
    <div className='max-h-96 overflow-y-auto space-y-4'>
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={msg.role === 'user' ? 'justify-end' : 'justify-start'}
        >
          <div
            className={
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : msg.role === 'error'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-muted'
            }
          >
            <p>{msg.content}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

{
  /* Input with loading state */
}
;<textarea
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }}
  disabled={isGenerating}
  placeholder='Ask NexusAI to create a landing page...'
/>

{
  /* Send button with spinner */
}
;<Button onClick={handleSend} disabled={!inputValue.trim() || isGenerating}>
  {isGenerating ? <Spinner /> : <Send />}
</Button>
```

---

## 🐛 Debugging & Troubleshooting

### Check Service Health

```bash
# All services status
ssh root@157.180.123.240 "docker ps --format 'table {{.Names}}\t{{.Status}}'"

# Specific services
ssh root@157.180.123.240 "docker ps | grep -E 'nexusai|python-api|ollama'"
```

### View Logs

```bash
# NexusAI frontend
ssh root@157.180.123.240 "docker logs vpn-nexusai -f"

# Flask API
ssh root@157.180.123.240 "docker logs vpn-python-api -f"

# Ollama
ssh root@157.180.123.240 "docker logs vpn-ollama -f"
```

### Test API Directly

```bash
# Test with X-API-Key
curl -X POST https://chatbuilds.com/api/ai/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: vpn_2hrUOubvcBqlrysKkGOe4CBv5_sTi7QEgNLhp7S2WrI" \
  -d '{
    "prompt": "Say hello",
    "model": "llama3.2:1b"
  }'

# Expected response:
{
  "response": "Hello! How can I help you today?",
  "model": "llama3.2:1b",
  "cached": false,
  "total_duration_ms": 1234.56
}
```

### Common Issues

#### 502 Bad Gateway

- **Cause:** Python API not ready
- **Fix:** Wait 10-15 seconds for Gunicorn workers to start
- **Check:** `docker logs vpn-python-api`

#### 401 Unauthorized

- **Cause:** Missing or invalid API key
- **Fix:** Enter API key in NexusAI settings dialog
- **Check:** Key starts with `vpn_`

#### 429 Rate Limit

- **Cause:** Exceeded hourly quota
- **Fix:** Wait for rate limit reset or upgrade tier
- **Check:** Response includes `window_reset` timestamp

#### Slow Responses

- **Cause:** Ollama generating for first time (cold start)
- **Fix:** First request takes 3-5s, subsequent are cached
- **Check:** `cached: true` in response = instant

---

## 🚀 Deployment Checklist

✅ **All Steps Completed:**

- [x] NexusAI frontend built with correct env vars
- [x] Flask API supports X-API-Key header
- [x] Nginx routes `/api/ai/*` to Python API
- [x] AIService uses `usePublicAPI = true`
- [x] Chat interface displays messages
- [x] API key dialog functional
- [x] Rate limiting implemented
- [x] Redis caching configured
- [x] Ollama models loaded
- [x] Production deployment successful

---

## 📝 Summary

**What Was Fixed:**

1. ✅ **AIService Constructor** - Added `usePublicAPI = true` for browser access
2. ✅ **Flask Authentication** - Added `X-API-Key` header support
3. ✅ **Chat Interface** - Implemented full message history display
4. ✅ **Loading States** - Added spinners and disabled states
5. ✅ **Error Handling** - Shows error messages in chat
6. ✅ **Keyboard Shortcuts** - Enter to send, Shift+Enter for newline

**Result:** Complete chat-to-code platform powered by local AI!

**Test Now:** https://chatbuilds.com/nexusai

Enter API key: `vpn_2hrUOubvcBqlrysKkGOe4CBv5_sTi7QEgNLhp7S2WrI`

Type: "Create a React button component"

Watch the magic happen! 🎉
