# VPN Enterprise - Ollama Integration Guide

Complete guide for using Ollama AI model hosting service in your VPN Enterprise project.

## 🎯 What is Ollama?

Ollama allows you to run large language models (LLMs) locally on your infrastructure:
- **Privacy**: Your data never leaves your servers
- **Cost-effective**: No API fees for model usage
- **Low latency**: Local inference is faster than API calls
- **Customizable**: Fine-tune models for your specific use case

## 🚀 Quick Start

### Development Environment

```bash
# Start all dev services including Ollama
./scripts/start-dev.sh
```

**Ollama will be available at**: `http://localhost:11434`

### Pull Your First Model

```bash
# Pull a lightweight model (1.5GB)
docker exec vpn-ollama-dev ollama pull llama3.2:1b

# Pull a more powerful model (4.7GB)
docker exec vpn-ollama-dev ollama pull llama3.2:3b

# Pull the full Llama 3.2 model (8GB)
docker exec vpn-ollama-dev ollama pull llama3.2

# Pull other popular models
docker exec vpn-ollama-dev ollama pull mistral
docker exec vpn-ollama-dev ollama pull codellama
docker exec vpn-ollama-dev ollama pull phi3
```

### Test Ollama

```bash
# Generate a response
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2:1b",
  "prompt": "Why is the sky blue?",
  "stream": false
}'

# Chat with a model
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.2:1b",
  "messages": [
    { "role": "user", "content": "Hello! Can you help me?" }
  ],
  "stream": false
}'
```

## 📚 Available Models

### Recommended Models for Different Use Cases

| Model | Size | Use Case | Pull Command |
|-------|------|----------|--------------|
| **llama3.2:1b** | 1.5GB | Quick responses, low resource | `ollama pull llama3.2:1b` |
| **llama3.2:3b** | 4.7GB | Balanced performance | `ollama pull llama3.2:3b` |
| **llama3.2** | 8GB | High quality responses | `ollama pull llama3.2` |
| **codellama** | 4GB | Code generation & analysis | `ollama pull codellama` |
| **mistral** | 4GB | General purpose, fast | `ollama pull mistral` |
| **phi3** | 2.3GB | Microsoft's efficient model | `ollama pull phi3` |
| **gemma2** | 5GB | Google's latest model | `ollama pull gemma2` |

View all available models: https://ollama.com/library

## 💻 Using Ollama in Your Application

### JavaScript/TypeScript Example

```typescript
// Using fetch API
async function chatWithOllama(message: string) {
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:1b',
      messages: [{ role: 'user', content: message }],
      stream: false
    })
  });
  
  const data = await response.json();
  return data.message.content;
}

// Usage
const answer = await chatWithOllama('What is VPN?');
console.log(answer);
```

### Python Example

```python
import requests

def chat_with_ollama(message):
    response = requests.post('http://localhost:11434/api/chat', json={
        'model': 'llama3.2:1b',
        'messages': [{'role': 'user', 'content': message}],
        'stream': False
    })
    return response.json()['message']['content']

# Usage
answer = chat_with_ollama('What is VPN?')
print(answer)
```

### Streaming Responses

```typescript
// Stream responses for real-time output
async function streamChat(message: string) {
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:1b',
      messages: [{ role: 'user', content: message }],
      stream: true  // Enable streaming
    })
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const data = JSON.parse(line);
      process.stdout.write(data.message.content);
    }
  }
}
```

## 🔧 API Endpoints

### Generate Text
```bash
POST http://localhost:11434/api/generate
```

### Chat (Conversation)
```bash
POST http://localhost:11434/api/chat
```

### List Models
```bash
GET http://localhost:11434/api/tags
```

### Show Model Info
```bash
POST http://localhost:11434/api/show
```

### Pull Model
```bash
POST http://localhost:11434/api/pull
```

### Delete Model
```bash
DELETE http://localhost:11434/api/delete
```

## 🎨 Integration Use Cases

### 1. AI-Powered VPN Troubleshooting

```typescript
async function diagnoseVpnIssue(errorLog: string) {
  return await chatWithOllama(`
    You are a VPN troubleshooting expert. Analyze this error log and provide:
    1. Root cause
    2. Step-by-step fix
    3. Prevention tips
    
    Error log:
    ${errorLog}
  `);
}
```

### 2. Automated Documentation

```typescript
async function generateApiDocs(code: string) {
  return await chatWithOllama(`
    Generate API documentation for this code:
    ${code}
    
    Include: endpoint, parameters, response format, example usage.
  `);
}
```

### 3. Code Review Assistant

```typescript
async function reviewCode(code: string) {
  return await chatWithOllama(`
    Review this code for:
    - Security vulnerabilities
    - Performance issues
    - Best practices
    
    Code:
    ${code}
  `);
}
```

### 4. Natural Language to SQL

```typescript
async function generateSql(query: string) {
  return await chatWithOllama(`
    Convert this natural language query to SQL for PostgreSQL:
    "${query}"
    
    Database schema: users, vpn_connections, billing
  `);
}
```

### 5. Customer Support Chatbot

```typescript
async function customerSupport(question: string, context: string) {
  return await chatWithOllama(`
    You are a VPN customer support agent. Answer this question:
    "${question}"
    
    Context: ${context}
    
    Be helpful, professional, and concise.
  `);
}
```

## 🔐 Security Best Practices

### Production Deployment

1. **Use nginx reverse proxy** (already configured in `ollama.conf`)
2. **Add authentication** using nginx auth_basic or JWT
3. **Rate limiting** to prevent abuse
4. **Network isolation** - only allow internal services access
5. **Model access control** - restrict which models can be used

### Secure nginx Configuration

```nginx
# Add to ollama.conf for basic auth
location / {
    auth_basic "Ollama Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://ollama_backend;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=ollama_limit:10m rate=10r/s;
location /api/ {
    limit_req zone=ollama_limit burst=20;
    proxy_pass http://ollama_backend;
}
```

## ⚙️ Configuration

### Environment Variables

Edit [`.env`](.env) file:

```bash
# Ollama Configuration
OLLAMA_ALLOWED_ORIGINS=*  # Change to specific domains in production
OLLAMA_NUM_PARALLEL=2     # Number of parallel requests
OLLAMA_MAX_LOADED_MODELS=2  # Max models in memory
```

### GPU Support (Production)

The production docker-compose.yml includes GPU support. Requirements:
- NVIDIA GPU
- nvidia-docker installed
- NVIDIA Container Toolkit

```bash
# Check if GPU is available
docker exec vpn-ollama nvidia-smi

# GPU will significantly speed up inference
```

### Resource Limits

**Development** (CPU-only):
- No specific limits - uses available resources

**Production** (with GPU):
- CPU: 4 cores (2 cores minimum)
- Memory: 8GB (4GB minimum)
- GPU: 1 NVIDIA GPU

## 📊 Monitoring

### Check Available Models

```bash
# List downloaded models
docker exec vpn-ollama-dev ollama list
```

### View Resource Usage

```bash
# Container stats
docker stats vpn-ollama-dev

# Disk usage (models storage)
docker exec vpn-ollama-dev du -sh /root/.ollama
```

### Health Check

```bash
# Check if Ollama is running
curl http://localhost:11434/

# Expected response: "Ollama is running"
```

## 🐛 Troubleshooting

### Model Download Fails

```bash
# Check disk space
df -h

# Check container logs
docker logs vpn-ollama-dev

# Retry pull with verbose output
docker exec vpn-ollama-dev ollama pull llama3.2:1b --verbose
```

### Out of Memory

```bash
# Pull a smaller model
docker exec vpn-ollama-dev ollama pull llama3.2:1b

# Or increase Docker memory limit in Docker Desktop settings
```

### Slow Inference

1. **Use GPU** in production (automatic with nvidia-docker)
2. **Use smaller models** for faster responses
3. **Enable model caching** - keeps models in memory
4. **Increase parallel requests** - set `OLLAMA_NUM_PARALLEL`

### Connection Refused

```bash
# Check if container is running
docker ps | grep ollama

# Restart container
docker restart vpn-ollama-dev

# Check port binding
docker port vpn-ollama-dev
```

## 🚀 Production Deployment

### 1. Start Production Stack

```bash
# Stop dev services
./scripts/stop-dev.sh

# Start production with GPU support
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

### 2. Pull Production Models

```bash
# Pull optimized models
docker exec vpn-ollama ollama pull llama3.2
docker exec vpn-ollama ollama pull codellama
```

### 3. Configure Domain

Update `ollama.domain.com` in [`nginx/conf.d/ollama.conf`](infrastructure/docker/nginx/conf.d/ollama.conf)

### 4. Enable SSL

```bash
# Use Let's Encrypt
certbot --nginx -d ollama.domain.com
```

## 📖 Additional Resources

- **Ollama Documentation**: https://ollama.com/docs
- **Model Library**: https://ollama.com/library
- **API Reference**: https://github.com/ollama/ollama/blob/main/docs/api.md
- **Model Fine-tuning**: https://ollama.com/docs/modelfile

## 🤝 Integration with N8N

Combine Ollama with N8N for powerful automation:

```javascript
// N8N HTTP Request node
const response = await $http.post('http://ollama:11434/api/chat', {
  model: 'llama3.2:1b',
  messages: [
    { role: 'user', content: $('Webhook').item.json.userMessage }
  ]
});

return response.message.content;
```

## 📝 Examples Repository

Find more examples in [`/examples/ollama/`](/examples/ollama/):
- Chat interface
- Code generation tool
- Document Q&A
- SQL query generator
- Customer support bot

---

**Need help?** Open an issue or check the [main README](../README.md) for more information.
