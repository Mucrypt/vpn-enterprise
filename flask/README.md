# 🐍 Python API Service (FastAPI)

**AI-powered microservice for VPN Enterprise platform**

---

## 📖 Documentation

### For Learning & Daily Use

**🎓 [Complete Guide](./FASTAPI_COMPLETE_GUIDE.md)** - Start here!
- FastAPI basics explained simply
- Full architecture walkthrough
- Every endpoint documented with examples
- Async programming concepts
- Pydantic models explained
- Docker deployment guide
- Troubleshooting section
- **Read this to understand how everything works**

**⚡ [Quick Reference](./FASTAPI_QUICK_REFERENCE.md)** - Keep this open!
- All commands you need daily
- curl examples for testing
- Common issues & fixes
- HTTP status codes
- Development workflow
- **Print this out and keep it handy**

---

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run with hot reload
uvicorn app:app --reload --port 5001

# Visit interactive docs
open http://localhost:5001/docs
```

### Docker (Production)
```bash
# Build and run
docker compose up -d --build python-api

# Check logs
docker logs -f vpn-python-api

# Test
curl http://localhost:5001/health
```

---

## 🎯 What This Service Does

This FastAPI service is the **AI integration layer** for NexusAI:

1. **AI Generation** - Connects to Ollama for code/SQL generation
2. **SQL Assistant** - Generate, explain, optimize, and fix SQL queries
3. **Code Completion** - Multi-language code suggestions
4. **Service Bridge** - Aggregates Ollama, N8N, and main API
5. **Auto Documentation** - Self-documenting API at `/docs`

### Key Features
- ✅ Async/await for high performance
- ✅ Pydantic validation (type-safe)
- ✅ Automatic OpenAPI docs
- ✅ Health checks & monitoring
- ✅ Docker containerized
- ✅ Multi-worker deployment (4 workers)

---

## 📡 Main Endpoints

```
POST /ai/generate       - Generate AI text/code
POST /ai/sql/assist     - SQL assistance (generate/explain/optimize/fix)
GET  /ai/models         - List available AI models
POST /ai/code/complete  - Code completion suggestions
GET  /health            - Health check endpoint
GET  /services/status   - Check all service connectivity
GET  /docs              - Interactive API documentation
```

**Full endpoint documentation:** See [Complete Guide](./FASTAPI_COMPLETE_GUIDE.md#4-endpoints-deep-dive)

---

## 🏗️ Architecture

```
┌─────────────────────┐
│   NexusAI Frontend  │
│  (React/TypeScript) │
└──────────┬──────────┘
           │ HTTPS
           ↓
┌─────────────────────┐
│   Nginx Proxy       │
│   (:443 → :5001)    │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   Python API        │
│   (FastAPI)         │ ← YOU ARE HERE
│   Port 5001         │
└──────────┬──────────┘
           │
    ┌──────┼──────┐
    ↓      ↓      ↓
┌────────┐ ┌────┐ ┌─────┐
│ Ollama │ │N8N │ │ API │
│ :11434 │ │5678│ │5000 │
└────────┘ └────┘ └─────┘
```

**Detailed architecture:** See [Complete Guide](./FASTAPI_COMPLETE_GUIDE.md#2-understanding-your-api)

---

## 🔧 Development

### File Structure
```
flask/
├── app.py                        # 🔥 Main application (edit this)
├── app_production.py             # Production entry point
├── requirements.txt              # Python dependencies
├── Dockerfile                    # Production build
├── Dockerfile.dev                # Development build
├── FASTAPI_COMPLETE_GUIDE.md    # 📖 Full documentation
├── FASTAPI_QUICK_REFERENCE.md   # ⚡ Cheat sheet
└── README.md                     # This file
```

### Key Files

**`app.py`** (562 lines)
- FastAPI application setup
- All endpoint definitions
- Ollama integration
- Service discovery
- Error handling

**`requirements.txt`**
- fastapi==0.115.0
- uvicorn[standard]==0.34.0
- httpx==0.28.1 (async HTTP client)
- pydantic==2.10.3 (validation)
- Redis, PostgreSQL drivers

**`Dockerfile`**
- Multi-stage build
- Python 3.11-slim base
- Non-root user (security)
- 4 workers for production
- Health checks included

---

## 🧪 Testing

### Interactive Docs (Easiest)
```bash
# Open in browser
open http://localhost:5001/docs

# Try requests without writing code!
```

### cURL Examples

**Health Check:**
```bash
curl http://localhost:5001/health
```

**AI Generation:**
```bash
curl -X POST http://localhost:5001/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a React button",
    "model": "llama3.2:1b"
  }'
```

**SQL Generation:**
```bash
curl -X POST http://localhost:5001/ai/sql/assist \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Get all users from 2025",
    "action": "generate"
  }'
```

**More examples:** See [Quick Reference](./FASTAPI_QUICK_REFERENCE.md#-testing-examples)

---

## 🐛 Troubleshooting

### Common Issues

**1. Service won't start**
```bash
# Check logs
docker logs vpn-python-api

# Check if port is in use
sudo lsof -i :5001
```

**2. 503 Service Unavailable**
```bash
# Ollama might be down
docker compose restart ollama
docker logs vpn-ollama
```

**3. Slow responses**
- AI generation takes time (normal)
- Use smaller models for faster responses
- Increase timeout in client

**Full troubleshooting guide:** See [Complete Guide](./FASTAPI_COMPLETE_GUIDE.md#10-testing--debugging)

---

## 📊 Monitoring

### Health Checks
```bash
# Service health
curl http://localhost:5001/health

# All services status
curl http://localhost:5001/services/status

# Container stats
docker stats vpn-python-api

# View logs
docker logs -f vpn-python-api
```

### Performance
- **Workers:** 4 (one per CPU core)
- **Timeout:** 120s for AI generation
- **Async:** Non-blocking I/O
- **Memory:** ~200MB per worker

---

## 🔐 Security

- ✅ Non-root user in container (UID 1000)
- ✅ No secrets in code (uses env vars)
- ✅ CORS configured (limit in production)
- ✅ Input validation via Pydantic
- ✅ Health checks for monitoring
- ⚠️ TODO: Add authentication middleware
- ⚠️ TODO: Add rate limiting per tier

---

## 🌍 Environment Variables

```bash
# Service URLs (Docker DNS)
OLLAMA_URL=http://vpn-ollama:11434
API_URL=http://vpn-api:5000
N8N_URL=http://vpn-n8n:5678
REDIS_URL=redis://vpn-redis:6379
POSTGRES_URL=postgresql://user:pass@host/db

# Application config
ENVIRONMENT=production
LOG_LEVEL=INFO
WORKERS=4
```

**Set in:** `infrastructure/docker/docker-compose.yml`

---

## 🚢 Deployment

### Local Development
```bash
cd flask
uvicorn app:app --reload --port 5001
```

### Docker Development
```bash
cd infrastructure/docker
docker compose up -d python-api
```

### Production (Hetzner)
```bash
ssh root@server
cd /opt/vpn-enterprise
git pull
cd infrastructure/docker
docker compose up -d --build python-api
```

**Full deployment guide:** See [Complete Guide](./FASTAPI_COMPLETE_GUIDE.md#9-docker--deployment)

---

## 📚 Learning Resources

### Documentation
1. **[FastAPI Complete Guide](./FASTAPI_COMPLETE_GUIDE.md)** - Read cover to cover
2. **[Quick Reference](./FASTAPI_QUICK_REFERENCE.md)** - Daily commands
3. **[Official FastAPI Docs](https://fastapi.tiangolo.com)** - Go deeper
4. **[Pydantic Docs](https://docs.pydantic.dev)** - Data validation
5. **[HTTPX Docs](https://www.python-httpx.org)** - Async HTTP client

### Learning Path
1. Week 1: Read Complete Guide, test endpoints
2. Week 2: Study async/await, Pydantic models
3. Week 3: Add a new endpoint, test in production
4. Week 4: Implement caching, rate limiting

---

## 🤝 Contributing

### Adding New Endpoint

1. **Define Pydantic models:**
```python
class MyRequest(BaseModel):
    field1: str
    field2: int

class MyResponse(BaseModel):
    result: str
```

2. **Add endpoint:**
```python
@app.post("/my-endpoint", response_model=MyResponse)
async def my_function(request: MyRequest):
    """Endpoint description"""
    try:
        # Your logic
        return {"result": "success"}
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

3. **Test:**
```bash
# Rebuild
docker compose up -d --build python-api

# Test
curl -X POST http://localhost:5001/my-endpoint \
  -H "Content-Type: application/json" \
  -d '{"field1":"value","field2":123}'
```

4. **Commit:**
```bash
git add flask/
git commit -m "feat: Add my-endpoint"
git push
```

---

## 📞 Support

### Quick Help
- **Interactive docs:** http://localhost:5001/docs
- **Health check:** http://localhost:5001/health
- **Logs:** `docker logs vpn-python-api`

### Documentation
- **Complete Guide:** [FASTAPI_COMPLETE_GUIDE.md](./FASTAPI_COMPLETE_GUIDE.md)
- **Quick Reference:** [FASTAPI_QUICK_REFERENCE.md](./FASTAPI_QUICK_REFERENCE.md)

### External Resources
- FastAPI: https://fastapi.tiangolo.com
- Ollama API: https://github.com/ollama/ollama/blob/main/docs/api.md

---

## 📝 Version

- **Python:** 3.11
- **FastAPI:** 0.115.0
- **Uvicorn:** 0.34.0
- **Workers:** 4
- **Status:** Production-ready ✅

---

## 🎯 Roadmap

### Current
- ✅ AI generation via Ollama
- ✅ SQL assistance (4 actions)
- ✅ Code completion
- ✅ Health checks
- ✅ Docker deployment

### Next
- ⏳ Redis caching
- ⏳ Rate limiting per tier
- ⏳ Authentication middleware
- ⏳ Usage analytics
- ⏳ Streaming responses

### Future
- 🔮 Multiple AI model support
- 🔮 Fine-tuned models
- 🔮 Vector embeddings
- 🔮 RAG (Retrieval Augmented Generation)

---

**Built with ❤️ for VPN Enterprise**  
**Last Updated:** February 1, 2026  
**Maintainer:** You (Python developer in training!)

---

*Start with the [Complete Guide](./FASTAPI_COMPLETE_GUIDE.md), keep the [Quick Reference](./FASTAPI_QUICK_REFERENCE.md) handy, and you'll master FastAPI in no time!*
