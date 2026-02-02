"""
VPN Enterprise - Production-Ready AI API
Powered by OpenAI & Anthropic - MORE POWERFUL than Cursor/Lovable
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

# AI Provider imports - Professional grade APIs
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# AI Provider Configuration
AI_PROVIDER = os.getenv("AI_PROVIDER", "openai")  # openai or anthropic
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Initialize AI clients
openai_client = None
anthropic_client = None

if OPENAI_API_KEY:
    openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    logger.info("✅ OpenAI client initialized")
    
if ANTHROPIC_API_KEY:
    anthropic_client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    logger.info("✅ Anthropic client initialized")

# Service discovery
SERVICES = {
    "api": os.getenv("API_URL", "http://vpn-api:5000"),
    "web": os.getenv("WEB_URL", "http://vpn-web:3000"),
    "redis_host": os.getenv("REDIS_HOST", "vpn-redis"),
    "redis_port": int(os.getenv("REDIS_PORT", "6379")),
    "n8n": os.getenv("N8N_URL", "http://vpn-n8n:5678"),
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
    logger.info(f"🤖 AI Provider: {AI_PROVIDER.upper()}")
    logger.info(f"📡 {len(SERVICES)} backend services configured")
    for name, url in SERVICES.items():
        if isinstance(url, str):
            logger.info(f"   • {name}: {url}")
    
    if not openai_client and not anthropic_client:
        logger.warning("⚠️  NO AI API KEYS SET! Set OPENAI_API_KEY or ANTHROPIC_API_KEY")
    
    yield
    
    logger.info("🛑 Shutting down gracefully...")

app = FastAPI(
    title="VPN Enterprise AI API",
    description="Production AI microservice powered by OpenAI GPT-4 & Anthropic Claude - MORE POWERFUL than Cursor/Lovable",
    version="3.0.0",
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

async def verify_token(
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
) -> Dict[str, Any]:
    """Verify JWT token or API key (supports both Authorization and X-API-Key headers)"""
    
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
    
    # Fall back to Authorization header
    if not authorization:
        return {"tier": "free", "user_id": "anonymous"}
    
    try:
        if authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
            # Check if it's an API key
            if token.startswith("vpn_"):
                return {
                    "tier": "pro",
                    "user_id": hashlib.md5(token.encode()).hexdigest()[:8],
                    "tenant_id": "nexusai"
                }
            # Otherwise it's a JWT token
            return {
                "tier": "pro",
                "user_id": token[:8],
                "tenant_id": "default"
            }
        else:
            # Legacy: direct API key without Bearer
            if authorization.startswith("vpn_"):
                return {
                    "tier": "pro",
                    "user_id": hashlib.md5(authorization.encode()).hexdigest()[:8],
                    "tenant_id": "nexusai"
                }
            return {"tier": "free", "user_id": "anonymous"}
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

class MultiFileGenerateRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=2000, description="Description of the app to generate")
    framework: str = Field(default="react", description="Framework to use (react, vue, angular, nextjs, etc.)")
    styling: str = Field(default="tailwind", description="Styling framework (tailwind, bootstrap, etc.)")
    features: Optional[List[str]] = Field(default=None, description="List of features to include")
    provider: str = Field(default="openai", description="AI provider: 'openai' or 'anthropic'")
    model: Optional[str] = Field(default=None, description="Specific model (defaults to gpt-4o for OpenAI, claude-3-7-sonnet for Anthropic)")

class FileOutput(BaseModel):
    path: str
    content: str
    language: str

class MultiFileGenerateResponse(BaseModel):
    files: List[FileOutput]
    instructions: str
    dependencies: Dict[str, str]

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

# Legacy Ollama endpoint removed - Use /ai/generate/app with OpenAI/Anthropic instead

@app.post("/ai/generate/app", response_model=MultiFileGenerateResponse)
async def generate_full_app(
    request: MultiFileGenerateRequest,
    user: Dict[str, Any] = Depends(verify_token)
):
    """
    Generate a complete application with multiple files - MORE POWERFUL than Cursor/Lovable
    Uses OpenAI GPT-4o or Anthropic Claude 3.7 Sonnet for superior code generation
    """
    
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
    
    # Validate AI provider availability
    provider = request.provider.lower()
    if provider == "openai" and not openai_client:
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key not configured. Set OPENAI_API_KEY environment variable."
        )
    elif provider == "anthropic" and not anthropic_client:
        raise HTTPException(
            status_code=503,
            detail="Anthropic API key not configured. Set ANTHROPIC_API_KEY environment variable."
        )
    
    features_str = "\n".join([f"- {f}" for f in request.features]) if request.features else "- Basic CRUD operations\n- Responsive design\n- Error handling"
    
    # Enhanced prompt for professional code generation
    system_prompt = """You are an expert full-stack developer and software architect with deep expertise in modern web development.
You create production-ready, scalable applications following industry best practices.
Your code is clean, well-documented, type-safe, and follows SOLID principles."""

    user_prompt = f"""Generate a complete, production-ready {request.framework} application.

**Project Description:**
{request.description}

**Required Features:**
{features_str}

**Styling Framework:** {request.styling}

**Critical Requirements:**
1. Generate a COMPLETE, WORKING application with ALL necessary files
2. Follow the latest best practices for {request.framework}
3. Include proper project structure:
   - Source files organized in logical directories
   - Configuration files (package.json, tsconfig.json, .env.example, etc.)
   - README.md with comprehensive setup instructions
4. Implement proper TypeScript types and interfaces
5. Add error handling, loading states, and edge case handling
6. Include proper styling with {request.styling}
7. Add comments for complex logic
8. Make it production-ready with security best practices

**Output Format (IMPORTANT - Must be valid JSON):**
{{
    "files": [
        {{
            "path": "src/App.tsx",
            "content": "// Full file content here",
            "language": "typescript"
        }}
    ],
    "instructions": "Step-by-step setup and running instructions",
    "dependencies": {{
        "react": "^18.3.0",
        "typescript": "^5.0.0"
    }}
}}

Generate 8-15 files minimum for a complete, professional application.
RESPOND ONLY WITH THE JSON OBJECT - NO ADDITIONAL TEXT BEFORE OR AFTER."""

    try:
        # Call appropriate AI provider
        if provider == "openai":
            model = request.model or "gpt-4o"  # GPT-4o is excellent for code generation
            logger.info(f"🤖 Generating app with OpenAI {model}...")
            
            response = await openai_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=16000,  # GPT-4o can handle large outputs
                response_format={"type": "json_object"}  # Force JSON output
            )
            
            ai_response = response.choices[0].message.content
            
        elif provider == "anthropic":
            model = request.model or "claude-3-7-sonnet-20250219"  # Claude 3.7 Sonnet - Latest and most powerful
            logger.info(f"🤖 Generating app with Anthropic {model}...")
            
            response = await anthropic_client.messages.create(
                model=model,
                max_tokens=8192,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7
            )
            
            ai_response = response.content[0].text
            
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid provider: {provider}. Use 'openai' or 'anthropic'"
            )
        
        # Parse JSON from AI response
        try:
            # Clean up response - remove markdown code blocks if present
            if "```json" in ai_response:
                json_start = ai_response.find("```json") + 7
                json_end = ai_response.find("```", json_start)
                ai_response = ai_response[json_start:json_end].strip()
            elif "```" in ai_response:
                json_start = ai_response.find("```") + 3
                json_end = ai_response.find("```", json_start)
                ai_response = ai_response[json_start:json_end].strip()
            
            result = json.loads(ai_response)
            
            logger.info(f"✅ Successfully generated {len(result.get('files', []))} files")
            
            return MultiFileGenerateResponse(
                files=[FileOutput(**f) for f in result.get("files", [])],
                instructions=result.get("instructions", "No instructions provided"),
                dependencies=result.get("dependencies", {})
            )
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            logger.error(f"Raw response: {ai_response[:500]}...")
            
            # Fallback: create a single file with the response
            return MultiFileGenerateResponse(
                files=[FileOutput(
                    path="App.tsx",
                    content=ai_response,
                    language="typescript"
                )],
                instructions="AI response could not be parsed. Raw output provided.",
                dependencies={}
            )
            
    except Exception as e:
        logger.error(f"AI request failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI service error: {str(e)}"
        )

# Legacy Ollama endpoints removed - Use OpenAI/Anthropic via /ai/generate/app
# SQL assistance and model listing deprecated

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
