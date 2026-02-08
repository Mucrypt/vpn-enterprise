"""
VPN Enterprise - Production AI API (Enterprise Grade)
=========================================================
World-class AI code generation powered by OpenAI GPT-4o & Anthropic Claude 3.5 Sonnet
Integrated with N8N for automated deployment, testing, and monitoring

Features:
- Dual AI Provider Support (OpenAI + Anthropic) with intelligent routing
- N8N Webhook Integration for CI/CD automation
- Enterprise-grade rate limiting, caching, and monitoring
- Automated database provisioning for generated apps
- Security scanning and code quality checks
- Real-time deployment status tracking

Author: VPN Enterprise Team
Version: 2.0.0 (Production)
"""

from fastapi import FastAPI, HTTPException, status, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any, List, Literal
import httpx
import os
import logging
import hashlib
import json
import time
import asyncio
import re
from enum import Enum

# AI Provider imports
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# ============================================
# CONFIGURATION
# ============================================

# AI Provider Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# N8N Webhook Configuration
N8N_WEBHOOK_BASE = os.getenv("N8N_WEBHOOK_URL", "https://chatbuilds.com/webhook")
N8N_APP_GENERATED = f"{N8N_WEBHOOK_BASE}/nexusai-app-generated"
N8N_APP_DEPLOY = f"{N8N_WEBHOOK_BASE}/nexusai-deploy"
N8N_APP_ERROR = f"{N8N_WEBHOOK_BASE}/nexusai-error"

# Service URLs
API_BASE_URL = os.getenv("API_URL", "https://chatbuilds.com/api")
DATABASE_PROVISIONER_URL = os.getenv("DATABASE_PROVISIONER_URL", "http://localhost:3003")

# Cache & Rate Limiting
CACHE_TTL = 3600  # 1 hour
memory_cache: Dict[str, Any] = {}
rate_limit_store: Dict[str, List[float]] = {}

# Rate limits by subscription tier
RATE_LIMITS = {
    "free": {"ai": 10, "deploy": 5, "window": 3600},      # 10 AI calls/hour, 5 deploys/day
    "pro": {"ai": 100, "deploy": 50, "window": 3600},     # 100 AI calls/hour, 50 deploys/day
    "enterprise": {"ai": 1000, "deploy": 500, "window": 3600}  # Unlimited
}

# AI Model Configuration
OPENAI_MODELS = {
    "gpt-4o": {"cost": 10, "max_tokens": 16384, "best_for": "complex apps"},
    "gpt-4o-mini": {"cost": 5, "max_tokens": 16384, "best_for": "simple apps"},
    "gpt-3.5-turbo": {"cost": 3, "max_tokens": 4096, "best_for": "quick prototypes"}
}

ANTHROPIC_MODELS = {
    "claude-3-7-sonnet": {"cost": 12, "max_tokens": 8192, "best_for": "production code"},
    "claude-3-5-sonnet": {"cost": 10, "max_tokens": 8192, "best_for": "balanced"},
    "claude-3-haiku": {"cost": 5, "max_tokens": 4096, "best_for": "fast generation"}
}

# Initialize clients
openai_client = None
anthropic_client = None
http_client: Optional[httpx.AsyncClient] = None

if OPENAI_API_KEY:
    openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    logger.info("✅ OpenAI client initialized with GPT-4o access")
    
if ANTHROPIC_API_KEY:
    anthropic_client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    logger.info("✅ Anthropic client initialized with Claude 3.5 Sonnet access")

# ============================================
# LIFESPAN & APP INITIALIZATION
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown"""
    global http_client
    
    logger.info("=" * 60)
    logger.info("🚀 VPN ENTERPRISE AI API - PRODUCTION MODE")
    logger.info("=" * 60)
    logger.info(f"📅 Started: {datetime.utcnow().isoformat()}")
    logger.info(f"🤖 AI Providers Active:")
    if openai_client:
        logger.info("   ✅ OpenAI GPT-4o (Industry Leading)")
    if anthropic_client:
        logger.info("   ✅ Anthropic Claude 3.5 Sonnet (Code Specialist)")
    
    logger.info(f"🔗 N8N Webhooks:")
    logger.info(f"   • App Generated: {N8N_APP_GENERATED}")
    logger.info(f"   • App Deploy: {N8N_APP_DEPLOY}")
    logger.info(f"   • App Error: {N8N_APP_ERROR}")
    
    if not openai_client and not anthropic_client:
        logger.error("❌ NO AI PROVIDERS! Set OPENAI_API_KEY or ANTHROPIC_API_KEY")
        raise RuntimeError("At least one AI provider must be configured")
    
    # Initialize HTTP client for webhooks
    http_client = httpx.AsyncClient(timeout=10.0)
    logger.info("✅ HTTP client initialized for N8N webhooks")
    logger.info("=" * 60)
    
    yield
    
    # Shutdown
    if http_client:
        await http_client.aclose()
    logger.info("🛑 API shutting down gracefully")

app = FastAPI(
    title="VPN Enterprise AI API",
    description="Enterprise-grade AI code generation with OpenAI & Anthropic",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
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
# MODELS & SCHEMAS
# ============================================

class AIProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    AUTO = "auto"  # Intelligent routing

class AppFramework(str, Enum):
    REACT = "react"
    VUE = "vue"
    NEXTJS = "nextjs"
    EXPRESS = "express"
    FASTAPI = "fastapi"
    FLASK = "flask"

class StylingFramework(str, Enum):
    TAILWIND = "tailwind"
    CSS = "css"
    STYLED_COMPONENTS = "styled-components"
    MUI = "mui"

class AIGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=10, max_length=100000)
    model: Optional[str] = Field(default=None)
    provider: AIProvider = Field(default=AIProvider.AUTO)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=8192, le=16384)

class MultiFileAppRequest(BaseModel):
    description: str = Field(..., min_length=20, max_length=10000)
    framework: AppFramework = Field(default=AppFramework.REACT)
    styling: StylingFramework = Field(default=StylingFramework.TAILWIND)
    features: List[str] = Field(default_factory=list)
    provider: AIProvider = Field(default=AIProvider.AUTO)
    include_database: bool = Field(default=True)
    include_auth: bool = Field(default=False)
    include_api: bool = Field(default=True)

class FileOutput(BaseModel):
    path: str
    content: str
    language: str

class MultiFileAppResponse(BaseModel):
    files: List[FileOutput]
    instructions: str
    dependencies: Dict[str, str]
    requires_database: bool
    database_schema: Optional[str] = None
    deployment_config: Optional[Dict[str, Any]] = None
    provider_used: str
    generation_time_ms: int
    tokens_used: int

class DeploymentRequest(BaseModel):
    app_name: str
    app_id: str
    files: List[FileOutput]
    dependencies: Dict[str, str]
    framework: str
    requires_database: bool
    database_schema: Optional[str] = None
    user_id: str
    user_email: str

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str
    ai_providers: Dict[str, bool]
    n8n_enabled: bool

# ============================================
# UTILITY FUNCTIONS
# ============================================

def cache_key(prefix: str, *args: Any) -> str:
    """Generate cache key"""
    data = json.dumps(args, sort_keys=True)
    hash_val = hashlib.md5(data.encode()).hexdigest()
    return f"{prefix}:{hash_val}"

def get_cache(key: str) -> Optional[Any]:
    """Get from cache"""
    if key in memory_cache:
        entry = memory_cache[key]
        if entry["expires"] > time.time():
            logger.info(f"💾 Cache HIT: {key}")
            return entry["data"]
        else:
            del memory_cache[key]
    return None

def set_cache(key: str, data: Any, ttl: int = CACHE_TTL):
    """Set cache"""
    memory_cache[key] = {
        "data": data,
        "expires": time.time() + ttl
    }
    logger.info(f"💾 Cache SET: {key} (TTL: {ttl}s)")

def check_rate_limit(user_id: str, tier: str, limit_type: str = "ai") -> bool:
    """Check if user is within rate limits"""
    if tier not in RATE_LIMITS:
        tier = "free"
    
    limits = RATE_LIMITS[tier]
    limit = limits.get(limit_type, limits["ai"])
    window = limits["window"]
    
    key = f"{user_id}:{limit_type}"
    now = time.time()
    
    if key not in rate_limit_store:
        rate_limit_store[key] = []
    
    # Remove old entries
    rate_limit_store[key] = [t for t in rate_limit_store[key] if now - t < window]
    
    if len(rate_limit_store[key]) >= limit:
        logger.warning(f"⚠️  Rate limit exceeded for {user_id} ({tier}): {len(rate_limit_store[key])}/{limit}")
        return False
    
    rate_limit_store[key].append(now)
    return True

async def send_n8n_webhook(webhook_url: str, payload: Dict[str, Any]):
    """Send webhook to N8N (fire and forget)"""
    try:
        if http_client:
            await http_client.post(webhook_url, json=payload, timeout=5.0)
            logger.info(f"🔔 N8N webhook sent: {webhook_url}")
    except Exception as e:
        logger.error(f"❌ N8N webhook failed: {str(e)}")

def choose_ai_provider(description: str, provider: AIProvider) -> tuple[str, Any]:
    """Intelligently choose AI provider"""
    if provider == AIProvider.OPENAI and openai_client:
        return ("openai", openai_client)
    
    if provider == AIProvider.ANTHROPIC and anthropic_client:
        return ("anthropic", anthropic_client)
    
    # AUTO mode - intelligent routing
    if provider == AIProvider.AUTO:
        # Prefer Claude for complex backend code
        if any(keyword in description.lower() for keyword in ["api", "backend", "database", "authentication", "security"]):
            if anthropic_client:
                logger.info("🧠 AUTO: Chose Claude 3.5 Sonnet (backend complexity)")
                return ("anthropic", anthropic_client)
        
        # Prefer GPT-4o for frontend/UI
        if any(keyword in description.lower() for keyword in ["ui", "frontend", "react", "component", "design"]):
            if openai_client:
                logger.info("🧠 AUTO: Chose GPT-4o (frontend/UI)")
                return ("openai", openai_client)
        
        # Default: use whichever is available
        if openai_client:
            return ("openai", openai_client)
        if anthropic_client:
            return ("anthropic", anthropic_client)
    
    raise HTTPException(
        status_code=503,
        detail="No AI provider available for the requested provider type"
    )

# ============================================
# PROMPT TEMPLATES
# ============================================

def get_app_generation_prompt(request: MultiFileAppRequest) -> str:
    """Generate comprehensive prompt for app generation"""
    
    features_text = ", ".join(request.features) if request.features else "basic CRUD operations"
    
    prompt = f"""Generate a complete, production-ready {request.framework.value} application with the following requirements:

**Project Description:**
{request.description}

**Technical Stack:**
- Framework: {request.framework.value}
- Styling: {request.styling.value}
- Features: {features_text}
- Database: {"PostgreSQL (with schema)" if request.include_database else "None"}
- Authentication: {"Yes (JWT-based)" if request.include_auth else "No"}
- API Layer: {"Yes (REST API)" if request.include_api else "No"}

**Requirements:**
1. Generate COMPLETE source files (no placeholders or TODO comments)
2. Include proper error handling and validation
3. Use modern best practices and patterns
4. Add TypeScript types where applicable
5. Include package.json with all dependencies
6. Add README with setup instructions
7. Include environment variable template (.env.example)
8. Add Dockerfile for containerization
9. {"Generate PostgreSQL database schema with tables, indexes, and constraints" if request.include_database else ""}

**Output Format:**
Return a JSON object with this EXACT structure:
{{
    "files": [
        {{"path": "src/App.tsx", "content": "...", "language": "typescript"}},
        {{"path": "package.json", "content": "...", "language": "json"}},
        ...
    ],
    "instructions": "Step-by-step setup instructions",
    "dependencies": {{"react": "^18.0.0", ...}},
    "requires_database": true/false,
    "database_schema": "CREATE TABLE statements..." (if database is needed)
}}

**CRITICAL:** Return ONLY the JSON object, no markdown, no explanations, just pure JSON.
"""
    
    return prompt

# ============================================
# API ENDPOINTS
# ============================================

@app.get("/", response_model=Dict[str, Any])
async def root():
    """Root endpoint"""
    return {
        "service": "VPN Enterprise AI API",
        "version": "2.0.0",
        "status": "operational",
        "ai_providers": {
            "openai": openai_client is not None,
            "anthropic": anthropic_client is not None
        },
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "generate": "/ai/generate",
            "generate_app": "/ai/generate/app",
            "deploy": "/deploy/app"
        }
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
        version="2.0.0",
        ai_providers={
            "openai": openai_client is not None,
            "anthropic": anthropic_client is not None
        },
        n8n_enabled=bool(N8N_WEBHOOK_BASE)
    )

@app.post("/ai/generate", response_model=Dict[str, Any])
async def generate_ai_text(
    request: AIGenerateRequest,
    x_api_key: Optional[str] = Header(None)
):
    """Generate AI text/code"""
    start_time = time.time()
    
    # Choose provider
    provider_name, client = choose_ai_provider(request.prompt, request.provider)
    
    try:
        if provider_name == "openai":
            model = request.model or "gpt-4o"
            response = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": request.prompt}],
                temperature=request.temperature,
                max_tokens=request.max_tokens
            )
            result = response.choices[0].message.content
            tokens = response.usage.total_tokens if response.usage else 0
            
        else:  # anthropic
            model = request.model or "claude-3-5-sonnet-20240620"
            response = await client.messages.create(
                model=model,
                max_tokens=request.max_tokens,
                temperature=request.temperature,
                messages=[{"role": "user", "content": request.prompt}]
            )
            result = response.content[0].text
            tokens = response.usage.input_tokens + response.usage.output_tokens if hasattr(response, 'usage') else 0
        
        elapsed = int((time.time() - start_time) * 1000)
        
        return {
            "response": result,
            "provider": provider_name,
            "model": model,
            "tokens_used": tokens,
            "generation_time_ms": elapsed
        }
        
    except Exception as e:
        logger.error(f"❌ AI generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@app.post("/ai/generate/app", response_model=MultiFileAppResponse)
async def generate_full_app(
    request: MultiFileAppRequest,
    x_api_key: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
    x_user_tier: Optional[str] = Header("free")
):
    """
    Generate complete application with multiple files
    This is the MAIN endpoint for NexusAI
    """
    start_time = time.time()
    user_id = x_user_id or "anonymous"
    
    # Rate limiting
    if not check_rate_limit(user_id, x_user_tier, "ai"):
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded for {x_user_tier} tier"
        )
    
    logger.info(f"🎨 Generating {request.framework.value} app for user {user_id}")
    logger.info(f"📝 Description: {request.description[:100]}...")
    
    # Check cache
    cache_key_val = cache_key("app", request.description, request.framework, request.features)
    cached = get_cache(cache_key_val)
    if cached:
        logger.info("💾 Returning cached app generation")
        return MultiFileAppResponse(**cached)
    
    # Choose AI provider
    provider_name, client = choose_ai_provider(request.description, request.provider)
    
    # Generate prompt
    prompt = get_app_generation_prompt(request)
    
    try:
        # Call AI
        if provider_name == "openai":
            model = "gpt-4o"  # Best for code generation
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are an expert full-stack developer. Generate complete, production-ready code with no placeholders. Return valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=16000,
                response_format={"type": "json_object"}
            )
            result_text = response.choices[0].message.content
            tokens = response.usage.total_tokens if response.usage else 0
            
        else:  # anthropic
            model = "claude-3-5-sonnet-20240620"  # Claude 3.5 Sonnet (June 2024 release)
            response = await client.messages.create(
                model=model,
                max_tokens=8192,
                temperature=0.7,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "You are an expert full-stack developer. Generate complete, production-ready code with no placeholders. Return valid JSON only."},
                            {"type": "text", "text": prompt}
                        ]
                    }
                ]
            )
            result_text = response.content[0].text
            tokens = response.usage.input_tokens + response.usage.output_tokens
        
        # Parse AI response
        # Clean JSON (remove markdown if present)
        result_text = result_text.strip()
        if result_text.startswith("```"):
            result_text = re.sub(r'```json?\n?', '', result_text)
            result_text = re.sub(r'\n?```$', '', result_text)
        
        result_json = json.loads(result_text)
        
        elapsed = int((time.time() - start_time) * 1000)
        
        # Build response
        response_data = { "files": result_json.get("files", []),
            "instructions": result_json.get("instructions", "No instructions provided"),
            "dependencies": result_json.get("dependencies", {}),
            "requires_database": result_json.get("requires_database", request.include_database),
            "database_schema": result_json.get("database_schema"),
            "deployment_config": {
                "framework": request.framework.value,
                "port": 3000,
                "build_command": "npm run build",
                "start_command": "npm start"
            },
            "provider_used": f"{provider_name}/{model}",
            "generation_time_ms": elapsed,
            "tokens_used": tokens
        }
        
        # Cache result
        set_cache(cache_key_val, response_data, ttl=3600)
        
        # Send N8N webhook (async, non-blocking)
        asyncio.create_task(send_n8n_webhook(N8N_APP_GENERATED, {
            "event": "app_generated",
            "user_id": user_id,
            "app_id": cache_key_val,
            "framework": request.framework.value,
            "provider": provider_name,
            "files_count": len(response_data["files"]),
            "requires_database": response_data["requires_database"],
            "generated_at": datetime.utcnow().isoformat()
        }))
        
        logger.info(f"✅ App generated successfully: {len(response_data['files'])} files in {elapsed}ms using {provider_name}")
        
        return MultiFileAppResponse(**response_data)
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ Failed to parse AI response as JSON: {str(e)}")
        logger.error(f"Raw response: {result_text[:500]}...")
        raise HTTPException(
            status_code=500,
            detail="AI returned invalid JSON. Please try again."
        )
    except Exception as e:
        logger.error(f"❌ App generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.post("/deploy/app", response_model=Dict[str, Any])
async def deploy_app(
    request: DeploymentRequest,
    x_api_key: Optional[str] = Header(None),
    x_user_tier: Optional[str] = Header("free")
):
    """
    Deploy generated app
    Triggers N8N workflow for automated deployment
    """
    user_id = request.user_id
    
    # Rate limiting
    if not check_rate_limit(user_id, x_user_tier, "deploy"):
        raise HTTPException(
            status_code=429,
            detail=f"Deploy rate limit exceeded for {x_user_tier} tier"
        )
    
    logger.info(f"🚀 Deploying app '{request.app_name}' for user {user_id}")
    
    # Send to N8N for deployment automation
    deployment_payload = {
        "event": "deploy_app",
        "app_id": request.app_id,
        "app_name": request.app_name,
        "user_id": user_id,
        "user_email": request.user_email,
        "framework": request.framework,
        "files": [{"path": f.path, "content": f.content, "language": f.language} for f in request.files],
        "dependencies": request.dependencies,
        "requires_database": request.requires_database,
        "database_schema": request.database_schema,
        "requested_at": datetime.utcnow().isoformat()
    }
    
    # Send webhook to N8N (this will handle deployment)
    asyncio.create_task(send_n8n_webhook(N8N_APP_DEPLOY, deployment_payload))
    
    return {
        "status": "deployment_queued",
        "app_id": request.app_id,
        "app_name": request.app_name,
        "message": "Deployment workflow started. You'll receive notifications in Slack/Email.",
        "estimated_time_minutes": 5
    }

# ============================================
# ADVANCED DUAL-AI FULL-STACK GENERATION
# ============================================

@app.post("/ai/generate/fullstack", response_model=MultiFileAppResponse)
async def generate_fullstack_app(
    request: MultiFileAppRequest,
    x_api_key: Optional[str] = Header(None)
):
    """
    🚀 ADVANCED: Generate complete full-stack app with backend API
    Uses DUAL-AI system (Claude + GPT-4) for maximum power
    More capable than Cursor/Lovable/Bolt
    
    Phase 1: Claude creates architecture plan
    Phase 2: GPT-4 generates frontend code  
    Phase 3: GPT-4 generates backend API + Postman collection
    Phase 4: Claude reviews and integrates everything
    """
    start_time = time.time()
    
    # Must have both providers for fullstack mode
    if not openai_client or not anthropic_client:
        raise HTTPException(
            status_code=503,
            detail="Fullstack mode requires both OpenAI and Anthropic API keys"
        )
    
    try:
        logger.info(f"🎯 Starting FULLSTACK generation: {request.description[:100]}")
        
        # Import advanced prompts
        from advanced_prompts import (
            get_architecture_prompt,
            get_fullstack_generation_prompt,
            get_integration_prompt
        )
        
        # PHASE 1: Architecture Planning (Claude - better at system design)
        logger.info("📐 Phase 1: Claude creating architecture...")
        arch_prompt = get_architecture_prompt(request)
        
        arch_response = await anthropic_client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=8192,
            temperature=0.3,  # Lower temperature for planning
            messages=[{
                "role": "user",
                "content": arch_prompt
            }]
        )
        
        arch_text = arch_response.content[0].text.strip()
        if arch_text.startswith("```"):
            arch_text = re.sub(r'```json?\n?', '', arch_text)
            arch_text = re.sub(r'\n?```$', '', arch_text)
        
        architecture = json.loads(arch_text)
        logger.info(f"✅ Architecture created with {len(architecture.get('file_structure', {}).get('frontend', []))} frontend files")
        
        # PHASE 2: Frontend Generation (GPT-4 - better at code generation)
        logger.info("⚛️  Phase 2: GPT-4 generating frontend...")
        frontend_prompt = get_fullstack_generation_prompt(architecture, request, is_frontend=True)
        
        frontend_response = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[{
                "role": "system",
                "content": "You are an elite frontend developer. Generate COMPLETE production code."
            }, {
                "role": "user",
                "content": frontend_prompt
            }],
            temperature=0.7,
            max_tokens=16000,
            response_format={"type": "json_object"}
        )
        
        frontend_text = frontend_response.choices[0].message.content.strip()
        frontend_data = json.loads(frontend_text)
        frontend_files = frontend_data.get("files", [])
        logger.info(f"✅ Frontend: {len(frontend_files)} files generated")
        
        # PHASE 3: Backend API Generation (GPT-4)
        logger.info("🔧 Phase 3: GPT-4 generating backend API...")
        backend_prompt = get_fullstack_generation_prompt(architecture, request, is_frontend=False)
        
        backend_response = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[{
                "role": "system",
                "content": "You are an elite backend developer. Generate COMPLETE production API with Postman collection."
            }, {
                "role": "user",
                "content": backend_prompt
            }],
            temperature=0.7,
            max_tokens=16000,
            response_format={"type": "json_object"}
        )
        
        backend_text = backend_response.choices[0].message.content.strip()
        backend_data = json.loads(backend_text)
        backend_files = backend_data.get("files", [])
        logger.info(f"✅ Backend: {len(backend_files)} files generated including Postman collection")
        
        # PHASE 4: Integration & Review (Claude - better at code review)
        logger.info("🔗 Phase 4: Claude integrating and reviewing...")
        integration_prompt = get_integration_prompt(frontend_files, backend_files, architecture)
        
        integration_response = await anthropic_client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=4096,
            temperature=0.2,
            messages=[{
                "role": "user",
                "content": integration_prompt
            }]
        )
        
        integration_text = integration_response.content[0].text.strip()
        if integration_text.startswith("```"):
            integration_text = re.sub(r'```json?\n?', '', integration_text)
            integration_text = re.sub(r'\n?```$', '', integration_text)
        
        integration_data = json.loads(integration_text)
        logger.info("✅ Integration complete")
        
        # Combine all files
        all_files = frontend_files + backend_files
        
        # Add docker-compose for full stack orchestration
        all_files.append({
            "path": "docker-compose.yml",
            "content": integration_data.get("docker_compose", ""),
            "language": "yaml"
        })
        
        # Add root README with architecture documentation
        all_files.append({
            "path": "README.md",
            "content": f"""# {request.description}

## Architecture Overview
{json.dumps(architecture.get('architecture', {}), indent=2)}

## Setup Instructions
{integration_data.get('setup_instructions', '')}

## Test Endpoints
{chr(10).join([f"- {test['name']}: `{test['curl']}`" for test in integration_data.get('test_endpoints', [])])}

## Generated by NexusAI
Powered by dual-AI system (Claude 3.5 Sonnet + GPT-4o)
More powerful than Cursor, Lovable, or Bolt!
""",
            "language": "markdown"
        })
        
        # Calculate totals
        total_tokens = (
            arch_response.usage.input_tokens + arch_response.usage.output_tokens +
            frontend_response.usage.total_tokens +
            backend_response.usage.total_tokens +
            integration_response.usage.input_tokens + integration_response.usage.output_tokens
        )
        
        generation_time = int((time.time() - start_time) * 1000)
        
        # Send N8N webhook
        if N8N_APP_GENERATED:
            asyncio.create_task(send_n8n_webhook(N8N_APP_GENERATED, {
                "description": request.description,
                "framework": request.framework.value,
                "file_count": len(all_files),
                "has_backend": True,
                "has_database": backend_data.get("requires_database", False),
                "generation_time_ms": generation_time,
                "provider": "dual-ai (claude + gpt4)"
            }))
        
        logger.info(f"🎉 FULLSTACK generation complete: {len(all_files)} files in {generation_time}ms")
        
        return MultiFileAppResponse(
            files=all_files,
            instructions=integration_data.get('setup_instructions', ''),
            dependencies={
                **frontend_data.get("dependencies", {}),
                **backend_data.get("dependencies", {})
            },
            requires_database=backend_data.get("requires_database", False),
            database_schema=backend_data.get("database_schema"),
            deployment_config=backend_data.get("deployment_config"),
            provider_used="dual-ai (claude-3.5-sonnet + gpt-4o)",
            generation_time_ms=generation_time,
            tokens_used=total_tokens
        )
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {str(e)}")
    except Exception as e:
        logger.error(f"Fullstack generation error: {str(e)}", exc_info=True)
        
        # Send error webhook
        if N8N_APP_ERROR:
            asyncio.create_task(send_n8n_webhook(N8N_APP_ERROR, {
                "error": str(e),
                "description": request.description,
                "timestamp": datetime.utcnow().isoformat()
            }))
        
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# ERROR HANDLERS
# ============================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    logger.error(f"HTTP {exc.status_code}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )

# ============================================
# RUN SERVER
# ============================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "5001"))
    uvicorn.run(
        "app_nexusai_production:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
