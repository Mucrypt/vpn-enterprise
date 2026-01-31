# Production-Ready AI Service - Billion-User Scale Architecture

## 🎯 Overview

This AI service is designed to handle **millions to billions of users** with:

- **Multi-tier authentication** (JWT & API keys)
- **Smart rate limiting** (100/1K/10K/1M req/hr by tier)
- **Response caching** (memory + Redis + database)
- **Usage tracking** for billing & analytics
- **Horizontal scalability** with load balancing
- **NexusAI integration** for Lovable/Cursor-style app generation

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Nginx Load Balancer                      │
│              (SSL, Routing, Compression, CDN)                │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
         [python-api]                    [nexusai]
         (FastAPI)                       (React + Vite)
         │                               │
         ├─ 4 Workers                    └─ Nginx Serving
         ├─ Authentication                  Static Build
         ├─ Rate Limiting
         └─ Caching
              │
    ┌─────────┼──────────┐
    │         │          │
[Ollama]  [Redis]  [PostgreSQL]
(AI Models) (Cache)  (Data + Analytics)
```

## 🚀 Deployment

### Quick Deploy (Production)

```bash
./scripts/deploy-ai-production.sh
```

This script will:

1. Upload production Flask API (`app_production.py`)
2. Run database migrations (`ai-service-schema.sql`)
3. Upload NexusAI configuration
4. Rebuild and restart services
5. Pull AI models (codellama:7b for code generation)
6. Verify health of all services

### Manual Deployment Steps

1. **Upload Production Code**

```bash
scp flask/app_production.py root@157.180.123.240:/opt/vpn-enterprise/flask/
scp -r apps/nexusAi/chat-to-code-38/.env.production.local root@157.180.123.240:/opt/vpn-enterprise/apps/nexusAi/chat-to-code-38/
```

2. **Run Database Migration**

```bash
scp packages/database/migrations/ai-service-schema.sql root@157.180.123.240:/tmp/
ssh root@157.180.123.240
docker exec vpn-postgres psql -U platform_admin -d platform_db -f /tmp/ai-service-schema.sql
```

3. **Rebuild Services**

```bash
ssh root@157.180.123.240
cd /opt/vpn-enterprise/infrastructure/docker
docker compose -f docker-compose.prod.yml build python-api nexusai
docker compose -f docker-compose.prod.yml up -d python-api nexusai
```

4. **Pull AI Models**

```bash
docker exec vpn-ollama ollama pull llama3.2:1b    # Already downloaded
docker exec vpn-ollama ollama pull codellama:7b   # For code generation
```

## 🔑 Authentication

### API Key Generation

```bash
# Generate a new API key
curl -X POST https://python-api.chatbuilds.com/auth/create-key \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "your-tenant-id",
    "tier": "pro",
    "description": "Production API key",
    "expires_in_days": 365
  }'

# Response (SAVE THIS - shown only once!)
{
  "api_key": "vpn_3xAmPl3K3yStr1ng...",
  "key_id": "550e8400-e29b-41d4-a716-446655440000",
  "tier": "pro",
  "rate_limit": {"requests": 1000, "window": 3600},
  "expires_at": "2026-01-20T10:30:00Z",
  "created_at": "2025-01-20T10:30:00Z"
}
```

### Using API Keys

```bash
# Include in Authorization header
curl https://python-api.chatbuilds.com/ai/generate \
  -H "Authorization: Bearer vpn_3xAmPl3K3yStr1ng..." \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explain quantum computing", "model": "llama3.2:1b"}'
```

## 📊 Rate Limits by Tier

| Tier           | Requests/Hour | Monthly Limit | Best For                   |
| -------------- | ------------- | ------------- | -------------------------- |
| **Free**       | 100           | 3,000         | Testing, personal projects |
| **Pro**        | 1,000         | 30,000        | Small businesses, startups |
| **Enterprise** | 10,000        | 300,000       | Large organizations        |
| **Unlimited**  | 1,000,000     | ∞             | High-scale production      |

## 🎨 NexusAI - App Generation

NexusAI is our **Lovable/Cursor alternative** for building apps via chat:

### Features

- **Chat-to-Code**: Describe your app, get working code
- **Multi-Framework**: React, Vue, Svelte, Next.js, Vite, Express
- **Live Preview**: See changes in real-time
- **Multi-File Support**: Up to 50 files per app
- **Code Completion**: Powered by codellama:7b
- **Export**: Download full project as ZIP

### Access

```
https://nexusai.chatbuilds.com
```

### Example Conversation

```
User: "Create a todo app with React and Tailwind CSS"
NexusAI: [Generates full app structure]
  ├─ src/App.jsx
  ├─ src/components/TodoList.jsx
  ├─ src/components/TodoItem.jsx
  ├─ package.json
  └─ tailwind.config.js

User: "Add dark mode support"
NexusAI: [Updates components with dark mode]
```

## 🔌 API Endpoints

### Core AI Endpoints

#### 1. Generate AI Response

```bash
POST /ai/generate
{
  "prompt": "Explain machine learning",
  "model": "llama3.2:1b",
  "stream": false,
  "use_cache": true
}

# Response (cached on 2nd+ request)
{
  "response": "Machine learning is a subset of AI...",
  "model": "llama3.2:1b",
  "cached": true,
  "eval_count": 337,
  "total_duration_ms": 10646.22
}
```

#### 2. SQL Assistant

```bash
POST /ai/sql/assist
{
  "query": "Show me all users who signed up last week",
  "schema": "users(id, email, created_at, plan)",
  "action": "generate"
}

# Response
{
  "sql": "SELECT * FROM users WHERE created_at >= NOW() - INTERVAL '7 days'",
  "explanation": "This query filters users by creation date...",
  "cached": false
}
```

#### 3. Code Completion

```bash
POST /ai/code/complete
{
  "code": "def fibonacci(n):\n    ",
  "language": "python",
  "max_tokens": 200
}
```

#### 4. List Available Models

```bash
GET /ai/models

# Response
{
  "models": [
    {
      "name": "llama3.2:1b",
      "size": "1.3GB",
      "family": "llama",
      "modified_at": "2025-01-19T..."
    },
    {
      "name": "codellama:7b",
      "size": "3.8GB",
      "family": "llama",
      "modified_at": "2025-01-20T..."
    }
  ]
}
```

### Usage & Quota

```bash
GET /usage
Authorization: Bearer vpn_your_key_here

# Response
{
  "requests_used": 47,
  "requests_limit": 1000,
  "requests_remaining": 953,
  "window_reset": "2025-01-20T11:00:00Z",
  "tier": "pro"
}
```

## 💾 Database Schema

### API Keys Table

```sql
CREATE TABLE ai_api_keys (
    id UUID PRIMARY KEY,
    key_hash VARCHAR(64) UNIQUE,        -- SHA256 of API key
    key_prefix VARCHAR(10),             -- First 10 chars for identification
    tenant_id UUID REFERENCES tenants(id),
    tier VARCHAR(50) DEFAULT 'free',
    rate_limit_requests INTEGER,
    rate_limit_window INTEGER,
    enabled BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Usage Logs (Partitioned for Scale)

```sql
CREATE TABLE ai_usage_logs (
    id BIGSERIAL PRIMARY KEY,
    api_key_id UUID REFERENCES ai_api_keys(id),
    tenant_id UUID,
    endpoint VARCHAR(255),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    cached BOOLEAN DEFAULT false,
    duration_ms INTEGER,
    status_code INTEGER,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW()
) PARTITION BY RANGE (created_at);
```

### Monthly Quotas

```sql
CREATE TABLE ai_usage_quotas (
    tenant_id UUID UNIQUE REFERENCES tenants(id),
    tier VARCHAR(50),
    monthly_request_limit INTEGER,
    monthly_requests_used INTEGER DEFAULT 0,
    monthly_token_limit BIGINT,
    monthly_tokens_used BIGINT DEFAULT 0,
    reset_date DATE,
    overage_allowed BOOLEAN DEFAULT false,
    overage_rate DECIMAL(10,4)
);
```

### Analytics View

```sql
CREATE MATERIALIZED VIEW ai_usage_analytics AS
SELECT
    DATE(created_at) as usage_date,
    tenant_id,
    endpoint,
    COUNT(*) as request_count,
    SUM(prompt_tokens + completion_tokens) as total_tokens,
    AVG(duration_ms) as avg_duration_ms,
    COUNT(*) FILTER (WHERE cached = true) as cached_requests
FROM ai_usage_logs
GROUP BY DATE(created_at), tenant_id, endpoint;
```

## 📈 Monitoring & Analytics

### View Usage in pgAdmin

1. **Access pgAdmin**: https://chatbuilds.com/pgadmin
2. **Login**: vpnadmin@vpnenterprise.com / VpnAdmin2026!
3. **Connect to**: platform_db
4. **Query**:

```sql
-- Today's usage by tenant
SELECT * FROM ai_usage_analytics
WHERE usage_date = CURRENT_DATE
ORDER BY request_count DESC;

-- Top API consumers
SELECT tenant_id, SUM(request_count) as total_requests
FROM ai_usage_analytics
GROUP BY tenant_id
ORDER BY total_requests DESC
LIMIT 10;

-- Cache hit rate
SELECT
    endpoint,
    cached_requests::float / request_count * 100 as cache_hit_rate
FROM ai_usage_analytics
WHERE usage_date >= CURRENT_DATE - 7;
```

### Performance Metrics

```bash
# Monitor in real-time
docker logs -f vpn-python-api

# Check Ollama performance
docker exec vpn-ollama ollama ps

# Redis cache stats
docker exec vpn-redis redis-cli INFO stats
```

## 🔧 Optimization Tips

### 1. Caching Strategy

- **Level 1**: Memory cache (instant, per-worker)
- **Level 2**: Redis cache (shared across workers)
- **Level 3**: Database cache (persistent, for popular queries)

### 2. Model Selection

- **llama3.2:1b**: Fast, low memory, general use
- **codellama:7b**: Slower, better code quality
- **Streaming**: Use for long responses (better UX)

### 3. Rate Limiting

```python
# Customize per endpoint
@app.post("/ai/expensive-operation")
async def expensive_op(user: Dict = Depends(verify_token)):
    # Apply stricter limits for expensive operations
    custom_limit = {"requests": 10, "window": 3600}
    rate_check = await check_rate_limit(user["user_id"], custom_limit)
```

## 🚨 Troubleshooting

### 1. High Response Times

**Problem**: AI responses taking >30 seconds

**Solutions**:

```bash
# Check Ollama memory usage
docker stats vpn-ollama

# Restart Ollama if needed
docker compose -f docker-compose.prod.yml restart ollama

# Consider reducing concurrent requests
OLLAMA_NUM_PARALLEL=2  # in docker-compose.prod.yml
```

### 2. Rate Limit Errors

**Problem**: Users hitting 429 errors

**Solutions**:

```sql
-- Check current usage
SELECT * FROM ai_usage_quotas WHERE tenant_id = 'xxx';

-- Increase limit temporarily
UPDATE ai_usage_quotas
SET monthly_request_limit = 50000
WHERE tenant_id = 'xxx';

-- Or upgrade tier
UPDATE ai_api_keys SET tier = 'pro' WHERE tenant_id = 'xxx';
```

### 3. Cache Not Working

**Problem**: Responses not being cached

**Solutions**:

```bash
# Check cache configuration
docker exec vpn-python-api env | grep CACHE

# Clear cache and restart
docker compose -f docker-compose.prod.yml restart python-api

# Verify Redis connection
docker exec vpn-redis redis-cli PING
```

## 🔐 Security Best Practices

1. **API Keys**: Never commit to version control
2. **Rate Limiting**: Enable strict limits in production
3. **CORS**: Configure specific origins (not `*`)
4. **Secrets**: Use Docker secrets for sensitive data
5. **Logging**: Don't log API keys or tokens
6. **HTTPS**: Always use SSL in production
7. **Input Validation**: Pydantic models validate all inputs

## 📞 Support & Contact

- **Documentation**: https://docs.chatbuilds.com
- **API Status**: https://status.chatbuilds.com
- **Issue Tracker**: GitHub Issues
- **Community**: Discord Server

## 📝 Changelog

### v2.0.0 (2025-01-20)

- 🚀 Production-ready architecture
- 🔑 JWT & API key authentication
- ⚡ Multi-worker support (4 workers)
- 💾 3-level caching (memory/Redis/database)
- 📊 Usage tracking & billing analytics
- 🎨 NexusAI app generation
- 📈 Tiered rate limiting
- 🔒 Enhanced security

### v1.0.0 (2025-01-19)

- ✅ Initial AI endpoints
- ✅ Ollama integration
- ✅ Basic caching
