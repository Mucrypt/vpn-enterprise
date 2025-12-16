# Grafana — VPN Enterprise

This directory contains provisioning for Grafana (datasources and dashboards) used by the compose stack. Grafana is provisioned from files under `provisioning/` so dashboards and datasources are available after container start.

Key files & folders

- `dashboards/` — JSON/YAML dashboards to provision.
- `datasources/` — datasource definitions used by Grafana (e.g., Prometheus).

Admin credentials

- The compose file sets Grafana admin credentials via environment variables:
  - `GRAFANA_ADMIN_USER`
  - `GRAFANA_ADMIN_PASSWORD`

Useful endpoints

- Grafana UI: `http://localhost:3000` (or the host/port you published)
- Health check endpoint used by compose: `http://localhost:3000/api/health`

Notes

- If you need to add a new dashboard, place it under `dashboards/` and update provisioning configuration.
- Back up `grafana-data` volume (dashboards and user data) regularly in production.

End of Grafana README
