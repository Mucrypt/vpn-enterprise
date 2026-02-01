# 🎨 Next.js Web Dashboard

**Enterprise VPN Management Platform - Frontend Application**

---

## 📖 Documentation

### 🎓 For Learning & Mastery

**[Complete Next.js Guide](./NEXTJS_COMPLETE_GUIDE.md)** - Your comprehensive reference

- Next.js & React basics explained simply
- App Router architecture walkthrough
- Complete project structure breakdown
- Server vs Client components
- State management with Zustand
- API integration patterns
- Supabase authentication
- Tailwind CSS & shadcn/ui components
- Build & deployment strategies
- Testing & debugging techniques
- **Read this to master Next.js and understand the entire frontend**

**[Quick Reference](./NEXTJS_QUICK_REFERENCE.md)** - Your daily cheat sheet

- All essential commands
- Common code patterns
- Component examples
- API integration snippets
- Troubleshooting guide
- Tailwind CSS quick reference
- **Print this and keep it by your desk**

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (LTS recommended)
- **npm** (or pnpm/yarn)
- **Git**
- _Optional:_ Vercel CLI (`npm i -g vercel`)

### Local Development

```bash
# From web-dashboard directory
cd apps/web-dashboard
npm install
npm run dev

# Or from repo root (monorepo)
npm run dev --workspace=apps/web-dashboard

# Open browser
open http://localhost:3000
```

---

## 🎯 What This Application Does

The Next.js Web Dashboard is the **frontend interface** for VPN Enterprise:

### Key Features

**1. Dashboard & Analytics**

- Real-time VPN server monitoring
- User connection statistics
- Bandwidth usage analytics
- Server health metrics

**2. NexusAI - Chat-to-Code Interface**

- AI-powered code generation
- Database query assistant
- Interactive code editor (Monaco)
- Real-time previews

**3. Database Manager**

- Visual PostgreSQL management
- SQL query editor
- Schema viewer
- Data manipulation tools

**4. VPN Management**

- Server configuration
- Client management
- VPN config generation
- Security settings

**5. Admin Tools**

- User management
- Billing & subscriptions
- Multi-tenancy support
- Threat monitoring

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser                                │
│              https://chatbuilds.com                         │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                 Nginx Reverse Proxy                         │
│          (routes to appropriate services)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ↓             ↓             ↓
┌────────────────┐ ┌─────────┐ ┌──────────┐
│  Next.js Web   │ │   API   │ │ Python   │
│  :3000         │ │  :5000  │ │ AI :5001 │
│                │ │         │ │          │
│ THIS APP       │ │ Backend │ │ Ollama   │
└────────┬───────┘ └─────────┘ └──────────┘
         ↓
┌────────────────┐
│   Supabase     │
│  (Auth/DB)     │
└────────────────┘
```

---

## 🔧 Technology Stack

### Core Framework

- **Next.js 16.0.10** - App Router (React 19)
- **TypeScript** - Type-safe development
- **React 19.2.0** - UI library

### UI & Styling

- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library (Radix UI primitives)
- **Lucide Icons** - Icon set
- **GSAP** - Animations

### State & Data

- **Zustand** - Lightweight state management
- **Supabase** - Authentication & database
- **React Hot Toast** - Notifications

### Developer Experience

- **ESLint** - Code linting
- **Monaco Editor** - Code editor (NexusAI)
- **TypeScript** - IntelliSense & type checking

---

## 📁 Project Structure

```
apps/web-dashboard/
├── app/                        # Pages & routing (App Router)
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page (/)
│   ├── globals.css            # Global styles
│   ├── dashboard/             # Dashboard pages
│   │   ├── page.tsx           # /dashboard
│   │   ├── layout.tsx         # Dashboard layout
│   │   ├── servers/           # /dashboard/servers
│   │   ├── nexusAi/           # /dashboard/nexusAi
│   │   ├── databases/         # /dashboard/databases
│   │   ├── analytics/         # /dashboard/analytics
│   │   └── ...
│   └── auth/                  # Authentication pages
│
├── components/                # React components
│   ├── ui/                   # shadcn/ui base components
│   ├── dashboard/            # Dashboard-specific components
│   ├── database/             # Database manager components
│   └── auth/                 # Authentication components
│
├── lib/                      # Utilities & helpers
│   ├── api.ts               # API client
│   ├── utils.ts             # Helper functions
│   ├── store.ts             # Zustand state store
│   └── supabase/            # Supabase client
│
├── hooks/                   # Custom React hooks
├── public/                  # Static assets
├── e2e/                     # End-to-end tests
│
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies
│
├── NEXTJS_COMPLETE_GUIDE.md # 📚 Comprehensive documentation
├── NEXTJS_QUICK_REFERENCE.md # ⚡ Daily cheat sheet
└── README.md                # This file
```

**Detailed structure:** See [Complete Guide](./NEXTJS_COMPLETE_GUIDE.md#3-project-structure)

---

## 🌍 Environment Variables

### Required Variables

```bash
# .env.local (create this file)

# Supabase Authentication
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# API Backend
NEXT_PUBLIC_API_URL=http://localhost:5000  # Development
# NEXT_PUBLIC_API_URL=https://chatbuilds.com  # Production
```

### Variable Types

**Public (NEXT*PUBLIC*\*):**

- Exposed to browser
- Must prefix with `NEXT_PUBLIC_`
- Used in client components

**Private (no prefix):**

- Server-only
- Never sent to browser
- Used in Server Components & API routes

**Important:**

- Never commit secrets to Git
- Use `.env.local` for local development (in `.gitignore`)
- Set production secrets in Vercel/deployment platform

---

## 🛠️ Development

### Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

### Development Workflow

1. **Start dev server:** `npm run dev`
2. **Edit files:** Changes hot-reload automatically
3. **Check console:** Browser DevTools for errors
4. **Test API calls:** Network tab in DevTools
5. **Build locally:** `npm run build` before committing

### Key Features

- **Hot Module Replacement (HMR)** - Instant updates
- **Fast Refresh** - Preserves component state
- **TypeScript checking** - Real-time error detection
- **ESLint integration** - Code quality checks

---

## 🧪 Testing

### Interactive Testing

**Automatic API docs:**

```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:3000

# Test features manually
```

### Browser DevTools

**React DevTools:**

1. Install React DevTools extension
2. Inspect component tree
3. View props, state, hooks

**Network Tab:**

- Monitor API calls
- Check request/response
- Debug CORS issues

**Console:**

- View logs
- Check errors
- Debug JavaScript

**Full testing guide:** See [Complete Guide](./NEXTJS_COMPLETE_GUIDE.md#11-testing--debugging)

---

## 🚢 Deployment

### Vercel (Recommended)

**Automatic deployment:**

1. Connect GitHub repo to Vercel
2. Configure environment variables
3. Push to `main` branch
4. Vercel builds & deploys automatically

**Manual deployment:**

```bash
npm install -g vercel
cd apps/web-dashboard
vercel --prod
```

**Environment variables:**

- Go to Vercel dashboard → Settings → Environment Variables
- Add all `NEXT_PUBLIC_*` variables
- Add server-only secrets
- Redeploy

### Docker

**Build:**

```bash
cd apps/web-dashboard
docker build -t vpn-web-dashboard .
```

**Run:**

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_API_URL=... \
  vpn-web-dashboard
```

**Docker Compose:**

```bash
cd infrastructure/docker
docker compose up -d web-dashboard
```

### Self-Hosted

**Build:**

```bash
npm run build
```

**Start:**

```bash
npm run start  # Runs on port 3000
```

**With PM2:**

```bash
pm2 start npm --name "web-dashboard" -- start
```

**Deployment guide:** See [Complete Guide](./NEXTJS_COMPLETE_GUIDE.md#10-build--deployment)

---

## 🔐 Security

### Authentication

- **Supabase Auth** - Secure authentication
- **JWT tokens** - Session management
- **httpOnly cookies** - Refresh token storage
- **Protected routes** - Middleware-based auth checks

### Best Practices

- ✅ Environment variables for secrets
- ✅ HTTPS in production
- ✅ CORS properly configured
- ✅ Input validation (TypeScript + Pydantic on backend)
- ✅ XSS protection (React escaping)
- ✅ CSRF protection (SameSite cookies)

### Security Headers

Configured in `next.config.ts`:

```typescript
headers: [
  'X-DNS-Prefetch-Control',
  'Strict-Transport-Security',
  'X-Frame-Options',
  'X-Content-Type-Options',
  'Referrer-Policy',
]
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Port already in use**

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

**2. Environment variables not working**

```bash
# Restart dev server after changing .env.local
# Prefix browser variables with NEXT_PUBLIC_
```

**3. Build fails**

```bash
# Clear cache
rm -rf .next
npm run build
```

**4. API calls fail**

```bash
# Check NEXT_PUBLIC_API_URL in .env.local
# Check backend is running
# Check Network tab in browser DevTools
```

**5. Authentication issues**

```bash
# Check Supabase credentials
# Clear browser cookies
# Check middleware.ts is protecting routes
```

**Full troubleshooting:** See [Quick Reference](./NEXTJS_QUICK_REFERENCE.md#-troubleshooting)

---

## 📊 Performance

### Build Optimization

- **Static Generation** - Pre-render pages at build time
- **Code Splitting** - Automatic route-based splitting
- **Image Optimization** - Next.js Image component
- **Font Optimization** - Next.js Font optimization
- **Bundle Analysis** - Monitor bundle size

### Runtime Optimization

- **React Server Components** - Reduce client JavaScript
- **Streaming** - Progressive page loading
- **Caching** - Fetch caching strategies
- **Lazy Loading** - Dynamic imports for heavy components

### Monitoring

```bash
# Build analysis
npm run build

# Check bundle size in .next/

# Lighthouse score
npm run build
npm run start
# Open Chrome DevTools → Lighthouse
```

---

## 🤝 Contributing

### Development Guidelines

1. **Follow TypeScript** - Use proper types
2. **Component structure** - Keep components small and focused
3. **Use shadcn/ui** - Consistent component library
4. **Tailwind classes** - Utility-first styling
5. **Server Components first** - Add `'use client'` only when needed

### Code Style

```tsx
// ✅ Good
interface ServerCardProps {
  server: Server
  onDelete: (id: string) => void
}

export function ServerCard({ server, onDelete }: ServerCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{server.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{server.status}</p>
      </CardContent>
    </Card>
  )
}

// ❌ Bad
export function ServerCard(props: any) {
  return <div>{props.server.name}</div>
}
```

### Adding New Features

1. **Create branch:** `git checkout -b feature/my-feature`
2. **Add components:** Follow existing structure
3. **Test locally:** `npm run dev`
4. **Build:** `npm run build`
5. **Commit:** `git commit -m "feat: Add feature"`
6. **Push:** `git push`
7. **Create PR:** Request review

---

## 📚 Learning Resources

### Official Documentation

- **[Next.js Docs](https://nextjs.org/docs)** - Framework docs
- **[React Docs](https://react.dev)** - React fundamentals
- **[Tailwind CSS](https://tailwindcss.com/docs)** - Utility classes
- **[shadcn/ui](https://ui.shadcn.com)** - Component library
- **[TypeScript](https://www.typescriptlang.org/docs)** - Type system
- **[Supabase](https://supabase.com/docs)** - Auth & database

### Internal Documentation

1. **[Complete Guide](./NEXTJS_COMPLETE_GUIDE.md)** - Read this first
2. **[Quick Reference](./NEXTJS_QUICK_REFERENCE.md)** - Daily use
3. **[Contributing Guide](./CONTRIBUTING.md)** - Development workflow

### Learning Path

**Week 1: Basics**

- ✅ Read Complete Guide
- ✅ Understand App Router
- ✅ Learn Server vs Client components
- ✅ Practice with Tailwind CSS

**Week 2: Components**

- ✅ Study shadcn/ui components
- ✅ Build custom components
- ✅ Learn state management
- ✅ Practice TypeScript

**Week 3: Integration**

- ✅ API integration patterns
- ✅ Supabase authentication
- ✅ Form handling
- ✅ Error handling

**Week 4: Production**

- ✅ Build optimization
- ✅ Deployment strategies
- ✅ Performance monitoring
- ✅ Security best practices

---

## 🎯 Project Status

### Current Version

- **Version:** 0.1.0
- **Status:** Production-ready ✅
- **Last Updated:** February 1, 2026

### Features

- ✅ Dashboard with server monitoring
- ✅ NexusAI chat-to-code interface
- ✅ Database manager
- ✅ VPN configuration
- ✅ User authentication
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Real-time updates

### Roadmap

**Next Sprint:**

- ⏳ Enhanced analytics dashboard
- ⏳ Mobile app integration
- ⏳ Advanced user permissions
- ⏳ WebSocket real-time updates

**Future:**

- 🔮 AI-powered insights
- 🔮 Multi-language support
- 🔮 Advanced threat detection
- 🔮 Custom dashboards

---

## 📞 Support

### Quick Help

- **Documentation:** Start with [Complete Guide](./NEXTJS_COMPLETE_GUIDE.md)
- **Cheat Sheet:** Keep [Quick Reference](./NEXTJS_QUICK_REFERENCE.md) handy
- **Logs:** `npm run dev` and check browser console

### Getting Help

1. **Check docs:** Read Complete Guide first
2. **Search issues:** Check GitHub issues
3. **Browser DevTools:** Console, Network, React tabs
4. **Ask team:** Team chat or meetings

### Useful Commands

```bash
# Development
npm run dev         # Start dev server
npm run build       # Test build
npm run lint        # Check code

# Debugging
console.log()       # Log to browser console
debugger           # Pause execution

# Docker
docker logs vpn-web-dashboard
docker exec -it vpn-web-dashboard sh
```

---

## 📝 Changelog

### v0.1.0 (2026-02-01)

**Added:**

- ✨ Complete Next.js documentation
- ✨ Quick reference guide
- ✨ Production-ready README
- ✨ NexusAI integration
- ✨ Database manager
- ✨ Enhanced UI/UX

**Improved:**

- 🚀 Performance optimization
- 🚀 TypeScript coverage
- 🚀 Component structure
- 🚀 Error handling

**Fixed:**

- 🐛 API integration issues
- 🐛 Authentication flow
- 🐛 Responsive design bugs

---

## 📄 License

**Proprietary** - VPN Enterprise Platform  
All rights reserved © 2026

---

## 👥 Team

**Maintainers:**

- Frontend Team - Web Dashboard
- Backend Team - API Integration
- DevOps Team - Deployment & Infrastructure

**Contributors:**

- You! (Learning and contributing)

---

**Built with ❤️ using Next.js, React, and TypeScript**

**Last Updated:** February 1, 2026  
**Documentation Status:** Complete & Production-Ready ✅

---

## 🎓 Start Learning

1. **Read:** [Complete Guide](./NEXTJS_COMPLETE_GUIDE.md) (comprehensive)
2. **Reference:** [Quick Reference](./NEXTJS_QUICK_REFERENCE.md) (daily use)
3. **Practice:** `npm run dev` and start building
4. **Ask:** Team is here to help

**You've got this! Happy coding!** 🚀

Vercel (recommended for serverless Next.js)

1. Add the project to Vercel and link the Git repository.
2. Set the required environment variables in the Vercel dashboard (both Production and Preview): `NEXT_PUBLIC_API_URL`, Supabase keys, and any server secrets.
3. Use the CI/CD workflow or manual deploy. We have helper scripts in `scripts/`:

```bash
# from repo root
./scripts/deploy-vercel.sh         # build + deploy API and web
./scripts/auto-deploy.sh "msg" --skip-api-build
```

Docker / Self-hosted (infrastructure/docker)

- If you want to self-host, build the Docker image via the `infrastructure/docker/Dockerfile.web` and deploy it behind the reverse-proxy (nginx) defined in `infrastructure/docker/docker-compose.yml`.

Example (build and run locally):

```bash
docker build -t vpn-web-dashboard -f infrastructure/docker/Dockerfile.web ..
docker run -e NEXT_PUBLIC_API_URL=http://host.docker.internal:3000 -p 3001:3000 vpn-web-dashboard
```

Notes about hostnames: In the production compose, nginx proxies requests to the `web-dashboard` container and exposes it on standard HTTP/HTTPS.

## CI recommendations

- Use a pipeline that performs these gates:
  1.  Install dependencies (monorepo-aware install, e.g., npm ci at root).
  2.  Build affected packages (or `make build` which builds packages/api and web).
  3.  Run tests and linters.
  4.  Run `infrastructure/verify-stack.sh` against a disposable test environment if you bring up infra in CI.
  5.  Deploy to staging/preview, run smoke tests, then promote to production.

Our repo includes a `scripts/` folder and GitHub Actions workflows as examples — adapt them to add approval gates and automatic rollbacks.

## Testing & quality gates

- Unit tests: add `npm test` entries per package. Prefer Jest or Vitest for React/Next.
- Integration tests: run against a staging deployment or bring up the Docker compose in CI and run tests against published ports.
- E2E tests: use Playwright or Cypress and run them against a preview deployment.

Example local test commands:

```bash
# run unit tests for the web-dashboard package
cd apps/web-dashboard
npm test
```

## Observability & logs

- Client errors: use Sentry or Datadog RUM to capture front-end errors and performance metrics.
- Server logs (Next.js server): surface server logs to your log aggregator (for Compose we ship logs with Promtail to Loki).
- Metrics: instrument critical paths with Prometheus metrics in the API and surface dashboards in Grafana. The monitoring stack is in `infrastructure/monitoring`.

## Security notes

- Content Security Policy: add a strict CSP in production via headers if your app loads third-party scripts.
- Authentication: the app uses Supabase + session tokens. Never store refresh tokens in localStorage; prefer httpOnly cookies for refresh flows.
- Secrets: rotate regularly and store in a secret manager.

## Release & versioning

- For UI-only changes you can deploy via Vercel previews. For releases involving API or core packages, bump package versions, run full repo build and smoke tests.
- Use semantic-release or a similar automated release tool for consistent changelogs and version bumps.

## Troubleshooting & common tasks

- Common issue: "Failed to fetch" in the browser — check `NEXT_PUBLIC_API_URL` and ensure the API is reachable. For local dev set it to `http://localhost:3000`.
- Modal overlay/layout broken in dev — the repo contains a dev-only overlay helper: ensure `data-env` is set to the correct value in `app/layout.tsx` if you see dev helper CSS.
- Health check: API health endpoint is `GET /health` (http://localhost:3000/health). Use `infrastructure/verify-stack.sh` to validate local infra.

Useful debug commands

```bash
# view web container logs (if using compose)
docker compose -f infrastructure/docker/docker-compose.yml logs -f web-dashboard

# check network connectivity from inside the web container
docker exec -it vpn-web-dashboard sh -c "apk add --no-cache curl >/dev/null 2>&1 || true; curl -v http://api:3000/health"
```

## File map & where to look

- `app/` — Next.js App Router routes and layouts (primary application code)
- `components/` — Reusable UI components
- `lib/` — shared client helpers (`lib/api.ts` is the fetch wrapper that handles refresh token retry logic)
- `hooks/` — custom hooks used across the app
- `public/` — static assets
- `next.config.ts` — Next.js configuration
- `vercel.json` — Vercel routing/headers (if used)

## Contribution & code ownership

- Add CODEOWNERS for `apps/web-dashboard` to require reviews from UI owners on PRs touching the dashboard.
- Follow the repo branching and PR conventions: small PRs, descriptive titles, link issues, run CI for tests/lint.

## Appendix: useful commands

```bash
# development
cd apps/web-dashboard
npm install
npm run dev

# build & run locally
npm run build
npm run start

# lint & tests
npm run lint
npm test

# deploy via scripts (repo root)
./scripts/deploy-vercel.sh --web-project <slug>
./scripts/auto-deploy.sh "Deploy web: ..." --skip-api-build

# infra verification
infrastructure/verify-stack.sh
```

---

If you'd like, I can next:

- Add a dedicated `apps/web-dashboard/CONTRIBUTING.md` with coding guidelines, component style rules, and testing templates.
- Add a Playwright test scaffold for E2E smoke tests that run on every preview deployment.

Tell me which follow-up you prefer and I'll implement it.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
