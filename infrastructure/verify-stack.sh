#!/usr/bin/env bash
set -euo pipefail

# infrastructure/verify-stack.sh
# Quick health-check script for the local infra stack (API, Web, Nginx, Prometheus, Grafana).
# Exits non-zero if any required check fails.

API_HEALTH_URL=${API_HEALTH_URL:-http://localhost:3000/health}
WEB_URL=${WEB_URL:-http://localhost:3001}
NGINX_HEALTH_URL=${NGINX_HEALTH_URL:-http://localhost/health}
PROMETHEUS_HEALTH_URL=${PROMETHEUS_HEALTH_URL:-http://localhost:9090/-/healthy}
GRAFANA_HEALTH_URL=${GRAFANA_HEALTH_URL:-http://localhost:3000/api/health}

SKIP_PROMETHEUS=${SKIP_PROMETHEUS:-false}
SKIP_GRAFANA=${SKIP_GRAFANA:-false}
SKIP_NGINX=${SKIP_NGINX:-false}

rc=0

echo "Verifying infrastructure endpoints..."

check() {
  local name="$1" url="$2"
  if curl -fsS -m 5 "$url" >/dev/null 2>&1; then
    echo "[PASS] $name -> $url"
  else
    echo "[FAIL] $name -> $url"
    rc=1
  fi
}

echo "Checking API..."
check "API" "$API_HEALTH_URL"

echo "Checking Web dashboard..."
check "Web" "$WEB_URL"

if [ "$SKIP_NGINX" != "true" ]; then
  echo "Checking Nginx (proxy)..."
  check "Nginx" "$NGINX_HEALTH_URL"
else
  echo "Skipping Nginx check"
fi

if [ "$SKIP_PROMETHEUS" != "true" ]; then
  echo "Checking Prometheus..."
  check "Prometheus" "$PROMETHEUS_HEALTH_URL"
else
  echo "Skipping Prometheus check"
fi

if [ "$SKIP_GRAFANA" != "true" ]; then
  echo "Checking Grafana..."
  check "Grafana" "$GRAFANA_HEALTH_URL"
else
  echo "Skipping Grafana check"
fi

if [ $rc -eq 0 ]; then
  echo "All checks passed"
else
  echo "One or more checks failed"
fi

exit $rc
