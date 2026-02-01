# 🎨 Complete Next.js Web Dashboard Guide

**Your Lifetime Reference for Understanding and Maintaining the Frontend**

---

## 📚 Table of Contents

1. [Next.js Basics - Start Here](#1-nextjs-basics---start-here)
2. [Understanding Your Dashboard](#2-understanding-your-dashboard)
3. [Project Structure](#3-project-structure)
4. [App Router Deep Dive](#4-app-router-deep-dive)
5. [Components Architecture](#5-components-architecture)
6. [State Management](#6-state-management)
7. [API Integration](#7-api-integration)
8. [Styling & Design](#8-styling--design)
9. [Authentication](#9-authentication)
10. [Build & Deployment](#10-build--deployment)
11. [Testing & Debugging](#11-testing--debugging)
12. [Quick Reference](#12-quick-reference)

---

## 1. Next.js Basics - Start Here

### What is Next.js?

**Next.js** is a React framework for building web applications. It's:

- **React-based** - Uses React components you know
- **Server-rendered** - Pages load faster (SEO-friendly)
- **File-based routing** - Files in `app/` become routes automatically
- **Full-stack** - Can have API routes alongside pages
- **Production-ready** - Built-in optimization, caching, bundling

### Why Next.js for Your Project?

In VPN Enterprise, this Next.js dashboard:

1. **Admin Interface** - Manage VPN servers, users, billing
2. **NexusAI** - Chat-to-code interface for building apps
3. **Database Manager** - Visual PostgreSQL management
4. **Analytics Dashboard** - Real-time VPN usage stats
5. **Authentication** - Secure login with Supabase
6. **Responsive** - Works on desktop, tablet, mobile

### Your Dashboard in the System

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser                               │
│            https://chatbuilds.com                           │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                 Nginx Reverse Proxy                         │
│         (routes requests to appropriate services)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ↓             ↓             ↓
┌────────────────┐ ┌─────────┐ ┌──────────┐
│  Next.js Web   │ │   API   │ │ Python   │
│  Dashboard     │ │  :5000  │ │ AI :5001 │
│  :3000         │ │         │ │          │
│                │ │         │ │          │
│ YOUR CODE      │ │ Backend │ │ Ollama   │
└────────────────┘ └─────────┘ └──────────┘
         ↓
┌────────────────┐
│   Supabase     │
│   (Auth/DB)    │
└────────────────┘
```

**What happens when you visit the site:**

1. Browser requests `https://chatbuilds.com`
2. Nginx routes to Next.js (port 3000)
3. Next.js renders React components
4. Page loads in browser
5. JavaScript makes API calls to backend
6. Dashboard updates with real data

---

## 2. Understanding Your Dashboard

### Technology Stack

**Core Framework:**

- **Next.js 16.0.10** - App Router (latest)
- **React 19.2.0** - UI library
- **TypeScript** - Type-safe JavaScript

**UI Libraries:**

- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library (Radix UI)
- **Lucide Icons** - Icon set
- **GSAP** - Animations

**State Management:**

- **Zustand** - Lightweight state store
- **React Hooks** - Component state

**API & Data:**

- **Supabase** - Authentication & database
- **Custom API client** - `/lib/api.ts`
- **React Hot Toast** - Notifications

**Developer Tools:**

- **ESLint** - Code linting
- **TypeScript** - Type checking
- **Monaco Editor** - Code editor (NexusAI)

### Key Features

**1. Dashboard Pages**

```
/dashboard              - Overview
/dashboard/servers      - VPN servers management
/dashboard/clients      - Client connections
/dashboard/analytics    - Usage statistics
/dashboard/billing      - Subscription management
/dashboard/security     - Security settings
```

**2. NexusAI**

```
/dashboard/nexusAi      - Chat-to-code interface
```

**3. Database Manager**

```
/dashboard/databases    - PostgreSQL management
```

**4. Admin Tools**

```
/dashboard/admin        - Admin panel
/dashboard/tenants      - Multi-tenancy
```

### File Structure Overview

```
apps/web-dashboard/
├── app/                    # Pages (App Router)
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── dashboard/         # Dashboard routes
│   │   ├── page.tsx       # /dashboard
│   │   ├── servers/       # /dashboard/servers
│   │   ├── nexusAi/       # /dashboard/nexusAi
│   │   └── databases/     # /dashboard/databases
│   └── auth/              # Auth pages
│
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard components
│   ├── database/         # Database UI
│   └── auth/             # Auth components
│
├── lib/                   # Utilities
│   ├── api.ts            # API client
│   ├── utils.ts          # Helper functions
│   ├── store.ts          # Zustand store
│   └── supabase/         # Supabase client
│
├── public/               # Static files
├── hooks/                # Custom React hooks
├── next.config.ts        # Next.js config
├── tailwind.config.ts    # Tailwind config
└── package.json          # Dependencies
```

---

## 3. Project Structure

### The `app/` Directory (App Router)

**How routing works:**

```
app/
├── page.tsx              → /
├── about/
│   └── page.tsx          → /about
├── dashboard/
│   ├── page.tsx          → /dashboard
│   ├── layout.tsx        → Layout for /dashboard/*
│   └── servers/
│       └── page.tsx      → /dashboard/servers
```

**File conventions:**

| File            | Purpose                        |
| --------------- | ------------------------------ |
| `page.tsx`      | Public page at that route      |
| `layout.tsx`    | Wraps all child pages          |
| `loading.tsx`   | Loading UI (Suspense boundary) |
| `error.tsx`     | Error UI (Error boundary)      |
| `not-found.tsx` | 404 page                       |
| `route.ts`      | API endpoint                   |

**Example: Dashboard Server Page**

File: `app/dashboard/servers/page.tsx`

```tsx
export default function ServersPage() {
  return (
    <div>
      <h1>VPN Servers</h1>
      {/* Server list */}
    </div>
  )
}
```

Accessible at: `/dashboard/servers`

### The `components/` Directory

**Organization:**

```
components/
├── ui/                  # shadcn/ui base components
│   ├── button.tsx      # Button component
│   ├── card.tsx        # Card component
│   ├── dialog.tsx      # Modal dialog
│   └── ...
│
├── dashboard/          # Dashboard-specific
│   ├── server-card.tsx
│   ├── stats-widget.tsx
│   └── ...
│
├── database/           # Database manager
│   ├── query-editor.tsx
│   ├── schema-viewer.tsx
│   └── ...
│
└── auth/              # Authentication
    ├── login-form.tsx
    └── auth-hydrator.tsx
```

**Component example:**

```tsx
// components/dashboard/server-card.tsx
interface ServerCardProps {
  name: string
  status: 'online' | 'offline'
  load: number
}

export function ServerCard({ name, status, load }: ServerCardProps) {
  return (
    <div className='p-4 border rounded-lg'>
      <h3>{name}</h3>
      <span className={status === 'online' ? 'text-green-500' : 'text-red-500'}>
        {status}
      </span>
      <p>Load: {load}%</p>
    </div>
  )
}
```

### The `lib/` Directory

**Purpose:** Shared utilities, API clients, helpers

**Key files:**

**`lib/api.ts`** - API Client

```typescript
// Centralized API calls
export async function fetchServers() {
  const response = await fetch(`${API_BASE}/servers`)
  return response.json()
}

export async function createVpnConfig(data: VpnConfigData) {
  const response = await fetch(`${API_BASE}/vpn/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return response.json()
}
```

**`lib/utils.ts`** - Helper Functions

```typescript
// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format bytes (1024 → "1 KB")
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
}
```

**`lib/store.ts`** - Zustand State

```typescript
import { create } from 'zustand'

interface AppState {
  user: User | null
  setUser: (user: User | null) => void
  servers: Server[]
  setServers: (servers: Server[]) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  servers: [],
  setServers: (servers) => set({ servers }),
}))
```

**Usage:**

```tsx
import { useAppStore } from '@/lib/store'

function MyComponent() {
  const servers = useAppStore((state) => state.servers)
  const setServers = useAppStore((state) => state.setServers)

  // Use servers...
}
```

---

## 4. App Router Deep Dive

### Server vs Client Components

**Next.js 13+ uses two types of components:**

**Server Components (default):**

```tsx
// app/dashboard/page.tsx
// No 'use client' directive = Server Component

export default async function DashboardPage() {
  // Can fetch data directly
  const data = await fetch('https://api.example.com/stats')
  const stats = await data.json()

  return <div>{stats.users} users</div>
}
```

**Benefits:**

- ✅ Smaller JavaScript bundle
- ✅ Can access backend resources directly
- ✅ Better for SEO
- ✅ Faster initial page load

**Client Components:**

```tsx
'use client' // Required at top of file

import { useState } from 'react'

export default function InteractiveWidget() {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>
  )
}
```

**When to use:**

- ❗ Need `useState`, `useEffect`, etc.
- ❗ Need event handlers (`onClick`, etc.)
- ❗ Need browser APIs (`window`, `localStorage`)
- ❗ Need third-party libraries that use hooks

**Rule of thumb:**

- Start with Server Components
- Add `'use client'` only when needed
- Keep `'use client'` as low in tree as possible

### Layouts

**Purpose:** Wrap pages with shared UI (nav, sidebar, etc.)

**Root Layout:**

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en'>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
```

**Nested Layout:**

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex'>
      <Sidebar />
      <main className='flex-1'>{children}</main>
    </div>
  )
}
```

**Layout hierarchy:**

```
app/layout.tsx                    → Wraps everything
  └── app/dashboard/layout.tsx    → Wraps /dashboard/*
      └── app/dashboard/page.tsx  → Dashboard content
```

### Loading States

**Create a `loading.tsx` file:**

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className='flex items-center justify-center p-8'>
      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600' />
    </div>
  )
}
```

**Automatically shown while page loads!**

### Error Handling

**Create an `error.tsx` file:**

```tsx
// app/dashboard/error.tsx
'use client' // Error components must be Client Components

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className='p-8'>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

**Catches errors in that route segment!**

---

## 5. Components Architecture

### shadcn/ui Components

**What is shadcn/ui?**

- Collection of reusable components
- Built on Radix UI (accessibility)
- Styled with Tailwind CSS
- Copy-paste into your project (not an npm package)

**Your UI components:**

```
components/ui/
├── button.tsx        - Buttons
├── card.tsx          - Cards
├── dialog.tsx        - Modals
├── dropdown-menu.tsx - Dropdowns
├── input.tsx         - Text inputs
├── label.tsx         - Form labels
├── select.tsx        - Select dropdowns
├── switch.tsx        - Toggle switches
├── tabs.tsx          - Tabs
└── ...
```

**Example: Using Button**

```tsx
import { Button } from '@/components/ui/button'

function MyComponent() {
  return (
    <>
      <Button>Default</Button>
      <Button variant='destructive'>Delete</Button>
      <Button variant='outline'>Cancel</Button>
      <Button size='sm'>Small</Button>
      <Button size='lg'>Large</Button>
    </>
  )
}
```

**Example: Using Card**

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

function StatsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Users</CardTitle>
      </CardHeader>
      <CardContent>
        <p className='text-3xl font-bold'>1,234</p>
      </CardContent>
    </Card>
  )
}
```

### Component Patterns

**1. Presentational Component:**

```tsx
// components/dashboard/server-card.tsx
interface ServerCardProps {
  server: {
    id: string
    name: string
    status: 'online' | 'offline'
    load: number
  }
}

export function ServerCard({ server }: ServerCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{server.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex justify-between'>
          <span>Status:</span>
          <span
            className={
              server.status === 'online' ? 'text-green-600' : 'text-red-600'
            }
          >
            {server.status}
          </span>
        </div>
        <div className='flex justify-between'>
          <span>Load:</span>
          <span>{server.load}%</span>
        </div>
      </CardContent>
    </Card>
  )
}
```

**2. Container Component:**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { ServerCard } from './server-card'
import { fetchServers } from '@/lib/api'

export function ServerList() {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServers()
      .then(setServers)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading...</p>

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
      {servers.map((server) => (
        <ServerCard key={server.id} server={server} />
      ))}
    </div>
  )
}
```

### Custom Hooks

**Location:** `hooks/`

**Example: useServers Hook**

```tsx
// hooks/use-servers.ts
import { useEffect, useState } from 'react'
import { fetchServers } from '@/lib/api'

export function useServers() {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchServers()
      .then(setServers)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { servers, loading, error }
}
```

**Usage:**

```tsx
import { useServers } from '@/hooks/use-servers'

export function ServerList() {
  const { servers, loading, error } = useServers()

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <div>
      {servers.map((server) => (
        <ServerCard key={server.id} server={server} />
      ))}
    </div>
  )
}
```

---

## 6. State Management

### Local State (useState)

**For component-specific state:**

```tsx
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}
```

### Global State (Zustand)

**Your store:** `lib/store.ts`

**Creating a store:**

```typescript
import { create } from 'zustand'

interface AppState {
  // State
  user: User | null
  servers: Server[]

  // Actions
  setUser: (user: User | null) => void
  setServers: (servers: Server[]) => void
  addServer: (server: Server) => void
  removeServer: (id: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  user: null,
  servers: [],

  // Actions
  setUser: (user) => set({ user }),
  setServers: (servers) => set({ servers }),
  addServer: (server) =>
    set((state) => ({
      servers: [...state.servers, server],
    })),
  removeServer: (id) =>
    set((state) => ({
      servers: state.servers.filter((s) => s.id !== id),
    })),
}))
```

**Using the store:**

```tsx
'use client'

import { useAppStore } from '@/lib/store'

export function UserProfile() {
  // Select specific state
  const user = useAppStore((state) => state.user)
  const setUser = useAppStore((state) => state.setUser)

  return (
    <div>
      <p>User: {user?.name ?? 'Not logged in'}</p>
      <button onClick={() => setUser(null)}>Logout</button>
    </div>
  )
}
```

**Benefits of Zustand:**

- ✅ Simple API (no providers, no boilerplate)
- ✅ TypeScript support
- ✅ Small bundle size
- ✅ DevTools support

### Server State (React Query - Future)

**For API data caching:**

```tsx
// Future implementation
import { useQuery } from '@tanstack/react-query'

export function ServerList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['servers'],
    queryFn: fetchServers,
  })

  // Auto caching, refetching, etc.
}
```

---

## 7. API Integration

### API Client (`lib/api.ts`)

**Base URL resolution:**

```typescript
// Determine API base URL
const ENV_API = process.env.NEXT_PUBLIC_API_URL
const INTERNAL_API = process.env.INTERNAL_API_URL

function resolveApiBase(): string {
  // In browser: use window.location.origin (same-origin for cookies)
  if (typeof window !== 'undefined') {
    // Self-hosted: always same-origin
    if (!window.location.hostname.endsWith('vercel.app')) {
      return window.location.origin
    }
  }

  // Server-side: use env vars
  return ENV_API || 'http://localhost:5000'
}

export const API_BASE = resolveApiBase()
```

**Why same-origin:**

- Cookies work (httpOnly refresh tokens)
- No CORS issues
- Nginx handles routing

### Making API Calls

**GET request:**

```typescript
export async function fetchServers(): Promise<Server[]> {
  const response = await fetch(`${API_BASE}/servers`, {
    credentials: 'include', // Send cookies
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch servers: ${response.statusText}`)
  }

  return response.json()
}
```

**POST request:**

```typescript
export async function createVpnConfig(data: VpnConfigData): Promise<VpnConfig> {
  const response = await fetch(`${API_BASE}/vpn/config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create config')
  }

  return response.json()
}
```

**Using in components:**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { fetchServers } from '@/lib/api'
import { toast } from 'react-hot-toast'

export function ServerList() {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServers()
      .then(setServers)
      .catch((error) => {
        toast.error(`Failed to load servers: ${error.message}`)
      })
      .finally(() => setLoading(false))
  }, [])

  // Render...
}
```

### Error Handling

**Pattern 1: Try-Catch**

```typescript
async function loadData() {
  try {
    const data = await fetchServers()
    setServers(data)
  } catch (error) {
    console.error('Error loading servers:', error)
    toast.error('Failed to load servers')
  }
}
```

**Pattern 2: Promise Catch**

```typescript
fetchServers()
  .then(setServers)
  .catch((error) => {
    console.error(error)
    toast.error(error.message)
  })
  .finally(() => setLoading(false))
```

### Loading States

**Show loading UI:**

```tsx
if (loading) {
  return (
    <div className='flex justify-center p-8'>
      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' />
    </div>
  )
}
```

### Notifications

**Using react-hot-toast:**

```tsx
import { toast } from 'react-hot-toast'

// Success
toast.success('Server created successfully!')

// Error
toast.error('Failed to delete server')

// Loading (with promise)
toast.promise(createServer(data), {
  loading: 'Creating server...',
  success: 'Server created!',
  error: 'Failed to create server',
})
```

---

## 8. Styling & Design

### Tailwind CSS

**Utility-first CSS framework:**

**Common patterns:**

```tsx
// Layout
<div className="flex items-center justify-between">
<div className="grid grid-cols-3 gap-4">
<div className="container mx-auto px-4">

// Spacing
<div className="p-4">          // padding: 1rem (all sides)
<div className="px-4 py-2">    // padding: 0.5rem vertical, 1rem horizontal
<div className="mt-4 mb-8">    // margin-top: 1rem, margin-bottom: 2rem

// Typography
<h1 className="text-3xl font-bold">
<p className="text-sm text-gray-600">

// Colors
<div className="bg-blue-600 text-white">
<div className="border border-gray-200">

// Responsive
<div className="hidden md:block">     // hidden on mobile, visible on tablet+
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// States
<button className="hover:bg-blue-700 active:bg-blue-800">
<input className="focus:ring-2 focus:ring-blue-500">
```

### Responsive Design

**Breakpoints:**

```
sm:  640px   - Small devices (phones landscape)
md:  768px   - Medium devices (tablets)
lg:  1024px  - Large devices (desktops)
xl:  1280px  - Extra large devices
2xl: 1536px  - 2X extra large devices
```

**Example:**

```tsx
<div
  className='
  w-full           // full width on mobile
  md:w-1/2         // half width on tablet
  lg:w-1/3         // third width on desktop
  p-4              // padding on all screens
  md:p-6           // more padding on tablet+
  lg:p-8           // even more on desktop
'
>
  Content
</div>
```

### Dark Mode

**Using Tailwind dark mode:**

```tsx
<div
  className='
  bg-white dark:bg-gray-900
  text-black dark:text-white
'
>
  Content
</div>
```

**Configure in `tailwind.config.ts`:**

```typescript
module.exports = {
  darkMode: 'class', // or 'media' for system preference
  // ...
}
```

### Custom Styles

**Global styles:** `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom base styles */
@layer base {
  h1 {
    @apply text-4xl font-bold;
  }
}

/* Custom components */
@layer components {
  .btn-primary {
    @apply bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700;
  }
}

/* Custom utilities */
@layer utilities {
  .text-shadow {
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  }
}
```

---

## 9. Authentication

### Supabase Authentication

**Client setup:** `lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
```

### Login

**Login form:**

```tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Logged in successfully!')
      window.location.href = '/dashboard'
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type='email'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder='Email'
      />
      <input
        type='password'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder='Password'
      />
      <button type='submit' disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
```

### Protected Routes

**Middleware:** `middleware.ts` (root of project)

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          response.cookies.set(name, value, options)
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

### Get Current User

**In Server Component:**

```tsx
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function DashboardPage() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookies().get(name)?.value
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <div>Welcome, {user?.email}</div>
}
```

**In Client Component:**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function UserProfile() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  return <div>Welcome, {user?.email}</div>
}
```

### Logout

```tsx
async function handleLogout() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    toast.error(error.message)
  } else {
    toast.success('Logged out')
    window.location.href = '/'
  }
}
```

---

## 10. Build & Deployment

### Development

**Start dev server:**

```bash
cd apps/web-dashboard
npm run dev
```

**Access:**

```
http://localhost:3000
```

**Hot reload:**

- Edit files in `app/` or `components/`
- Changes appear instantly in browser
- No manual refresh needed

### Production Build

**Build command:**

```bash
npm run build
```

**What it does:**

1. Type-checks TypeScript
2. Lints code with ESLint
3. Bundles JavaScript
4. Optimizes images
5. Generates static pages (when possible)
6. Creates `.next/` output directory

**Output:**

```
.next/
├── static/          - Static assets
├── server/          - Server-side code
└── standalone/      - Standalone deployment files
```

### Environment Variables

**Public (browser-accessible):**

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=https://chatbuilds.com
```

**Private (server-only):**

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...
```

**Access in code:**

```typescript
// Public (works in browser and server)
const apiUrl = process.env.NEXT_PUBLIC_API_URL

// Private (server-only, undefined in browser)
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
```

### Vercel Deployment

**Option 1: Automatic (GitHub)**

1. Connect repo to Vercel
2. Push to `main` branch
3. Vercel builds and deploys automatically

**Option 2: Manual (CLI)**

```bash
npm install -g vercel
cd apps/web-dashboard
vercel
```

**Environment variables:**

1. Go to Vercel dashboard
2. Project Settings → Environment Variables
3. Add all `NEXT_PUBLIC_*` and private vars
4. Redeploy

### Docker Deployment

**Dockerfile:**

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

**Build and run:**

```bash
docker build -t vpn-web-dashboard .
docker run -p 3000:3000 vpn-web-dashboard
```

### Production Checklist

- [ ] Environment variables set correctly
- [ ] Build succeeds without errors
- [ ] TypeScript errors fixed
- [ ] ESLint warnings addressed
- [ ] Images optimized
- [ ] API endpoints work
- [ ] Authentication tested
- [ ] Mobile responsive
- [ ] Performance tested (Lighthouse)
- [ ] Error tracking configured

---

## 11. Testing & Debugging

### Browser DevTools

**Console:**

```typescript
console.log('Debug:', data)
console.error('Error:', error)
console.table(servers) // Nice table view
```

**React DevTools:**

1. Install React DevTools extension
2. Open DevTools → React tab
3. Inspect component tree
4. View props, state, hooks

### Debugging Client Components

**Add debugger:**

```tsx
'use client'

export function MyComponent() {
  const [state, setState] = useState(0)

  debugger // Pauses execution here

  return <div>{state}</div>
}
```

**VS Code debugging:**

1. Add breakpoint (click line number)
2. Press F5 (Run → Start Debugging)
3. Choose "Next.js: debug full stack"

### Logging API Calls

**In `lib/api.ts`:**

```typescript
export async function fetchServers() {
  console.log('Fetching servers from:', `${API_BASE}/servers`)

  const response = await fetch(`${API_BASE}/servers`)

  console.log('Response status:', response.status)

  const data = await response.json()

  console.log('Received data:', data)

  return data
}
```

### Network Tab

1. Open DevTools → Network
2. Filter: XHR/Fetch
3. Click request to see:
   - Headers
   - Request payload
   - Response
   - Timing

### Common Issues

**Issue: Page not found (404)**

```
Cause: File not in correct location
Fix: Check file is named page.tsx in correct folder
```

**Issue: "Cannot use useState" error**

```
Cause: Using hook in Server Component
Fix: Add 'use client' at top of file
```

**Issue: API calls fail with CORS**

```
Cause: API doesn't allow frontend domain
Fix: Configure CORS in backend, or use same-origin
```

**Issue: Environment variable undefined**

```
Cause: Variable not prefixed with NEXT_PUBLIC_
Fix: Rename to NEXT_PUBLIC_VARNAME and restart dev server
```

**Issue: Hydration error**

```
Cause: Server HTML doesn't match client HTML
Common culprits:
- Date.now() (different on server vs client)
- Math.random()
- localStorage in initial render

Fix: Use useEffect for client-only code
```

### Production Debugging

**Check logs:**

```bash
# Vercel
vercel logs

# Docker
docker logs vpn-web-dashboard

# Server
pm2 logs
```

**Error tracking:**

- Sentry
- LogRocket
- Datadog

---

## 12. Quick Reference

### Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Docker
docker compose up -d web-dashboard
docker logs -f vpn-web-dashboard
docker exec -it vpn-web-dashboard sh
```

### Project Structure

```
apps/web-dashboard/
├── app/              # Pages (App Router)
├── components/       # React components
├── lib/              # Utilities, API client
├── hooks/            # Custom hooks
├── public/           # Static files
├── next.config.ts    # Next.js config
└── package.json      # Dependencies
```

### Key Files

```
app/layout.tsx        - Root layout
app/page.tsx          - Home page
app/dashboard/        - Dashboard pages
components/ui/        - UI components
lib/api.ts            - API client
lib/store.ts          - Zustand store
lib/supabase/         - Supabase client
```

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=https://chatbuilds.com
```

### Useful Snippets

**Fetch data:**

```typescript
const { data } = await fetch(`${API_BASE}/servers`).then((res) => res.json())
```

**Show toast:**

```typescript
import { toast } from 'react-hot-toast'
toast.success('Success!')
toast.error('Error!')
```

**Navigate:**

```typescript
import { useRouter } from 'next/navigation'
const router = useRouter()
router.push('/dashboard')
```

### Learning Resources

- **Next.js Docs:** https://nextjs.org/docs
- **React Docs:** https://react.dev
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **Supabase:** https://supabase.com/docs

---

**Last Updated:** February 1, 2026  
**Your frontend, fully documented** 🎨

---

_Master this guide and you'll confidently build and maintain the web dashboard for years to come!_
