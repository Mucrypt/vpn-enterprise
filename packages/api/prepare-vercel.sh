#!/bin/bash
# Prepare API for Vercel deployment by bundling workspace dependencies

echo "🔧 Preparing API for Vercel deployment..."

# Build all workspace packages
cd ../..
npm run build --workspace=@vpn-enterprise/database
npm run build --workspace=@vpn-enterprise/auth  
npm run build --workspace=@vpn-enterprise/vpn-core
npm run build --workspace=@vpn-enterprise/api

cd packages/api

# Copy built workspace packages into api directory
mkdir -p lib
cp -r ../database/dist lib/database
cp -r ../auth/dist lib/auth
cp -r ../vpn-core/dist lib/vpn-core

# Copy package.json files
cp ../database/package.json lib/database/
cp ../auth/package.json lib/auth/
cp ../vpn-core/package.json lib/vpn-core/

echo "✅ API prepared for Vercel deployment"
echo "📦 Workspace packages bundled in lib/"
