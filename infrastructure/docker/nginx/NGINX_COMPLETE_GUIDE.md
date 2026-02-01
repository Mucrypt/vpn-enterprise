# 🌐 Complete Nginx Configuration Guide for VPN Enterprise

**Your Lifetime Reference for Understanding and Maintaining Nginx**

---

## 📚 Table of Contents

1. [Nginx Basics - Start Here](#1-nginx-basics---start-here)
2. [Understanding Your Setup](#2-understanding-your-setup)
3. [Main Configuration Explained](#3-main-configuration-explained)
4. [Routing and Location Blocks](#4-routing-and-location-blocks)
5. [Reverse Proxy Deep Dive](#5-reverse-proxy-deep-dive)
6. [Docker Integration](#6-docker-integration)
7. [Security Configuration](#7-security-configuration)
8. [Performance Optimization](#8-performance-optimization)
9. [Common Patterns in Your Config](#9-common-patterns-in-your-config)
10. [Troubleshooting Guide](#10-troubleshooting-guide)
11. [Quick Reference](#11-quick-reference)

---

## 1. Nginx Basics - Start Here

### What is Nginx?

**Nginx** (pronounced "engine-x") is a web server that can also act as a:

- **Reverse proxy** - Sits in front of your apps and forwards requests
- **Load balancer** - Distributes traffic across multiple servers
- **SSL/TLS terminator** - Handles HTTPS encryption
- **Static file server** - Serves HTML, CSS, JS, images directly

### Why Use Nginx?

In your VPN Enterprise project, nginx:

1. **Routes traffic** - Sends `/api/` to API server, `/nexusai/` to NexusAI app
2. **Handles HTTPS** - Terminates SSL so your apps don't have to
3. **Improves performance** - Compresses responses, caches files
4. **Adds security** - Blocks bad requests, adds security headers
5. **Manages Docker services** - Connects to containers by name

### Basic Nginx Concepts

```
Browser Request → Nginx → Backend App → Response → Nginx → Browser
                    ↑                               ↓
                 Routes based on:              Adds headers,
                 - Domain name                 compresses,
                 - URL path                    caches
                 - Headers
```

---

## 2. Understanding Your Setup

### Your Nginx Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERNET (Port 443/80)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
         ┌────────────▼───────────┐
         │   Nginx Container      │
         │   (vpn-nginx)          │
         │                        │
         │  Main Config Files:    │
         │  ├─ nginx.conf         │
         │  └─ conf.d/            │
         │     └─ 00-router.conf  │
         └────────────┬───────────┘
                      │
         ┌────────────┴──────────────────────────┐
         │        Docker Network Bridge          │
         │          (vpn-network)                │
         └─┬─────┬─────┬────────┬────────┬───────┘
           │     │     │        │        │
    ┌──────▼─┐ ┌─▼────┐ ┌──────▼─┐ ┌────▼────┐ ┌──────▼─────┐
    │  Web   │ │ API  │ │ Python │ │ NexusAI │ │   Ollama   │
    │ :3000  │ │:5000 │ │  API   │ │  :80    │ │  :11434    │
    │        │ │      │ │ :5001  │ │         │ │            │
    └────────┘ └──────┘ └────────┘ └─────────┘ └────────────┘
```

### File Structure Overview

```
infrastructure/docker/nginx/
├── nginx.conf                    # Main config (rarely changed)
├── prod/
│   ├── nginx.conf               # Production main config
│   └── conf.d/
│       └── 00-router.conf       # 🔥 MAIN ROUTING LOGIC (you edit this)
├── conf.d/                      # Development configs
│   ├── nexusai.conf            # NexusAI subdomain config
│   ├── python-api.conf         # Python API config
│   └── ...
└── ssl/                         # SSL certificates
    ├── fullchain.pem           # Public certificate
    └── privkey.pem             # Private key
```

**Key Point:** Most of your changes will be in `prod/conf.d/00-router.conf`

---

## 3. Main Configuration Explained

### nginx.conf Breakdown

Let's go through your main config line by line:

```nginx
user nginx;
```

**What it does:** Runs nginx as the `nginx` user (not root) for security  
**Why:** Limits damage if nginx is compromised  
**When to change:** Never in normal operation

```nginx
worker_processes auto;
```

**What it does:** Creates one nginx worker per CPU core  
**Why:** Maximizes performance on your server  
**Example:** 4-core CPU = 4 workers  
**When to change:** Usually leave as `auto`

```nginx
worker_rlimit_nofile 65535;
```

**What it does:** Max file descriptors (connections) each worker can handle  
**Why:** Prevents "too many open files" errors under high load  
**Calculation:** 65535 = ~65,000 concurrent connections possible  
**When to change:** If you expect more than 50,000+ concurrent users

```nginx
events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}
```

**Breakdown:**

- `worker_connections 4096` - Each worker handles 4096 connections
- `use epoll` - Linux-optimized connection handling (faster)
- `multi_accept on` - Accept multiple connections at once

**Total capacity:** `worker_processes * worker_connections`  
**Your setup:** auto \* 4096 = ~16,000+ connections

```nginx
http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
```

**What it does:**

- `include mime.types` - Tells nginx what `.js`, `.css`, `.png` files are
- `default_type` - If nginx doesn't know the file type, send as binary

**Example:** `.mp4` files are sent with `video/mp4` MIME type

### Logging Configuration

```nginx
log_format json_combined escape=json
    '{'
        '"time_local":"$time_local",'
        '"remote_addr":"$remote_addr",'
        '"request":"$request",'
        '"status":"$status",'
        ...
    '}';

access_log /var/log/nginx/access.log json_combined;
```

**What it does:** Logs every request as JSON  
**Why JSON:** Easy to parse with tools like `jq`, import to databases  
**Variables explained:**

- `$time_local` - When request happened: `[31/Jan/2026:21:42:30 +0000]`
- `$remote_addr` - Client IP: `192.168.1.100`
- `$request` - Full request: `GET /api/users HTTP/1.1`
- `$status` - Response code: `200`, `404`, `502`
- `$request_time` - How long it took: `0.234` seconds

**Example log entry:**

```json
{
  "time_local": "01/Feb/2026:10:30:15 +0000",
  "remote_addr": "203.0.113.42",
  "request": "POST /api/ai/generate HTTP/1.1",
  "status": "200",
  "body_bytes_sent": "1234",
  "request_time": "2.456"
}
```

**Analyzing logs:**

```bash
# View last 100 requests
docker logs vpn-nginx | tail -100

# Find all 502 errors
docker logs vpn-nginx | grep '"status":"502"'

# Count requests per endpoint
docker logs vpn-nginx | jq -r '.request' | cut -d' ' -f2 | sort | uniq -c
```

### Performance Settings

```nginx
sendfile on;
tcp_nopush on;
tcp_nodelay on;
keepalive_timeout 65;
```

**Breakdown:**

**`sendfile on`**

- **What:** Nginx sends files directly from disk to network (bypasses memory)
- **Why:** 2-3x faster for static files (images, CSS, JS)
- **When:** Always keep enabled

**`tcp_nopush on`**

- **What:** Send HTTP headers and file in one packet
- **Why:** Reduces network overhead (fewer packets = faster)
- **Works with:** `sendfile`

**`tcp_nodelay on`**

- **What:** Don't wait to send small packets
- **Why:** Lower latency for API responses
- **Note:** Seems contradictory with `tcp_nopush`, but they work together

**`keepalive_timeout 65`**

- **What:** Keep connection open for 65 seconds
- **Why:** Browser can reuse same connection for multiple requests
- **Example:** Load page with 20 images → 1 connection, not 20

```nginx
client_max_body_size 10G;
```

**What it does:** Allow uploads up to 10 GB  
**Why:** Your Ollama models can be several GB  
**Default:** 1M (too small for large files)  
**Change to:** `100M` for most apps, `10G` for file/model uploads

```nginx
server_tokens off;
```

**What it does:** Hide nginx version in error pages  
**Why Security:** Attackers can't see if you're using vulnerable version  
**Before:** `nginx/1.24.0` shown in headers  
**After:** Just `nginx` shown

### Gzip Compression

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/javascript
    application/json
    application/javascript
    ...;
```

**What it does:** Compresses responses before sending  
**Example:** 1MB JavaScript file → 300KB compressed → faster download  
**Settings explained:**

- `gzip on` - Enable compression
- `gzip_vary on` - Tell browsers "content can be compressed"
- `gzip_comp_level 6` - Compression strength (1-9)
  - 1 = fastest, less compression
  - 9 = slowest, most compression
  - 6 = good balance (recommended)
- `gzip_types` - Which files to compress (text files compress well, images don't)

**Don't compress:** Images (`.jpg`, `.png`), videos (`.mp4`) - already compressed

### Docker DNS Resolver

```nginx
resolver 127.0.0.11 valid=30s ipv6=off;
```

**CRITICAL CONCEPT - READ CAREFULLY:**

**What it does:** Looks up container IPs by name  
**Docker DNS:** `127.0.0.11` is Docker's internal DNS server  
**Why needed:** Container IPs change when you restart them

**Without resolver:**

```
1. Start containers: web:3000 → 172.20.0.5
2. Nginx caches: web = 172.20.0.5
3. Restart web container: web:3000 → 172.20.0.8 (NEW IP!)
4. Nginx still sends to 172.20.0.5 → 502 Bad Gateway ❌
```

**With resolver:**

```
1. Start containers: web:3000 → 172.20.0.5
2. Nginx asks Docker DNS: "What IP is 'web'?" → 172.20.0.5
3. Restart web container: web:3000 → 172.20.0.8
4. Nginx asks again: "What IP is 'web'?" → 172.20.0.8 ✅
```

**Parameters:**

- `valid=30s` - Cache DNS lookup for 30 seconds, then re-check
- `ipv6=off` - Only use IPv4 (Docker usually doesn't need IPv6)

**Pro tip:** If you get random 502 errors after restarting containers, restart nginx:

```bash
docker compose restart nginx
```

---

## 4. Routing and Location Blocks

### Understanding Location Blocks

Location blocks are how nginx decides where to send requests.

### Location Matching Rules

```nginx
location = /exact  { }     # Priority 1: Exact match
location ^~ /prefix { }    # Priority 2: Prefix match (stops searching)
location ~ /regex { }      # Priority 3: Case-sensitive regex
location ~* /RegEx { }     # Priority 4: Case-insensitive regex
location /prefix { }       # Priority 5: Basic prefix match
location / { }             # Priority 6: Catch-all (lowest priority)
```

**Visual Example:**

```
Request: GET /api/ai/generate

Nginx checks in this order:
1. ✗ location = /api/ai/generate  (no exact match)
2. ✓ location ^~ /api/ai/         (MATCH! Stop searching)
3.   (skipped - already matched)
```

### Your Main Routing Logic

Let's break down your `00-router.conf`:

#### 1. Subdomain Routing (map block)

```nginx
map $host $backend_hostport {
    default                 web:3000;
    ~^api\..*               api:5000;
    ~^python-api\..*        python-api:5001;
    ~^ollama\..*            ollama:11434;
    ~^nexusai\..*           nexusai:80;
}
```

**What is `map`?**  
A map creates a variable based on another variable's value.

**How it works:**

```
If $host (domain name) matches pattern → set $backend_hostport to value

api.chatbuilds.com      → $backend_hostport = "api:5000"
python-api.example.com  → $backend_hostport = "python-api:5001"
ollama.mydomain.com     → $backend_hostport = "ollama:11434"
chatbuilds.com          → $backend_hostport = "web:3000" (default)
```

**Regex explained:**

- `~^api\..*` means:
  - `~` = regex match
  - `^` = start of string
  - `api` = literal text "api"
  - `\.` = literal dot (escaped because `.` means "any character" in regex)
  - `.*` = any characters after

**Examples:**

- `api.chatbuilds.com` ✓ matches
- `api.mydomain.org` ✓ matches
- `myapi.domain.com` ✗ doesn't match (api not at start)

#### 2. HTTP to HTTPS Redirect

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location /health {
        access_log off;
        return 200 "ok\n";
        add_header Content-Type text/plain;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
```

**Breakdown:**

**`listen 80 default_server`**

- Listen on port 80 (HTTP)
- `default_server` = catch all domains (if no other server block matches)

**`listen [::]:80`**

- Listen on IPv6 too
- `::` is IPv6 notation

**`server_name _`**

- `_` = catch-all wildcard (any domain name)

**Health check endpoint:**

```nginx
location /health {
    access_log off;        # Don't log health checks (noisy)
    return 200 "ok\n";     # Return 200 OK status
    add_header Content-Type text/plain;
}
```

**Used by:** Load balancers, monitoring tools (checks if nginx is alive)

**Redirect all HTTP to HTTPS:**

```nginx
location / {
    return 301 https://$host$request_uri;
}
```

- `301` = permanent redirect (browsers cache this)
- `$host` = the domain name (e.g., `chatbuilds.com`)
- `$request_uri` = the path (e.g., `/api/users?id=5`)

**Example:**

```
Request:  http://chatbuilds.com/api/users
Redirect: https://chatbuilds.com/api/users
```

#### 3. HTTPS Server Block

```nginx
server {
    listen 443 ssl http2 default_server;
    listen [::]:443 ssl http2 default_server;
    server_name _;

    resolver 127.0.0.11 valid=10s ipv6=off;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
```

**`listen 443 ssl http2`**

- `443` = HTTPS port
- `ssl` = enable SSL/TLS encryption
- `http2` = use HTTP/2 protocol (faster, multiplexing)

**SSL certificates:**

- `ssl_certificate` = public certificate (sent to browsers)
- `ssl_certificate_key` = private key (kept secret)

**SSL protocols:**

- TLSv1.2 = older but widely supported
- TLSv1.3 = newest, fastest, most secure
- ❌ Not using TLSv1.0, TLSv1.1 (insecure, deprecated)

**SSL session cache:**

- Saves SSL handshake results for 10 minutes
- New requests reuse cached session (faster)
- `10m` = 10 megabytes of memory

### Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

**What each header does:**

**`X-Frame-Options: SAMEORIGIN`**

- **Prevents:** Clickjacking attacks
- **How:** Page can only be embedded in iframe from same domain
- **Example:** Your page on `chatbuilds.com` can iframe itself, but `evil.com` cannot

**`X-Content-Type-Options: nosniff`**

- **Prevents:** MIME type sniffing
- **How:** Browser must respect the `Content-Type` header
- **Example:** If file is `.txt` but contains JavaScript, browser won't execute it

**`Referrer-Policy: no-referrer-when-downgrade`**

- **What:** Controls what referrer info is sent
- **Rule:** Send full referrer to HTTPS, but not to HTTP
- **Why:** Prevents leaking URLs with sensitive data to HTTP sites

**`Strict-Transport-Security: max-age=31536000; includeSubDomains`**

- **What:** Force HTTPS for 1 year
- **How:** Browser remembers to always use HTTPS
- **`includeSubDomains`:** Also apply to all subdomains
- **Example:** After first visit, browser automatically changes `http://` to `https://`

**The `always` keyword:**

- Adds header even on error responses (404, 500, etc.)
- Without it, headers only added on 200 OK

### Hide Dotfiles

```nginx
location ~ /\.(?!well-known/) {
    access_log off;
    log_not_found off;
    return 404;
}
```

**What it does:** Block access to hidden files  
**Prevents:** Leaking `.env`, `.git`, `.htaccess` files  
**Regex explained:**

- `\.` = literal dot
- `(?!well-known/)` = except `.well-known/` (needed for Let's Encrypt)

**Blocks:**

- `/.env` ✓
- `/.git/config` ✓
- `/.htpasswd` ✓

**Allows:**

- `/.well-known/acme-challenge/` ✓ (SSL verification)

---

## 5. Reverse Proxy Deep Dive

### What is a Reverse Proxy?

```
           Without Nginx:
Browser ──────────────────────> App:3000
                                (receives request directly)

           With Nginx (Reverse Proxy):
Browser ────> Nginx ────> App:3000
              (port 443)   (internal port)
```

**Benefits:**

1. **SSL Termination** - Nginx handles HTTPS, app uses HTTP
2. **Load Balancing** - Distribute to multiple app instances
3. **Caching** - Nginx caches responses
4. **Security** - Hide internal structure, block attacks
5. **Multiple Apps** - One domain, many services

### Basic Proxy Configuration

```nginx
location /api/ {
    set $api_upstream api:5000;
    proxy_pass http://$api_upstream;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Line by line:**

**`set $api_upstream api:5000;`**

- **Why use variable:** Forces nginx to use Docker DNS resolver
- **Alternative:** `proxy_pass http://api:5000;` (caches IP, causes issues)
- **Best practice:** Always use variable with Docker

**`proxy_pass http://$api_upstream;`**

- **What:** Forward request to backend
- **Note:** No trailing `/` means keep original path
- **Example:** `/api/users` → `http://api:5000/api/users`

**`proxy_http_version 1.1;`**

- **Why:** HTTP/1.1 supports keep-alive connections (faster)
- **Default:** HTTP/1.0 (creates new connection each request - slow)

**`proxy_set_header Host $host;`**

- **What:** Tell backend what domain was requested
- **Example:** `Host: chatbuilds.com`
- **Why:** Backend needs to know for generating absolute URLs

**`proxy_set_header X-Real-IP $remote_addr;`**

- **What:** Send client's real IP to backend
- **Without it:** Backend sees nginx's IP (useless for logging/security)
- **Example:** `X-Real-IP: 203.0.113.42`

**`proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`**

- **What:** Chain of proxies (if multiple)
- **Example:** `X-Forwarded-For: client_ip, proxy1_ip, proxy2_ip`
- **Use:** Tracking request path through infrastructure

**`proxy_set_header X-Forwarded-Proto $scheme;`**

- **What:** Tell backend if request was HTTP or HTTPS
- **Values:** `http` or `https`
- **Why:** Backend needs to generate correct URLs

### URL Rewriting

Your config has several rewrite examples:

#### Example 1: NexusAI

```nginx
location ^~ /nexusai/ {
    rewrite ^/nexusai/(.*)$ /$1 break;
    proxy_pass http://nexusai:80;
}
```

**How rewrite works:**

```
Request: /nexusai/about
                ↓
Regex:   ^/nexusai/(.*)$
         ^^^^^^^^^ ^^^^
         remove    capture this (about)
                ↓
Result:  /$1
         ^^^
         /about
                ↓
Proxied to: http://nexusai:80/about
```

**Flags:**

- `break` = stop processing, use this result
- `last` = stop this location, start matching again
- `redirect` = return 302 temporary redirect
- `permanent` = return 301 permanent redirect

**Without rewrite:**

```
Request: /nexusai/about
Sent to: http://nexusai:80/nexusai/about  ❌ (404 - app doesn't have /nexusai/)
```

**With rewrite:**

```
Request: /nexusai/about
Sent to: http://nexusai:80/about  ✅
```

#### Example 2: Python AI API

```nginx
location ^~ /api/ai/ {
    rewrite ^/api/ai/(.*)$ /ai/$1 break;
    proxy_pass http://python-api:5001;
}
```

**Flow:**

```
Browser:     POST /api/ai/generate
             ↓ (rewrite)
Nginx sends: POST /ai/generate → http://python-api:5001/ai/generate
             ↓
FastAPI:     @app.post("/ai/generate")  ✅ matches
```

### WebSocket Support

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

**What:** Enables real-time bidirectional communication  
**Used by:** Chat apps, live updates, real-time dashboards  
**How it works:**

```
1. Client: "Hey, I want to upgrade to WebSocket"
   Header: Upgrade: websocket

2. Nginx: Forwards headers to backend
   Header: Upgrade: websocket
   Header: Connection: upgrade

3. Backend: "Sure, switching to WebSocket protocol"
   Status: 101 Switching Protocols

4. Connection stays open for real-time messages
```

**Without these headers:** WebSocket requests fail with 400 Bad Request

### Timeouts

```nginx
proxy_connect_timeout 60s;
proxy_send_timeout 300s;
proxy_read_timeout 300s;
```

**`proxy_connect_timeout`**

- **What:** How long to wait for backend connection
- **Default:** 60 seconds
- **When to increase:** If backend takes long to start accepting connections

**`proxy_send_timeout`**

- **What:** How long to wait when sending to backend
- **Default:** 60 seconds
- **When to increase:** Large file uploads

**`proxy_read_timeout`**

- **What:** How long to wait for backend response
- **Default:** 60 seconds
- **Your value:** 300s (5 minutes)
- **Why:** AI generation can take 30-60 seconds

**Common timeout errors:**

- `504 Gateway Timeout` - Backend took too long to respond
- **Fix:** Increase `proxy_read_timeout`

### Buffering

```nginx
proxy_buffering off;
proxy_request_buffering off;
```

**`proxy_buffering off`**

- **What:** Send response to client as soon as nginx receives it
- **Default:** Buffer entire response first
- **Use case:** Streaming responses (AI, video)
- **Tradeoff:** Slower for small responses, faster for streaming

**`proxy_request_buffering off`**

- **What:** Send request to backend immediately
- **Default:** Buffer entire request first
- **Use case:** Large file uploads
- **Benefit:** Upload starts immediately, not after 100% received

### Large Buffer Example (Your Config)

```nginx
location ^~ /api/ {
    # Login/refresh can set multiple cookies (Set-Cookie headers)
    proxy_buffer_size 32k;
    proxy_buffers 8 32k;
    proxy_busy_buffers_size 64k;

    proxy_pass http://$api_upstream;
}
```

**Why needed:**

```
Login Response Headers:
Set-Cookie: access_token=eyJhbGci...  (2000 bytes)
Set-Cookie: refresh_token=eyJhbGci... (2000 bytes)
Set-Cookie: session=abc123...          (500 bytes)
+ other headers                        (1000 bytes)
= ~5500 bytes total
```

**Default buffer:** 4-8 KB  
**Problem:** Headers don't fit → 502 Bad Gateway  
**Solution:** Increase buffers

**Settings explained:**

- `proxy_buffer_size 32k` - First buffer (headers only)
- `proxy_buffers 8 32k` - 8 buffers of 32KB each = 256KB total
- `proxy_busy_buffers_size 64k` - Max memory used while sending

---

## 6. Docker Integration

### How Nginx Talks to Containers

```yaml
# docker-compose.yml
services:
  nginx:
    container_name: vpn-nginx
    networks: [vpn-network]

  web:
    container_name: vpn-web
    networks: [vpn-network]

  api:
    container_name: vpn-api
    networks: [vpn-network]

networks:
  vpn-network:
    driver: bridge
```

**Docker creates internal DNS:**

- `web` resolves to container IP (e.g., `172.20.0.5`)
- `api` resolves to container IP (e.g., `172.20.0.6`)
- All containers on `vpn-network` can talk to each other

**In nginx config:**

```nginx
proxy_pass http://web:3000;
```

Docker DNS resolves `web` → `172.20.0.5` → connection established

### Container Restart Handling

**Problem scenario:**

```bash
# Start everything
docker compose up -d
  web: 172.20.0.5
  api: 172.20.0.6

# Nginx caches these IPs

# Later, restart web
docker compose restart web
  web: 172.20.0.9  # New IP!

# Nginx still tries 172.20.0.5 → 502 Bad Gateway ❌
```

**Solution 1: Use variables** (Your config does this)

```nginx
set $web_upstream web:3000;
proxy_pass http://$web_upstream;
```

**Why it works:** Variables force nginx to look up IP on every request

**Solution 2: Restart nginx**

```bash
docker compose restart nginx
```

**When:** After restarting many containers

**Solution 3: Docker DNS resolver** (Already in your config)

```nginx
resolver 127.0.0.11 valid=10s;
```

### Port Mapping

```
Outside Docker:
https://chatbuilds.com:443 → Docker Host

Inside Docker:
vpn-nginx:443 → vpn-web:3000
```

**Key concept:** Internal ports are different from external ports

**Example:**

```yaml
# docker-compose.yml
web:
  ports:
    - '3000:3000' # host:container
```

**In nginx:**

```nginx
proxy_pass http://web:3000;  # Use container port (3000)
# NOT http://web:80  # Wrong - container doesn't listen on 80
```

---

## 7. Security Configuration

### SSL/TLS Setup

```nginx
ssl_certificate /etc/nginx/ssl/fullchain.pem;
ssl_certificate_key /etc/nginx/ssl/privkey.pem;
ssl_protocols TLSv1.2 TLSv1.3;
```

**Certificate files:**

- `fullchain.pem` - Your certificate + intermediate certificates
- `privkey.pem` - Private key (keep secret!)

**Getting certificates:**

**Option 1: Let's Encrypt (Free)**

```bash
# Using certbot
certbot certonly --standalone -d chatbuilds.com -d www.chatbuilds.com

# Copies to:
/etc/letsencrypt/live/chatbuilds.com/fullchain.pem
/etc/letsencrypt/live/chatbuilds.com/privkey.pem
```

**Option 2: Paid certificate**

- Buy from CA (DigiCert, Sectigo, etc.)
- Upload to `/infrastructure/docker/nginx/ssl/`

**Mounting in Docker:**

```yaml
nginx:
  volumes:
    - ./nginx/ssl:/etc/nginx/ssl:ro # :ro = read-only
```

### SSL Best Practices

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

**Protocol versions:**

- ❌ SSLv3 - Broken (POODLE attack)
- ❌ TLSv1.0 - Deprecated
- ❌ TLSv1.1 - Deprecated
- ✅ TLSv1.2 - Current standard
- ✅ TLSv1.3 - Latest (faster, more secure)

**`ssl_prefer_server_ciphers off`**

- Let client choose cipher (TLS 1.3 best practice)
- TLS 1.3 has only secure ciphers, so order doesn't matter

### Rate Limiting (Not in your config, but useful)

**Example to add:**

```nginx
# In http block
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# In location block
location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://$api_upstream;
}
```

**What it does:**

- Allow 10 requests/second per IP
- Burst up to 20 extra requests
- Reject with 503 if exceeded

**When to use:** Prevent abuse, DDoS protection

### Auth Request Pattern (Your n8n config)

```nginx
# Auth check endpoint
location = /_auth/admin {
    internal;  # Only accessible from nginx
    set $api_upstream api:5000;
    proxy_pass http://$api_upstream/api/v1/admin/authz;
    proxy_set_header Authorization "Bearer $cookie_access_token";
}

# Protected resource
location ^~ /admin/n8n/ {
    auth_request /_auth/admin;  # Check auth first

    # If auth passes, proxy to n8n
    proxy_pass http://n8n:5678;
}
```

**Flow:**

```
1. Request: GET /admin/n8n/
2. Nginx: "Hold on, let me check auth"
3. Internal request to /_auth/admin
4. API checks token → Returns 200 (OK) or 401 (Denied)
5. If 200: Continue to n8n
   If 401: Return 401 to client
```

**Benefits:**

- Centralized authentication
- Protect any service without modifying it
- Works with services that don't have auth (pgAdmin, n8n)

---

## 8. Performance Optimization

### Caching Static Files

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    proxy_pass http://nexusai_backend;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**What it does:**

- Files cached in browser for 1 year
- `immutable` = never re-check if changed
- Only for files with hash in name: `app.a1b2c3.js`

**Why it works:**

- Modern build tools add hash to filename
- When file changes: `app.d4e5f6.js` (new name)
- Browser requests new file automatically

### Upstream Keepalive

```nginx
upstream nexusai_backend {
    server nexusai:80;
    keepalive 32;  # Keep 32 idle connections
}

location / {
    proxy_pass http://nexusai_backend;
    proxy_http_version 1.1;
    proxy_set_header Connection "";  # Don't send "Connection: close"
}
```

**Without keepalive:**

```
Request 1: Create connection → Use → Close
Request 2: Create connection → Use → Close  # Slow!
```

**With keepalive:**

```
Request 1: Create connection → Use → Keep open
Request 2: Reuse connection → Use → Keep open  # Fast!
```

**`keepalive 32`:** Keep up to 32 idle connections ready

### Gzip Compression Levels

```nginx
gzip_comp_level 6;
```

**Levels 1-9:**

- Level 1: Fast, less compression (~60%)
- Level 6: Balanced (recommended) (~75%)
- Level 9: Slow, max compression (~80%)

**Performance test:**

```
Original: 1MB JavaScript file

Level 1: 400KB, 10ms CPU time
Level 6: 300KB, 30ms CPU time  ← Your setting
Level 9: 280KB, 100ms CPU time
```

**Recommendation:** Stick with 6 (diminishing returns after)

### Sendfile Optimization

```nginx
sendfile on;
tcp_nopush on;
```

**How it works:**

**Without sendfile:**

```
1. Read file from disk → kernel buffer
2. Copy to nginx buffer
3. Copy to socket buffer
4. Send to network
```

**With sendfile:**

```
1. Read file from disk → kernel buffer
2. Send directly to network  # Skip copies!
```

**Result:** 2-3x faster for static files

---

## 9. Common Patterns in Your Config

### Pattern 1: Path-Based Routing

```nginx
location ^~ /api/        { proxy_pass http://api:5000; }
location ^~ /api/ai/     { proxy_pass http://python-api:5001; }
location ^~ /nexusai/    { proxy_pass http://nexusai:80; }
location ^~ /admin/n8n/  { proxy_pass http://n8n:5678; }
location /               { proxy_pass http://web:3000; }
```

**Key:** Order matters! More specific first.

**Matching priority:**

```
/api/ai/generate  → matches /api/ai/ (not /api/)
/api/users        → matches /api/
/nexusai/about    → matches /nexusai/
/anything         → matches /
```

### Pattern 2: URL Rewriting

```nginx
# Public URL: /nexusai/about
# App expects: /about

location ^~ /nexusai/ {
    rewrite ^/nexusai/(.*)$ /$1 break;
    proxy_pass http://nexusai:80;
}
```

**Common in:** SPAs, microservices, legacy apps

### Pattern 3: Subdomain Routing

```nginx
map $host $backend_hostport {
    ~^api\..*      api:5000;
    ~^ollama\..*   ollama:11434;
    default        web:3000;
}

location / {
    proxy_pass http://$backend_hostport;
}
```

**Supports:**

- `api.chatbuilds.com` → api:5000
- `api.mydomain.org` → api:5000
- `anything.com` → web:3000

### Pattern 4: Health Check

```nginx
location /health {
    access_log off;
    return 200 "ok\n";
    add_header Content-Type text/plain;
}
```

**Used by:** Kubernetes, Docker Swarm, AWS ELB, monitoring tools

**Test:**

```bash
curl http://localhost/health
# ok
```

### Pattern 5: Security Redirects

```nginx
# Force trailing slash
location = /nexusai {
    return 301 /nexusai/;
}

# Force HTTPS
location / {
    return 301 https://$host$request_uri;
}
```

**Why trailing slash matters:**

```
/nexusai  → nginx location = /nexusai
/nexusai/ → nginx location ^~ /nexusai/

Without redirect, /nexusai doesn't work!
```

---

## 10. Troubleshooting Guide

### Common Error: 502 Bad Gateway

**What it means:** Nginx can't reach the backend

**Causes and fixes:**

**1. Backend is down**

```bash
# Check if container is running
docker ps | grep vpn-web

# Check logs
docker logs vpn-web

# Restart
docker compose restart web
```

**2. Wrong port in nginx**

```nginx
# Wrong
proxy_pass http://web:80;  # App runs on 3000, not 80

# Correct
proxy_pass http://web:3000;
```

**3. Container IP changed (stale DNS)**

```bash
# Restart nginx to refresh DNS
docker compose restart nginx
```

**4. Backend crashed/timing out**

```bash
# Check backend health
curl http://localhost:3000/health  # Should return 200

# Check if backend is slow
time curl http://localhost:3000/api/users
```

### Common Error: 504 Gateway Timeout

**What it means:** Backend took too long to respond

**Fix: Increase timeout**

```nginx
proxy_read_timeout 300s;  # 5 minutes
```

**When:** AI generation, large file processing, complex queries

### Common Error: 413 Request Entity Too Large

**What it means:** Upload too big

**Fix: Increase max body size**

```nginx
client_max_body_size 100M;  # Allow 100MB uploads
```

**Where to put:**

- `http` block - Applies to all
- `server` block - Applies to one domain
- `location` block - Applies to one endpoint

### Common Error: 400 Bad Request

**Causes:**

**1. Missing Host header**

```nginx
# Fix
proxy_set_header Host $host;
```

**2. WebSocket upgrade failed**

```nginx
# Fix
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

**3. Invalid characters in URL**

```bash
# Browser might send
curl 'http://example.com/api/search?q=test query'
# Should be
curl 'http://example.com/api/search?q=test%20query'
```

### Common Error: Headers too large

**Error:** `upstream sent too big header`

**Fix:**

```nginx
proxy_buffer_size 32k;
proxy_buffers 8 32k;
proxy_busy_buffers_size 64k;
```

**When:** Many cookies, large JWT tokens, many headers

### Debugging Tips

**1. Enable debug logging**

```nginx
error_log /var/log/nginx/error.log debug;
```

**Watch logs:**

```bash
docker logs -f vpn-nginx
```

**2. Check nginx config syntax**

```bash
docker exec vpn-nginx nginx -t
```

**3. Reload without downtime**

```bash
docker exec vpn-nginx nginx -s reload
```

**4. Test specific location**

```bash
# What location matches this URL?
curl -I https://chatbuilds.com/api/ai/generate
# Check X-Location header (if you add it)
```

**5. Trace request path**

```nginx
# Add to location block
add_header X-Location "api-ai-route" always;
```

**6. Check DNS resolution**

```bash
# Inside nginx container
docker exec vpn-nginx nslookup web
docker exec vpn-nginx nslookup python-api
```

---

## 11. Quick Reference

### Most Used Directives

```nginx
# Server basics
listen 80;
listen 443 ssl http2;
server_name example.com;

# SSL
ssl_certificate /path/to/cert.pem;
ssl_certificate_key /path/to/key.pem;

# Reverse proxy
set $backend app:3000;
proxy_pass http://$backend;
proxy_http_version 1.1;

# Essential headers
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

# WebSocket
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";

# Timeouts
proxy_connect_timeout 60s;
proxy_send_timeout 300s;
proxy_read_timeout 300s;

# File size
client_max_body_size 100M;

# Redirects
return 301 https://$host$request_uri;
rewrite ^/old/(.*)$ /new/$1 permanent;

# Static files
root /usr/share/nginx/html;
try_files $uri $uri/ /index.html;
```

### Useful Variables

```nginx
$host               # Domain name (example.com)
$request_uri        # Full path with query (/api/users?id=5)
$uri                # Path only (/api/users)
$args               # Query string (id=5)
$remote_addr        # Client IP (203.0.113.42)
$scheme             # http or https
$request_method     # GET, POST, PUT, DELETE
$status             # Response status code (200, 404)
$request_time       # Request duration in seconds (0.234)
$upstream_addr      # Backend IP nginx sent request to
$upstream_status    # Response code from backend
$http_*             # Any request header (e.g., $http_user_agent)
$cookie_*           # Any cookie (e.g., $cookie_access_token)
```

### Testing Commands

```bash
# Check config syntax
docker exec vpn-nginx nginx -t

# Reload config (no downtime)
docker exec vpn-nginx nginx -s reload

# Restart nginx
docker compose restart nginx

# View logs
docker logs -f vpn-nginx

# Test endpoint
curl -I https://chatbuilds.com/api/health

# Check container connectivity
docker exec vpn-nginx ping web
docker exec vpn-nginx curl http://web:3000/health

# DNS lookup
docker exec vpn-nginx nslookup api
```

### Your Specific Endpoints

```
Production: https://chatbuilds.com

Public URLs → Backend Service:
/                    → web:3000 (Next.js dashboard)
/api/*               → api:5000 (Node.js API)
/api/ai/*            → python-api:5001 (FastAPI + Ollama)
/nexusai/*           → nexusai:80 (React SPA)
/admin/n8n/*         → n8n:5678 (Workflow automation)
/pgadmin/*           → vpn-pgadmin:80 (Database admin)

Subdomains:
api.chatbuilds.com      → api:5000
python-api.example.com  → python-api:5001
ollama.example.com      → ollama:11434
nexusai.example.com     → nexusai:80
```

### File Locations in Container

```
/etc/nginx/nginx.conf                # Main config
/etc/nginx/conf.d/*.conf             # Additional configs
/etc/nginx/ssl/                      # SSL certificates
/var/log/nginx/access.log            # Access logs
/var/log/nginx/error.log             # Error logs
/usr/share/nginx/html/               # Default web root
```

### Common Modifications

**Add new service:**

```nginx
location ^~ /myapp/ {
    set $myapp_upstream myapp:8080;
    proxy_pass http://$myapp_upstream;
    # Add standard proxy headers (see template above)
}
```

**Add subdomain:**

```nginx
map $host $backend_hostport {
    ~^myapp\..*    myapp:8080;
    # ... existing entries
}
```

**Increase upload size:**

```nginx
client_max_body_size 500M;  # In server or location block
```

**Add custom header:**

```nginx
add_header X-Custom-Header "my-value" always;
```

**Enable CORS:**

```nginx
add_header Access-Control-Allow-Origin "*" always;
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE" always;
add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
```

---

## 📖 Learning Path

### Week 1: Basics

- ✅ Understand what nginx does
- ✅ Read through main config (nginx.conf)
- ✅ Trace a request through your setup
- ✅ Make a simple change and test

### Week 2: Routing

- ✅ Study location blocks
- ✅ Understand matching order
- ✅ Practice with regexes
- ✅ Add a new route

### Week 3: Proxy

- ✅ Learn reverse proxy concepts
- ✅ Understand headers
- ✅ Study timeouts and buffering
- ✅ Debug a 502 error

### Week 4: Security

- ✅ Review SSL configuration
- ✅ Understand security headers
- ✅ Add rate limiting
- ✅ Test auth_request pattern

### Week 5: Performance

- ✅ Study caching strategies
- ✅ Optimize gzip compression
- ✅ Enable keepalive
- ✅ Monitor response times

### Ongoing

- Read nginx.org documentation
- Join nginx community forums
- Practice on test environments
- Document your changes

---

## 🎓 Additional Resources

**Official Docs:**

- https://nginx.org/en/docs/
- https://nginx.org/en/docs/beginners_guide.html

**Testing Tools:**

- https://www.ssllabs.com/ssltest/ (SSL config test)
- https://securityheaders.com/ (Security headers check)

**Monitoring:**

- https://github.com/nginxinc/nginx-prometheus-exporter
- https://grafana.com/grafana/dashboards/12708 (Nginx dashboard)

---

**Last Updated:** February 1, 2026  
**Maintainer:** You (with love and dedication)  
**Status:** Production-ready, lifetime maintained ❤️

---

_Keep this guide handy. Every time you work with nginx, you'll understand it better. Soon, you'll be the expert!_
