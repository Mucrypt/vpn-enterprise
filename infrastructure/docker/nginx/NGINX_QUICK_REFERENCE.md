# 🚀 Nginx Quick Reference Card

**Print this and keep it on your desk!**

---

## 🔧 Daily Commands

```bash
# Check if config is valid
docker exec vpn-nginx nginx -t

# Reload config (no downtime)
docker exec vpn-nginx nginx -s reload

# Restart nginx
docker compose restart nginx

# View real-time logs
docker logs -f vpn-nginx

# View last 100 lines
docker logs vpn-nginx --tail 100

# Check if container is running
docker ps | grep nginx
```

---

## 🎯 Location Matching Priority

```nginx
1. = /exact         # Exact match (highest priority)
2. ^~ /prefix       # Prefix match (stops searching)
3. ~ /regex         # Regex (case-sensitive)
4. ~* /Regex        # Regex (case-insensitive)
5. /prefix          # Basic prefix
6. /                # Catch-all (lowest priority)
```

**Example:**
```
Request: /api/ai/generate

Checks:
1. ✗ = /api/ai/generate     (no exact match)
2. ✓ ^~ /api/ai/            (MATCHED! Stop here)
3-6. (skipped)
```

---

## 📡 Essential Proxy Headers

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

# For WebSocket
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

---

## 🔄 Common Rewrites

```nginx
# Strip prefix
location ^~ /app/ {
    rewrite ^/app/(.*)$ /$1 break;
    proxy_pass http://backend:3000;
}
# /app/page → backend sees /page

# Add prefix
location ^~ /api/ {
    rewrite ^/api/(.*)$ /v1/$1 break;
    proxy_pass http://backend:5000;
}
# /api/users → backend sees /v1/users

# Redirect with query string
return 301 https://$host$request_uri;
```

---

## 🐛 Error Codes Cheat Sheet

| Code | Meaning | Common Cause | Fix |
|------|---------|--------------|-----|
| 502 | Bad Gateway | Backend down/wrong port | Check container, restart nginx |
| 504 | Gateway Timeout | Backend slow | Increase `proxy_read_timeout` |
| 413 | Request Too Large | Upload too big | Increase `client_max_body_size` |
| 400 | Bad Request | Missing headers | Add `proxy_set_header Host` |
| 301 | Moved Permanently | Redirect | Check `return 301` or `rewrite` |

---

## 📊 Useful Nginx Variables

```nginx
$host                   # example.com
$uri                    # /api/users
$request_uri            # /api/users?id=5
$args                   # id=5
$remote_addr            # 203.0.113.42
$scheme                 # http or https
$request_method         # GET, POST, etc.
$status                 # 200, 404, 502
$request_time           # 0.234 (seconds)
$upstream_addr          # 172.20.0.5:3000
$http_user_agent        # Browser info
$cookie_access_token    # Cookie value
```

---

## 🛡️ Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Strict-Transport-Security "max-age=31536000" always;
```

---

## ⏱️ Timeout Settings

```nginx
# How long to wait for connection
proxy_connect_timeout 60s;

# How long to wait sending request
proxy_send_timeout 300s;

# How long to wait for response
proxy_read_timeout 300s;

# Keep connection alive
keepalive_timeout 65;
```

---

## 🔍 Debugging Snippets

### Add location identifier
```nginx
location ^~ /api/ {
    add_header X-Nginx-Location "api-block" always;
    proxy_pass http://api:5000;
}
```

### Log variables
```nginx
error_log /var/log/nginx/error.log debug;
access_log /var/log/nginx/access.log;
```

### Test DNS resolution
```bash
docker exec vpn-nginx nslookup web
docker exec vpn-nginx nslookup api
```

### Test backend directly
```bash
docker exec vpn-nginx curl http://web:3000/health
docker exec vpn-nginx curl http://api:5000/health
```

---

## 🎛️ Your Service Map

```
Domain: chatbuilds.com

/                → web:3000        (Next.js)
/api/*           → api:5000        (Node.js)
/api/ai/*        → python-api:5001 (FastAPI)
/nexusai/*       → nexusai:80      (React)
/admin/n8n/*     → n8n:5678        (Automation)
/pgadmin/*       → vpn-pgadmin:80  (DB Admin)
```

---

## 📝 Common Tasks

### Add New Service

```nginx
# In prod/conf.d/00-router.conf
location ^~ /myservice/ {
    set $myservice_upstream myservice:8080;
    
    # Strip prefix if needed
    rewrite ^/myservice/(.*)$ /$1 break;
    
    proxy_pass http://$myservice_upstream;
    proxy_http_version 1.1;
    
    # Standard headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket support
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_read_timeout 300s;
}
```

### Increase Upload Limit

```nginx
# For all services
http {
    client_max_body_size 500M;
}

# For specific location
location /upload/ {
    client_max_body_size 2G;
}
```

### Force HTTPS

```nginx
# HTTP server block
server {
    listen 80;
    return 301 https://$host$request_uri;
}
```

### Enable CORS

```nginx
location /api/ {
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
    
    # Handle preflight
    if ($request_method = OPTIONS) {
        return 204;
    }
    
    proxy_pass http://api:5000;
}
```

---

## 🔄 Deployment Workflow

```bash
# 1. Edit config
vim infrastructure/docker/nginx/prod/conf.d/00-router.conf

# 2. Test syntax
docker exec vpn-nginx nginx -t

# 3. If OK, reload
docker exec vpn-nginx nginx -s reload

# 4. Watch logs for errors
docker logs -f vpn-nginx

# 5. Test endpoint
curl -I https://chatbuilds.com/your-new-route

# 6. Commit changes
git add infrastructure/docker/nginx/
git commit -m "nginx: Add new route for X"
git push
```

---

## 🆘 Emergency Fixes

### Nginx won't start
```bash
# Check config syntax
docker exec vpn-nginx nginx -t

# View error logs
docker logs vpn-nginx

# Common issues:
# - Syntax error in config
# - SSL cert files missing
# - Port already in use
```

### 502 Bad Gateway
```bash
# Check backend is running
docker ps | grep web

# Check backend logs
docker logs web

# Restart backend
docker compose restart web

# Restart nginx (refreshes DNS)
docker compose restart nginx

# Test backend directly
docker exec vpn-nginx curl http://web:3000/
```

### Can't reach container
```bash
# Check Docker network
docker network ls
docker network inspect vpn-network

# Check DNS resolution
docker exec vpn-nginx nslookup web

# Check if service is exposed
docker exec web netstat -tlnp
```

### Logs filling up disk
```bash
# Check log size
docker exec vpn-nginx du -sh /var/log/nginx/

# Rotate logs
docker exec vpn-nginx sh -c "echo > /var/log/nginx/access.log"
docker exec vpn-nginx sh -c "echo > /var/log/nginx/error.log"

# Or restart container
docker compose restart nginx
```

---

## 📚 Where to Learn More

**Full Guide:** `NGINX_COMPLETE_GUIDE.md` (same folder)

**Official Docs:** https://nginx.org/en/docs/

**Your Config Files:**
- `prod/nginx.conf` - Main config
- `prod/conf.d/00-router.conf` - Routing logic

**Test Configs:**
- SSL Test: https://www.ssllabs.com/ssltest/
- Headers: https://securityheaders.com/

---

## 💡 Pro Tips

1. **Always use variables with Docker:** `set $upstream app:3000;`
2. **Test before reload:** `nginx -t` catches 90% of errors
3. **Watch logs when deploying:** Catch issues immediately
4. **Document your changes:** Future you will thank you
5. **Use `^~` for specific paths:** Stops regex checking (faster)
6. **Enable debug logs temporarily:** Great for troubleshooting
7. **Restart nginx after container restarts:** Refreshes DNS cache

---

**Keep this card handy!** 🎯

*Last updated: February 1, 2026*
