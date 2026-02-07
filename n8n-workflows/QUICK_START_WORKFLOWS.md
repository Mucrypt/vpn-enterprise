# 🚀 Quick Start: 3 Essential N8N Workflows for NexusAI

## Workflow 1: App Generated → Slack Notification (5 min setup)

### Import this JSON into n8n:

```json
{
  "name": "NexusAI: App Generated Alert",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "nexusai-app-generated",
        "responseMode": "lastNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "webhookId": "nexusai-app-generated"
    },
    {
      "parameters": {
        "channel": "#nexusai-apps",
        "text": "=🎉 *New App Generated!*\n\n*User:* {{$json.user_email}}\n*App:* {{$json.app_name}}\n*Framework:* {{$json.framework}}\n*Files:* {{$json.files.length}}\n*Credits:* {{$json.credits_used}}\n\n🔗 <https://chatbuilds.com/nexusai/apps/{{$json.app_id}}|View App>",
        "attachments": []
      },
      "name": "Slack",
      "type": "n8n-nodes-base.slack",
      "position": [450, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{"node": "Slack", "type": "main", "index": 0}]]
    }
  }
}
```

### Setup Steps:
1. Open n8n: http://localhost:5678
2. Click "+ New Workflow"
3. Name it "NexusAI: App Generated Alert"
4. Click "..." → "Import from File"
5. Paste the JSON above
6. Configure Slack credentials:
   - Click Slack node → "Create New" credential
   - Add Slack Bot Token (get from https://api.slack.com/)
7. Save and Activate workflow
8. Copy webhook URL (looks like: `https://chatbuilds.com/webhook/nexusai-app-generated`)

### Add to NexusAI Python API:

```python
# flask/app.py
import requests
from threading import Thread

N8N_WEBHOOK = "https://chatbuilds.com/webhook/nexusai-app-generated"

def notify_n8n(payload):
    """Fire-and-forget notification to n8n"""
    try:
        requests.post(N8N_WEBHOOK, json=payload, timeout=3)
    except:
        pass  # Don't block if n8n is down

@app.route('/api/ai/generate/app', methods=['POST'])
async def generate_app():
    # ... existing generation logic ...
    
    # After successful generation
    n8n_data = {
        'app_id': app_id,
        'user_email': user.email,
        'app_name': result['app_name'],
        'framework': framework,
        'files': result['files'],
        'credits_used': 10,
        'created_at': datetime.utcnow().isoformat()
    }
    
    # Send to n8n in background
    Thread(target=notify_n8n, args=(n8n_data,)).start()
    
    return jsonify(result)
```

**Test it:**
```bash
curl -X POST https://chatbuilds.com/api/ai/generate/app \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_KEY" \
  -d '{"description": "Todo app", "framework": "react"}'

# Check Slack channel #nexusai-apps for notification ✅
```

---

## Workflow 2: Auto-Deploy Generated Apps (15 min setup)

### N8N Workflow Structure:

```
Webhook → Save Files → Run Tests → Build Docker → Deploy → Notify
```

### Import this JSON:

```json
{
  "name": "NexusAI: Auto-Deploy App",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "nexusai-deploy",
        "responseMode": "lastNode"
      },
      "name": "Webhook: Deploy Request",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "webhookId": "nexusai-deploy"
    },
    {
      "parameters": {
        "mode": "runOnceForAllItems",
        "jsCode": "// Save app files to disk\nconst fs = require('fs');\nconst path = require('path');\n\nconst app = $input.all()[0].json;\nconst appPath = `/tmp/nexusai-${app.app_id}`;\n\n// Create directory\nfs.mkdirSync(appPath, { recursive: true });\n\n// Write all files\napp.files.forEach(file => {\n  const filePath = path.join(appPath, file.path);\n  const dir = path.dirname(filePath);\n  \n  if (!fs.existsSync(dir)) {\n    fs.mkdirSync(dir, { recursive: true });\n  }\n  \n  fs.writeFileSync(filePath, file.content);\n});\n\n// Create package.json\nconst pkg = {\n  name: app.app_name,\n  version: '1.0.0',\n  scripts: {\n    dev: 'vite',\n    build: 'vite build',\n    test: 'vitest run',\n    start: 'vite preview'\n  },\n  dependencies: app.dependencies || {}\n};\n\nfs.writeFileSync(`${appPath}/package.json`, JSON.stringify(pkg, null, 2));\n\n// Create Dockerfile\nconst dockerfile = `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install --production\nCOPY . .\nRUN npm run build\nEXPOSE 3000\nCMD [\"npm\", \"start\"]`;\n\nfs.writeFileSync(`${appPath}/Dockerfile`, dockerfile);\n\nreturn { json: { app_id: app.app_id, path: appPath, status: 'files_saved' } };"
      },
      "name": "Save Files to Disk",
      "type": "n8n-nodes-base.code",
      "position": [450, 300]
    },
    {
      "parameters": {
        "command": "=cd {{$json.path}} && npm install && npm run test",
        "options": {}
      },
      "name": "Run Tests",
      "type": "n8n-nodes-base.executeCommand",
      "position": [650, 300]
    },
    {
      "parameters": {
        "command": "=cd {{$json.path}} && docker build -t nexusai/{{$json.app_id}} . && docker run -d -p 0:3000 --name nexusai-{{$json.app_id}} nexusai/{{$json.app_id}}",
        "options": {}
      },
      "name": "Build & Run Docker",
      "type": "n8n-nodes-base.executeCommand",
      "position": [850, 300]
    },
    {
      "parameters": {
        "command": "=docker port nexusai-{{$json.app_id}} 3000",
        "options": {}
      },
      "name": "Get Container Port",
      "type": "n8n-nodes-base.executeCommand",
      "position": [1050, 300]
    },
    {
      "parameters": {
        "mode": "runOnceForAllItems",
        "jsCode": "// Extract port from docker output\nconst output = $input.all()[0].json.stdout;\nconst port = output.match(/:(\\d+)/)[1];\n\nconst appId = $('Save Files to Disk').all()[0].json.app_id;\nconst appUrl = `https://chatbuilds.com/apps/${appId}`;\n\n// Register with nginx (you'd do this via API in production)\nconst nginxConfig = `\nlocation /apps/${appId} {\n  proxy_pass http://localhost:${port};\n  proxy_set_header Host $host;\n  proxy_set_header X-Real-IP $remote_addr;\n}\n`;\n\nreturn { \n  json: { \n    app_id: appId,\n    port: port,\n    app_url: appUrl,\n    status: 'deployed',\n    deployed_at: new Date().toISOString()\n  } \n};"
      },
      "name": "Register with Nginx",
      "type": "n8n-nodes-base.code",
      "position": [1250, 300]
    },
    {
      "parameters": {
        "channel": "#nexusai-apps",
        "text": "=✅ *App Deployed Successfully!*\n\n*App ID:* {{$json.app_id}}\n*URL:* {{$json.app_url}}\n*Port:* {{$json.port}}\n*Deployed:* {{$json.deployed_at}}\n\n🚀 <{{$json.app_url}}|Open App>"
      },
      "name": "Slack: Deployment Success",
      "type": "n8n-nodes-base.slack",
      "position": [1450, 300]
    },
    {
      "parameters": {
        "channel": "#nexusai-errors",
        "text": "=❌ *Deployment Failed*\n\n*App ID:* {{$json.app_id}}\n*Stage:* {{$json.error_stage}}\n*Error:* {{$json.error}}\n\n🔍 Check logs for details"
      },
      "name": "Slack: Deployment Failed",
      "type": "n8n-nodes-base.slack",
      "position": [1450, 500]
    }
  ],
  "connections": {
    "Webhook: Deploy Request": {
      "main": [[{"node": "Save Files to Disk", "type": "main", "index": 0}]]
    },
    "Save Files to Disk": {
      "main": [[{"node": "Run Tests", "type": "main", "index": 0}]]
    },
    "Run Tests": {
      "main": [
        [{"node": "Build & Run Docker", "type": "main", "index": 0}],
        [{"node": "Slack: Deployment Failed", "type": "main", "index": 0}]
      ]
    },
    "Build & Run Docker": {
      "main": [[{"node": "Get Container Port", "type": "main", "index": 0}]]
    },
    "Get Container Port": {
      "main": [[{"node": "Register with Nginx", "type": "main", "index": 0}]]
    },
    "Register with Nginx": {
      "main": [[{"node": "Slack: Deployment Success", "type": "main", "index": 0}]]
    }
  }
}
```

### Important Notes:
- Requires Docker installed on n8n server
- Requires write access to `/tmp`
- Requires nginx configuration API (or manual nginx reload)
- Production version should use Kubernetes/Docker Swarm

**Test it:**
```bash
# Trigger deployment
curl -X POST https://chatbuilds.com/webhook/nexusai-deploy \
  -H "Content-Type: application/json" \
  -d @test-app.json

# Check Docker containers
docker ps | grep nexusai

# Visit app
open https://chatbuilds.com/apps/YOUR_APP_ID
```

---

## Workflow 3: Hourly Usage Analytics → Credit Adjustments (10 min)

### N8N Workflow Structure:

```
Schedule (hourly) → Query Prometheus → Calculate Credits → Update DB → Notify
```

### Import this JSON:

```json
{
  "name": "NexusAI: Hourly Credit Adjustments",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [{"field": "hours", "hoursInterval": 1}]
        }
      },
      "name": "Schedule: Every Hour",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "http://prometheus:9090/api/v1/query",
        "options": {
          "qs": {
            "query": "sum(rate(http_requests_total{job='nexusai-apps'}[1h])) by (app_id)"
          }
        }
      },
      "name": "Query Prometheus Metrics",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300]
    },
    {
      "parameters": {
        "mode": "runOnceForAllItems",
        "jsCode": "// Calculate credits for each app\nconst metrics = $input.all()[0].json.data.result;\n\nconst apps = metrics.map(metric => {\n  const appId = metric.metric.app_id;\n  const requests = parseFloat(metric.value[1]);\n  \n  // Pricing: 1 credit per 1000 requests\n  const creditsUsed = Math.ceil(requests / 1000);\n  \n  return {\n    app_id: appId,\n    requests: Math.round(requests),\n    credits_used: creditsUsed,\n    timestamp: new Date().toISOString()\n  };\n}).filter(app => app.credits_used > 0);\n\nreturn apps.map(app => ({ json: app }));"
      },
      "name": "Calculate Credits",
      "type": "n8n-nodes-base.code",
      "position": [650, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://chatbuilds.com/api/nexusai/apps/{{$json.app_id}}/usage",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {"name": "credits_used", "value": "={{$json.credits_used}}"},
            {"name": "requests", "value": "={{$json.requests}}"},
            {"name": "period", "value": "hourly"}
          ]
        },
        "options": {
          "headers": {
            "X-API-Key": "={{$credentials.nexusaiApi.apiKey}}"
          }
        }
      },
      "name": "Update App Credits",
      "type": "n8n-nodes-base.httpRequest",
      "position": [850, 300]
    },
    {
      "parameters": {
        "mode": "runOnceForAllItems",
        "jsCode": "// Aggregate results\nconst results = $input.all();\n\nconst totalCredits = results.reduce((sum, r) => sum + r.json.credits_used, 0);\nconst totalApps = results.length;\nconst totalRequests = results.reduce((sum, r) => sum + r.json.requests, 0);\n\nreturn {\n  json: {\n    total_apps_charged: totalApps,\n    total_credits_used: totalCredits,\n    total_requests: totalRequests,\n    period: 'hourly',\n    timestamp: new Date().toISOString()\n  }\n};"
      },
      "name": "Aggregate Stats",
      "type": "n8n-nodes-base.code",
      "position": [1050, 300]
    },
    {
      "parameters": {
        "channel": "#nexusai-billing",
        "text": "=💰 *Hourly Credit Usage*\n\n*Apps Charged:* {{$json.total_apps_charged}}\n*Total Credits:* {{$json.total_credits_used}}\n*Total Requests:* {{$json.total_requests}}\n*Period:* {{$json.period}}\n*Time:* {{$json.timestamp}}"
      },
      "name": "Slack: Usage Summary",
      "type": "n8n-nodes-base.slack",
      "position": [1250, 300]
    }
  ],
  "connections": {
    "Schedule: Every Hour": {
      "main": [[{"node": "Query Prometheus Metrics", "type": "main", "index": 0}]]
    },
    "Query Prometheus Metrics": {
      "main": [[{"node": "Calculate Credits", "type": "main", "index": 0}]]
    },
    "Calculate Credits": {
      "main": [[{"node": "Update App Credits", "type": "main", "index": 0}]]
    },
    "Update App Credits": {
      "main": [[{"node": "Aggregate Stats", "type": "main", "index": 0}]]
    },
    "Aggregate Stats": {
      "main": [[{"node": "Slack: Usage Summary", "type": "main", "index": 0}]]
    }
  }
}
```

### Setup Prometheus (if not already running):

```yaml
# infrastructure/docker/docker-compose.monitoring.yml
prometheus:
  image: prom/prometheus:latest
  ports:
    - "9090:9090"
  volumes:
    - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    - prometheus-data:/prometheus
  command:
    - '--config.file=/etc/prometheus/prometheus.yml'
    - '--storage.tsdb.path=/prometheus'
```

### Prometheus Config:

```yaml
# infrastructure/docker/prometheus/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'nexusai-apps'
    static_configs:
      - targets: ['localhost:10000'] # Your app metrics endpoint
    
    # Scrape metrics from all NexusAI apps
    relabel_configs:
      - source_labels: [__address__]
        target_label: app_id
        regex: '.*:(\\d+)'
        replacement: '$1'
```

### Add to API to track usage:

```python
# packages/api/src/middleware/usage-tracker.ts
import { Request, Response, NextFunction } from 'express';
import { client as prometheus } from 'prom-client';

const httpRequestsTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['app_id', 'method', 'path', 'status']
});

export const trackUsage = (req: Request, res: Response, next: NextFunction) => {
  const appId = req.headers['x-app-id'] || 'unknown';
  
  res.on('finish', () => {
    httpRequestsTotal.inc({
      app_id: appId,
      method: req.method,
      path: req.path,
      status: res.statusCode
    });
  });
  
  next();
};

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

---

## 🎯 Monitoring & Troubleshooting

### Check N8N Workflow Status

```bash
# View workflow executions
docker exec -it vpn-n8n n8n list:workflow

# View execution logs
docker logs -f vpn-n8n | grep "Workflow"

# Restart n8n if stuck
docker restart vpn-n8n
```

### Test Workflows Manually

```bash
# Test Webhook
curl -X POST https://chatbuilds.com/webhook/nexusai-app-generated \
  -H "Content-Type: application/json" \
  -d '{
    "app_id": "test-123",
    "user_email": "test@example.com",
    "app_name": "Test App",
    "framework": "react",
    "files": [],
    "credits_used": 10
  }'

# Check Slack for notification
```

### Common Issues & Solutions

**Issue 1: Webhook not responding**
```bash
# Check if n8n is running
docker ps | grep n8n

# Check n8n logs
docker logs vpn-n8n --tail 100

# Restart n8n
docker restart vpn-n8n
```

**Issue 2: Slack notifications not sending**
```bash
# Verify Slack credentials
curl -X POST https://slack.com/api/auth.test \
  -H "Authorization: Bearer YOUR_SLACK_TOKEN"

# Re-add Slack credentials in n8n UI
```

**Issue 3: Docker builds failing**
```bash
# Check Docker daemon
docker info

# Check disk space
df -h

# Clean up old images
docker system prune -a
```

---

## 📊 Performance Optimization

### Enable N8N Queue Mode (for high volume)

```yaml
# infrastructure/docker/docker-compose.yml
n8n:
  environment:
    - EXECUTIONS_MODE=queue
    - QUEUE_BULL_REDIS_HOST=redis
    - QUEUE_BULL_REDIS_PORT=6379
```

### Add Redis for Queue

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis-data:/data
```

### Scale N8N Workers

```bash
# Run multiple n8n workers
docker-compose up -d --scale n8n-worker=3
```

---

## 🚀 Next Steps

1. **Import all 3 workflows into n8n**
2. **Configure credentials** (Slack, API keys)
3. **Test each workflow** with curl commands
4. **Monitor Slack channels** for notifications
5. **Scale up** as usage grows

**Pro Tip**: Start with Workflow 1 (Slack notifications). It's the easiest and gives immediate visual feedback!

---

## 📚 Advanced Workflows (Coming Soon)

- **Auto-Testing Suite**: Playwright E2E tests for every app
- **Security Scanner**: Snyk + OWASP ZAP integration
- **Mobile App Converter**: React → React Native
- **A/B Testing**: Deploy multiple variants automatically
- **Cost Optimizer**: Suggest cheaper tech stacks

**Want these workflows?** Deploy the basics first, then we'll automate everything! 🚀
