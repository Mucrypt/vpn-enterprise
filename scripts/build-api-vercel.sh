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

# Copy workspace packages into a local node_modules namespace
cd packages/api
echo "📦 Bundling workspace packages into dist/vendor..."

# Ensure old dist/node_modules from previous strategy is removed to avoid
# accidental module resolution to stale packages
rm -rf dist/node_modules || true

# Helper to materialize a minimal package with compiled JS + package.json
bundle_pkg() {
	local src_pkg_dir="$1"      # e.g., ../vpn-core
	local name="$2"             # e.g., @vpn-enterprise/vpn-core
	local target_dir="dist/vendor/${name}"

	echo "  • Bundling ${name} -> ${target_dir}"
	mkdir -p "$target_dir"
	# Copy compiled JS to target root
	if [ -d "$src_pkg_dir/dist" ]; then
		cp -r "$src_pkg_dir/dist/." "$target_dir/" || true
	fi
	# Write a minimal package.json so Node & npm (file:) can resolve
	cat > "$target_dir/package.json" <<EOF
{
	"name": "${name}",
	"version": "1.0.0",
	"main": "index.js",
	"type": "commonjs"
}
EOF
}

# Create vendor/@vpn-enterprise structure inside dist and bundle packages
bundle_pkg ../database @vpn-enterprise/database
bundle_pkg ../auth @vpn-enterprise/auth
bundle_pkg ../vpn-core @vpn-enterprise/vpn-core

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
