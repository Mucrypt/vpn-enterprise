#!/bin/bash
# Build API bundle for Vercel deployment

set -e

echo "🔧 Building API for Vercel..."

# Navigate to project root
cd /home/mukulah/vpn-enterprise

# Build all workspace dependencies
echo "📦 Building workspace packages..."
npm run build --workspace=@vpn-enterprise/database
npm run build --workspace=@vpn-enterprise/auth
npm run build --workspace=@vpn-enterprise/vpn-core

# Build API
echo "🏗️  Building API..."
npm run build --workspace=@vpn-enterprise/api

# Copy dependencies into API dist
cd packages/api
echo "📋 Bundling workspace dependencies..."

# Create lib directory for workspace packages to avoid overwriting API files
mkdir -p dist/lib
cp -r ../database/dist/* dist/lib/
cp -r ../auth/dist/* dist/lib/
cp -r ../vpn-core/dist/* dist/lib/

# Save original package.json
echo "💾 Backing up package.json..."
cp package.json package.json.backup

# Use Vercel-friendly package.json
echo "📝 Using Vercel package.json..."
cp package.vercel.json package.json

echo "✅ API ready for Vercel deployment!"
echo "🚀 Run: cd packages/api && vercel --prod"
echo "⚠️  Don't forget to restore: mv package.json.backup package.json"
