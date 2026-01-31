# 🎨 NexusAI Integration Complete - Chat-to-Code Platform

## ✅ Status: **FULLY INTEGRATED & OPERATIONAL**

NexusAI is now fully integrated with your production AI infrastructure, providing Lovable/Cursor-like chat-to-code capabilities powered by your local Ollama LLM.

---

## 🌐 Access URLs

### Public Access
- **NexusAI App**: https://chatbuilds.com/nexusai/
- **AI API**: https://chatbuilds.com/api/ai/*
- **Main API**: https://chatbuilds.com/api/*

### Internal (Docker Network)
- **NexusAI Container**: http://vpn-nexusai:80
- **Python AI API**: http://vpn-python-api:5001
- **Ollama LLM**: http://vpn-ollama:11434
- **Main API**: http://vpn-api:5000

---

## 🏗️ Architecture Overview

```
User Browser
    ↓
https://chatbuilds.com/nexusai/
    ↓
Nginx (vpn-nginx:443)
    ↓
NexusAI Container (React SPA)
    ↓ (API calls from browser)
    ↓
Python AI API (vpn-python-api:5001)
    ↓
Ollama LLM (vpn-ollama:11434)
    ↓
PostgreSQL (platform_db)
```

---

## 🎯 NexusAI Features

### 1. **AI Text Generation**
Generate any text content using natural language prompts.

**Usage:**
```typescript
import { useAI } from '@/services/aiService';

const ai = useAI('your-api-key');

const response = await ai.generate({
  prompt: "Explain microservices architecture",
  model: "llama3.2:1b",
  temperature: 0.7,
  max_tokens: 2000
});

console.log(response.response);
```

### 2. **Component Generation**
Generate React components with TypeScript and Tailwind CSS.

**Usage:**
```typescript
const componentCode = await ai.generateComponent(
  "A responsive navbar with logo, menu items, and a user profile dropdown"
);
```

**Output:**
```tsx
import React, { useState } from 'react';

interface NavbarProps {
  logoSrc: string;
  menuItems: string[];
}

export const Navbar: React.FC<NavbarProps> = ({ logoSrc, menuItems }) => {
  // Complete component code with hooks, styling, etc.
}
```

### 3. **Full App Generation**
Generate complete application structures with routing and components.

**Usage:**
```typescript
const appStructure = await ai.generateApp(
  "A task management app with boards, lists, and cards like Trello"
);

console.log(appStructure);
// {
//   components: [
//     { name: "Board", code: "..." },
//     { name: "List", code: "..." },
//     { name: "Card", code: "..." }
//   ],
//   routes: ["/", "/board/:id", "/settings"],
//   description: "Task management application..."
// }
```

### 4. **Database Schema Generation**
Generate PostgreSQL schemas from natural language.

**Usage:**
```typescript
const schema = await ai.generateDatabaseSchema(
  "E-commerce platform with users, products, orders, and payments"
);
```

**Output:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Complete schema with relationships, indexes...
```

### 5. **SQL Query Assistance**
Generate, explain, optimize, or fix SQL queries.

**Usage:**
```typescript
// Generate SQL from natural language
const result = await ai.sqlAssist({
  query: "Get all orders placed in the last 30 days with customer details",
  action: "generate"
});

// Explain existing SQL
const explanation = await ai.sqlAssist({
  sql: "SELECT * FROM orders WHERE created_at > NOW() - INTERVAL '30 days'",
  action: "explain"
});

// Optimize query
const optimized = await ai.sqlAssist({
  sql: "SELECT * FROM orders JOIN customers ON orders.customer_id = customers.id",
  action: "optimize"
});
```

### 6. **Code Explanation**
Understand any code snippet.

**Usage:**
```typescript
const explanation = await ai.explainCode(`
  const memoizedValue = useMemo(() => {
    return expensiveOperation(data);
  }, [data]);
`);
```

### 7. **Code Fixing**
Fix broken code with error messages.

**Usage:**
```typescript
const fixed = await ai.fixCode(
  `const [count setCount] = useState(0);`, // broken code
  "SyntaxError: Unexpected identifier 'setCount'" // error message
);

// Returns: const [count, setCount] = useState(0);
```

### 8. **Code Optimization**
Improve performance and readability.

**Usage:**
```typescript
const optimized = await ai.optimizeCode(`
  function searchArray(arr, target) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === target) return i;
    }
    return -1;
  }
`);

// Suggests using Array.indexOf() or binary search for sorted arrays
```

### 9. **API Generation**
Generate Express.js API endpoints.

**Usage:**
```typescript
const apiCode = await ai.generateAPI(
  "REST API for blog posts with CRUD operations and authentication"
);
```

### 10. **Code Completion**
Real-time code suggestions as you type.

**Usage:**
```typescript
const code = "function calculateTotal(items) {\n  ";
const cursorPosition = code.length;

const completion = await ai.completeCode(code, cursorPosition);

// Suggests: "return items.reduce((sum, item) => sum + item.price, 0);"
```

---

## 🔐 Authentication System

### API Key Management

NexusAI uses the same API key system as your production AI API.

#### Getting an API Key

**Option 1: Request from Admin**
Contact your VPN Enterprise administrator for an API key.

**Option 2: Create via API (Admin Only)**
```bash
docker exec vpn-python-api curl -X POST \
  http://localhost:5001/auth/create-key \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "your-tenant",
    "user_id": "your-user-id",
    "name": "NexusAI Development Key",
    "quota_requests_per_hour": 1000,
    "tier": "pro"
  }'
```

**Response:**
```json
{
  "api_key": "vpn_abc123xyz...",
  "key_id": "uuid",
  "tier": "pro",
  "rate_limit": {
    "requests": 1000,
    "window": 3600
  },
  "expires_at": "2027-01-31T..."
}
```

#### Using API Key in NexusAI

**Browser (React Component):**
```typescript
import { APIKeyManager } from '@/components/APIKeyManager';

function App() {
  return (
    <div>
      <APIKeyManager />
      {/* Your app components */}
    </div>
  );
}
```

**Programmatically:**
```typescript
import { aiService } from '@/services/aiService';

// Set API key
aiService.setAPIKey('vpn_abc123xyz...');

// Verify it works
const isValid = await aiService.verifyAPIKey();
console.log('Key valid:', isValid);

// Check usage
const usage = await aiService.getUsage();
console.log('Used:', usage.requests_used, '/', usage.requests_limit);
```

#### API Key Storage

- **Location**: `localStorage` key `nexusai_api_key`
- **Security**: Client-side storage (HTTPS only in production)
- **Expiration**: Keys can have expiration dates (default: 1 year)

---

## 📊 Performance & Caching

### Redis Caching

All AI responses are cached for 1 hour by default:

```typescript
// First call - hits Ollama (slower)
const response1 = await ai.generate({ prompt: "What is Docker?" });
console.log(response1.cached); // false

// Second call - cached (instant)
const response2 = await ai.generate({ prompt: "What is Docker?" });
console.log(response2.cached); // true
```

### Rate Limiting

**Free Tier:**
- 100 requests/hour per API key
- Sliding window (resets hourly)

**Pro Tier:**
- 1,000 requests/hour
- Priority processing

**Enterprise Tier:**
- 10,000 requests/hour
- Dedicated resources

**Check Remaining Quota:**
```typescript
const usage = await ai.getUsage();
console.log(`${usage.requests_remaining} requests remaining`);
console.log(`Resets at: ${new Date(usage.window_reset).toLocaleString()}`);
```

---

## 🚀 Deployment Architecture

### Container Status

```bash
# Check all AI services
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

# Expected output:
NAMES            STATUS                   PORTS
vpn-nexusai      Up (healthy)            80/tcp
vpn-python-api   Up (healthy)            5001/tcp
vpn-ollama       Up (healthy)            11434/tcp
vpn-redis        Up (healthy)            6379/tcp
vpn-postgres     Up (healthy)            5432/tcp
vpn-nginx        Up                      80/tcp, 443/tcp
```

### Resource Allocation

**NexusAI:**
- 2 CPU cores limit, 0.5 CPU reservation
- 2GB RAM limit, 512MB reservation
- Nginx serving static React build

**Python AI API:**
- 4 CPU cores, 4GB RAM
- 4 Uvicorn workers
- Redis connection pooling

**Ollama:**
- 4 CPU cores, 8GB RAM
- Model: llama3.2:1b (1.3GB)
- Multi-request concurrency

**Redis:**
- 1 CPU core, 512MB RAM
- 10 connection pool size
- 1-hour TTL for AI responses

---

## 🔧 Configuration Files

### Environment Variables

**NexusAI** (`apps/nexusAi/chat-to-code-38/.env.production`):
```env
# API Endpoints (for build-time)
VITE_AI_API_URL=http://vpn-python-api:5001
VITE_MAIN_API_URL=http://vpn-api:5000/api

# Public URLs (for client-side)
VITE_PUBLIC_AI_API_URL=https://chatbuilds.com/api/ai
VITE_PUBLIC_API_URL=https://chatbuilds.com/api

# Features
VITE_ENABLE_AI_ASSIST=true
VITE_ENABLE_CODE_COMPLETION=true
VITE_ENABLE_STREAMING=true
VITE_ENABLE_CHAT_TO_CODE=true

# Models
VITE_DEFAULT_MODEL=llama3.2:1b
VITE_CODE_MODEL=llama3.2:1b

# Performance
VITE_CACHE_ENABLED=true
VITE_CACHE_TTL=3600
VITE_MAX_TOKENS=2000
```

### Docker Compose

**NexusAI Service** (in `docker-compose.prod.yml`):
```yaml
nexusai:
  build:
    context: ../../apps/nexusAi/chat-to-code-38
    dockerfile: Dockerfile
  container_name: vpn-nexusai
  restart: always
  networks:
    - vpn-network
  deploy:
    resources:
      limits:
        cpus: '2.0'
        memory: 2G
  healthcheck:
    test: ['CMD', 'wget', '--spider', 'http://localhost:80/']
    interval: 30s
    timeout: 10s
```

### Nginx Routing

**Location Block** (in `nginx/prod/conf.d/00-router.conf`):
```nginx
location ^~ /nexusai/ {
  rewrite ^/nexusai/(.*)$ /$1 break;
  
  proxy_pass http://nexusai:80;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  
  proxy_buffering off;
}
```

---

## 🧪 Testing & Verification

### Manual Testing

#### 1. Check NexusAI is Accessible
```bash
curl -I https://chatbuilds.com/nexusai/
# Expected: 200 OK with HTML content
```

#### 2. Verify AI API
```bash
curl -X POST https://chatbuilds.com/api/ai/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: vpn_your_key_here" \
  -d '{"prompt":"Say hello","model":"llama3.2:1b"}'
```

#### 3. Test Component Generation
```bash
curl -X POST http://vpn-python-api:5001/ai/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: vpn_your_key_here" \
  -d '{
    "prompt": "Generate a React login form component with email and password fields",
    "max_tokens": 2000
  }'
```

#### 4. Check Usage Stats
```bash
curl http://vpn-python-api:5001/usage \
  -H "X-API-Key: vpn_your_key_here"
```

### Automated Testing

**React Testing:**
```typescript
import { render, screen } from '@testing-library/react';
import { APIKeyManager } from '@/components/APIKeyManager';

test('renders API key input', () => {
  render(<APIKeyManager />);
  expect(screen.getByLabelText(/API Key/i)).toBeInTheDocument();
});
```

**API Integration Testing:**
```typescript
import { aiService } from '@/services/aiService';

test('generates component code', async () => {
  aiService.setAPIKey('vpn_test_key');
  
  const code = await aiService.generateComponent('a simple button');
  
  expect(code).toContain('Button');
  expect(code).toContain('React');
});
```

---

## 📈 Monitoring & Analytics

### Health Checks

**Check all services:**
```bash
# NexusAI
curl -f http://vpn-nexusai:80/ || echo "NexusAI DOWN"

# Python AI API
curl -f http://vpn-python-api:5001/health || echo "Python API DOWN"

# Ollama
curl -f http://vpn-ollama:11434/api/tags || echo "Ollama DOWN"
```

### Logs

**View NexusAI logs:**
```bash
docker logs -f vpn-nexusai
```

**View Python AI API logs:**
```bash
docker logs -f vpn-python-api | grep -E "INFO|ERROR"
```

**View Ollama logs:**
```bash
docker logs -f vpn-ollama
```

### Metrics

**API Usage:**
```bash
# Total requests per tenant
SELECT tenant_id, COUNT(*) as total_requests
FROM ai_usage_logs
GROUP BY tenant_id
ORDER BY total_requests DESC;

# Most used endpoints
SELECT endpoint, COUNT(*) as count
FROM ai_usage_logs
GROUP BY endpoint
ORDER BY count DESC;

# Average response time
SELECT endpoint, 
       AVG(response_time_ms) as avg_ms,
       MAX(response_time_ms) as max_ms
FROM ai_usage_logs
GROUP BY endpoint;
```

---

## 🎨 UI Components

### Available Components

1. **APIKeyManager** - Manage and verify API keys
2. **AIChat** - Chat interface for conversations
3. **ComponentGenerator** - Visual component builder
4. **CodeEditor** - Syntax-highlighted code editor
5. **UsageStats** - Display quota and usage

### Example: Full Chat Interface

```typescript
import { useState } from 'react';
import { useAI } from '@/services/aiService';
import { APIKeyManager } from '@/components/APIKeyManager';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function ChatInterface() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const ai = useAI();

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await ai.generate({
        prompt: input,
        model: 'llama3.2:1b',
        max_tokens: 2000,
      });

      const aiMessage = { role: 'assistant', content: response.response };
      setMessages([...messages, userMessage, aiMessage]);
    } catch (error) {
      console.error('AI error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <APIKeyManager />
      
      <div className="flex-1 overflow-y-auto space-y-4 my-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-4 rounded-lg ${
              msg.role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
            } max-w-[80%]`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask me to generate code, explain concepts, or build apps..."
          rows={3}
        />
        <Button onClick={handleSend} disabled={loading}>
          {loading ? 'Thinking...' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
```

---

## 🚀 Next Steps

### Phase 1: Enhanced Features (Immediate) ✅ CURRENT

- [x] Deploy NexusAI to production
- [x] Integrate with AI API
- [x] API key management UI
- [x] Basic code generation

### Phase 2: Advanced Capabilities (Week 1)

- [ ] Real-time streaming responses
- [ ] Multi-file project generation
- [ ] Live code preview
- [ ] Git repository creation
- [ ] One-click deployment

### Phase 3: Collaboration (Week 2)

- [ ] Team workspaces
- [ ] Shared projects
- [ ] Code review with AI
- [ ] Version control integration

### Phase 4: Enterprise (Month 1)

- [ ] Custom model fine-tuning
- [ ] Private model deployment
- [ ] Advanced security controls
- [ ] Audit logging
- [ ] SSO integration

---

## 📚 Additional Resources

### Documentation

- **AI API Docs**: See [AI_SERVICE_READY.md](AI_SERVICE_READY.md)
- **React Components**: Browse `/apps/nexusAi/chat-to-code-38/src/components/`
- **AI Service API**: See `/apps/nexusAi/chat-to-code-38/src/services/aiService.ts`

### Example Projects

**Generate a Todo App:**
```typescript
const app = await ai.generateApp("A todo list app with categories and due dates");
```

**Generate E-commerce:**
```typescript
const schema = await ai.generateDatabaseSchema("E-commerce with products, cart, orders");
const api = await ai.generateAPI("Product catalog with search and filters");
```

**Generate Dashboard:**
```typescript
const component = await ai.generateComponent("Analytics dashboard with charts and metrics");
```

---

## 🎉 Success!

NexusAI is now fully integrated with your VPN Enterprise platform! You can:

✅ Generate React components from natural language  
✅ Build full applications through conversation  
✅ Create database schemas automatically  
✅ Get SQL assistance (generate, explain, optimize, fix)  
✅ Fix and optimize code with AI  
✅ Complete code as you type  
✅ Generate API endpoints  
✅ All powered by your local Ollama LLM  
✅ Production-ready with caching and rate limiting  

**Access your platform:** https://chatbuilds.com/nexusai/

---

*Last Updated: January 31, 2026*  
*Service: NexusAI v1.0*  
*Status: ✅ OPERATIONAL*
