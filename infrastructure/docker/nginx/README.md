# Nginx (reverse proxy) — VPN Enterprise

This directory contains the nginx configuration used by the `infrastructure/docker` compose stacks. It provides host-based routing and TLS termination for the API, web dashboard, and other services in the stack.

Key files

- `nginx.conf` — main global configuration (includes `conf.d/*.conf`).
- `conf.d/default.conf` — default site config used for production. It routes `/api` requests to the API upstream and other paths to the web dashboard.
- `conf.d/dev.conf` — development convenience config (localhost-based routing, no TLS).
- `ssl/` — place TLS certificates here for on-prem deployments (certificate files are intentionally not committed).

Common operations

- Reload nginx after changing certs or configs (running in compose):

```bash
docker compose -f infrastructure/docker/docker-compose.yml exec nginx nginx -s reload
```

- To add a new upstream/service: edit a vhost in `conf.d/` and add a matching `upstream` and `proxy_pass`.

Security & TLS

- For production, use certificates issued by a trusted CA (Let's Encrypt or internal CA). Do not commit cert private keys to the repo.
- Automate certificate renewal with an ACME client and ensure the renewed certs are mounted into the `nginx` container.

Notes for developers

- The dev compose file does not include the nginx service by default (the dev compose targets API and web directly). Use the production compose to test full reverse-proxy behaviour.

Example nginx snippet (proxying `/api` to an upstream):

```nginx
location /api/ {
  proxy_pass http://api:3000/;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

End of nginx README
