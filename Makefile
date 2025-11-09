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


# Run infrastructure verification and web smoke E2E tests (if present)
.PHONY: web-verify
web-verify:
	@echo "Running infrastructure verification..."
	./infrastructure/verify-stack.sh
	@echo "If Playwright E2E exists, running smoke tests..."
	@if [ -d "apps/web-dashboard/e2e" ]; then \
		cd apps/web-dashboard/e2e && npm ci && npm run install-browsers && npx playwright test --project=chromium --grep @smoke; \
	else \
		echo "No E2E directory found at apps/web-dashboard/e2e -- skipping Playwright tests."; \
	fi
