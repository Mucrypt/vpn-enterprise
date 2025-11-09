# Prometheus — VPN Enterprise

This directory contains the Prometheus configuration used by the Docker compose stack. Prometheus scrapes application metrics and stores them on disk (configured in the compose file).

Key file

- `prometheus.yml` — scrape configuration and job definitions. Adjust the targets to match your deployment hostnames/ports if you change the compose networking.

Common changes

- Adding a new scrape target:

1. Edit `prometheus.yml` and add a job under `scrape_configs` with the target host:port.
2. Reload Prometheus (restart container or use the API if configured):

```bash
docker compose -f infrastructure/docker/docker-compose.yml restart prometheus
```

Useful endpoints (when running via compose)

- Prometheus UI: `http://localhost:9090` (or the host/port you published)
- Health check: `http://localhost:9090/-/healthy`

Notes

- For production-scale deployments, configure persistent storage and retention rules for TSDB and consider remote write to long-term storage.

End of Prometheus README
