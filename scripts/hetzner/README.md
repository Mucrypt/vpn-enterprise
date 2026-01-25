# Hetzner automation scripts

These scripts are meant to be run on (or against) a single Hetzner server running the production Docker Compose stack in `infrastructure/docker/docker-compose.prod.yml`.

## Typical flow

- On the Hetzner host (once):
  - `./scripts/setup-secrets.sh`
  - `./scripts/hetzner/setup-env-production.sh`

- Deploy / update (on the Hetzner host):
  - `./scripts/hetzner/deploy-prod.sh --pull --build`

- Quick status / logs:
  - `./scripts/hetzner/status.sh`
  - `./scripts/hetzner/logs.sh nginx` (or `api`, `web`, etc.)

## Notes

- These scripts do **not** create TLS certs. Nginx expects certs at `infrastructure/docker/nginx/ssl/fullchain.pem` and `infrastructure/docker/nginx/ssl/privkey.pem`.
- `.env.production` is expected at repo root and is gitignored.
