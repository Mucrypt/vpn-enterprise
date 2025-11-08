# 🚀 VPN Enterprise - Complete Setup Guide

This guide will walk you through setting up your enterprise VPN service from scratch.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Environment Configuration](#environment-configuration)
4. [Running the Application](#running-the-application)
5. [Testing the API](#testing-the-api)
6. [Next Steps](#next-steps)

## ✅ Prerequisites

Before you begin, make sure you have:

- ✅ Node.js 18+ installed
- ✅ npm or yarn package manager
- ✅ Ubuntu server with WireGuard configured (you already have this!)
- ✅ Supabase account (free tier works great!)

## 🗄️ Supabase Setup

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in the details:
   - **Project name**: `vpn-enterprise`
   - **Database Password**: (Choose a strong password and save it!)
   - **Region**: Choose closest to your users
4. Wait for project creation (takes ~2 minutes)

### Step 2: Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Open the file `/home/mukulah/vpn-enterprise/packages/database/schema.sql`
4. Copy the entire content and paste it into the Supabase SQL editor
5. Click **Run** or press `Ctrl+Enter`
6. You should see "Success" - your database is now set up!

### Step 3: Get Your API Keys

1. Go to **Project Settings** → **API**
2. You'll need these three values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long string)
   - **service_role key**: `eyJhbGc...` (different long string)
3. Keep these safe - you'll need them next!

## ⚙️ Environment Configuration

### Step 1: Create Environment File

```bash
cd /home/mukulah/vpn-enterprise
cp .env.example .env
```

### Step 2: Edit the .env File

```bash
nano .env
```

Or use your preferred editor. Fill in these values:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-from-supabase
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-supabase

# Application Configuration
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# WireGuard Configuration (from your existing setup)
WIREGUARD_INTERFACE=wg0
WIREGUARD_PORT=51820
WIREGUARD_PUBLIC_KEY=4nEWZs+9Mvt9x1PmvFiCDpMMBK/JLkOamgUA66JoTTw=
WIREGUARD_SUBNET=10.0.0.0/24
```

**Important**: Replace the Supabase values with your actual keys!

### Step 3: Create .env file in API package

```bash
cp .env packages/api/.env
```

## 🏃 Running the Application

### Option 1: Development Mode (Recommended)

```bash
# From the api package directory
cd /home/mukulah/vpn-enterprise/packages/api
npm run dev
```

You should see:

```
╔════════════════════════════════════════════════╗
║   🔐 VPN ENTERPRISE API SERVER                 ║
╠════════════════════════════════════════════════╣
║   🚀 Server running on port 3000               ║
║   📚 Environment: development                  ║
║   🔒 Health check: http://localhost:3000/health║
╚════════════════════════════════════════════════╝
```

### Option 2: Production Mode

```bash
# Build the project
npm run build

# Start the server
npm start
```

## 🧪 Testing the API

### 1. Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-07T...",
  "service": "vpn-enterprise-api",
  "version": "1.0.0"
}
```

### 2. Get Available Servers

```bash
curl http://localhost:3000/api/v1/servers
```

### 3. Sign Up a New User

```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'
```

### 4. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'
```

Save the access token from the response!

### 5. Get User Subscription (Protected Route)

```bash
curl http://localhost:3000/api/v1/user/subscription \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## 📊 Verify Database

Go to your Supabase dashboard:

1. Click **Table Editor** (left sidebar)
2. You should see these tables:
   - `servers`
   - `user_subscriptions`
   - `user_devices`
   - `connection_logs`
   - `server_statistics`

3. Check `servers` table - you should see 5 sample servers already populated!

## 🎯 Next Steps

### 1. Add Your Real VPN Server

```bash
# In Supabase SQL Editor, run:
INSERT INTO servers (name, country, country_code, city, host, public_key, port)
VALUES (
  'My-VPN-Server',
  'Your Country',
  'US',  -- Your country code
  'Your City',
  'YOUR_SERVER_IP',  -- Your actual server IP
  '4nEWZs+9Mvt9x1PmvFiCDpMMBK/JLkOamgUA66JoTTw=',  -- Your WireGuard public key
  51820
);
```

### 2. Test VPN Connection Flow

```bash
# 1. Sign up
# 2. Login and get token
# 3. Get available servers
curl http://localhost:3000/api/v1/servers

# 4. Add a device
curl -X POST http://localhost:3000/api/v1/user/devices \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_name": "My Laptop",
    "os_type": "linux"
  }'
```

### 3. Build the Next.js Dashboard

Coming next! We'll create a beautiful web dashboard where users can:
- Sign up and login
- View available servers
- Manage devices
- Monitor connections
- See usage statistics

### 4. Set Up Billing (Optional)

Integrate Stripe for subscription payments.

## 🐛 Troubleshooting

### Server won't start?

**Check environment variables**:
```bash
cd /home/mukulah/vpn-enterprise/packages/api
cat .env
```

Make sure all Supabase keys are set correctly.

### Database connection errors?

**Verify Supabase URL**:
- Check if URL is correct
- Check if service role key is set
- Make sure you ran the schema.sql file

### Import errors in TypeScript?

```bash
# Reinstall dependencies
cd /home/mukulah/vpn-enterprise
npm install

# Rebuild TypeScript
npm run build
```

## 📚 API Documentation

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/servers` | List all active servers |
| GET | `/api/v1/servers/country/:code` | Get servers by country |
| GET | `/api/v1/servers/best` | Get best available server |
| POST | `/api/v1/auth/signup` | Register new user |
| POST | `/api/v1/auth/login` | User login |

### Protected Endpoints (Require `Authorization: Bearer TOKEN`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/user/subscription` | Get user subscription |
| GET | `/api/v1/user/devices` | List user devices |
| POST | `/api/v1/user/devices` | Add new device |
| DELETE | `/api/v1/user/devices/:id` | Remove device |
| GET | `/api/v1/user/connections` | Connection history |
| GET | `/api/v1/user/usage` | Data usage stats |

## 🎉 Congratulations!

You now have a fully functional enterprise VPN backend! 

Your system includes:
- ✅ User authentication with Supabase
- ✅ Subscription management
- ✅ Multi-device support
- ✅ WireGuard integration
- ✅ Connection tracking
- ✅ Usage analytics
- ✅ Server load balancing

Next: Build the web dashboard with Next.js!
