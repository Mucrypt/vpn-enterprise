# Quick Deploy Commands - Run on Hetzner Server

# Copy-paste these commands one by one while SSH'd into 157.180.123.240

## 1. Navigate to project root

cd /opt/vpn-enterprise

## 2. Pull latest code

git fetch origin
git pull origin main

## 3. Verify new files exist

ls -lh flask/app_nexusai_production.py
ls -lh n8n-workflows/\*.json

## 4. Make deployment script executable

chmod +x scripts/deploy-nexusai-production.sh

## 5. Run the deployment script

./scripts/deploy-nexusai-production.sh

## OR run manual deployment (if script fails):

### Step 1: Navigate to Docker directory

cd /opt/vpn-enterprise/infrastructure/docker

### Step 2: Stop old Python API

docker compose -f docker-compose.prod.yml stop python-api
docker compose -f docker-compose.prod.yml rm -f python-api

### Step 3: Rebuild Python API with new code

docker compose -f docker-compose.prod.yml build --no-cache python-api

### Step 4: Start Python API

docker compose -f docker-compose.prod.yml up -d python-api

### Step 5: Check logs

docker logs -f vpn-python-api

### Step 6: Test health endpoint

curl http://localhost:5001/health

### Step 7: Start N8N (if not running)

docker compose -f docker-compose.monitoring.yml up -d n8n

### Step 8: Check all services

docker ps | grep -E "python-api|n8n|postgres|redis"

## Test API Generation

curl -X POST http://localhost:5001/ai/generate/app \
 -H "Content-Type: application/json" \
 -d '{
"description": "Create a simple todo list app with React and Tailwind CSS",
"framework": "react",
"styling": "tailwind",
"features": ["authentication", "crud-operations"],
"requires_database": true
}'

## View Logs

docker logs vpn-python-api --tail 100 -f

## Restart if needed

docker compose -f docker-compose.prod.yml restart python-api

## Access N8N UI

# Open in browser: http://157.180.123.240:5678

# Then import the 4 JSON files from: /opt/vpn-enterprise/n8n-workflows/
