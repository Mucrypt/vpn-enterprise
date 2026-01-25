# VPN Enterprise — Hetzner Self‑Hosting Guide (Hostinger Domain)

This guide deploys the full production stack on a single Hetzner server using Docker Compose, with Nginx (in Docker) as the reverse proxy + TLS termination.

## What this deploys

- Web dashboard (Next.js)
- API (Express/TypeScript)
- Postgres + Redis
- n8n
- Python API (from `flask/`)
- Ollama
- NexusAI (optional but included)

## 0) Choose your subdomains

Recommended DNS names (change if you want):

- `example.com` → Web dashboard
- `api.example.com` → API
- `n8n.example.com` → n8n
- `python-api.example.com` → Python API
- `ollama.example.com` → Ollama
- `nexusai.example.com` → NexusAI

## 1) Create the Hetzner server

- OS: Ubuntu 22.04/24.04
- Recommended minimum for everything: 4 vCPU, 8–16GB RAM (Ollama benefits from more)

## 2) Point your Hostinger domain to Hetzner

In Hostinger DNS, create **A records** to your Hetzner server IP:

- `@` → `YOUR_SERVER_IP`
- `api` → `YOUR_SERVER_IP`
- `n8n` → `YOUR_SERVER_IP`
- `python-api` → `YOUR_SERVER_IP`
- `ollama` → `YOUR_SERVER_IP`
- `nexusai` → `YOUR_SERVER_IP` (only if you enable the optional NexusAI profile)

Wait for DNS to propagate (can be 5–60 minutes).

## 3) First login + security baseline

SSH in as root (first time):

```bash
ssh root@YOUR_SERVER_IP
```

Update packages:

```bash
apt update && apt upgrade -y
```

Create a deploy user and lock down SSH:

```bash
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

sed -i 's/^#\?PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh
```

Firewall:

```bash
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
```

Reconnect as deploy:

```bash
exit
ssh deploy@YOUR_SERVER_IP
```

## 4) Install Docker + Compose

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg git

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

## 5) Clone the repo

```bash
git clone https://github.com/Mucrypt/vpn-enterprise.git
cd vpn-enterprise
```

## 6) Create production env + secrets

Create `.env.production` from the example:

```bash
cp .env.production.example .env.production
nano .env.production

Notes:

- For Hetzner self-hosting, you can usually leave `NEXT_PUBLIC_API_URL` unset: the dashboard defaults to same-origin and Nginx routes `/api/*` to the API container.
- Set n8n basic auth creds:
  - `N8N_BASIC_AUTH_USER`
  - `N8N_BASIC_AUTH_PASSWORD`
```

Create secrets files (used by Docker Compose):

```bash
cd infrastructure/docker

# Copy example secrets (then replace values)
cp -n secrets/db_password.example secrets/db_password
cp -n secrets/redis_password.example secrets/redis_password
cp -n secrets/n8n_encryption_key.example secrets/n8n_encryption_key
cp -n secrets/api_key.example secrets/api_key

# IMPORTANT: edit them and put strong values
nano secrets/db_password
nano secrets/redis_password
nano secrets/n8n_encryption_key
nano secrets/api_key

# Lock down permissions
chmod 600 secrets/*
```

## 7) TLS certificates (Let’s Encrypt)

Install certbot on the host:

```bash
sudo apt install -y certbot
```

Stop anything using port 80 (first time there’s nothing, later stop nginx container):

```bash
cd ~/vpn-enterprise/infrastructure/docker
docker compose -f docker-compose.prod.yml down || true
```

Issue certificates (replace `example.com` with your real domain):

```bash
sudo certbot certonly --standalone \
  -d example.com \
  -d api.example.com \
  -d n8n.example.com \
  -d python-api.example.com \
  -d ollama.example.com
```

If you enable NexusAI, also include `-d nexusai.example.com`.

Copy certs into the repo-mounted Nginx SSL folder:

```bash
sudo cp /etc/letsencrypt/live/example.com/fullchain.pem infrastructure/docker/nginx/ssl/fullchain.pem
sudo cp /etc/letsencrypt/live/example.com/privkey.pem infrastructure/docker/nginx/ssl/privkey.pem
sudo chown -R $USER:$USER infrastructure/docker/nginx/ssl
chmod 600 infrastructure/docker/nginx/ssl/privkey.pem
```

Add auto-renew (runs daily; reloads nginx container after renew):

```bash
(crontab -l 2>/dev/null; echo "15 3 * * * certbot renew --quiet && docker restart vpn-nginx") | crontab -
```

## 8) Start production stack

````bash
cd ~/vpn-enterprise/infrastructure/docker

docker compose -f docker-compose.prod.yml up -d --build

If the web build is killed during `--build` (usually low RAM), add swap or use a bigger server.
Example 8GB swap (one-time):

```bash
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
free -h
```

Optional services:

- NexusAI is behind a Compose profile to avoid submodule-related clone issues. Enable it with:
  ```bash
  docker compose -f docker-compose.prod.yml --profile nexusai up -d --build
````

````

## 9) Verify everything

- Web: `https://example.com`
- API health: `https://api.example.com/health`
- n8n: `https://n8n.example.com`
- Python API: `https://python-api.example.com/health`
- Ollama: `https://ollama.example.com/api/version`
- NexusAI: `https://nexusai.example.com`

Check logs:

```bash
docker ps
docker logs -f vpn-nginx
docker logs -f vpn-api
````

## 10) Common problems

### “nginx: [emerg] cannot load certificate”

- The files must exist:
  - `infrastructure/docker/nginx/ssl/fullchain.pem`
  - `infrastructure/docker/nginx/ssl/privkey.pem`

### “502 bad gateway”

- Check backend containers are healthy:
  ```bash
  docker ps
  docker logs --tail=200 vpn-api
  docker logs --tail=200 vpn-web
  ```

### DNS not working

- Confirm records at Hostinger and wait propagation:
  ```bash
  dig +short example.com
  dig +short api.example.com
  ```
