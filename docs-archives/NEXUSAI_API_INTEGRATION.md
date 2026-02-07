# NexusAI + FastAPI Integration Guide

## 🔗 Complete Integration Map

### Architecture Overview

```
NexusAI (React) → Nginx → FastAPI → Ollama AI
     ↓                                  ↓
Browser (https://chatbuilds.com/nexusai/) → Python API (vpn-python-api:5001)
```

---

## 1. Backend API (FastAPI - /flask/app.py)

### Available Endpoints

#### ✅ AI Generation

```python
POST /ai/generate
Content-Type: application/json
X-API-Key: <your-api-key>

Request:
{
  "prompt": "Create a todo app",
  "model": "llama3.2:1b",
  "temperature": 0.7,
  "stream": false,
  "context": "optional context"
}

Response:
{
  "response": "Generated code...",
  "model": "llama3.2:1b",
  "eval_count": 1245,
  "total_duration_ms": 1234.56
}
```

#### ✅ List AI Models

```python
GET /ai/models
X-API-Key: <your-api-key>

Response:
{
  "models": [
    {
      "name": "llama3.2:1b",
      "size": 1250000000,
      "modified_at": "2025-01-31T12:00:00Z"
    }
  ]
}
```

#### ✅ SQL Assistant

```python
POST /ai/sql/assist
Content-Type: application/json
X-API-Key: <your-api-key>

Request:
{
  "query": "Create a users table",
  "action": "generate",  // or "explain", "optimize", "fix"
  "schema": "optional schema context"
}

Response (generate):
{
  "sql": "CREATE TABLE users (...)",
  "explanation": null,
  "suggestions": null
}

Response (explain):
{
  "sql": null,
  "explanation": "This query creates a users table...",
  "suggestions": null
}
```

#### ✅ Code Completion

```python
POST /ai/code/complete
Content-Type: application/json
X-API-Key: <your-api-key>

Request:
{
  "code": "function handleClick() {",
  "language": "javascript",
  "cursor_position": 25
}

Response:
{
  "completions": [
    "  console.log('clicked');",
    "  event.preventDefault();",
    "  // handle click logic"
  ],
  "confidence": 0.85
}
```

#### ✅ Health Check

```python
GET /health

Response:
{
  "status": "healthy",
  "timestamp": "2025-01-31T21:37:00Z",
  "service": "python-api",
  "version": "1.0.0",
  "environment": "production"
}
```

#### ✅ Service Status

```python
GET /services/status

Response:
[
  {
    "name": "ollama",
    "url": "http://vpn-ollama-dev:11434",
    "status": "up",
    "response_time_ms": 12.34
  },
  {
    "name": "api",
    "url": "http://vpn-api-dev:5000",
    "status": "up",
    "response_time_ms": 8.56
  }
]
```

---

## 2. Frontend Integration (aiService.ts)

### Configuration

```typescript
// API URLs
const AI_API_URL = 'http://vpn-python-api:5001' // Internal
const PUBLIC_API_URL = 'https://chatbuilds.com/api/ai' // Public

// AIService uses public API by default for browser
const aiService = new AIService(undefined, true)
```

### Methods Used by NexusAI

#### Generate Component

```typescript
async generateComponent(description: string): Promise<string> {
  const prompt = `Generate a React component with TypeScript based on this description:
${description}

Requirements:
- Use React hooks (useState, useEffect, etc.)
- Include TypeScript types
- Use Tailwind CSS for styling
- Add proper error handling
- Include JSDoc comments
- Make it production-ready

Return only the component code, no explanations.`

  const response = await this.generate({ prompt, max_tokens: 2000 })
  return response.response
}
```

**Frontend calls:** `aiService.generateComponent("Create a todo app")`  
**API endpoint:** `POST /ai/generate`  
**Ollama prompt:** Full prompt with React/TypeScript requirements

#### Generate App Structure

```typescript
async generateApp(description: string): Promise<{
  components: Array<{ name: string; code: string }>
  routes: string[]
  description: string
}> {
  const prompt = `Create a complete React application structure for:
${description}

Generate:
1. List of component names needed
2. Routes for the app
3. Component hierarchy
4. Brief description of each component's purpose

Format response as JSON.`

  const response = await this.generate({ prompt, max_tokens: 2000 })
  return JSON.parse(response.response)
}
```

**Frontend calls:** `aiService.generateApp("Build a blog platform")`  
**API endpoint:** `POST /ai/generate`  
**Response:** JSON with app structure

#### Generate Database Schema

```typescript
async generateDatabaseSchema(description: string): Promise<string> {
  const request: SQLAssistRequest = {
    query: `Create a complete PostgreSQL database schema for: ${description}. Include tables, relationships, indexes, and constraints.`,
    action: 'generate',
  }

  const response = await this.sqlAssist(request)
  return response.sql || ''
}
```

**Frontend calls:** `aiService.generateDatabaseSchema("E-commerce store")`  
**API endpoint:** `POST /ai/sql/assist`  
**Response:** PostgreSQL CREATE statements

#### Generate API Endpoints

```typescript
async generateAPI(description: string): Promise<string> {
  const prompt = `Generate Express.js API endpoints for:
${description}

Include:
- Route handlers with TypeScript
- Input validation
- Error handling
- Response formatting
- Example request/response

Return only the code.`

  const response = await this.generate({ prompt, max_tokens: 2000 })
  return response.response
}
```

**Frontend calls:** `aiService.generateAPI("User authentication system")`  
**API endpoint:** `POST /ai/generate`  
**Response:** Express.js TypeScript code

---

## 3. Request Flow Example

### User Action: "Create a todo app"

```
1. User types in NexusAI chat input
   ↓
2. HeroSection.tsx → handleSend()
   ↓
3. detectIntentAndGenerate("Create a todo app")
   ↓ (detects "app" keyword)
4. generateApp("Create a todo app")
   ↓
5. aiService.generateApp()
   ↓
6. fetch('https://chatbuilds.com/api/ai/ai/generate', {
      method: 'POST',
      headers: { 'X-API-Key': 'vpn_...', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: "Create a complete React application structure for: Create a todo app...",
        model: "llama3.2:1b",
        temperature: 0.7,
        max_tokens: 2000
      })
   })
   ↓
7. Nginx routes /api/ai/* → vpn-python-api:5001
   ↓
8. FastAPI /ai/generate endpoint
   ↓
9. httpx.post('http://vpn-ollama:11434/api/generate', ...)
   ↓
10. Ollama generates response with llama3.2:1b
   ↓
11. FastAPI returns JSON response
   ↓
12. NexusAI displays code block with Copy/Preview buttons
```

---

## 4. Nginx Routing Configuration

### /infrastructure/docker/nginx/prod/conf.d/00-router.conf

```nginx
# NexusAI React App
location ^~ /nexusai/ {
  rewrite ^/nexusai/(.*)$ /$1 break;
  proxy_pass http://nexusai:80;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_buffering off;
}

# FastAPI AI Service
location ^~ /api/ai/ {
  rewrite ^/api/ai/(.*)$ /$1 break;
  proxy_pass http://python-api:5001;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_read_timeout 120s;
}
```

### URL Rewriting

- Browser: `https://chatbuilds.com/api/ai/ai/generate`
- Nginx rewrites to: `/ai/generate`
- Proxies to: `http://python-api:5001/ai/generate`
- FastAPI receives: `POST /ai/generate`

---

## 5. Docker Network

### docker-compose.prod.yml

```yaml
services:
  nexusai:
    container_name: vpn-nexusai
    networks: [vpn-network]
    # Serves React app at http://nexusai:80

  python-api:
    container_name: vpn-python-api
    networks: [vpn-network]
    # Serves FastAPI at http://python-api:5001

  ollama:
    container_name: vpn-ollama
    networks: [vpn-network]
    # Serves Ollama at http://ollama:11434

networks:
  vpn-network:
    driver: bridge
```

All containers can reach each other via Docker DNS using container names.

---

## 6. API Key Management

### Demo API Key

```
vpn_U5zBa_Ze2a4g5zVcJgl1d9ZLXlDJs6uSOTtlO0QRnTg
```

### Storage

- **Browser:** `localStorage.getItem('nexusai_api_key')`
- **Sent as:** `X-API-Key` header in every request

### Verification

```typescript
// Frontend verifies by calling /ai/models
async verifyAPIKey(): Promise<boolean> {
  if (!this.apiKey) return false

  try {
    await this.listModels()  // GET /ai/models
    return true
  } catch {
    return false
  }
}
```

---

## 7. Error Handling

### Common Errors

#### 404 Not Found

**Cause:** Calling non-existent endpoint like `/usage`  
**Fix:** Removed `/usage` calls, use `/ai/models` instead

#### 503 Service Unavailable

**Cause:** Ollama is down or not responding  
**Fix:** Check `docker ps | grep ollama` and `docker logs vpn-ollama`

#### 401 Unauthorized

**Cause:** Missing or invalid API key  
**Fix:** Add demo key in NexusAI settings dialog

#### CORS Errors

**Cause:** Nginx not forwarding headers correctly  
**Fix:** FastAPI has `allow_origins=["*"]` for development

---

## 8. Testing the Integration

### Test AI Generation

```bash
curl -X POST https://chatbuilds.com/api/ai/ai/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: vpn_U5zBa_Ze2a4g5zVcJgl1d9ZLXlDJs6uSOTtlO0QRnTg" \
  -d '{
    "prompt": "Create a React button component",
    "model": "llama3.2:1b",
    "temperature": 0.7
  }'
```

### Test SQL Assistant

```bash
curl -X POST https://chatbuilds.com/api/ai/ai/sql/assist \
  -H "Content-Type: application/json" \
  -H "X-API-Key: vpn_U5zBa_Ze2a4g5zVcJgl1d9ZLXlDJs6uSOTtlO0QRnTg" \
  -d '{
    "query": "Create a users table with email and password",
    "action": "generate"
  }'
```

### Test Models List

```bash
curl -X GET https://chatbuilds.com/api/ai/ai/models \
  -H "X-API-Key: vpn_U5zBa_Ze2a4g5zVcJgl1d9ZLXlDJs6uSOTtlO0QRnTg"
```

---

## 9. Development Workflow

### Local Development

```bash
# Start all services
cd infrastructure/docker
docker compose -f docker-compose.dev.yml up -d

# Check logs
docker logs -f vpn-nexusai
docker logs -f vpn-python-api
docker logs -f vpn-ollama

# NexusAI will be at http://localhost/nexusai/
# API will be at http://localhost/api/ai/
```

### Production Deployment

```bash
# From local machine
cd /home/mukulah/vpn-enterprise
git add .
git commit -m "feat: Add new feature"
git push origin main

# SSH to server
ssh root@157.180.123.240

# Deploy
cd /opt/vpn-enterprise
git pull
cd infrastructure/docker
docker compose -f docker-compose.prod.yml up -d --build --no-deps nexusai

# Verify
curl -I https://chatbuilds.com/nexusai/
```

---

## 10. Troubleshooting Checklist

### NexusAI shows "Error: Not Found"

- ✅ Check if API key is set in localStorage
- ✅ Verify nginx is routing /api/ai/ correctly
- ✅ Check FastAPI logs: `docker logs vpn-python-api`
- ✅ Test endpoint directly with curl
- ✅ Ensure aiService.ts uses correct PUBLIC_API_URL

### "Ollama service unavailable"

- ✅ Check Ollama is running: `docker ps | grep ollama`
- ✅ Check Ollama logs: `docker logs vpn-ollama`
- ✅ Test Ollama directly: `curl http://localhost:11434/`
- ✅ Verify model exists: `docker exec vpn-ollama ollama list`

### Slow responses

- ✅ First request after restart takes 2-3 seconds (model loading)
- ✅ Complex prompts take longer (10-30 seconds)
- ✅ Check CPU usage: `docker stats`
- ✅ Consider using streaming for better UX

### Build fails

- ✅ Check Node.js version: `node --version` (should be 20)
- ✅ Clear npm cache: `npm cache clean --force`
- ✅ Remove node_modules: `rm -rf node_modules && npm ci`
- ✅ Check for TypeScript errors in logs

---

## 11. Future Enhancements

### Add Streaming Responses

```python
# FastAPI
@app.post("/ai/generate/stream")
async def generate_stream(request: AIRequest):
    async def stream_generator():
        async with httpx.AsyncClient() as client:
            async with client.stream("POST", f"{OLLAMA_URL}/api/generate", json={
                "model": request.model,
                "prompt": request.prompt,
                "stream": True
            }) as response:
                async for chunk in response.aiter_bytes():
                    yield chunk

    return StreamingResponse(stream_generator(), media_type="text/event-stream")
```

```typescript
// Frontend
async generateWithStreaming(prompt: string, onChunk: (text: string) => void) {
  const response = await fetch(`${this.baseURL}/ai/generate/stream`, {
    method: 'POST',
    headers: this.getHeaders(),
    body: JSON.stringify({ prompt })
  })

  const reader = response.body?.getReader()
  // Process stream chunks...
}
```

### Add Usage Tracking

```python
# FastAPI
@app.get("/usage")
async def get_usage(api_key: str = Header(..., alias="X-API-Key")):
    # Query Redis for usage stats
    usage = await redis_client.hgetall(f"usage:{api_key}")
    return {
        "requests_used": int(usage.get("count", 0)),
        "requests_limit": 100,
        "requests_remaining": 100 - int(usage.get("count", 0)),
        "window_reset": usage.get("reset_time")
    }
```

### Add Model Selection UI

```typescript
// NexusAI
const [selectedModel, setSelectedModel] = useState('llama3.2:1b')
const [availableModels, setAvailableModels] = useState([])

useEffect(() => {
  aiService.listModels().then(setAvailableModels)
}, [])

// In settings dialog
<Select value={selectedModel} onValueChange={setSelectedModel}>
  {availableModels.map(model => (
    <SelectItem value={model.name}>{model.name}</SelectItem>
  ))}
</Select>
```

---

## 📚 Related Documentation

- **FastAPI Docs:** http://localhost:5001/docs (when running locally)
- **Ollama API:** https://github.com/ollama/ollama/blob/main/docs/api.md
- **NexusAI Guide:** [NEXUSAI_READY.md](./NEXUSAI_READY.md)
- **Docker Setup:** [infrastructure/docker/README.md](./infrastructure/docker/README.md)

---

_Last Updated: January 31, 2026_  
_Status: ✅ PRODUCTION READY_  
_Integration: NexusAI ↔ FastAPI ↔ Ollama_
