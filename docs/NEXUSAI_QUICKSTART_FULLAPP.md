# NexusAI - Quick Start for Full App Generation

## 🚀 What Changed?

Your NexusAI is now upgraded from generating small code snippets to **full applications** like Cursor and Lovable!

### Before vs After:

| Feature            | Before (llama3.2:1b) | After (deepseek-coder-v2:16b) |
| ------------------ | -------------------- | ----------------------------- |
| **Model Size**     | 1B params            | 16B params                    |
| **Context Window** | 2K tokens            | 32K tokens                    |
| **Max Output**     | 2K tokens            | 8K tokens                     |
| **Capability**     | Small snippets       | Full applications             |
| **Quality**        | Basic                | Professional                  |

---

## 📦 Installation (Choose One)

### Option 1: Install Better Local Model (Recommended)

```bash
cd ~/vpn-enterprise
./scripts/upgrade-ollama-model.sh
```

This script will:

- Show available models
- Check your server resources
- Download the model (10GB)
- Configure Ollama automatically
- Test the installation

**Recommended Model:** `deepseek-coder-v2:16b`

- Best for code generation
- 128K context window
- Requires 16GB RAM minimum

### Option 2: Use Existing Setup (Faster but Lower Quality)

If you don't want to wait for the download, the system will fall back to the existing model, but with improved prompts and context handling.

---

## 🎯 New Features

### 1. Generate Full Applications

**Endpoint:** `POST /ai/generate/app`

```bash
curl -X POST https://python-api.chatbuilds.com/ai/generate/app \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Create a todo app with user authentication, dark mode, and task categories",
    "framework": "react",
    "features": [
      "User authentication with JWT",
      "CRUD operations for todos",
      "Dark mode toggle",
      "Task categories and filtering",
      "Responsive design"
    ],
    "styling": "tailwind"
  }'
```

**Response:**

```json
{
  "files": [
    {
      "path": "package.json",
      "content": "{\n  \"name\": \"todo-app\",\n  ...",
      "language": "json"
    },
    {
      "path": "src/App.tsx",
      "content": "import React from 'react'...",
      "language": "typescript"
    },
    {
      "path": "src/components/TodoList.tsx",
      "content": "...",
      "language": "typescript"
    }
    // ... more files
  ],
  "instructions": "1. Run npm install\n2. Create .env file...",
  "dependencies": {
    "react": "^18.2.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0"
  }
}
```

### 2. Enhanced Code Generation

**Larger Context:** Now handles 32K tokens of context
**Better Output:** Up to 8K tokens output for complex components

```bash
curl -X POST https://python-api.chatbuilds.com/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a complete React dashboard with charts, tables, and real-time updates",
    "model": "deepseek-coder-v2:16b",
    "max_tokens": 4096,
    "num_ctx": 32768
  }'
```

---

## 📝 Usage Examples

### Example 1: E-commerce Store

```typescript
import { useAI } from './services/aiService'

const { generateFullApp } = useAI()

const result = await generateFullApp({
  description:
    'Modern e-commerce store with product catalog, shopping cart, and checkout',
  framework: 'nextjs',
  features: [
    'Product listing with search and filters',
    'Shopping cart with local storage',
    'Checkout flow with Stripe integration',
    'User authentication',
    'Admin dashboard for product management',
  ],
  styling: 'tailwind',
})

// Result contains all files ready to use!
console.log(`Generated ${result.files.length} files`)
result.files.forEach((file) => {
  console.log(`${file.path} (${file.language})`)
})
```

### Example 2: SaaS Dashboard

```javascript
const dashboard = await fetch(
  'https://python-api.chatbuilds.com/ai/generate/app',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'SaaS analytics dashboard with user management and billing',
      framework: 'react',
      features: [
        'User dashboard with stats and charts',
        'Team management and invitations',
        'Subscription billing with Stripe',
        'Usage analytics and reporting',
        'Dark mode support',
      ],
      styling: 'tailwind',
    }),
  },
)

const app = await dashboard.json()
```

### Example 3: API Backend

```bash
curl -X POST https://python-api.chatbuilds.com/ai/generate/app \
  -H "Content-Type: application/json" \
  -d '{
    "description": "RESTful API with user authentication, posts, and comments",
    "framework": "express",
    "features": [
      "JWT authentication",
      "CRUD operations for posts and comments",
      "PostgreSQL database with Prisma ORM",
      "Input validation and error handling",
      "Rate limiting and security"
    ]
  }'
```

---

## 🔧 Configuration

### Current Setup (Production)

**Docker Compose:** `infrastructure/docker/docker-compose.prod.yml`

```yaml
ollama:
  image: ollama/ollama:latest
  environment:
    - OLLAMA_NUM_CTX=32768 # 32K context window
    - OLLAMA_NUM_PREDICT=8192 # 8K max output
  deploy:
    resources:
      limits:
        cpus: '8.0'
        memory: 32G
```

**Python API:** `flask/app.py`

```python
# Default model
model: str = Field(default="deepseek-coder-v2:16b")

# Increased limits
max_tokens: int = Field(default=4096, le=8192)
num_ctx: int = Field(default=32768)
```

---

## 📊 Comparison with Cursor/Lovable

| Feature                 | NexusAI (After Upgrade)   | Cursor       | Lovable      |
| ----------------------- | ------------------------- | ------------ | ------------ |
| **Full App Generation** | ✅ Yes                    | ✅ Yes       | ✅ Yes       |
| **Multi-File Output**   | ✅ Yes                    | ✅ Yes       | ✅ Yes       |
| **Code Completion**     | ✅ Yes                    | ✅ Yes       | ❌ No        |
| **Privacy**             | ✅ Local                  | ❌ Cloud     | ❌ Cloud     |
| **Cost**                | ✅ Free (hardware)        | 💰 $20/month | 💰 $20/month |
| **Context Window**      | 32K-128K                  | 32K          | 100K         |
| **Customization**       | ✅ Full control           | ⚠️ Limited   | ⚠️ Limited   |
| **Frameworks**          | React, Vue, Next, Express | All          | React only   |

---

## 🎓 Best Practices

### 1. Be Specific in Descriptions

❌ **Bad:** "Create a website"
✅ **Good:** "Create a Next.js e-commerce site with product search, shopping cart, user authentication, and Stripe checkout"

### 2. List All Features

```json
{
  "description": "Social media dashboard",
  "features": [
    "User authentication with social login",
    "Post creation with image upload",
    "Like and comment functionality",
    "Real-time notifications",
    "User profiles and followers",
    "Dark mode support"
  ]
}
```

### 3. Start Small, Iterate

1. Generate core app structure
2. Review and test
3. Ask for specific features/components
4. Integrate and refine

### 4. Use Context for Complex Apps

When building on existing code, provide context:

```python
{
  "prompt": "Add payment integration to this checkout page",
  "context": "Existing components: Cart, CheckoutForm, UserContext",
  "max_tokens": 4096
}
```

---

## 🐛 Troubleshooting

### Issue: Model Not Found

```bash
# List available models
ssh root@157.180.123.240 'docker exec vpn-ollama ollama list'

# Pull the model
ssh root@157.180.123.240 'docker exec vpn-ollama ollama pull deepseek-coder-v2:16b'
```

### Issue: Out of Memory

If the model is too large for your server:

1. Use smaller model: `qwen2.5-coder:7b` (4GB)
2. Or increase server RAM
3. Or use cloud API (DeepSeek API - $0.14/1M tokens)

### Issue: Slow Generation

Expected times:

- **7B model:** 30-60 seconds
- **13B model:** 1-2 minutes
- **16B model:** 2-5 minutes

To speed up:

- Reduce `max_tokens`
- Use smaller model
- Enable GPU if available

### Issue: Invalid JSON Response

The model might wrap JSON in markdown:

```bash
# The API automatically removes markdown blocks
# If it still fails, try:
- Reduce complexity
- Split into smaller requests
- Use temperature=0.3 for more consistent output
```

---

## 📚 Additional Resources

- **Full Upgrade Guide:** [docs/NEXUSAI_UPGRADE_GUIDE.md](./NEXUSAI_UPGRADE_GUIDE.md)
- **API Documentation:** https://python-api.chatbuilds.com/docs
- **Ollama Models:** https://ollama.com/library
- **DeepSeek Documentation:** https://github.com/deepseek-ai/DeepSeek-Coder

---

## 🚀 Next Steps

1. **Install the model:**

   ```bash
   ./scripts/upgrade-ollama-model.sh
   ```

2. **Test full app generation:**

   ```bash
   curl -X POST https://python-api.chatbuilds.com/ai/generate/app \
     -H "Content-Type: application/json" \
     -d '{
       "description": "Simple todo app with dark mode",
       "framework": "react",
       "styling": "tailwind"
     }' | jq .
   ```

3. **Update your NexusAI UI** to use the new endpoint

4. **Deploy:**
   ```bash
   npm run deploy
   ```

---

## 💡 Pro Tips

1. **Use streaming** for large generations to show progress
2. **Cache common patterns** to speed up repeated requests
3. **Fallback to cloud API** during high load
4. **Version your prompts** for consistent results
5. **Monitor resource usage** and adjust model accordingly

---

**Ready to generate full apps?** 🎉

Run the upgrade script and start building!

```bash
./scripts/upgrade-ollama-model.sh
```
