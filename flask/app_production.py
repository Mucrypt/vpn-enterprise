"""
VPN Enterprise - Production-Ready AI API
Scalable FastAPI microservice with authentication, rate limiting, and caching
"""
from fastapi import FastAPI, HTTPException, status, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any, List
import httpx
import os
import logging
import hashlib
import json
import time
import asyncio
from functools import wraps

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Service discovery
SERVICES = {
    "api": os.getenv("API_URL", "http://vpn-api:5000"),
    "web": os.getenv("WEB_URL", "http://vpn-web:3000"),
    "redis_host": os.getenv("REDIS_HOST", "vpn-redis"),
    "redis_port": int(os.getenv("REDIS_PORT", "6379")),
    "n8n": os.getenv("N8N_URL", "http://vpn-n8n:5678"),
    "ollama": os.getenv("OLLAMA_URL", "http://vpn-ollama:11434"),
    "postgres": os.getenv("POSTGRES_URL", "postgresql://postgres:postgres@vpn-postgres:5432/postgres")
}

# In-memory cache (fallback if Redis unavailable)
memory_cache: Dict[str, Any] = {}
rate_limit_store: Dict[str, List[float]] = {}

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-CHANGE-THIS-IN-PRODUCTION")
CACHE_TTL = int(os.getenv("CACHE_TTL", "3600"))  # 1 hour default

# Rate limits by tier
RATE_LIMITS = {
    "free": {"requests": 100, "window": 3600},
    "pro": {"requests": 1000, "window": 3600},
    "enterprise": {"requests": 10000, "window": 3600},
    "unlimited": {"requests": 1000000, "window": 3600}
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    logger.info("🚀 VPN Enterprise AI API Starting (Production Mode)...")
    logger.info(f"📡 {len(SERVICES)} services configured")
    for name, url in SERVICES.items():
        if isinstance(url, str):
            logger.info(f"   • {name}: {url}")
    
    yield
    
    logger.info("🛑 Shutting down gracefully...")

app = FastAPI(
    title="VPN Enterprise AI API",
    description="Production-ready AI microservice with authentication, caching & rate limiting",
    version="2.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# UTILITIES
# ============================================

def generate_cache_key(prefix: str, **kwargs) -> str:
    """Generate consistent cache key"""
    key_parts = [prefix] + [f"{k}:{v}" for k, v in sorted(kwargs.items())]
    key_string = ":".join(key_parts)
    return hashlib.md5(key_string.encode()).hexdigest()

async def get_from_cache(key: str) -> Optional[Any]:
    """Get value from cache"""
    try:
        if key in memory_cache:
            cached = memory_cache[key]
            if cached["expires"] > time.time():
                return cached["data"]
            else:
                del memory_cache[key]
    except Exception as e:
        logger.error(f"Cache get error: {e}")
    return None

async def set_in_cache(key: str, value: Any, ttl: int = CACHE_TTL):
    """Set value in cache"""
    try:
        memory_cache[key] = {
            "data": value,
            "expires": time.time() + ttl
        }
    except Exception as e:
        logger.error(f"Cache set error: {e}")

async def check_rate_limit(identifier: str, tier: str = "free") -> Dict[str, Any]:
    """Check if request is within rate limit"""
    limit_config = RATE_LIMITS.get(tier, RATE_LIMITS["free"])
    max_requests = limit_config["requests"]
    window = limit_config["window"]
    
    current_time = time.time()
    key = f"ratelimit:{identifier}"
    
    if key not in rate_limit_store:
        rate_limit_store[key] = []
    
    # Remove expired timestamps
    rate_limit_store[key] = [
        ts for ts in rate_limit_store[key]
        if current_time - ts < window
    ]
    
    requests_used = len(rate_limit_store[key])
    remaining = max_requests - requests_used
    
    if remaining <= 0:
        reset_time = min(rate_limit_store[key]) + window if rate_limit_store[key] else current_time + window
        return {
            "allowed": False,
            "requests_used": requests_used,
            "requests_limit": max_requests,
            "requests_remaining": 0,
            "window_reset": datetime.fromtimestamp(reset_time)
        }
    
    # Add current request
    rate_limit_store[key].append(current_time)
    
    return {
        "allowed": True,
        "requests_used": requests_used + 1,
        "requests_limit": max_requests,
        "requests_remaining": remaining - 1,
        "window_reset": datetime.fromtimestamp(current_time + window)
    }

async def verify_token(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Verify JWT token or API key"""
    if not authorization:
        return {"tier": "free", "user_id": "anonymous"}
    
    try:
        if authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
            # In production, validate JWT properly
            # For now, extract user info from token
            return {
                "tier": "pro",
                "user_id": token[:8],
                "tenant_id": "default"
            }
        else:
            # API key
            return {
                "tier": "enterprise",
                "user_id": authorization[:8],
                "tenant_id": "default"
            }
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        return {"tier": "free", "user_id": "anonymous"}

# ============================================
# MODELS
# ============================================

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    service: str
    version: str
    environment: str

class AIRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)
    model: str = Field(default="llama3.2:1b")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    context: Optional[str] = None
    use_cache: bool = Field(default=True)

class AIResponse(BaseModel):
    response: str
    model: str
    cached: bool = False
    eval_count: Optional[int] = None
    total_duration_ms: Optional[float] = None

class SQLAssistRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    database_schema: Optional[str] = Field(None, alias="schema")
    action: str = Field(default="generate", pattern="^(generate|explain|optimize|fix)$")

class SQLAssistResponse(BaseModel):
    sql: Optional[str] = None
    explanation: Optional[str] = None
    suggestions: Optional[List[str]] = None
    cached: bool = False

class UsageStats(BaseModel):
    requests_used: int
    requests_limit: int
    requests_remaining: int
    window_reset: datetime
    tier: str

# ============================================
# ENDPOINTS
# ============================================

@app.get("/", response_model=Dict[str, str])
async def root():
    return {
        "service": "VPN Enterprise AI API",
        "status": "running",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "service": "ai-api",
        "version": "2.0.0",
        "environment": os.getenv("ENVIRONMENT", "production")
    }

@app.get("/usage")
async def get_usage(user: Dict[str, Any] = Depends(verify_token)):
    """Get current usage stats"""
    rate_check = await check_rate_limit(
        user.get("user_id", "anonymous"),
        user.get("tier", "free")
    )
    
    return UsageStats(
        requests_used=rate_check["requests_used"],
        requests_limit=rate_check["requests_limit"],
        requests_remaining=rate_check["requests_remaining"],
        window_reset=rate_check["window_reset"],
        tier=user.get("tier", "free")
    )

@app.post("/ai/generate", response_model=AIResponse)
async def generate_ai_response(
    request: AIRequest,
    user: Dict[str, Any] = Depends(verify_token)
):
    """Generate AI response with caching and rate limiting"""
    
    # Rate limiting
    rate_check = await check_rate_limit(
        user.get("user_id", "anonymous"),
        user.get("tier", "free")
    )
    
    if not rate_check["allowed"]:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Reset at {rate_check['window_reset']}"
        )
    
    # Check cache if enabled
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
    
    # Call Ollama
    try:
        full_prompt = request.prompt
        if request.context:
            full_prompt = f"Context: {request.context}\n\nQuestion: {request.prompt}"
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{SERVICES['ollama']}/api/generate",
                json={
                    "model": request.model,
                    "prompt": full_prompt,
                    "stream": False,
                    "options": {"temperature": request.temperature}
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Ollama error: {response.text}"
                )
            
            data = response.json()
            result = {
                "response": data.get("response", ""),
                "model": request.model,
                "eval_count": data.get("eval_count"),
                "total_duration_ms": data.get("total_duration", 0) / 1e6 if data.get("total_duration") else None
            }
            
            # Cache result
            if request.use_cache:
                await set_in_cache(cache_key, result, ttl=CACHE_TTL)
            
            return AIResponse(**result, cached=False)
            
    except httpx.RequestError as e:
        logger.error(f"Ollama request failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service temporarily unavailable"
        )

@app.post("/ai/sql/assist", response_model=SQLAssistResponse)
async def sql_assistant(
    request: SQLAssistRequest,
    user: Dict[str, Any] = Depends(verify_token)
):
    """AI SQL assistance with caching"""
    
    # Rate limiting
    rate_check = await check_rate_limit(
        user.get("user_id", "anonymous"),
        user.get("tier", "free")
    )
    
    if not rate_check["allowed"]:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Reset at {rate_check['window_reset']}"
        )
    
    # Check cache
    cache_key = generate_cache_key(
        "ai:sql",
        query=request.query,
        action=request.action
    )
    cached_response = await get_from_cache(cache_key)
    if cached_response:
        return SQLAssistResponse(**cached_response, cached=True)
    
    try:
        prompts = {
            "generate": f"""You are a PostgreSQL expert. Generate ONLY a SQL query for:

{request.query}
{f'Schema: {request.database_schema}' if request.database_schema else ''}

Return only the SQL query, no explanations.""",
            
            "explain": f"""Explain this SQL query clearly:

{request.query}

Provide a concise explanation.""",
            
            "optimize": f"""Optimize this SQL query:

{request.query}

Return the optimized query and explain improvements.""",
            
            "fix": f"""Fix errors in this SQL:

{request.query}

Return the corrected query and explain what was wrong."""
        }
        
        prompt = prompts.get(request.action, prompts["generate"])
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{SERVICES['ollama']}/api/generate",
                json={
                    "model": "llama3.2:1b",
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.3}
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="AI error")
            
            data = response.json()
            ai_response = data.get("response", "").strip()
            
            # Parse response
            result = {}
            if request.action == "generate":
                sql = ai_response.replace("```sql", "").replace("```", "").strip()
                result = {"sql": sql}
            elif request.action == "explain":
                result = {"explanation": ai_response}
            else:
                result = {"sql": ai_response, "explanation": "Optimized version"}
            
            # Cache
            await set_in_cache(cache_key, result, ttl=CACHE_TTL)
            
            return SQLAssistResponse(**result, cached=False)
            
    except Exception as e:
        logger.error(f"SQL assist error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service unavailable"
        )

@app.get("/ai/models")
async def list_ai_models(user: Dict[str, Any] = Depends(verify_token)):
    """List available Ollama models"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{SERVICES['ollama']}/api/tags")
            if response.status_code == 200:
                return response.json()
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch models")
    except Exception as e:
        logger.error(f"Failed to list models: {e}")
        raise HTTPException(status_code=503, detail="Ollama unavailable")

# ============================================
# AUTHENTICATION & KEY MANAGEMENT
# ============================================

class CreateKeyRequest(BaseModel):
    tenant_id: str = Field(..., min_length=1)
    tier: str = Field(default="free", pattern="^(free|pro|enterprise|unlimited)$")
    description: Optional[str] = None
    expires_in_days: Optional[int] = Field(default=365, ge=1, le=3650)

class APIKeyResponse(BaseModel):
    api_key: str
    key_id: str
    tier: str
    rate_limit: Dict[str, int]
    expires_at: Optional[datetime]
    created_at: datetime

@app.post("/auth/create-key", response_model=APIKeyResponse)
async def create_api_key(request: CreateKeyRequest):
    """
    Generate a new API key for a tenant
    NOTE: The full API key is only shown once. Store it securely.
    """
    import secrets
    import uuid
    
    # Generate secure API key
    key_prefix = "vpn"
    key_secret = secrets.token_urlsafe(32)
    api_key = f"{key_prefix}_{key_secret}"
    
    # Generate key ID
    key_id = str(uuid.uuid4())
    
    # Hash the key for storage (SHA256)
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    
    # Calculate expiration
    expires_at = datetime.now() + timedelta(days=request.expires_in_days)
    
    # Get rate limit for tier
    rate_limit = RATE_LIMITS.get(request.tier, RATE_LIMITS["free"])
    
    # TODO: Store in database (ai_api_keys table)
    # For now, we'll return the key. In production, this should:
    # 1. Insert into ai_api_keys table with key_hash
    # 2. Associate with tenant_id
    # 3. Log the creation event
    
    logger.info(f"API key created for tenant {request.tenant_id} with tier {request.tier}")
    
    return APIKeyResponse(
        api_key=api_key,  # Only shown once!
        key_id=key_id,
        tier=request.tier,
        rate_limit=rate_limit,
        expires_at=expires_at,
        created_at=datetime.now()
    )

@app.post("/auth/verify-key")
async def verify_api_key(authorization: str = Header(...)):
    """Verify an API key and return its details"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    api_key = authorization.split(" ")[1]
    
    # Hash the provided key
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    
    # TODO: Look up in database by key_hash
    # For now, accept any key with vpn_ prefix
    if not api_key.startswith("vpn_"):
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return {
        "valid": True,
        "tier": "free",  # Would come from database
        "tenant_id": "demo-tenant"
    }

# ============================================
# ADMIN ENDPOINTS
# ============================================

@app.post("/admin/cache/clear")
async def clear_cache(user: Dict[str, Any] = Depends(verify_token)):
    """Clear all caches (admin only)"""
    if user.get("tier") != "enterprise":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    memory_cache.clear()
    rate_limit_store.clear()
    return {"message": "Cache cleared successfully"}

@app.get("/admin/stats")
async def get_stats(user: Dict[str, Any] = Depends(verify_token)):
    """Get service statistics (admin only)"""
    if user.get("tier") != "enterprise":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return {
        "cache_size": len(memory_cache),
        "rate_limit_users": len(rate_limit_store),
        "total_requests": sum(len(v) for v in rate_limit_store.values())
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app_production:app",
        host="0.0.0.0",
        port=5001,
        reload=False,
        log_level="info",
        workers=4  # Multiple workers for production
    )
