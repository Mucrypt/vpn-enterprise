
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
from fastapi import FastAPI, HTTPException, Depends, status # pyright: ignore[reportMissingImports]
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from pydantic import BaseModel, Field # type: ignore
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import logging
import httpx #type: ignore
from contextlib import asynccontextmanager

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 FastAPI Python Service Starting...")
    logger.info(f"📡 Service Discovery: {len(SERVICES)} services configured")
    for name, url in SERVICES.items():
        logger.info(f"   • {name}: {url}")
    yield
    # Shutdown
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
    prompt: str = Field(..., min_length=1, max_length=2000)
    model: str = Field(default="llama3.2:1b")
    stream: bool = Field(default=False)

class AIResponse(BaseModel):
    response: str
    model: str
    eval_count: Optional[int] = None
    total_duration_ms: Optional[float] = None

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
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{SERVICES['ollama']}/api/generate",
                json={
                    "model": request.model,
                    "prompt": request.prompt,
                    "stream": request.stream
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
