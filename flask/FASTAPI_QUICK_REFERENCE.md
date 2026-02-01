# 🚀 FastAPI Quick Reference

**Print this out! Your daily Python API cheat sheet.**

---

## 🔥 Essential Commands

### Service Control

```bash
# Start Python API
docker compose up -d python-api

# Restart
docker compose restart python-api

# Rebuild after code changes
docker compose up -d --build python-api

# Stop
docker compose stop python-api

# View logs (live)
docker logs -f vpn-python-api

# Last 100 lines
docker logs vpn-python-api --tail 100
```

### Quick Health Check

```bash
# Local
curl http://localhost:5001/health

# Production
curl https://chatbuilds.com/api/ai/health

# Pretty JSON
curl http://localhost:5001/health | jq .
```

### Enter Container

```bash
# Interactive shell
docker exec -it vpn-python-api bash

# Run single command
docker exec vpn-python-api curl http://localhost:5001/health
```

---

## 📡 API Endpoints

### Base URLs

```
Local:      http://localhost:5001
Production: https://chatbuilds.com/api/ai
```

### Health & Status

```bash
GET  /                  # Service info
GET  /health            # Health check
GET  /services/status   # All services status
GET  /docs              # Interactive API docs
```

### AI Generation

```bash
POST /ai/generate       # Generate text/code
POST /ai/sql/assist     # SQL assistance
GET  /ai/models         # List AI models
POST /ai/code/complete  # Code completion
```

### VPN (Proxy to Main API)

```bash
POST /vpn/config/generate  # Generate VPN config
GET  /vpn/servers          # List VPN servers
```

### Workflows

```bash
POST /workflows/trigger/{workflow_id}  # Trigger N8N workflow
```

### Analytics (Placeholder)

```bash
POST /analytics/query       # Run analytics query
GET  /analytics/dashboard   # Dashboard data
```

---

## 🧪 Testing Examples

### Health Check

```bash
curl http://localhost:5001/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-02-01T10:30:00",
  "service": "python-api",
  "version": "1.0.0",
  "environment": "production"
}
```

### AI Generation

```bash
curl -X POST http://localhost:5001/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a React button component",
    "model": "llama3.2:1b",
    "temperature": 0.7
  }'
```

**Response:**

```json
{
  "response": "Here's a React button...",
  "model": "llama3.2:1b",
  "eval_count": 42,
  "total_duration_ms": 1234.56
}
```

### SQL Generation

```bash
curl -X POST http://localhost:5001/ai/sql/assist \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Get all users who registered in January 2025",
    "action": "generate"
  }'
```

**Response:**

```json
{
  "sql": "SELECT * FROM users WHERE EXTRACT(MONTH FROM created_at) = 1 AND EXTRACT(YEAR FROM created_at) = 2025;",
  "explanation": null
}
```

### SQL Explain

```bash
curl -X POST http://localhost:5001/ai/sql/assist \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT u.*, COUNT(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id",
    "action": "explain"
  }'
```

### SQL Optimize

```bash
curl -X POST http://localhost:5001/ai/sql/assist \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)",
    "action": "optimize"
  }'
```

### SQL Fix

```bash
curl -X POST http://localhost:5001/ai/sql/assist \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELCT * FRM users WERE id = 1",
    "action": "fix"
  }'
```

### List AI Models

```bash
curl http://localhost:5001/ai/models
```

### Service Status

```bash
curl http://localhost:5001/services/status
```

**Response:**

```json
[
  {
    "name": "ollama",
    "url": "http://vpn-ollama:11434",
    "status": "up",
    "response_time_ms": 12.34
  },
  {
    "name": "api",
    "url": "http://vpn-api:5000",
    "status": "up",
    "response_time_ms": 8.56
  }
]
```

---

## 🐛 Troubleshooting

### Check if Service Running

```bash
docker ps | grep python-api
```

**Should show:**

```
vpn-python-api   Up 2 hours   5001/tcp
```

### View Recent Errors

```bash
docker logs vpn-python-api --tail 50 | grep ERROR
```

### Test Ollama Connection

```bash
# From your machine
curl http://localhost:11434/

# From inside python-api container
docker exec vpn-python-api curl http://ollama:11434/
```

### Test From Nginx

```bash
docker exec vpn-nginx curl http://python-api:5001/health
```

### Check Environment Variables

```bash
docker exec vpn-python-api env | grep -E 'OLLAMA|API_URL'
```

### Python Interactive Shell

```bash
docker exec -it vpn-python-api python3
>>> import httpx
>>> import asyncio
>>> async def test():
...     async with httpx.AsyncClient() as client:
...         r = await client.get('http://ollama:11434/')
...         print(r.status_code)
>>> asyncio.run(test())
```

---

## 🔥 Common Issues & Fixes

### Issue: 503 Service Unavailable

**Symptoms:**

```json
{ "detail": "Ollama service is unavailable" }
```

**Cause:** Ollama container is down  
**Fix:**

```bash
docker compose restart ollama
docker logs ollama  # Check why it crashed
```

### Issue: Slow Response

**Symptoms:** Request takes 30+ seconds  
**Cause:** AI generation is slow (normal)  
**Solutions:**

- Use smaller model (`llama3.2:1b` faster than `codellama:7b`)
- Increase client timeout
- Add loading indicator in frontend

### Issue: 422 Validation Error

**Symptoms:**

```json
{
  "detail": [
    {
      "loc": ["body", "prompt"],
      "msg": "field required"
    }
  ]
}
```

**Cause:** Missing required field in request  
**Fix:** Check Pydantic model, add missing fields

### Issue: 500 Internal Server Error

**Symptoms:** Generic error  
**Fix:** Check logs for Python traceback

```bash
docker logs vpn-python-api --tail 100
```

### Issue: Cannot Connect to Ollama

**Symptoms:**

```
httpx.ConnectError: Connection refused
```

**Fixes:**

```bash
# 1. Check if Ollama is running
docker ps | grep ollama

# 2. Check Ollama logs
docker logs vpn-ollama

# 3. Test Ollama directly
curl http://localhost:11434/

# 4. Restart Ollama
docker compose restart ollama

# 5. Check network
docker network inspect vpn-enterprise-network
```

### Issue: Port Already in Use

**Symptoms:**

```
Error: Bind for 0.0.0.0:5001 failed: port is already allocated
```

**Fix:**

```bash
# Find process using port
sudo lsof -i :5001

# Kill process
sudo kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "5002:5001"  # Use 5002 instead
```

---

## 📝 HTTP Status Codes

```
200  ✅  OK                      - Request successful
400  ❌  Bad Request             - Invalid input
401  🔒  Unauthorized            - Missing auth
403  🚫  Forbidden               - No permission
404  🔍  Not Found               - Resource doesn't exist
422  ⚠️   Unprocessable Entity   - Validation failed (Pydantic)
500  💥  Internal Server Error   - Python exception
503  🔌  Service Unavailable     - Ollama/service down
```

---

## 🔧 Development Workflow

### Local Development

```bash
# 1. Navigate to flask directory
cd flask

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run with hot reload
uvicorn app:app --reload --port 5001

# 4. Test in browser
open http://localhost:5001/docs
```

### Making Changes

```bash
# 1. Edit code
vim flask/app.py

# 2. Restart service
docker compose up -d --build python-api

# 3. Test
curl http://localhost:5001/health

# 4. Check logs
docker logs -f vpn-python-api

# 5. Commit
git add flask/
git commit -m "feat: Added new endpoint"
git push
```

### Adding New Endpoint

```python
# In flask/app.py

# 1. Create Pydantic model (if needed)
class MyRequest(BaseModel):
    field1: str
    field2: int

class MyResponse(BaseModel):
    result: str

# 2. Add endpoint
@app.post("/my-endpoint", response_model=MyResponse)
async def my_endpoint(request: MyRequest):
    """What this endpoint does"""
    try:
        # Your logic
        return {"result": "success"}
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 3. Test at http://localhost:5001/docs
```

---

## 🏗️ Architecture

### Service Connections

```
Browser
  ↓
Nginx (:443)
  ↓
Python API (:5001)
  ↓
├─→ Ollama (:11434)    # AI generation
├─→ Main API (:5000)   # VPN operations
├─→ N8N (:5678)        # Workflows
├─→ Redis (:6379)      # Caching (future)
└─→ PostgreSQL (:5432) # Database (future)
```

### Docker Containers

```
vpn-nginx          → Reverse proxy
vpn-python-api     → This FastAPI service
vpn-ollama         → AI model serving
vpn-api            → Main Express API
vpn-n8n            → Workflow automation
vpn-redis          → Caching
vpn-postgres       → Database
```

### Service Discovery (Docker DNS)

```python
# In app.py
SERVICES = {
    "ollama": "http://vpn-ollama:11434",
    "api": "http://vpn-api:5000",
    "n8n": "http://vpn-n8n:5678",
    # Docker DNS resolves container names
}
```

---

## 📊 Monitoring

### Check All Services

```bash
curl http://localhost:5001/services/status | jq .
```

### Watch Logs

```bash
# Python API
docker logs -f vpn-python-api

# Ollama
docker logs -f vpn-ollama

# All at once
docker compose logs -f python-api ollama
```

### Container Stats

```bash
docker stats vpn-python-api
```

### Disk Space

```bash
docker system df
docker system prune  # Clean up
```

---

## 🔑 Environment Variables

### Service URLs

```bash
OLLAMA_URL=http://vpn-ollama:11434
API_URL=http://vpn-api:5000
N8N_URL=http://vpn-n8n:5678
REDIS_URL=redis://vpn-redis:6379
POSTGRES_URL=postgresql://user:pass@host/db
```

### Application Config

```bash
ENVIRONMENT=production           # production/development
LOG_LEVEL=INFO                   # DEBUG/INFO/WARNING/ERROR
WORKERS=4                        # Uvicorn worker count
```

### View in Container

```bash
docker exec vpn-python-api env
```

### Set in docker-compose.yml

```yaml
python-api:
  environment:
    - OLLAMA_URL=http://vpn-ollama:11434
    - ENVIRONMENT=production
```

---

## 💡 Pro Tips

### 1. Use `/docs` for Testing

- Auto-generated interactive docs
- Try requests in browser
- No cURL needed!
- URL: `http://localhost:5001/docs`

### 2. Pretty Print JSON

```bash
# Using Python
curl http://localhost:5001/health | python3 -m json.tool

# Using jq (if installed)
curl http://localhost:5001/health | jq .
```

### 3. Follow Logs with Grep

```bash
docker logs -f vpn-python-api | grep ERROR
docker logs -f vpn-python-api | grep "POST /ai"
```

### 4. Quick Restart Script

```bash
#!/bin/bash
# save as restart-api.sh
docker compose up -d --build python-api
docker logs -f vpn-python-api
```

### 5. Test from Inside Container

```bash
docker exec vpn-python-api curl http://localhost:5001/health
docker exec vpn-python-api curl http://ollama:11434/
```

---

## 🎯 Daily Checklist

### Morning Routine

```bash
# 1. Check services
docker ps

# 2. Check health
curl https://chatbuilds.com/api/ai/health

# 3. Check logs
docker logs vpn-python-api --tail 50
```

### After Code Changes

```bash
# 1. Rebuild
docker compose up -d --build python-api

# 2. Test
curl http://localhost:5001/health

# 3. Watch logs
docker logs -f vpn-python-api

# 4. Test in browser
open http://localhost:5001/docs
```

### Before Leaving

```bash
# 1. Check no errors
docker logs vpn-python-api | grep ERROR

# 2. Commit changes
git add .
git commit -m "..."
git push

# 3. Verify production
curl https://chatbuilds.com/api/ai/health
```

---

## 📱 Useful URLs

```
Local Development:
  http://localhost:5001/          # Service info
  http://localhost:5001/health    # Health check
  http://localhost:5001/docs      # API docs (Swagger)
  http://localhost:5001/redoc     # API docs (ReDoc)

Production:
  https://chatbuilds.com/api/ai/health
  https://chatbuilds.com/api/ai/docs
```

---

## 🔗 Quick Links

- **FastAPI Docs:** https://fastapi.tiangolo.com
- **Pydantic Docs:** https://docs.pydantic.dev
- **Uvicorn Docs:** https://www.uvicorn.org
- **HTTPX Docs:** https://www.python-httpx.org
- **Ollama API:** https://github.com/ollama/ollama/blob/main/docs/api.md

---

## 📋 File Locations

```
Repository: /home/mukulah/vpn-enterprise
Docker:     /opt/vpn-enterprise
Flask:      /home/mukulah/vpn-enterprise/flask
Logs:       docker logs vpn-python-api
```

---

**Last Updated:** February 1, 2026  
**Quick, simple, always helpful** 🚀

---

_Keep this open while coding. Copy-paste the commands. You've got this!_
