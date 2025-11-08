# 🔐 VPN Enterprise - Enterprise-Level VPN Service

A production-ready, enterprise-grade VPN service built with WireGuard, Node.js, Supabase, and Next.js. This platform provides the infrastructure for a NordVPN-like service with user management, subscription handling, and a beautiful dashboard.

## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Next.js Web   │◄────►│   Node.js API    │◄────►│    Supabase     │
│    Dashboard    │      │   (Express.js)   │      │   (PostgreSQL)  │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                 ▲
                                 │
                                 ▼
                         ┌──────────────────┐
                         │  WireGuard VPN   │
                         │     Servers      │
                         └──────────────────┘
```

## 📦 Project Structure

```
vpn-enterprise/
├── packages/
│   ├── api/              # REST API server (Express.js)
│   ├── auth/             # Authentication & authorization
│   ├── database/         # Supabase database layer
│   ├── vpn-core/         # VPN server management
│   ├── billing/          # Subscription & payment handling
│   └── shared/           # Shared utilities
├── apps/
│   └── web-dashboard/    # Next.js user dashboard
└── infrastructure/
    ├── docker/           # Docker configurations
    └── monitoring/       # Monitoring & logging
```

## ✨ Features

### Core Features
- ✅ **WireGuard Integration** - Fast, modern VPN protocol
- ✅ **User Authentication** - Powered by Supabase Auth
- ✅ **Subscription Management** - Free, Basic, Premium, Enterprise tiers
- ✅ **Multi-Device Support** - Connect multiple devices per user
- ✅ **Server Load Balancing** - Automatic server selection
- ✅ **Connection Tracking** - Real-time connection monitoring
- ✅ **Data Usage Analytics** - Track bandwidth and data usage
- ✅ **Global Server Network** - Deploy servers worldwide

### Database Schema
- **servers** - VPN server information and status
- **user_subscriptions** - User subscription plans and billing
- **user_devices** - User devices with WireGuard keys
- **connection_logs** - Connection history and analytics
- **server_statistics** - Server performance metrics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account (https://supabase.com)
- Ubuntu server with WireGuard installed
- (Optional) Stripe account for payments

### 1. Clone and Install

\`\`\`bash
git clone <your-repo>
cd vpn-enterprise
npm install
\`\`\`

### 2. Set Up Supabase

1. **Create a Supabase project**: https://app.supabase.com

2. **Run the database schema**:
   - Go to SQL Editor in Supabase
   - Copy and execute `/packages/database/schema.sql`

3. **Get your credentials**:
   - Project Settings → API
   - Copy `Project URL` and `anon/public key`
   - Copy `service_role key` (keep it secret!)

### 3. Configure Environment Variables

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` with your Supabase credentials:

\`\`\`env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
\`\`\`

### 4. Start the Development Server

\`\`\`bash
# Start API server
cd packages/api
npm run dev
\`\`\`

The API will be running at http://localhost:3000

## 📡 API Endpoints

### Public Endpoints

\`\`\`
GET  /health                    # Health check
GET  /api/v1/servers            # List available VPN servers
POST /api/v1/auth/signup        # User registration
POST /api/v1/auth/login         # User login
\`\`\`

### Protected Endpoints (Require Authentication)

\`\`\`
GET    /api/v1/user/profile           # Get user profile
GET    /api/v1/user/subscription      # Get subscription info
GET    /api/v1/user/devices           # List user devices
POST   /api/v1/user/devices           # Add new device
DELETE /api/v1/user/devices/:id       # Remove device

GET    /api/v1/vpn/status             # VPN server status
POST   /api/v1/vpn/connect            # Start VPN connection
POST   /api/v1/vpn/disconnect         # End VPN connection
GET    /api/v1/vpn/history            # Connection history
\`\`\`

### Admin Endpoints

\`\`\`
POST   /api/v1/admin/servers          # Add new server
PUT    /api/v1/admin/servers/:id      # Update server
DELETE /api/v1/admin/servers/:id      # Remove server
GET    /api/v1/admin/users            # List all users
GET    /api/v1/admin/statistics       # Platform statistics
\`\`\`

## 🔧 Development

### Run Tests
\`\`\`bash
npm test
\`\`\`

### Build for Production
\`\`\`bash
npm run build
\`\`\`

### Start Production Server
\`\`\`bash
npm start
\`\`\`

## 🌐 WireGuard Setup

Your WireGuard server should already be configured. To integrate it:

1. **Get server public key**:
\`\`\`bash
sudo cat /etc/wireguard/public.key
\`\`\`

2. **Add server to database**:
Use Supabase dashboard or API to add server information.

3. **Configure environment**:
Update `.env` with your WireGuard configuration.

## 📊 Subscription Tiers

| Plan       | Price    | Devices | Data Limit | Features              |
|------------|----------|---------|------------|-----------------------|
| Free       | $0/month | 1       | 10 GB/mo   | Basic features        |
| Basic      | $9/month | 3       | Unlimited  | All servers           |
| Premium    | $15/month| 5       | Unlimited  | Premium servers + P2P |
| Enterprise | Custom   | Unlimited| Unlimited  | Dedicated support     |

## 🔒 Security Best Practices

1. **Never commit `.env` files** - They contain sensitive keys
2. **Use HTTPS in production** - Encrypt all traffic
3. **Rotate keys regularly** - Update WireGuard and API keys
4. **Enable RLS in Supabase** - Row-level security is enabled by default
5. **Use service role key only server-side** - Never expose to clients

## 📦 Package Details

### @vpn-enterprise/api
Express.js REST API server with rate limiting, CORS, and security headers.

### @vpn-enterprise/auth
Authentication service using Supabase Auth with JWT validation.

### @vpn-enterprise/database
Type-safe Supabase client with repository pattern for data access.

### @vpn-enterprise/vpn-core
WireGuard integration, server management, and connection tracking.

### @vpn-enterprise/billing
(Coming soon) Stripe integration for subscription management.

## 🚀 Deployment

### Deploy to Production

1. **Set up a VPS** (AWS, DigitalOcean, Oracle Cloud, etc.)
2. **Install WireGuard** on the server
3. **Configure environment variables** for production
4. **Use PM2** or similar for process management
5. **Set up NGINX** as reverse proxy
6. **Configure SSL/TLS** with Let's Encrypt

### Deploy with Docker

\`\`\`bash
docker-compose up -d
\`\`\`

## 📝 License

ISC

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ for enterprise-grade VPN services
