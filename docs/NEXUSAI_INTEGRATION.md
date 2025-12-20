# NexusAi Integration

NexusAi is a modern AI-powered chat-to-code interface integrated into the VPN Enterprise platform. It provides an intuitive web interface for AI-assisted development workflows.

## 🚀 Quick Start

### Development Mode

Start NexusAi along with other services:

```bash
./scripts/start-dev.sh
```

**Access NexusAi at: http://localhost:8080**

### Production Deployment

```bash
cd infrastructure/docker
docker compose up -d nexusai
```

**Access via nginx reverse proxy at: http://nexusai.domain.com**

## 📁 Architecture

- **Framework**: Vite + React + TypeScript
- **Package Manager**: Bun
- **UI Library**: Shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS
- **Dev Port**: 8080
- **Prod Port**: 80 (nginx)

## 🛠️ Configuration

### Docker Services

#### Development (`docker-compose.dev.yml`)
- **Service**: `nexusai-dev`
- **Port**: 8080
- **Hot Reload**: ✅ Enabled
- **Volume Mounts**: Source code mounted for live updates

#### Production (`docker-compose.yml`)
- **Service**: `nexusai`
- **Port**: 80 (internal)
- **Build**: Multi-stage (builder + nginx)
- **Optimization**: Static assets with gzip compression

### Environment Variables

No special environment variables required for basic setup. The app runs entirely client-side.

## 🏗️ Build Process

### Development Build
```bash
cd apps/nexusAi/chat-to-code-38
bun install
bun run dev
```

### Production Build
```bash
bun install --frozen-lockfile
bun run build
# Output: dist/ directory served by nginx
```

## 📦 Docker Images

### Development Image (`Dockerfile.dev`)
- Base: `oven/bun:1`
- Runs Vite dev server with hot reload
- Mounts source code as volume

### Production Image (`Dockerfile`)
- Stage 1: Build with Bun
- Stage 2: Serve with nginx:alpine
- Final image size: ~30MB

## 🌐 Nginx Configuration

Reverse proxy configuration at `/infrastructure/docker/nginx/conf.d/nexusai.conf`:

- **Domain**: nexusai.domain.com
- **Upstream**: nexusai:80
- **Features**:
  - Gzip compression for text assets
  - Static asset caching (1 year)
  - SPA routing support (all routes → index.html)
  - Security headers (X-Frame-Options, CSP, etc.)

## 🔧 Development

### Local Development (without Docker)

```bash
cd apps/nexusAi/chat-to-code-38
bun install
bun run dev
# Access at http://localhost:8080
```

### Code Structure

```
apps/nexusAi/chat-to-code-38/
├── src/
│   ├── components/       # React components
│   │   ├── ui/          # Shadcn UI components
│   │   ├── Footer.tsx
│   │   ├── Navbar.tsx
│   │   └── ...
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   └── App.tsx          # Main app component
├── public/              # Static assets
├── Dockerfile           # Production build
├── Dockerfile.dev       # Development build
└── nginx.conf           # Nginx config for production
```

## 🚦 Testing

### Verify Development Setup

1. Check container status:
```bash
docker ps | grep nexusai-dev
```

2. View logs:
```bash
docker logs vpn-nexusai-dev -f
```

3. Test HTTP access:
```bash
curl http://localhost:8080
```

### Verify Production Setup

1. Build and start:
```bash
cd infrastructure/docker
docker compose up --build nexusai
```

2. Test nginx routing:
```bash
curl -H "Host: nexusai.domain.com" http://localhost
```

## 🔒 Security

### Development
- No authentication required
- Localhost access only
- Hot reload enabled

### Production
- Consider adding authentication via nginx
- Use HTTPS with SSL certificates
- Enable rate limiting in nginx
- Set proper CORS headers

## 📊 Monitoring

### Logs
```bash
# Development logs
docker logs vpn-nexusai-dev -f

# Production logs
docker logs vpn-nexusai -f
```

### Health Check
```bash
# Direct access
curl http://localhost:8080/

# Via nginx (production)
curl http://nexusai.domain.com/health
```

## 🐛 Troubleshooting

### Container won't start
```bash
# Check logs
docker logs vpn-nexusai-dev --tail 50

# Rebuild container
docker compose -f infrastructure/docker/docker-compose.dev.yml up --build nexusai-dev
```

### Port already in use
```bash
# Find process using port 8080
lsof -i :8080

# Stop conflicting container
docker stop $(docker ps -q --filter "publish=8080")
```

### Build fails
```bash
# Clear node_modules and rebuild
cd apps/nexusAi/chat-to-code-38
rm -rf node_modules
bun install
bun run build
```

### Hot reload not working
- Ensure source code is properly mounted as volume
- Check file permissions (755 for directories, 644 for files)
- Verify Vite config allows network access

## 🔄 Deployment Workflow

### Development → Staging → Production

1. **Develop locally**:
   ```bash
   ./scripts/start-dev.sh
   ```

2. **Test production build**:
   ```bash
   cd apps/nexusAi/chat-to-code-38
   bun run build
   bun run preview
   ```

3. **Deploy to production**:
   ```bash
   cd infrastructure/docker
   docker compose up --build -d nexusai
   ```

## 📝 Notes

- NexusAi is a **client-side SPA** - no backend required
- All API calls should go through the main VPN Enterprise API
- Consider integrating with N8N for workflow automation
- Use the existing auth system for user management

## 🔗 Related Services

- **API**: http://localhost:5000 (dev) / http://api.domain.com (prod)
- **Web Dashboard**: http://localhost:3001 (dev) / http://dashboard.domain.com (prod)
- **N8N**: http://localhost:5678 (dev) / http://n8n.domain.com (prod)
- **NexusAi**: http://localhost:8080 (dev) / http://nexusai.domain.com (prod)

## 📚 Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Shadcn/ui Components](https://ui.shadcn.com/)
- [Bun Package Manager](https://bun.sh/)
