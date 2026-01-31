# AI-as-a-Service Integration Guide

## 🚀 Overview

VPN Enterprise now includes a comprehensive AI-as-a-Service platform powered by **Ollama**, **NexusAI**, and a custom **Flask API**. This integration provides:

- 🤖 **AI SQL Assistant** - Generate, optimize, and explain SQL queries
- 💬 **NexusAI Chat-to-Code** - Build entire applications through conversation
- ⚡ **AI API Endpoints** - Programmatic access to AI capabilities
- 🔄 **N8N Automation** - AI-powered workflow automation

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interfaces                          │
├─────────────────┬───────────────────┬───────────────────────┤
│  SQL Editor     │   NexusAI Web     │   Direct API Access   │
│  (AI Assistant) │   (Chat-to-Code)  │   (REST Endpoints)    │
└────────┬────────┴──────────┬────────┴───────────┬───────────┘
         │                   │                    │
         └───────────────────┼────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Nginx Router  │
                    │  (Subdomain)    │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼─────┐      ┌─────▼──────┐    ┌──────▼──────┐
    │  Flask   │      │  NexusAI   │    │   Ollama    │
    │ Python   │◄─────┤   React    │    │   LLM       │
    │   API    │      │   App      │    │   Server    │
    └────┬─────┘      └────────────┘    └──────▲──────┘
         │                                      │
         └──────────────────────────────────────┘
```

## 🎯 Features

### 1. AI SQL Assistant

**Location:** Database Management → SQL Editor

**Capabilities:**
- ✅ Generate SQL from natural language
- ✅ Explain complex queries
- ✅ Optimize slow queries
- ✅ Fix SQL errors
- ✅ Auto-complete suggestions

**Example Usage:**
```
User: "Get all users created in the last 7 days"
AI: SELECT * FROM users WHERE created_at > NOW() - INTERVAL '7 days'
```

### 2. Flask AI API Endpoints

**Base URL:** `https://python-api.chatbuilds.com`

#### Generate AI Response
```bash
POST /ai/generate
Content-Type: application/json

{
  "prompt": "Explain what a foreign key is",
  "model": "llama3.2:1b",
  "temperature": 0.7,
  "context": "Database concepts for beginners"
}
```

**Response:**
```json
{
  "response": "A foreign key is a column that references...",
  "model": "llama3.2:1b",
  "eval_count": 150,
  "total_duration_ms": 245.3
}
```

#### SQL Assistance
```bash
POST /ai/sql/assist
Content-Type: application/json

{
  "query": "Get all active users",
  "schema": "tenant_mukulah",
  "action": "generate"
}
```

**Actions:**
- `generate` - Create SQL from natural language
- `explain` - Explain what a SQL query does
- `optimize` - Improve query performance
- `fix` - Fix SQL errors

**Response:**
```json
{
  "sql": "SELECT * FROM users WHERE status = 'active'",
  "explanation": "This query retrieves all users with active status",
  "suggestions": ["Add index on status column"]
}
```

#### Code Completion
```bash
POST /ai/code/complete
Content-Type: application/json

{
  "code": "function calculateTotal(items) {\n  let sum = 0;\n  ",
  "language": "javascript",
  "cursor_position": 45
}
```

**Response:**
```json
{
  "completions": [
    "items.forEach(item => sum += item.price);",
    "for (const item of items) sum += item.price;",
    "return items.reduce((acc, item) => acc + item.price, 0);"
  ],
  "confidence": 0.85
}
```

#### List Available Models
```bash
GET /ai/models
```

**Response:**
```json
{
  "models": [
    {
      "name": "llama3.2:1b",
      "size": 1300000000,
      "modified_at": "2025-12-22T10:30:00Z"
    }
  ]
}
```

### 3. NexusAI Chat-to-Code

**Access:** `https://nexusai.chatbuilds.com`

Build entire applications through conversation:
- Frontend components (React, Vue, etc.)
- Backend APIs (Express, FastAPI, etc.)
- Database schemas
- Complete features end-to-end

**Example:**
```
You: "Create a React todo app with local storage"
AI: [Generates complete React component with useState, localStorage, and UI]
```

### 4. Service Health Checks

```bash
# Check all services
GET /services/status

# Response
[
  {
    "name": "ollama",
    "url": "http://vpn-ollama:11434",
    "status": "up",
    "response_time_ms": 12.5
  },
  {
    "name": "api",
    "url": "http://vpn-api:5000",
    "status": "up",
    "response_time_ms": 8.3
  }
]
```

## 🔧 Installation & Setup

### Prerequisites
- Docker and Docker Compose
- At least 8GB RAM for Ollama
- 4 CPU cores recommended

### Deploy to Production

1. **Pull Ollama Models:**
```bash
ssh root@157.180.123.240
docker exec vpn-ollama ollama pull llama3.2:1b
docker exec vpn-ollama ollama pull codellama:7b  # For code tasks
```

2. **Verify Services:**
```bash
docker ps | grep -E "ollama|python-api|nexusai"
```

3. **Test AI Endpoints:**
```bash
curl -X POST https://python-api.chatbuilds.com/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, AI!", "model": "llama3.2:1b"}'
```

### Local Development

1. **Start Dev Environment:**
```bash
cd infrastructure/docker
docker compose -f docker-compose.dev.yml up -d ollama python-api nexusai
```

2. **Pull Models:**
```bash
docker exec vpn-ollama-dev ollama pull llama3.2:1b
```

3. **Test Locally:**
```bash
curl http://localhost:5001/health
curl http://localhost:11434/api/tags  # List Ollama models
```

## 🔐 Security & Best Practices

### Rate Limiting
Flask API implements per-user rate limits:
- AI Generation: 100 requests/hour
- SQL Assist: 200 requests/hour
- Code Completion: 500 requests/hour

### Authentication
All AI endpoints require valid JWT tokens from the main API:
```bash
Authorization: Bearer <your-jwt-token>
```

### Resource Limits
Ollama container limits:
- CPU: 4 cores (2 reserved, 4 limit)
- Memory: 8GB (4GB reserved, 8GB limit)
- Models are cached in `ollama_data` volume

### Privacy
- AI requests are NOT logged or stored
- Tenant data stays isolated
- No data sent to external AI services (100% on-premises)

## 📊 Monitoring

### Check Ollama Performance
```bash
docker stats vpn-ollama
```

### View Flask API Logs
```bash
docker logs -f vpn-python-api
```

### N8N Workflows
Access at `https://n8n.chatbuilds.com` to create AI automation workflows

## 🎨 Frontend Integration

### React/Next.js Example
```typescript
async function askAI(prompt: string) {
  const response = await fetch('https://python-api.chatbuilds.com/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getJWT()}`
    },
    body: JSON.stringify({
      prompt,
      model: 'llama3.2:1b',
      temperature: 0.7
    })
  })
  
  return response.json()
}

// Use in component
const { response } = await askAI('Explain ACID properties')
console.log(response)
```

### SQL Editor Integration
The SQL editor includes built-in AI assistant:
```typescript
import { AiSqlAssistant } from '@/components/database/ai-sql-assistant'

<AiSqlAssistant
  activeTenant={tenant}
  onQueryGenerated={(sql) => {
    // Insert generated SQL into editor
    editor.setValue(sql)
  }}
/>
```

## 🚀 Advanced Use Cases

### 1. Automated Database Documentation
```python
# Generate schema docs with AI
POST /ai/generate
{
  "prompt": "Document this database schema: [paste schema]",
  "context": "Create Markdown documentation"
}
```

### 2. Query Performance Analysis
```python
POST /ai/sql/assist
{
  "query": "SELECT * FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.created_at > '2024-01-01'",
  "action": "optimize",
  "schema": "tenant_production"
}
```

### 3. N8N AI Workflow
Create workflows like:
- User submits natural language → AI generates SQL → Execute → Return results
- Code review: Push to Git → AI analyzes → Post comments
- Auto-generate test data based on schema

## 📝 Model Recommendations

| Task | Model | Size | Speed |
|------|-------|------|-------|
| SQL Generation | llama3.2:1b | 1.3GB | ⚡ Very Fast |
| Code Completion | codellama:7b | 7GB | ⚡ Fast |
| Chat/Explanations | llama3:8b | 8GB | 🐢 Medium |
| Complex Reasoning | llama3:13b | 13GB | 🐢 Slow |

**Recommendation:** Start with `llama3.2:1b` - it's fast, accurate, and perfect for SQL/code tasks.

## 🐛 Troubleshooting

### Ollama Service Not Responding
```bash
docker restart vpn-ollama
docker logs vpn-ollama
```

### Model Download Stuck
```bash
docker exec vpn-ollama ollama list  # Check status
docker exec vpn-ollama ollama rm llama3.2:1b  # Remove and retry
docker exec vpn-ollama ollama pull llama3.2:1b
```

### Flask API 503 Error
```bash
# Check if Ollama is accessible
docker exec vpn-python-api curl http://vpn-ollama:11434/
```

### SQL Assistant Not Working in UI
Check browser console for CORS errors, verify nginx routing:
```bash
curl -I https://python-api.chatbuilds.com/health
```

## 📚 Additional Resources

- [Ollama Documentation](https://ollama.ai/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [NexusAI GitHub](https://github.com/nexusai)
- [N8N AI Workflows](https://n8n.io/integrations/ai/)

## 🎯 Roadmap

- [ ] Add streaming responses for real-time AI output
- [ ] Implement caching with Redis for common queries
- [ ] Add more specialized models (SQL-Coder, DeepSeek)
- [ ] Create AI-powered database migration assistant
- [ ] Build visual query builder with AI suggestions
- [ ] Add voice input for SQL generation
- [ ] Implement AI-powered database optimization recommendations

## 💡 Tips for Best Results

1. **Be Specific:** "Create a users table with email, name, and timestamps" > "create table"
2. **Provide Context:** Include schema info when asking SQL questions
3. **Use Examples:** Show the AI what you want with sample input/output
4. **Iterate:** Start simple, then ask for improvements
5. **Temperature:** Lower (0.3) for precise tasks, higher (0.8) for creative work

---

**Built with ❤️ for VPN Enterprise**
*Making databases intelligent, one query at a time.*
