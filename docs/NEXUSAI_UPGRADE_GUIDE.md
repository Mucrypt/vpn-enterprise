# NexusAI Upgrade Guide - Full App Generation Like Cursor/Lovable

## Current Limitations

### 🔴 Current Setup Issues:

- **Model**: `llama3.2:1b` (1 billion parameters) - TOO SMALL
- **Context Window**: ~2048 tokens (default)
- **Max Tokens**: 2000 tokens output
- **Result**: Can only generate small code snippets, not full applications

### ✅ Required for Full App Generation:

- **Model**: 70B+ parameters OR cloud API (GPT-4, Claude, DeepSeek)
- **Context Window**: 32K - 200K tokens
- **Max Tokens**: 4000-8000 tokens output
- **Streaming**: Multi-turn conversation for complex apps

---

## Solution Options

### Option 1: Use Larger Ollama Models (Recommended for Privacy)

#### Best Models for Code Generation:

1. **DeepSeek-Coder-V2 (16B/236B)**
   - Best for code generation
   - 128K context window
   - Specialized for programming

   ```bash
   ollama pull deepseek-coder-v2:16b
   ollama pull deepseek-coder-v2:236b  # If you have 64GB+ RAM
   ```

2. **Qwen2.5-Coder (7B/14B/32B)**
   - Excellent code generation
   - 32K context window

   ```bash
   ollama pull qwen2.5-coder:7b
   ollama pull qwen2.5-coder:32b  # Better quality
   ```

3. **CodeLlama (13B/34B/70B)**
   - Meta's code specialist
   - 100K context window

   ```bash
   ollama pull codellama:13b
   ollama pull codellama:34b
   ollama pull codellama:70b  # Best quality, needs 64GB RAM
   ```

4. **Llama 3.1 (8B/70B/405B)**
   - General purpose, good at code
   - 128K context window
   ```bash
   ollama pull llama3.1:8b
   ollama pull llama3.1:70b
   ```

#### Server Requirements:

| Model Size | RAM Needed | GPU VRAM | Speed     |
| ---------- | ---------- | -------- | --------- |
| 7B-8B      | 8GB        | 6GB      | Fast      |
| 13B-16B    | 16GB       | 10GB     | Medium    |
| 32B-34B    | 32GB       | 20GB     | Slow      |
| 70B+       | 64GB       | 48GB     | Very Slow |

---

### Option 2: Use Cloud APIs (Recommended for Production)

#### Best Cloud Models:

1. **OpenAI GPT-4o** ($5/1M tokens)
   - 128K context window
   - Best for complex reasoning
   - Fast and reliable

2. **Anthropic Claude 3.5 Sonnet** ($3/1M tokens)
   - 200K context window
   - Excellent at following instructions
   - Great for multi-file generation

3. **DeepSeek API** ($0.14/1M tokens)
   - CHEAPEST option
   - 64K context window
   - Specialized for code
   - **HIGHLY RECOMMENDED**

4. **Google Gemini 1.5 Pro** ($1.25/1M tokens)
   - 1M context window (LARGEST)
   - Can handle entire codebases
   - Good for refactoring

---

## Implementation Guide

### Step 1: Update Ollama Configuration

Edit [infrastructure/docker/docker-compose.prod.yml](../infrastructure/docker/docker-compose.prod.yml):

```yaml
ollama:
  image: ollama/ollama:latest
  container_name: vpn-ollama
  restart: always
  volumes:
    - ollama_data:/root/.ollama
  environment:
    - OLLAMA_HOST=0.0.0.0:11434
    - OLLAMA_NUM_PARALLEL=4
    - OLLAMA_MAX_LOADED_MODELS=2
    # Increase context window
    - OLLAMA_NUM_CTX=32768 # 32K context
    - OLLAMA_NUM_PREDICT=4096 # 4K max output
  deploy:
    resources:
      limits:
        cpus: '8.0' # Increase for larger models
        memory: 32G # Increase for 13B+ models
      reservations:
        cpus: '4.0'
        memory: 16G
```

### Step 2: Update Python API to Support Larger Context

Edit [flask/app.py](../flask/app.py):

```python
class AIRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=50000)  # Increase from 2000
    model: str = Field(default="deepseek-coder-v2:16b")       # Better default
    stream: bool = Field(default=False)
    context: Optional[str] = None
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=4096, le=8192)            # Increase output limit
    num_ctx: int = Field(default=32768)                        # Context window

@app.post("/ai/generate", response_model=AIResponse)
async def generate_ai_response(request: AIRequest):
    """Generate AI response using Ollama service"""
    try:
        full_prompt = request.prompt
        if request.context:
            full_prompt = f"Context: {request.context}\n\nQuestion: {request.prompt}"

        async with httpx.AsyncClient(timeout=300.0) as client:  # Increase timeout
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
```

### Step 3: Add Multi-File Generation Support

Create new endpoint in [flask/app.py](../flask/app.py):

````python
from typing import List, Dict

class MultiFileGenerateRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=5000)
    framework: str = Field(default="react", pattern="^(react|vue|angular|nextjs|express)$")
    features: List[str] = Field(default_factory=list)
    styling: str = Field(default="tailwind", pattern="^(tailwind|css|styled-components)$")

class FileOutput(BaseModel):
    path: str
    content: str
    language: str

class MultiFileGenerateResponse(BaseModel):
    files: List[FileOutput]
    instructions: str
    dependencies: Dict[str, str]

@app.post("/ai/generate/app", response_model=MultiFileGenerateResponse)
async def generate_full_app(request: MultiFileGenerateRequest):
    """Generate a complete application with multiple files"""

    features_str = "\n".join([f"- {f}" for f in request.features]) if request.features else "Basic CRUD operations"

    prompt = f"""You are an expert full-stack developer. Create a complete, production-ready {request.framework} application.

**Requirements:**
{request.description}

**Features to include:**
{features_str}

**Styling:** {request.styling}

**Instructions:**
Generate a complete application structure with ALL necessary files. Return a JSON object with this EXACT structure:

{{
  "files": [
    {{
      "path": "src/App.tsx",
      "content": "// Full component code here",
      "language": "typescript"
    }},
    {{
      "path": "src/components/Header.tsx",
      "content": "// Full component code here",
      "language": "typescript"
    }}
  ],
  "instructions": "Step-by-step setup instructions",
  "dependencies": {{
    "react": "^18.2.0",
    "typescript": "^5.0.0"
  }}
}}

Include:
1. Main application file
2. All components with proper structure
3. Routing setup
4. State management (if needed)
5. API integration (if needed)
6. Styling files
7. Configuration files (tsconfig.json, etc.)
8. README.md with setup instructions

Return ONLY valid JSON, no markdown formatting."""

    try:
        async with httpx.AsyncClient(timeout=600.0) as client:  # 10 min timeout
            response = await client.post(
                f"{SERVICES['ollama']}/api/generate",
                json={
                    "model": "deepseek-coder-v2:16b",  # Use best code model
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,      # Lower for more consistent output
                        "num_predict": 8192,     # Large output
                        "num_ctx": 32768,        # Large context
                        "num_thread": 8,
                    }
                }
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Ollama service error: {response.text}"
                )

            data = response.json()
            ai_response = data.get("response", "")

            # Clean up markdown code blocks if present
            ai_response = ai_response.strip()
            if ai_response.startswith("```json"):
                ai_response = ai_response[7:]
            if ai_response.startswith("```"):
                ai_response = ai_response[3:]
            if ai_response.endswith("```"):
                ai_response = ai_response[:-3]

            # Parse JSON response
            import json
            result = json.loads(ai_response.strip())

            return result

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response as JSON: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="AI generated invalid response format"
        )
    except Exception as e:
        logger.error(f"Full app generation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
````

### Step 4: Update NexusAI Frontend

Edit [apps/nexusAi/chat-to-code-38/src/services/aiService.ts](../apps/nexusAi/chat-to-code-38/src/services/aiService.ts):

```typescript
export interface MultiFileGenerateRequest {
  description: string
  framework?: 'react' | 'vue' | 'angular' | 'nextjs' | 'express'
  features?: string[]
  styling?: 'tailwind' | 'css' | 'styled-components'
}

export interface FileOutput {
  path: string
  content: string
  language: string
}

export interface MultiFileGenerateResponse {
  files: FileOutput[]
  instructions: string
  dependencies: Record<string, string>
}

export class AIService {
  // ... existing code ...

  // Generate full application
  async generateFullApp(
    request: MultiFileGenerateRequest,
  ): Promise<MultiFileGenerateResponse> {
    const response = await fetch(`${this.baseURL}/generate/app`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        description: request.description,
        framework: request.framework || 'react',
        features: request.features || [],
        styling: request.styling || 'tailwind',
      }),
    })

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `API Error: ${response.status}`)
    }

    return response.json()
  }
}

// Update hook
export function useAI(apiKey?: string) {
  const [service] = useState(() => new AIService(apiKey, true))

  return {
    // ... existing methods ...

    generateFullApp: (req: MultiFileGenerateRequest) =>
      service.generateFullApp(req),
  }
}
```

### Step 5: Deploy and Test

1. **Pull the model:**

   ```bash
   ssh root@157.180.123.240
   docker exec vpn-ollama ollama pull deepseek-coder-v2:16b
   # This will take 15-30 minutes (10GB download)
   ```

2. **Restart services with new config:**

   ```bash
   cd /root/vpn-enterprise/infrastructure/docker
   docker compose -f docker-compose.prod.yml down
   docker compose -f docker-compose.prod.yml up -d --build
   ```

3. **Test the new endpoint:**
   ```bash
   curl -X POST https://python-api.chatbuilds.com/ai/generate/app \
     -H "Content-Type: application/json" \
     -d '{
       "description": "Create a todo app with authentication",
       "framework": "react",
       "features": ["user auth", "CRUD todos", "dark mode"],
       "styling": "tailwind"
     }'
   ```

---

## Cloud API Integration (Alternative)

If local models are too slow, integrate DeepSeek API:

### Add to `.env.production`:

```bash
DEEPSEEK_API_KEY=your_api_key_here
USE_CLOUD_AI=true
CLOUD_AI_PROVIDER=deepseek  # or openai, anthropic
```

### Update Python API:

```python
import os

CLOUD_AI_ENABLED = os.getenv("USE_CLOUD_AI", "false").lower() == "true"
CLOUD_AI_PROVIDER = os.getenv("CLOUD_AI_PROVIDER", "deepseek")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")

async def generate_with_cloud_ai(prompt: str, max_tokens: int = 4096):
    """Use cloud AI API for generation"""
    if CLOUD_AI_PROVIDER == "deepseek":
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "deepseek-coder",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": max_tokens,
                    "temperature": 0.3
                }
            )
            data = response.json()
            return data["choices"][0]["message"]["content"]
```

---

## Comparison: Local vs Cloud

| Feature         | Local (DeepSeek 16B) | Cloud (DeepSeek API) | Cloud (GPT-4)     |
| --------------- | -------------------- | -------------------- | ----------------- |
| **Cost**        | Free (hardware)      | $0.14/1M tokens      | $5/1M tokens      |
| **Speed**       | 5-20 tokens/sec      | 50-100 tokens/sec    | 50-100 tokens/sec |
| **Privacy**     | ✅ Complete          | ❌ Third-party       | ❌ Third-party    |
| **Quality**     | Good                 | Excellent            | Excellent         |
| **Context**     | 128K                 | 64K                  | 128K              |
| **Setup**       | Complex              | Easy                 | Easy              |
| **Scalability** | Limited by hardware  | Unlimited            | Unlimited         |

---

## Recommended Approach

### For Development/Testing:

1. Use `deepseek-coder-v2:16b` locally
2. Set context window to 32K
3. Set max output to 4096 tokens

### For Production:

1. Use **DeepSeek API** (cheapest, specialized for code)
2. Fallback to local model if API fails
3. Implement caching for common patterns
4. Add streaming for better UX

---

## Next Steps

1. **Choose your approach** (local model or cloud API)
2. **Update configuration files** (follow Step 1-2 above)
3. **Pull the model** (if using local)
4. **Test the new endpoints**
5. **Update NexusAI UI** to use multi-file generation

Need help with implementation? Let me know which approach you prefer!
