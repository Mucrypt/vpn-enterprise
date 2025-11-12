#!/bin/bash
# Build API bundle for Vercel deployment

set -e

echo "🔧 Building API for Vercel..."


# Ensure we are at the repo root (works in CI and locally)
cd "$(git rev-parse --show-toplevel)"

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
cp -r ../database/dist/* dist/lib/ || true
cp -r ../auth/dist/* dist/lib/ || true
cp -r ../vpn-core/dist/* dist/lib/ || true

# Save original package.json (if not already backed up)
if [ ! -f package.json.backup ]; then
	echo "💾 Backing up package.json..."
	cp package.json package.json.backup
fi

# Use Vercel-friendly package.json
echo "📝 Using Vercel package.json for deploy..."
cp package.vercel.json package.json

# create a marker so deploy wrapper can restore later
touch .vercel-swap

echo "✅ API prepared for Vercel deployment. The deploy wrapper will restore package.json after deploy."
echo "🚀 Next: run the Vercel CLI from packages/api or use scripts/deploy-vercel.sh to deploy both projects."
