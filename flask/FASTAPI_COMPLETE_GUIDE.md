# 🐍 Complete FastAPI (Python API) Guide for VPN Enterprise

**Your Lifetime Reference for Understanding and Maintaining the Python/FastAPI Microservice**

---

## 📚 Table of Contents

1. [FastAPI Basics - Start Here](#1-fastapi-basics---start-here)
2. [Understanding Your API](#2-understanding-your-api)
3. [Code Structure Explained](#3-code-structure-explained)
4. [Endpoints Deep Dive](#4-endpoints-deep-dive)
5. [Ollama AI Integration](#5-ollama-ai-integration)
6. [Async Programming](#6-async-programming)
7. [Pydantic Models](#7-pydantic-models)
8. [Error Handling](#8-error-handling)
9. [Docker & Deployment](#9-docker--deployment)
10. [Testing & Debugging](#10-testing--debugging)
11. [Quick Reference](#11-quick-reference)

---

## 1. FastAPI Basics - Start Here

### What is FastAPI?

**FastAPI** is a modern Python web framework for building APIs. It's:
- **Fast** - As fast as NodeJS and Go (thanks to Starlette/Pydantic)
- **Type-safe** - Uses Python type hints for validation
- **Auto-documented** - Generates interactive API docs automatically
- **Async-ready** - Built on async/await for high performance

### Why FastAPI for Your Project?

In VPN Enterprise, this FastAPI service:
1. **AI Integration** - Connects to Ollama for code/SQL generation
2. **Service Bridge** - Links frontend to AI without direct exposure
3. **API Gateway** - Aggregates multiple services (Ollama, N8N, main API)
4. **Rate Limiting** - Controls API usage per tier (free/pro/enterprise)
5. **Auto Docs** - Visit `/docs` for interactive API testing

### Your API in the System

```
┌─────────────────────────────────────────────────────────────┐
│                    NexusAI Frontend                         │
│                    (React/TypeScript)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP POST
                       │ /api/ai/generate
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                 Nginx Reverse Proxy                         │
│          (routes /api/ai/* → python-api:5001)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│         FastAPI Python API (python-api:5001)                │
│         YOUR CODE: flask/app.py                             │
│                                                             │
│  Endpoints:                                                 │
│  ├─ POST /ai/generate        → Ollama                      │
│  ├─ POST /ai/sql/assist      → Ollama                      │
│  ├─ GET  /ai/models          → Ollama                      │
│  ├─ POST /ai/code/complete   → Ollama                      │
│  └─ GET  /health             → Status check                │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ↓             ↓             ↓
┌────────────┐ ┌──────────┐ ┌──────────────┐
│  Ollama    │ │   N8N    │ │  Main API    │
│  :11434    │ │  :5678   │ │  :5000       │
│            │ │          │ │              │
│ llama3.2   │ │ Workflow │ │ VPN Config   │
└────────────┘ └──────────┘ └──────────────┘
```

---

## 2. Understanding Your API

### File Structure

```
flask/
├── app.py                # 🔥 MAIN APPLICATION (you edit this)
├── app_production.py     # Production entry point (rarely changed)
├── requirements.txt      # Python dependencies
├── Dockerfile            # Container build instructions
├── Dockerfile.dev        # Development container
└── __pycache__/          # Compiled Python (auto-generated)
```

### What Each File Does

**`app.py`** (562 lines) - YOUR MAIN FILE
- FastAPI app initialization
- All endpoint definitions
- Service integrations (Ollama, N8N)
- Request/response models
- Error handling
- Logging setup

**`app_production.py`** - Production Wrapper
- Imports from `app.py`
- Production-specific config
- Used in Dockerfile CMD

**`requirements.txt`** - Dependencies
- Lists all Python packages needed
- Installed via `pip install -r requirements.txt`

**`Dockerfile`** - Container Build
- Multi-stage build (builder + runtime)
- Security: Non-root user
- Health check included
- 4 workers for production

### How It Runs

```bash
# Development (local)
cd flask
uvicorn app:app --reload --port 5001

# Production (Docker)
uvicorn app_production:app --host 0.0.0.0 --port 5001 --workers 4
```

---

## 3. Code Structure Explained

### Imports Section

```python
from fastapi import FastAPI, HTTPException, Depends, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import httpx
```

**What each import does:**

**`fastapi.FastAPI`**
- Main application class
- Creates your API instance: `app = FastAPI()`

**`fastapi.HTTPException`**
- Raise HTTP errors: `raise HTTPException(status_code=404, detail="Not found")`

**`fastapi.Depends`**
- Dependency injection (not heavily used in your code yet)

**`fastapi.middleware.cors.CORSMiddleware`**
- Enables CORS (Cross-Origin Resource Sharing)
- Allows frontend to call API from different domain

**`pydantic.BaseModel`**
- Data validation and serialization
- Define request/response schemas

**`httpx`**
- Modern HTTP client (like `requests` but async)
- Used to call Ollama, N8N, main API

### Service Discovery

```python
SERVICES = {
    "api": os.getenv("API_URL", "http://vpn-api-dev:5000"),
    "web": os.getenv("WEB_URL", "http://vpn-web-dev:3000"),
    "redis": os.getenv("REDIS_URL", "redis://vpn-redis-dev:6379"),
    "n8n": os.getenv("N8N_URL", "http://vpn-n8n-dev:5678"),
    "ollama": os.getenv("OLLAMA_URL", "http://vpn-ollama-dev:11434"),
    "postgres": os.getenv("POSTGRES_URL", "postgresql://...")
}
```

**What this does:**
- Maps service names to Docker container addresses
- Uses environment variables for flexibility
- Falls back to defaults if env vars not set

**How to use:**
```python
# Get Ollama URL
ollama_url = SERVICES["ollama"]  # "http://vpn-ollama-dev:11434"

# Make request
response = await client.post(f"{ollama_url}/api/generate", ...)
```

**In production:** Environment variables are set in docker-compose

### Application Lifecycle

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code
    logger.info("🚀 FastAPI Python Service Starting...")
    
    # Initialize Redis
    redis_client = await redis.from_url(...)
    
    yield  # App runs here
    
    # Shutdown code
    if redis_client:
        await redis_client.close()
    logger.info("🛑 FastAPI Python Service Shutting Down...")

app = FastAPI(lifespan=lifespan)
```

**What `lifespan` does:**
1. **Before `yield`:** Runs once when app starts
   - Connect to databases
   - Initialize connections
   - Log startup info

2. **`yield`:** App handles requests

3. **After `yield`:** Runs once when app stops
   - Close database connections
   - Clean up resources
   - Log shutdown info

**When it runs:**
```
Container starts → lifespan startup → App ready → Handle requests
                                          ↓
Container stops  ← lifespan shutdown  ← Signal received
```

### CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**What is CORS?**
Browser security that blocks requests from one domain to another.

**Example without CORS:**
```
Frontend: https://chatbuilds.com
API: https://chatbuilds.com/api/ai/

Browser: ✅ Same domain, request allowed
```

```
Frontend: http://localhost:3000
API: https://chatbuilds.com/api/ai/

Browser: ❌ Different domain, request BLOCKED
```

**Your CORS config:**
- `allow_origins=["*"]` - Allow requests from ANY domain
- `allow_credentials=True` - Allow cookies/auth headers
- `allow_methods=["*"]` - Allow GET, POST, PUT, DELETE, etc.
- `allow_headers=["*"]` - Allow any custom headers

**Production tip:** Change `["*"]` to specific domains:
```python
allow_origins=[
    "https://chatbuilds.com",
    "https://nexusai.chatbuilds.com"
]
```

---

## 4. Endpoints Deep Dive

### Anatomy of an Endpoint

```python
@app.post("/ai/generate", response_model=AIResponse)
async def generate_ai_response(request: AIRequest):
    """Generate AI response using Ollama service"""
    # ... implementation
```

**Breaking it down:**

**`@app.post`** - Decorator (tells FastAPI this is an endpoint)
- `@app.get` - GET requests
- `@app.post` - POST requests  
- `@app.put` - PUT requests
- `@app.delete` - DELETE requests

**`"/ai/generate"`** - URL path
- Full URL: `http://python-api:5001/ai/generate`
- Accessed via nginx: `https://chatbuilds.com/api/ai/generate`

**`response_model=AIResponse`** - Response type
- FastAPI validates response matches this model
- Auto-generates docs with response schema
- Converts Python dict to JSON

**`async def`** - Async function
- Can use `await` inside
- Doesn't block other requests
- More on this in Async section

**`request: AIRequest`** - Request body type
- FastAPI auto-validates incoming JSON
- Rejects invalid requests with 422 error
- Provides type hints in IDE

**Docstring `""" ... """`**
- Shows in `/docs` as endpoint description
- Good practice to document what endpoint does

### Root Endpoint

```python
@app.get("/", response_model=Dict[str, str])
async def root():
    return {
        "service": "VPN Enterprise Python API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }
```

**Purpose:** Service information  
**When to use:** Check if API is reachable  
**Example:**
```bash
curl http://localhost:5001/
{
  "service": "VPN Enterprise Python API",
  "status": "running",
  "version": "1.0.0",
  "docs": "/docs",
  "health": "/health"
}
```

### Health Check Endpoint

```python
@app.get("/health", response_model=HealthResponse)
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "service": "python-api",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development")
    }
```

**Purpose:** Monitoring and load balancers  
**Used by:**
- Docker health checks
- Kubernetes liveness probes
- Monitoring tools (Prometheus, Grafana)
- Nginx upstream checks

**Example:**
```bash
curl http://localhost:5001/health
{
  "status": "healthy",
  "timestamp": "2026-02-01T10:30:00",
  "service": "python-api",
  "version": "1.0.0",
  "environment": "production"
}
```

**In Dockerfile:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s \
    CMD curl -f http://localhost:5001/health || exit 1
```

### Service Status Check

```python
@app.get("/services/status", response_model=List[ServiceStatus])
async def check_services():
    """Check status of all services via Docker DNS"""
    results = []
    
    async with httpx.AsyncClient(timeout=5.0) as client:
        for name, url in SERVICES.items():
            try:
                start_time = datetime.now()
                
                if name == "ollama":
                    response = await client.get(f"{url}/")
                elif name == "n8n":
                    response = await client.get(f"{url}/healthz")
                # ... more checks
```

**What it does:**
1. Loop through all services in `SERVICES` dict
2. Try to reach each service's health endpoint
3. Measure response time
4. Return status for each

**Response example:**
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
  },
  {
    "name": "redis",
    "url": "redis://vpn-redis:6379",
    "status": "configured",
    "response_time_ms": null
  }
]
```

**Use cases:**
- Dashboard: Show service health
- Debugging: Which service is down?
- Monitoring: Track response times

---

## 5. Ollama AI Integration

### AI Generation Endpoint

```python
@app.post("/ai/generate", response_model=AIResponse)
async def generate_ai_response(request: AIRequest):
    """Generate AI response using Ollama service"""
    try:
        # Build prompt with context if provided
        full_prompt = request.prompt
        if request.context:
            full_prompt = f"Context: {request.context}\n\nQuestion: {request.prompt}"
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{SERVICES['ollama']}/api/generate",
                json={
                    "model": request.model,
                    "prompt": full_prompt,
                    "stream": request.stream,
                    "options": {
                        "temperature": request.temperature
                    }
                }
            )
```

**Step-by-step breakdown:**

**1. Build prompt**
```python
full_prompt = request.prompt
if request.context:
    full_prompt = f"Context: {request.context}\n\nQuestion: {request.prompt}"
```
**Why:** Providing context helps AI give better answers  
**Example:**
```python
prompt = "Create a button"
context = "React + TypeScript project with Tailwind"
full_prompt = "Context: React + TypeScript project with Tailwind\n\nQuestion: Create a button"
```

**2. Create HTTP client**
```python
async with httpx.AsyncClient(timeout=120.0) as client:
```
**Why `async with`:** Auto-closes connection when done  
**`timeout=120.0`:** Wait up to 2 minutes (AI can be slow)  
**Without timeout:** Request hangs forever if Ollama crashes

**3. Call Ollama API**
```python
response = await client.post(
    f"{SERVICES['ollama']}/api/generate",
    json={
        "model": "llama3.2:1b",
        "prompt": full_prompt,
        "stream": False,
        "options": {"temperature": 0.7}
    }
)
```

**Ollama API parameters:**
- `model` - Which AI model to use (`llama3.2:1b`, `codellama`, etc.)
- `prompt` - The question/instruction
- `stream` - If `True`, returns tokens as they're generated
- `temperature` - Creativity level (0.0-2.0)
  - 0.0 = deterministic, same answer every time
  - 0.7 = balanced (your default)
  - 2.0 = very creative, random

**4. Parse response**
```python
data = response.json()
return {
    "response": data.get("response", ""),
    "model": request.model,
    "eval_count": data.get("eval_count"),
    "total_duration_ms": data.get("total_duration", 0) / 1e6
}
```

**Ollama response structure:**
```json
{
  "response": "Sure! Here's a React button component...",
  "model": "llama3.2:1b",
  "total_duration": 1234567890,  # nanoseconds
  "eval_count": 42                # tokens generated
}
```

**Your response (converted):**
```json
{
  "response": "Sure! Here's a React button component...",
  "model": "llama3.2:1b",
  "total_duration_ms": 1234.56,  # milliseconds
  "eval_count": 42
}
```

### SQL Assistant Endpoint

```python
@app.post("/ai/sql/assist", response_model=SQLAssistResponse)
async def sql_assistant(request: SQLAssistRequest):
    """AI-powered SQL assistance"""
    prompts = {
        "generate": f"""You are a PostgreSQL expert. Generate a SQL query...

User Request: {request.query}
{f'Database Schema: {request.schema}' if request.schema else ''}

Generate ONLY the SQL query without explanations.""",
        
        "explain": f"""Explain this SQL query in simple terms:

SQL Query: {request.query}""",
        
        "optimize": f"""Analyze and optimize this query...""",
        
        "fix": f"""Fix the errors in this SQL query..."""
    }
    
    prompt = prompts.get(request.action, prompts["generate"])
```

**What this does:**
Different prompts for different actions:

**1. Generate SQL**
```
User: "Get all users who signed up in 2025"
Action: generate
Prompt: "Generate a SQL query: Get all users who signed up in 2025"
AI Response: "SELECT * FROM users WHERE EXTRACT(YEAR FROM created_at) = 2025;"
```

**2. Explain SQL**
```
User: "SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)"
Action: explain
AI Response: "This query finds all users who have placed at least one order..."
```

**3. Optimize SQL**
```
User: "SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)"
Action: optimize
AI Response: "SELECT DISTINCT u.* FROM users u INNER JOIN orders o ON u.id = o.user_id"
Explanation: "Using JOIN instead of subquery is faster..."
```

**4. Fix SQL**
```
User: "SELCT * FRM users WERE id = 1"
Action: fix
AI Response: "SELECT * FROM users WHERE id = 1"
Explanation: "Fixed typos: SELCT→SELECT, FRM→FROM, WERE→WHERE"
```

**Response parsing:**
```python
if request.action == "generate":
    sql = ai_response.strip()
    sql = sql.replace("```sql", "").replace("```", "").strip()
    return {"sql": sql, "explanation": None}
```

**Why remove markdown:**
AI sometimes wraps SQL in code blocks:
````
```sql
SELECT * FROM users;
```
````

We extract just the SQL:
```sql
SELECT * FROM users;
```

### Models List Endpoint

```python
@app.get("/ai/models")
async def list_ai_models():
    """List available AI models from Ollama"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{SERVICES['ollama']}/api/tags")
            if response.status_code == 200:
                return response.json()
```

**Purpose:** Show which models are installed  
**Example response:**
```json
{
  "models": [
    {
      "name": "llama3.2:1b",
      "size": 1250000000,
      "modified_at": "2026-01-15T10:30:00Z"
    },
    {
      "name": "codellama:7b",
      "size": 3800000000,
      "modified_at": "2026-01-20T14:20:00Z"
    }
  ]
}
```

**Used by:** NexusAI settings to show available models

---

## 6. Async Programming

### What is Async?

**Synchronous (Blocking):**
```python
def slow_function():
    result = call_api()  # Wait 2 seconds
    return result

# Handle 3 requests
request1 = slow_function()  # 2 seconds
request2 = slow_function()  # 2 seconds  
request3 = slow_function()  # 2 seconds
# Total: 6 seconds
```

**Asynchronous (Non-blocking):**
```python
async def fast_function():
    result = await call_api()  # Start request, do other work
    return result

# Handle 3 requests
request1 = fast_function()  # Start
request2 = fast_function()  # Start
request3 = fast_function()  # Start
# All run at same time
# Total: 2 seconds
```

### Async in Your Code

```python
@app.post("/ai/generate")
async def generate_ai_response(request: AIRequest):
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(...)
```

**Key keywords:**

**`async def`** - Async function
- Can use `await` inside
- Returns a coroutine
- Must be awaited when called

**`await`** - Wait for async operation
- Pauses this function
- Lets other requests run
- Resumes when operation done

**`async with`** - Async context manager
- Like `with` but for async resources
- Auto-closes when block exits

### Why Async Matters

**Without async (blocking):**
```
Request 1: Call Ollama (2s) → Process → Return
Request 2: Wait... → Call Ollama (2s) → Process → Return
Request 3: Wait... → Wait... → Call Ollama (2s) → Process → Return

User 1 waits: 2 seconds
User 2 waits: 4 seconds  
User 3 waits: 6 seconds
```

**With async (non-blocking):**
```
Request 1: Call Ollama → (waiting, but not blocking)
Request 2: Call Ollama → (waiting, but not blocking)
Request 3: Call Ollama → (waiting, but not blocking)

All return in ~2 seconds

User 1 waits: 2 seconds
User 2 waits: 2 seconds
User 3 waits: 2 seconds
```

### Common Async Patterns

**Pattern 1: HTTP Request**
```python
async with httpx.AsyncClient() as client:
    response = await client.get("http://api.example.com")
    data = response.json()
```

**Pattern 2: Database Query**
```python
async with database.transaction():
    result = await database.fetch_one("SELECT * FROM users")
```

**Pattern 3: Multiple Concurrent Requests**
```python
async with httpx.AsyncClient() as client:
    # Start all requests at once
    task1 = client.get("http://api1.com")
    task2 = client.get("http://api2.com")
    task3 = client.get("http://api3.com")
    
    # Wait for all to complete
    response1, response2, response3 = await asyncio.gather(
        task1, task2, task3
    )
```

---

## 7. Pydantic Models

### What are Pydantic Models?

**Pydantic** validates and serializes data using Python type hints.

**Without Pydantic:**
```python
@app.post("/user")
def create_user(data: dict):
    # What if 'name' is missing?
    # What if 'age' is a string, not int?
    # What if 'email' is invalid?
    name = data["name"]  # KeyError if missing
    age = data["age"]    # Might be wrong type
```

**With Pydantic:**
```python
class User(BaseModel):
    name: str
    age: int
    email: str

@app.post("/user")
def create_user(user: User):
    # Guaranteed:
    # - name exists and is string
    # - age exists and is int
    # - email exists and is string
```

### Your Request Models

**AIRequest:**
```python
class AIRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    model: str = Field(default="llama3.2:1b")
    stream: bool = Field(default=False)
    context: Optional[str] = None
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
```

**Field parameters:**

**`Field(...)`** - Required field
- `...` (Ellipsis) = required
- Without it = optional

**`min_length=1, max_length=2000`** - String validation
- Prompt must be 1-2000 characters
- Rejects empty or too-long prompts

**`default="llama3.2:1b"`** - Default value
- If client doesn't provide, use this

**`Optional[str]`** - Can be None
- Context is optional
- Can be `None` or string

**`ge=0.0, le=2.0`** - Numeric validation
- `ge` = greater than or equal
- `le` = less than or equal
- Temperature must be 0.0-2.0

**Example valid request:**
```json
{
  "prompt": "Hello",
  "model": "llama3.2:1b",
  "stream": false,
  "context": null,
  "temperature": 0.7
}
```

**Example invalid request (rejected with 422):**
```json
{
  "prompt": "",  # ❌ Too short (min_length=1)
  "temperature": 3.0  # ❌ Too high (le=2.0)
}
```

### Your Response Models

**AIResponse:**
```python
class AIResponse(BaseModel):
    response: str
    model: str
    eval_count: Optional[int] = None
    total_duration_ms: Optional[float] = None
```

**Why use response models:**
1. **Documentation** - Shows in `/docs` what API returns
2. **Validation** - Ensures you return correct structure
3. **Type safety** - IDE autocomplete works

**Example:**
```python
@app.post("/ai/generate", response_model=AIResponse)
async def generate_ai_response(request: AIRequest):
    # ...
    return {
        "response": "Hello!",
        "model": "llama3.2:1b",
        "eval_count": 42,
        "total_duration_ms": 1234.56
    }
    # FastAPI converts dict → AIResponse object
    # Then serializes to JSON
```

### SQLAssistRequest Model

```python
class SQLAssistRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    schema: Optional[str] = None
    action: str = Field(
        default="generate",
        pattern="^(generate|explain|optimize|fix)$"
    )
```

**`pattern="^(generate|explain|optimize|fix)$"`** - Regex validation
- Only allow these 4 values
- Rejects anything else

**Valid:**
```json
{"query": "SELECT * FROM users", "action": "explain"}
```

**Invalid:**
```json
{"query": "SELECT * FROM users", "action": "delete"}  # ❌ Not in pattern
```

---

## 8. Error Handling

### HTTP Exceptions

```python
raise HTTPException(
    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
    detail="Ollama service is unavailable"
)
```

**Common status codes:**

| Code | Constant | Meaning | When to Use |
|------|----------|---------|-------------|
| 200 | HTTP_200_OK | Success | Normal response |
| 400 | HTTP_400_BAD_REQUEST | Bad input | Invalid data |
| 401 | HTTP_401_UNAUTHORIZED | Not authenticated | Missing API key |
| 403 | HTTP_403_FORBIDDEN | Not authorized | Wrong permissions |
| 404 | HTTP_404_NOT_FOUND | Not found | Resource doesn't exist |
| 422 | HTTP_422_UNPROCESSABLE_ENTITY | Validation failed | Pydantic error |
| 500 | HTTP_500_INTERNAL_SERVER_ERROR | Server error | Unexpected error |
| 503 | HTTP_503_SERVICE_UNAVAILABLE | Service down | Ollama unreachable |

### Try-Except Pattern

```python
@app.post("/ai/generate")
async def generate_ai_response(request: AIRequest):
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(...)
            # Process response
    except httpx.RequestError as e:
        logger.error(f"Ollama request failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ollama service is unavailable"
        )
```

**Flow:**
```
1. Try to call Ollama
   ↓
2a. Success? Return response
2b. RequestError? Log error and raise 503
```

**Why this pattern:**
1. **Graceful failure** - Return proper error to client
2. **Logging** - Track what went wrong
3. **Specificity** - Different errors for different problems

### Validation Errors (Automatic)

FastAPI automatically validates with Pydantic:

**Request:**
```json
{
  "prompt": "",
  "temperature": 3.0
}
```

**Response (automatic 422):**
```json
{
  "detail": [
    {
      "loc": ["body", "prompt"],
      "msg": "ensure this value has at least 1 characters",
      "type": "value_error.any_str.min_length"
    },
    {
      "loc": ["body", "temperature"],
      "msg": "ensure this value is less than or equal to 2.0",
      "type": "value_error.number.not_le"
    }
  ]
}
```

**You don't write this code!** Pydantic does it automatically.

### Logging Best Practices

```python
logger.info("🚀 FastAPI Python Service Starting...")
logger.error(f"Ollama request failed: {str(e)}")
logger.info(f"📡 Service Discovery: {len(SERVICES)} services")
```

**Log levels:**
- `logger.debug()` - Detailed info (dev only)
- `logger.info()` - General info (what's happening)
- `logger.warning()` - Something unusual (still works)
- `logger.error()` - Error occurred (request failed)
- `logger.critical()` - Critical failure (service down)

**View logs:**
```bash
docker logs vpn-python-api
docker logs -f vpn-python-api  # Follow/watch
docker logs vpn-python-api --tail 100  # Last 100 lines
```

---

## 9. Docker & Deployment

### Dockerfile Breakdown

```dockerfile
# Stage 1: Builder
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy code
COPY . .
```

**Multi-stage build:**
- Stage 1 (builder): Install everything (compilers, dev tools)
- Stage 2 (final): Only runtime dependencies

**Why:** Smaller image (builder stage discarded)

**Stage 2: Runtime**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Runtime dependencies only
RUN apt-get update && apt-get install -y \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY . .

# Non-root user (security)
RUN useradd -m -u 1000 fastapi && chown -R fastapi:fastapi /app
USER fastapi

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s \
    CMD curl -f http://localhost:5001/health || exit 1

# Run with 4 workers
CMD ["uvicorn", "app_production:app", "--host", "0.0.0.0", "--port", "5001", "--workers", "4"]
```

**CMD explained:**
- `uvicorn` - ASGI server (runs FastAPI)
- `app_production:app` - Import `app` from `app_production.py`
- `--host 0.0.0.0` - Listen on all interfaces
- `--port 5001` - Port number
- `--workers 4` - 4 worker processes (parallel requests)

### Environment Variables

**Set in docker-compose:**
```yaml
python-api:
  environment:
    - OLLAMA_URL=http://vpn-ollama:11434
    - API_URL=http://vpn-api:5000
    - ENVIRONMENT=production
```

**Access in code:**
```python
SERVICES = {
    "ollama": os.getenv("OLLAMA_URL", "http://vpn-ollama-dev:11434"),
}
```

**`os.getenv(key, default)`:**
- Read environment variable
- Use default if not set

### Building & Running

**Build image:**
```bash
cd flask
docker build -t vpn-python-api .
```

**Run container:**
```bash
docker run -p 5001:5001 vpn-python-api
```

**With docker-compose:**
```bash
cd infrastructure/docker
docker compose up -d python-api
```

**Rebuild and restart:**
```bash
docker compose up -d --build python-api
```

### Workers Explained

**`--workers 4`** - Run 4 processes

```
┌─────────────────────────────────────┐
│      Uvicorn Master Process         │
└────────┬───────┬───────┬────────────┘
         │       │       │
    ┌────▼──┐ ┌──▼───┐ ┌▼─────┐ ┌──────┐
    │Worker1│ │Worker2│ │Worker3│ │Worker4│
    └───────┘ └───────┘ └───────┘ └──────┘
         ↑       ↑       ↑       ↑
      Request1 Request2 Request3 Request4
```

**Why multiple workers:**
- Better CPU utilization (one per core)
- Handle more concurrent requests
- If one crashes, others keep running

**How many workers:**
- **Formula:** `(2 × CPU cores) + 1`
- **Your server (4 cores):** 4 workers is good
- **Small VPS (1 core):** 2 workers
- **Big server (16 cores):** 8-16 workers

---

## 10. Testing & Debugging

### Interactive API Docs

FastAPI generates docs automatically!

**Swagger UI (recommended):**
```
http://localhost:5001/docs
```

**Features:**
- List all endpoints
- Try requests in browser
- See request/response schemas
- No code needed!

**ReDoc (alternative):**
```
http://localhost:5001/redoc
```

### Manual Testing with cURL

**Test health:**
```bash
curl http://localhost:5001/health
```

**Test AI generation:**
```bash
curl -X POST http://localhost:5001/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Say hello",
    "model": "llama3.2:1b"
  }'
```

**Test SQL assist:**
```bash
curl -X POST http://localhost:5001/ai/sql/assist \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Get all users",
    "action": "generate"
  }'
```

**Pretty print JSON:**
```bash
curl http://localhost:5001/health | python3 -m json.tool
curl http://localhost:5001/health | jq .
```

### Debugging Tips

**1. Check logs**
```bash
docker logs vpn-python-api
docker logs -f vpn-python-api  # Follow
```

**2. Check if service is running**
```bash
docker ps | grep python-api
```

**3. Test Ollama directly**
```bash
curl http://localhost:11434/api/generate \
  -d '{"model":"llama3.2:1b","prompt":"Hello"}'
```

**4. Enter container**
```bash
docker exec -it vpn-python-api bash
```

**5. Check network**
```bash
docker exec vpn-python-api curl http://ollama:11434/
```

**6. Test endpoint from inside nginx**
```bash
docker exec vpn-nginx curl http://python-api:5001/health
```

### Common Issues

**Issue: 503 Service Unavailable**
```
Cause: Ollama is down or unreachable
Fix: docker compose restart ollama
```

**Issue: 500 Internal Server Error**
```
Cause: Python exception
Fix: Check logs for traceback
```

**Issue: 422 Validation Error**
```
Cause: Invalid request body
Fix: Check request matches Pydantic model
```

**Issue: Slow responses**
```
Cause: Ollama generating (normal for AI)
Solution: Increase timeout or add progress indicator
```

---

## 11. Quick Reference

### Common Commands

```bash
# Start service
cd infrastructure/docker
docker compose up -d python-api

# Restart service
docker compose restart python-api

# Rebuild and restart
docker compose up -d --build python-api

# View logs
docker logs vpn-python-api
docker logs -f vpn-python-api

# Check if running
docker ps | grep python-api

# Enter container
docker exec -it vpn-python-api bash

# Test inside container
docker exec vpn-python-api curl http://localhost:5001/health
```

### Your Endpoints

```
Production: https://chatbuilds.com/api/ai/

POST /ai/generate       - Generate AI text/code
POST /ai/sql/assist     - SQL generation/explain/optimize/fix
GET  /ai/models         - List available models
POST /ai/code/complete  - Code completion
GET  /health            - Health check
GET  /services/status   - Check all services
GET  /docs              - Interactive API docs
```

### Request Examples

**Generate AI:**
```json
POST /ai/generate
{
  "prompt": "Create a React button",
  "model": "llama3.2:1b",
  "temperature": 0.7
}
```

**SQL Assist:**
```json
POST /ai/sql/assist
{
  "query": "Get all users from 2025",
  "action": "generate"
}
```

### Response Codes

```
200 - Success
400 - Bad request (invalid data)
422 - Validation error (Pydantic)
500 - Internal error
503 - Service unavailable (Ollama down)
```

### Key Files

```
flask/
├── app.py              - Main application (edit this)
├── requirements.txt    - Dependencies
├── Dockerfile          - Container build
└── app_production.py   - Production entry
```

### Adding New Endpoint

```python
@app.post("/your-endpoint", response_model=YourResponse)
async def your_function(request: YourRequest):
    """What this endpoint does"""
    try:
        # Your logic here
        return {"result": "success"}
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

### Deployment Workflow

```bash
# 1. Edit code
vim flask/app.py

# 2. Test locally
cd flask
uvicorn app:app --reload

# 3. Commit
git add flask/
git commit -m "feat: Add new endpoint"
git push

# 4. Deploy
ssh root@server
cd /opt/vpn-enterprise
git pull
cd infrastructure/docker
docker compose up -d --build python-api

# 5. Verify
curl https://chatbuilds.com/api/ai/health
```

---

## 📚 Learning Path

### Week 1: Basics
- ✅ Understand FastAPI concepts
- ✅ Read through app.py
- ✅ Test endpoints in `/docs`
- ✅ Make a simple endpoint

### Week 2: Deep Dive
- ✅ Study Pydantic models
- ✅ Understand async/await
- ✅ Learn error handling
- ✅ Add validation to endpoint

### Week 3: Integration
- ✅ Study Ollama integration
- ✅ Understand httpx usage
- ✅ Learn Docker deployment
- ✅ Debug a production issue

### Week 4: Advanced
- ✅ Add caching with Redis
- ✅ Implement rate limiting
- ✅ Add authentication
- ✅ Monitor performance

### Ongoing
- Read FastAPI docs: https://fastapi.tiangolo.com
- Practice on test environment
- Document your changes
- Keep learning!

---

**Last Updated:** February 1, 2026  
**Maintainer:** You (with Python power!)  
**Status:** Production-ready, lifetime maintained 🐍

---

*This guide grows with you. Every endpoint you add, every bug you fix, you'll understand FastAPI better!*
