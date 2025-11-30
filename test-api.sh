#!/bin/bash

# Simple test for the updated API
echo "Testing VPN Enterprise API with Database Platform..."

# Start the API in the background
cd /home/mukulah/vpn-enterprise/packages/api
echo "Starting API server..."
npm run dev &
API_PID=$!

# Wait for API to start
sleep 5

# Test health endpoint
echo "Testing health endpoint..."
curl -s http://localhost:3001/health | jq '.' || echo "Health endpoint test failed"

# Test unified data API health
echo "Testing GraphQL endpoint..."
curl -s -X POST http://localhost:3001/graphql -H "Content-Type: application/json" -d '{"query":"{ _health }"}' | jq '.' || echo "GraphQL test failed"

# Test tenant associations endpoint (will fail without auth, but should return proper error)
echo "Testing tenant associations..."
curl -s http://localhost:3001/api/v1/tenants/me/associations | jq '.' || echo "Tenant associations test - expected to fail without auth"

# Clean up
echo "Stopping API server..."
kill $API_PID 2>/dev/null || true

echo "API tests completed."