
"""
VPN Enterprise - Python FastAPI Microservice
This module provides a FastAPI-based microservice for the VPN Enterprise platform,
offering AI integration, VPN configuration management, analytics, and workflow automation.
The service integrates with multiple backend services including:
- Ollama AI for natural language processing
- Main VPN API for configuration management
- N8N for workflow automation
- Redis for caching
- PostgreSQL for data persistence
Key Features:
- Health checks and service discovery via Docker DNS
- AI text generation using Ollama models
- VPN configuration generation and server management
- Analytics querying and dashboard statistics
- N8N workflow triggering
- CORS-enabled REST API with OpenAPI documentation
Environment Variables:
- API_URL: Main VPN API service URL (default: http://vpn-api-dev:5000)
- WEB_URL: Web frontend URL (default: http://vpn-web-dev:3000)
- REDIS_URL: Redis connection URL (default: redis://vpn-redis-dev:6379)
- N8N_URL: N8N automation service URL (default: http://vpn-n8n-dev:5678)
- OLLAMA_URL: Ollama AI service URL (default: http://vpn-ollama-dev:11434)
- POSTGRES_URL: PostgreSQL connection URL (default: postgresql://postgres:postgres@vpn-postgres-dev:5432/postgres)
- ENVIRONMENT: Deployment environment (default: development)
Endpoints:
- GET /: Root endpoint with service information
- GET /health: Health check endpoint
- GET /services/status: Check status of all integrated services
- POST /ai/generate: Generate AI responses using Ollama
- GET /ai/models: List available AI models
- POST /vpn/config/generate: Generate VPN configuration
- GET /vpn/servers: List available VPN servers
- POST /analytics/query: Query analytics data
- GET /analytics/dashboard: Get dashboard statistics
- POST /workflows/trigger/{workflow_id}: Trigger N8N workflow
Author: VPN Enterprise Team
Version: 1.0.0
"""
from fastapi import FastAPI, HTTPException, Depends, status, Header # pyright: ignore[reportMissingImports]
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from pydantic import BaseModel, Field # type: ignore
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import os
import logging
import httpx #type: ignore
from contextlib import asynccontextmanager
import hashlib
import json
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Service discovery - Docker DNS
SERVICES = {
    "api": os.getenv("API_URL", "http://vpn-api-dev:5000"),
    "web": os.getenv("WEB_URL", "http://vpn-web-dev:3000"),
    "redis": os.getenv("REDIS_URL", "redis://vpn-redis-dev:6379"),
    "n8n": os.getenv("N8N_URL", "http://vpn-n8n-dev:5678"),
    "ollama": os.getenv("OLLAMA_URL", "http://vpn-ollama-dev:11434"),
    "postgres": os.getenv("POSTGRES_URL", "postgresql://postgres:postgres@vpn-postgres-dev:5432/postgres")
}

# Redis connection
redis_client: Optional[redis.Redis] = None

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"

# Rate limiting configuration
RATE_LIMITS = {
    "free": {"requests": 100, "window": 3600},  # 100 req/hour
    "pro": {"requests": 1000, "window": 3600},   # 1000 req/hour
    "enterprise": {"requests": 10000, "window": 3600}  # 10k req/hour
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global http_client
    logger.info("🚀 FastAPI Python Service Starting...")
    logger.info(f"📡 Service Discovery: {len(SERVICES)} services configured")
    for name, url in SERVICES.items():
        logger.info(f"   • {name}: {url}")
    
    # Initialize HTTP client
    http_client = httpx.AsyncClient(timeout=30.0)
    logger.info("✅ HTTP client initialized successfully")
    
    yield
    
    # Shutdown
    if http_client:
        await http_client.aclose()
    logger.info("🛑 FastAPI Python Service Shutting Down...")

app = FastAPI(
    title="VPN Enterprise - Python API",
    description="Python/FastAPI microservice for VPN Enterprise platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# MODELS
# ============================================

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    service: str
    version: str
    environment: str

class ServiceStatus(BaseModel):
    name: str
    url: str
    status: str
    response_time_ms: Optional[float] = None

class AIRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=50000)  # Increased for large prompts
    model: str = Field(default="deepseek-coder-v2:16b")      # Better default for code gen
    stream: bool = Field(default=False)
    context: Optional[str] = None
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=4096, le=8192)            # Max output tokens
    num_ctx: int = Field(default=32768)                        # Context window size

class AIResponse(BaseModel):
    response: str
    model: str
    eval_count: Optional[int] = None
    total_duration_ms: Optional[float] = None

class SQLAssistRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    schema: Optional[str] = None
    action: str = Field(default="generate", pattern="^(generate|explain|optimize|fix)$")

class SQLAssistResponse(BaseModel):
    sql: Optional[str] = None
    explanation: Optional[str] = None
    suggestions: Optional[List[str]] = None

class CodeCompleteRequest(BaseModel):
    code: str = Field(..., min_length=1)
    language: str = Field(default="javascript")
    cursor_position: Optional[int] = None

class CodeCompleteResponse(BaseModel):
    completions: List[str]
    confidence: float

class TokenValidationResponse(BaseModel):
    valid: bool
    user_id: Optional[str] = None
    tenant_id: Optional[str] = None
    tier: str = "free"
    email: Optional[str] = None

class UsageStats(BaseModel):
    requests_used: int
    requests_limit: int
    requests_remaining: int
    window_reset: datetime

class VPNConfig(BaseModel):
    user_id: str
    server_id: str
    config_type: str = Field(default="wireguard")

class AnalyticsQuery(BaseModel):
    metric: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    aggregation: str = Field(default="daily")

# ============================================
# HEALTH & STATUS ENDPOINTS
# ============================================

@app.get("/", response_model=Dict[str, str])
async def root():
    return {
        "service": "VPN Enterprise Python API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "service": "python-api",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

@app.get("/services/status", response_model=List[ServiceStatus])
async def check_services():
    """Check status of all services via Docker DNS"""
    results = []
    
    async with httpx.AsyncClient(timeout=5.0) as client:
        for name, url in SERVICES.items():
            try:
                start_time = datetime.now()
                
                # Different health check endpoints
                if name == "ollama":
                    response = await client.get(f"{url}/")
                elif name == "n8n":
                    response = await client.get(f"{url}/healthz")
                elif name in ["api", "web"]:
                    response = await client.get(f"{url}/health")
                else:
                    # Skip redis and postgres for HTTP checks
                    results.append({
                        "name": name,
                        "url": url,
                        "status": "configured",
                        "response_time_ms": None
                    })
                    continue
                
                response_time = (datetime.now() - start_time).total_seconds() * 1000
                
                results.append({
                    "name": name,
                    "url": url,
                    "status": "up" if response.status_code == 200 else "down",
                    "response_time_ms": round(response_time, 2)
                })
            except Exception as e:
                results.append({
                    "name": name,
                    "url": url,
                    "status": "error",
                    "response_time_ms": None
                })
                logger.error(f"Service check failed for {name}: {str(e)}")
    
    return results

# ============================================
# AI / OLLAMA INTEGRATION
# ============================================

@app.post("/ai/generate", response_model=AIResponse)
async def generate_ai_response(request: AIRequest):
    """Generate AI response using Ollama service"""
    try:
        # Build prompt with context if provided
        full_prompt = request.prompt
        if request.context:
            full_prompt = f"Context: {request.context}\n\nQuestion: {request.prompt}"
        
        async with httpx.AsyncClient(timeout=300.0) as client:  # Increased timeout for large generations
            response = await client.post(
                f"{SERVICES['ollama']}/api/generate",
                json={
                    "model": request.model,
                    "prompt": full_prompt,
                    "stream": request.stream,
                    "options": {
                        "temperature": request.temperature,
                        "num_predict": request.max_tokens,   # Max output tokens
                        "num_ctx": request.num_ctx,          # Context window
                        "num_thread": 8,                      # Parallel processing
                    }
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Ollama service error: {response.text}"
                )
            
            data = response.json()
            return {
                "response": data.get("response", ""),
                "model": request.model,
                "eval_count": data.get("eval_count"),
                "total_duration_ms": data.get("total_duration", 0) / 1e6 if data.get("total_duration") else None
            }
    except httpx.RequestError as e:
        logger.error(f"Ollama request failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ollama service is unavailable"
        )

@app.get("/ai/models")
async def list_ai_models():
    """List available AI models from Ollama"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{SERVICES['ollama']}/api/tags")
            if response.status_code == 200:
                return response.json()
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch models")
    except Exception as e:
        logger.error(f"Failed to list models: {str(e)}")
        raise HTTPException(status_code=503, detail="Ollama service unavailable")

# ============================================
# AI SQL ASSISTANT
# ============================================

@app.post("/ai/sql/assist", response_model=SQLAssistResponse)
async def sql_assistant(request: SQLAssistRequest):
    """AI-powered SQL assistance - generate, explain, optimize, or fix SQL queries"""
    try:
        prompts = {
            "generate": f"""You are a PostgreSQL expert. Generate a SQL query for this request:

User Request: {request.query}
{f'Database Schema: {request.schema}' if request.schema else ''}

Generate ONLY the SQL query without explanations. Use PostgreSQL syntax.""",
            
            "explain": f"""You are a PostgreSQL expert. Explain this SQL query in simple terms:

SQL Query: {request.query}

Provide a clear, concise explanation of what this query does.""",
            
            "optimize": f"""You are a PostgreSQL performance expert. Analyze and optimize this query:

SQL Query: {request.query}
{f'Database Schema: {request.schema}' if request.schema else ''}

Provide the optimized query and explain the improvements.""",
            
            "fix": f"""You are a PostgreSQL expert. Fix the errors in this SQL query:

SQL Query: {request.query}
{f'Database Schema: {request.schema}' if request.schema else ''}

Provide the corrected query and explain what was wrong."""
        }
        
        prompt = prompts.get(request.action, prompts["generate"])
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{SERVICES['ollama']}/api/generate",
                json={
                    "model": "llama3.2:1b",
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.3}  # Lower temperature for more precise SQL
                }
            )
            
            if response.status_code != 200:
                detail = f"AI service error: {response.text}"
                raise HTTPException(
                    status_code=response.status_code,
                    detail=detail
                )
            
            data = response.json()
            ai_response = data.get("response", "")
            
            # Parse response based on action
            if request.action == "generate":
                # Extract SQL from response
                sql = ai_response.strip()
                # Remove markdown code blocks if present
                sql = sql.replace("```sql", "").replace("```", "").strip()
                return {"sql": sql, "explanation": None, "suggestions": None}
            
            elif request.action == "explain":
                return {"sql": None, "explanation": ai_response.strip(), "suggestions": None}
            
            elif request.action in ["optimize", "fix"]:
                # Try to extract SQL and explanation
                lines = ai_response.split("\n")
                sql_part = []
                explanation_part = []
                in_sql = False
                
                for line in lines:
                    if "```sql" in line.lower() or line.strip().upper().startswith(("SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "ALTER")):
                        in_sql = True
                    elif "```" in line and in_sql:
                        in_sql = False
                    elif in_sql:
                        sql_part.append(line)
                    else:
                        explanation_part.append(line)
                
                return {
                    "sql": "\n".join(sql_part).strip() if sql_part else None,
                    "explanation": "\n".join(explanation_part).strip() if explanation_part else ai_response,
                    "suggestions": None
                }
            
    except httpx.RequestError as e:
        logger.error(f"SQL assist request failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is unavailable"
        )

# ============================================
# AI CODE COMPLETION
# ============================================

@app.post("/ai/code/complete", response_model=CodeCompleteResponse)
async def code_completion(request: CodeCompleteRequest):
    """AI-powered code completion"""
    try:
        prompt = f"""You are an expert {request.language} programmer. Complete this code:

```{request.language}
{request.code}
```

Provide 2-3 different completion suggestions. Be concise and practical."""
        
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                f"{SERVICES['ollama']}/api/generate",
                json={
                    "model": "deepseek-coder-v2:16b",
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.5,
                        "num_predict": 500,
                        "num_ctx": 8192
                    }
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="AI service error")
            
            data = response.json()
            ai_response = data.get("response", "")
            
            # Parse completions (simplified - you might want more sophisticated parsing)
            completions = [line.strip() for line in ai_response.split("\n") if line.strip() and not line.strip().startswith("#")]
            
            return {
                "completions": completions[:3] if completions else ["// No suggestions available"],
                "confidence": 0.85 if completions else 0.0
            }
            
    except httpx.RequestError as e:
        logger.error(f"Code completion failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is unavailable"
        )

# ============================================
# FULL APP GENERATION (Like Cursor/Lovable)
# ============================================

class FileOutput(BaseModel):
    path: str
    content: str
    language: str

class MultiFileGenerateRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=5000)
    framework: str = Field(default="react", pattern="^(react|vue|angular|nextjs|express|fastapi)$")
    features: List[str] = Field(default_factory=list)
    styling: str = Field(default="tailwind", pattern="^(tailwind|css|styled-components|sass)$")

class MultiFileGenerateResponse(BaseModel):
    files: List[FileOutput]
    instructions: str
    dependencies: Dict[str, str]

@app.post("/ai/generate/app", response_model=MultiFileGenerateResponse)
async def generate_full_app(request: MultiFileGenerateRequest):
    """Generate a complete application with multiple files - Like Cursor/Lovable"""
    
    features_str = "\n".join([f"- {f}" for f in request.features]) if request.features else "- Basic CRUD operations\n- Responsive design\n- Error handling"
    
    prompt = f"""You are an expert full-stack developer creating production-ready applications. Generate a complete {request.framework} application.

**Project Description:**
{request.description}

**Required Features:**
{features_str}

**Styling Framework:** {request.styling}

**Critical Instructions:**
1. Generate a COMPLETE, WORKING application with ALL necessary files
2. Include proper project structure and organization
3. Add comprehensive error handling and loading states
4. Make it production-ready with proper TypeScript types
5. Include proper documentation in comments

Return ONLY a valid JSON object with this EXACT structure (no markdown, no extra text):

{{
  "files": [
    {{
      "path": "package.json",
      "content": "{{...complete package.json content...}}",
      "language": "json"
    }},
    {{
      "path": "src/App.tsx",
      "content": "import React from 'react'\\n\\nconst App = () => {{...}}",
      "language": "typescript"
    }}
  ],
  "instructions": "Complete setup instructions with all commands",
  "dependencies": {{"react": "^18.2.0", "typescript": "^5.0.0"}}
}}

Generate at minimum:
- package.json with ALL dependencies
- Main application file
- Component files (at least 3-5 components)
- Routing setup (if applicable)
- API service/utilities
- CSS/Tailwind configuration
- TypeScript configuration
- README.md with detailed setup instructions
- Environment variables template (.env.example)

IMPORTANT: Return ONLY valid JSON, no markdown code blocks, no extra explanations."""

    try:
        logger.info(f"Generating full app: {request.framework} with features: {request.features}")
        
        async with httpx.AsyncClient(timeout=600.0) as client:  # 10 min timeout for large generations
            response = await client.post(
                f"{SERVICES['ollama']}/api/generate",
                json={
                    "model": "deepseek-coder-v2:16b",  # Best model for code generation
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,      # Lower for more consistent output
                        "num_predict": 8192,     # Maximum output tokens
                        "num_ctx": 32768,        # Large context for complex apps
                        "num_thread": 8,         # Parallel processing
                    }
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Ollama service error: {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Ollama service error: {response.text}"
                )
            
            data = response.json()
            ai_response = data.get("response", "")
            
            logger.info(f"AI generated response length: {len(ai_response)} characters")
            
            # Clean up markdown code blocks if present
            ai_response = ai_response.strip()
            if ai_response.startswith("```json"):
                ai_response = ai_response[7:]
            elif ai_response.startswith("```"):
                ai_response = ai_response[3:]
            
            if ai_response.endswith("```"):
                ai_response = ai_response[:-3]
            
            ai_response = ai_response.strip()
            
            # Parse JSON response
            result = json.loads(ai_response)
            
            # Validate response structure
            if "files" not in result or "instructions" not in result or "dependencies" not in result:
                raise ValueError("Invalid response structure from AI")
            
            logger.info(f"Successfully generated {len(result['files'])} files")
            return result
            
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response as JSON: {str(e)}")
        logger.error(f"Raw response: {ai_response[:500]}...")
        raise HTTPException(
            status_code=500,
            detail="AI generated invalid response format. Try again or reduce complexity."
        )
    except httpx.RequestError as e:
        logger.error(f"Full app generation request failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is unavailable"
        )
    except Exception as e:
        logger.error(f"Full app generation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Generation failed: {str(e)}"
        )

# ============================================
# VPN OPERATIONS
# ============================================

@app.post("/vpn/config/generate")
async def generate_vpn_config(config: VPNConfig):
    """Generate VPN configuration (delegates to main API)"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{SERVICES['api']}/api/v1/vpn/config",
                json=config.dict()
            )
            return response.json()
    except Exception as e:
        logger.error(f"VPN config generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/vpn/servers")
async def list_vpn_servers():
    """List available VPN servers"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{SERVICES['api']}/api/v1/servers")
            return response.json()
    except Exception as e:
        logger.error(f"Failed to list servers: {str(e)}")
        raise HTTPException(status_code=503, detail="Main API unavailable")

# ============================================
# ANALYTICS & DATA PROCESSING
# ============================================

@app.post("/analytics/query")
async def query_analytics(query: AnalyticsQuery):
    """Query analytics data (example endpoint)"""
    # This is a placeholder - implement with actual database queries
    return {
        "metric": query.metric,
        "aggregation": query.aggregation,
        "data": [
            {"date": "2025-12-21", "value": 150},
            {"date": "2025-12-22", "value": 175}
        ],
        "total": 325
    }

@app.get("/analytics/dashboard")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    return {
        "active_connections": 42,
        "total_users": 1250,
        "bandwidth_used_gb": 1847.5,
        "uptime_percentage": 99.8,
        "timestamp": datetime.now()
    }

# ============================================
# N8N WORKFLOW INTEGRATION
# ============================================

@app.post("/workflows/trigger/{workflow_id}")
async def trigger_workflow(workflow_id: str, payload: Dict[str, Any]):
    """Trigger N8N workflow"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{SERVICES['n8n']}/webhook/{workflow_id}",
                json=payload
            )
            return {"status": "triggered", "workflow_id": workflow_id}
    except Exception as e:
        logger.error(f"Workflow trigger failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn # type: ignore
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=5001,
        reload=True,
        log_level="info"
    )
