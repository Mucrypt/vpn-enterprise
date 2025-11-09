#!/usr/bin/env bash
# Enhanced health-check + diagnostics for dev stack
# Usage: ./infrastructure/verify-stack.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# If nginx is present and running, the publicly reachable endpoints are behind nginx
if docker ps --format '{{.Names}}' | grep -q '^vpn-nginx$'; then
  API_URL="http://localhost/api/health"
  WEB_URL="http://localhost/"
else
  API_URL="http://localhost:3000/health"
  WEB_URL="http://localhost:3001"
fi

echo "Checking API health (${API_URL}) ..."
TMP_API_BODY=$(mktemp /tmp/verify_api_body.XXXXXX || echo /tmp/verify_api_body)
if curl -fsS --max-time 5 "${API_URL}" -o "${TMP_API_BODY}"; then
  echo "API health: OK"
else
  echo "API health: FAILED" >&2
  echo "----- CURL VERBOSE OUTPUT (API) -----"
  curl -v --max-time 10 "${API_URL}" || true
  echo "----- RESPONSE BODY (if any) -----"
  sed -n '1,200p' "${TMP_API_BODY}" || true
  echo
  echo "----- Docker containers and ports (docker ps) -----"
  docker ps --format 'table {{.Names}}	{{.Image}}	{{.Status}}	{{.Ports}}' || true
  echo
  echo "----- Compose service status (if docker compose is available) -----"
  docker compose -f "${ROOT_DIR}/infrastructure/docker/docker-compose.dev.yml" ps || true
  exit 2
fi

echo "Checking Web dashboard (${WEB_URL}) ..."
if curl -fsS --max-time 5 "${WEB_URL}" -o /tmp/verify_web_body.txt; then
  echo "Web dashboard: OK"
else
  echo "Web dashboard: FAILED" >&2
  echo "----- CURL VERBOSE OUTPUT (WEB) -----"
  curl -v --max-time 10 "${WEB_URL}" || true
  echo "----- RESPONSE BODY (if any) -----"
  TMP_WEB_BODY=$(mktemp /tmp/verify_web_body.XXXXXX || echo /tmp/verify_web_body)
  sed -n '1,200p' "${TMP_WEB_BODY}" || true
  echo
  echo "----- Docker containers and ports (docker ps) -----"
  docker ps --format 'table {{.Names}}	{{.Image}}	{{.Status}}	{{.Ports}}' || true
  echo
  echo "----- Compose service status (if docker compose is available) -----"
  docker compose -f "${ROOT_DIR}/infrastructure/docker/docker-compose.dev.yml" ps || true
  exit 3
fi

echo "All checks passed."
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
  if ! check_with_retries "Prometheus" "$PROMETHEUS_HEALTH_URL"; then
    # Try checking inside a running prometheus container as a fallback
    if command -v docker >/dev/null 2>&1; then
      PROM_CONT=$(docker ps --format '{{.Names}} {{.Image}}' | grep -i prometheus | awk '{print $1}' | head -n1 || true)
      if [ -n "$PROM_CONT" ]; then
        echo "Host check failed; trying inside container: $PROM_CONT"
        # Try curl, then wget fallback inside container
        if docker exec "$PROM_CONT" sh -c "curl -fsS -m 5 $PROMETHEUS_HEALTH_URL >/dev/null 2>&1 || (wget -q -T5 -O- $PROMETHEUS_HEALTH_URL >/dev/null 2>&1)" >/dev/null 2>&1; then
          echo "[PASS] Prometheus (in container) -> $PROMETHEUS_HEALTH_URL"
        else
          echo "[FAIL] Prometheus (in container) -> $PROMETHEUS_HEALTH_URL"
          rc=1
        fi
      else
        rc=1
      fi
    else
      rc=1
    fi
  fi
else
  echo "Skipping Prometheus check"
fi

if [ "$SKIP_GRAFANA" != "true" ]; then
  echo "Checking Grafana... ($GRAFANA_HEALTH_URL)"
  if ! check_with_retries "Grafana" "$GRAFANA_HEALTH_URL"; then
    # Try checking inside a running grafana container as a fallback
    if command -v docker >/dev/null 2>&1; then
      # Prefer grafana container but avoid matching promtail (image name contains 'grafana')
      GRAF_CONT=$(docker ps --format '{{.Names}} {{.Image}}' | grep -i grafana | grep -vi promtail | awk '{print $1}' | head -n1 || true)
      if [ -n "$GRAF_CONT" ]; then
        echo "Host check failed; trying inside container: $GRAF_CONT"
        if docker exec "$GRAF_CONT" sh -c "curl -fsS -m 5 $GRAFANA_HEALTH_URL >/dev/null 2>&1 || (wget -q -T5 -O- $GRAFANA_HEALTH_URL >/dev/null 2>&1)" >/dev/null 2>&1; then
          echo "[PASS] Grafana (in container) -> $GRAFANA_HEALTH_URL"
        else
          echo "[FAIL] Grafana (in container) -> $GRAFANA_HEALTH_URL"
          rc=1
        fi
      else
        rc=1
      fi
    else
      rc=1
    fi
  fi
else
  echo "Skipping Grafana check"
fi

if [ $rc -eq 0 ]; then
  echo "All checks passed"
else
  echo "One or more checks failed"
fi

exit $rc
