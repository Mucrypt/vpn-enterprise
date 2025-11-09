#!/usr/bin/env bash
set -euo pipefail

# infrastructure/verify-stack.sh
# Quick health-check script for the local infra stack (API, Web, Nginx, Prometheus, Grafana).
# Exits non-zero if any required check fails.

API_HEALTH_URL=${API_HEALTH_URL:-http://localhost:3000/health}
# Try the web at host port first (dev compose), then fallback to nginx root (prod compose)
WEB_PRIMARY=${WEB_PRIMARY:-http://localhost:3001}
WEB_FALLBACK=${WEB_FALLBACK:-http://localhost/}

# Nginx health endpoints to try (some configs serve /health on HTTP, others proxy /api/health)
NGINX_HEALTH_CANDIDATES=("http://localhost/health" "http://localhost/api/health" "http://localhost")

PROMETHEUS_HEALTH_URL=${PROMETHEUS_HEALTH_URL:-http://localhost:9090/-/healthy}
GRAFANA_HEALTH_URL=${GRAFANA_HEALTH_URL:-http://localhost:3000/api/health}

SKIP_PROMETHEUS=${SKIP_PROMETHEUS:-false}
SKIP_GRAFANA=${SKIP_GRAFANA:-false}
SKIP_NGINX=${SKIP_NGINX:-false}

rc=0

RETRIES=${RETRIES:-3}
DELAY=${DELAY:-2}

echo "Verifying infrastructure endpoints... (retries=$RETRIES, delay=${DELAY}s)"

check_with_retries() {
  local name="$1" url="$2"
  local i=0
  while [ $i -lt $RETRIES ]; do
    if curl -fsS -m 5 "$url" >/dev/null 2>&1; then
      echo "[PASS] $name -> $url"
      return 0
    fi
    i=$((i+1))
    sleep $DELAY
  done
  echo "[FAIL] $name -> $url"
  return 1
}

echo "Checking API... ($API_HEALTH_URL)"
if ! check_with_retries "API" "$API_HEALTH_URL"; then rc=1; fi

echo "Checking Web dashboard (primary: $WEB_PRIMARY, fallback: $WEB_FALLBACK)"
if check_with_retries "Web" "$WEB_PRIMARY"; then
  true
elif check_with_retries "Web (fallback)" "$WEB_FALLBACK"; then
  true
else
  rc=1
fi

if [ "$SKIP_NGINX" != "true" ]; then
  echo "Checking Nginx (trying ${#NGINX_HEALTH_CANDIDATES[@]} health paths)"
  nginx_ok=false
  for u in "${NGINX_HEALTH_CANDIDATES[@]}"; do
    if check_with_retries "Nginx" "$u"; then
      nginx_ok=true
      break
    fi
  done
  if [ "$nginx_ok" = false ]; then rc=1; fi
else
  echo "Skipping Nginx check"
fi

if [ "$SKIP_PROMETHEUS" != "true" ]; then
  echo "Checking Prometheus... ($PROMETHEUS_HEALTH_URL)"
  if ! check_with_retries "Prometheus" "$PROMETHEUS_HEALTH_URL"; then rc=1; fi
else
  echo "Skipping Prometheus check"
fi

if [ "$SKIP_GRAFANA" != "true" ]; then
  echo "Checking Grafana... ($GRAFANA_HEALTH_URL)"
  if ! check_with_retries "Grafana" "$GRAFANA_HEALTH_URL"; then rc=1; fi
else
  echo "Skipping Grafana check"
fi

if [ $rc -eq 0 ]; then
  echo "All checks passed"
else
  echo "One or more checks failed"
fi

exit $rc
