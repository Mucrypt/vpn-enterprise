# Convenience Makefile for common developer flows

.PHONY: build deploy deploy-skip-api auto-deploy push

# Build all workspace packages (fast local build used by deploy scripts)
build:
	npm run build --workspace=@vpn-enterprise/database || true
	npm run build --workspace=@vpn-enterprise/auth || true
	npm run build --workspace=@vpn-enterprise/vpn-core || true
	npm run build --workspace=@vpn-enterprise/api || true

# Deploy projects via the deploy helper (includes API build by default)
deploy:
	./scripts/deploy-vercel.sh

# Deploy but skip rebuilding the API (faster when UI-only changes)
deploy-skip-api:
	./scripts/deploy-vercel.sh --skip-api-build

# Auto-deploy: prompts for commit message if omitted, then deploys
auto-deploy:
	./scripts/auto-deploy.sh

# Push only (git helper will prompt if no message supplied)
push:
	./scripts/git/push.sh
