# ⚡ Next.js Web Dashboard Quick Reference

**Print this out! Your daily frontend cheat sheet.**

---

## 🚀 Essential Commands

### Development

```bash
# Start dev server
cd apps/web-dashboard
npm run dev

# Open browser
open http://localhost:3000

# Watch logs
npm run dev | grep -i error
```

### Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm run start

# Deploy to Vercel
vercel --prod

# Docker
docker compose up -d web-dashboard
docker logs -f vpn-web-dashboard
```

### Maintenance

```bash
# Install dependencies
npm install

# Update dependencies
npm update

# Check for issues
npm run lint

# Clean build
rm -rf .next
npm run build
```

---

## 📁 Project Structure

```
apps/web-dashboard/
├── app/                    # 🔥 Pages (App Router)
│   ├── page.tsx           # / (home)
│   ├── layout.tsx         # Root layout
│   ├── dashboard/         # /dashboard/*
│   │   ├── page.tsx       # /dashboard
│   │   ├── servers/       # /dashboard/servers
│   │   ├── nexusAi/       # /dashboard/nexusAi
│   │   └── databases/     # /dashboard/databases
│   └── auth/              # /auth/*
│
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard components
│   └── database/         # Database UI
│
├── lib/                  # Utilities
│   ├── api.ts           # API client
│   ├── utils.ts         # Helpers
│   └── store.ts         # Zustand state
│
├── hooks/               # Custom hooks
├── public/              # Static files (images, etc.)
├── next.config.ts       # Next.js config
└── package.json         # Dependencies
```

---

## 🎯 Key Concepts

### File-Based Routing

```
app/page.tsx              → /
app/about/page.tsx        → /about
app/dashboard/page.tsx    → /dashboard
app/dashboard/servers/page.tsx → /dashboard/servers
```

### Special Files

```
page.tsx       - Page content
layout.tsx     - Wraps pages (nav, sidebar)
loading.tsx    - Loading UI (Suspense)
error.tsx      - Error UI (Error boundary)
not-found.tsx  - 404 page
route.ts       - API endpoint
```

### Server vs Client Components

**Server Component (default):**

```tsx
// No 'use client' = Server Component
export default async function Page() {
  const data = await fetch('...')
  return <div>{data}</div>
}
```

**Client Component:**

```tsx
'use client' // ← Required for hooks!

import { useState } from 'react'

export default function Page() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

**When to use 'use client':**

- ✅ Need `useState`, `useEffect`, etc.
- ✅ Need event handlers (`onClick`, etc.)
- ✅ Need browser APIs (`window`, `localStorage`)

---

## 🧩 Common Patterns

### Fetch Data (Client)

```tsx
'use client'

import { useEffect, useState } from 'react'

export function ServerList() {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/servers')
      .then((res) => res.json())
      .then(setServers)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading...</p>

  return (
    <div>
      {servers.map((server) => (
        <div key={server.id}>{server.name}</div>
      ))}
    </div>
  )
}
```

### Fetch Data (Server)

```tsx
// No 'use client' = Server Component
export default async function Page() {
  const res = await fetch('https://api.example.com/data', {
    cache: 'no-store', // Don't cache
  })
  const data = await res.json()

  return <div>{data.title}</div>
}
```

### Form Handling

```tsx
'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'

export function CreateServerForm() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (!res.ok) throw new Error('Failed')

      toast.success('Server created!')
      setName('')
    } catch (error) {
      toast.error('Error creating server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder='Server name'
      />
      <button type='submit' disabled={loading}>
        {loading ? 'Creating...' : 'Create'}
      </button>
    </form>
  )
}
```

### Modal Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function MyModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Modal</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modal Title</DialogTitle>
        </DialogHeader>
        <p>Modal content goes here</p>
      </DialogContent>
    </Dialog>
  )
}
```

### Loading State

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className='flex justify-center items-center p-8'>
      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600' />
    </div>
  )
}
```

### Error Boundary

```tsx
// app/dashboard/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className='p-8'>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

---

## 🎨 Tailwind CSS Cheat Sheet

### Layout

```tsx
<div className="flex items-center justify-between">
<div className="grid grid-cols-3 gap-4">
<div className="container mx-auto px-4">
```

### Spacing

```tsx
<div className="p-4">          // padding all sides
<div className="px-4 py-2">    // padding horizontal/vertical
<div className="mt-4 mb-8">    // margin top/bottom
<div className="space-y-4">    // gap between children
```

### Typography

```tsx
<h1 className="text-3xl font-bold">
<p className="text-sm text-gray-600">
<span className="text-blue-600 underline">
```

### Colors

```tsx
<div className="bg-blue-600 text-white">
<div className="border border-gray-200">
<button className="bg-red-500 hover:bg-red-600">
```

### Responsive

```tsx
<div className="
  w-full         // mobile
  md:w-1/2       // tablet
  lg:w-1/3       // desktop
">

<div className="hidden md:block">  // hide on mobile
<div className="block md:hidden">  // show only on mobile
```

### States

```tsx
<button className="hover:bg-blue-700 active:bg-blue-800">
<input className="focus:ring-2 focus:ring-blue-500">
<div className="group-hover:opacity-100">
```

---

## 🔌 API Integration

### API Client Setup

```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export async function fetchServers() {
  const res = await fetch(`${API_BASE}/servers`, {
    credentials: 'include', // Send cookies
  })
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export async function createServer(data: any) {
  const res = await fetch(`${API_BASE}/servers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create')
  return res.json()
}
```

### Usage

```tsx
import { fetchServers, createServer } from '@/lib/api'

// Fetch
const servers = await fetchServers()

// Create
await createServer({ name: 'Server 1', location: 'US' })
```

---

## 🔐 Authentication (Supabase)

### Login

```tsx
'use client'

import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

async function handleLogin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    toast.error(error.message)
  } else {
    toast.success('Logged in!')
    window.location.href = '/dashboard'
  }
}
```

### Logout

```tsx
async function handleLogout() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    toast.error(error.message)
  } else {
    window.location.href = '/'
  }
}
```

### Get User

```tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function UserProfile() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  return <div>Welcome, {user?.email}</div>
}
```

---

## 📦 Component Library (shadcn/ui)

### Button

```tsx
import { Button } from '@/components/ui/button'

<Button>Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Ghost</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button disabled>Disabled</Button>
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

;<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content goes here</CardContent>
</Card>
```

### Input

```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

<Label>Email</Label>
<Input type="email" placeholder="Email" />
```

### Select

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

;<Select>
  <SelectTrigger>
    <SelectValue placeholder='Select option' />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value='1'>Option 1</SelectItem>
    <SelectItem value='2'>Option 2</SelectItem>
  </SelectContent>
</Select>
```

### Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

;<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <p>Content</p>
  </DialogContent>
</Dialog>
```

### Tabs

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

;<Tabs defaultValue='tab1'>
  <TabsList>
    <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
    <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value='tab1'>Content 1</TabsContent>
  <TabsContent value='tab2'>Content 2</TabsContent>
</Tabs>
```

---

## 💾 State Management (Zustand)

### Create Store

```typescript
// lib/store.ts
import { create } from 'zustand'

interface Store {
  count: number
  increment: () => void
  decrement: () => void
}

export const useStore = create<Store>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}))
```

### Use Store

```tsx
'use client'

import { useStore } from '@/lib/store'

export function Counter() {
  const count = useStore((state) => state.count)
  const increment = useStore((state) => state.increment)
  const decrement = useStore((state) => state.decrement)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  )
}
```

---

## 🛠️ Debugging

### Console Logging

```typescript
console.log('Data:', data)
console.error('Error:', error)
console.table(servers) // Nice table view
```

### React DevTools

1. Install React DevTools extension
2. Open DevTools → React tab
3. Inspect components, props, state

### Network Tab

1. Open DevTools → Network
2. Filter: XHR/Fetch
3. Click request to see details

### Breakpoints

```tsx
export function MyComponent() {
  debugger // Pauses execution here
  return <div>Content</div>
}
```

---

## 🐛 Troubleshooting

### Issue: "Cannot use useState"

**Cause:** Using hook in Server Component  
**Fix:** Add `'use client'` at top of file

### Issue: Page not found (404)

**Cause:** File not named `page.tsx`  
**Fix:** Rename to `page.tsx`

### Issue: Environment variable undefined

**Cause:** Not prefixed with `NEXT_PUBLIC_`  
**Fix:** Rename and restart dev server

### Issue: Hydration error

**Cause:** Server/client HTML mismatch  
**Fix:** Use `useEffect` for client-only code

### Issue: API calls fail

**Cause:** CORS or wrong URL  
**Fix:** Check `NEXT_PUBLIC_API_URL` env var

### Check Logs

```bash
# Dev server
npm run dev

# Production (Vercel)
vercel logs

# Production (Docker)
docker logs vpn-web-dashboard
```

---

## 🌐 Environment Variables

```bash
# .env.local (create this file)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# API
NEXT_PUBLIC_API_URL=http://localhost:5000

# Production API
NEXT_PUBLIC_API_URL=https://chatbuilds.com
```

**Important:** Restart dev server after changing env vars!

---

## 📱 Responsive Breakpoints

```
Default: 0px      (mobile)
sm:      640px    (large phones)
md:      768px    (tablets)
lg:      1024px   (desktops)
xl:      1280px   (large desktops)
2xl:     1536px   (extra large)
```

**Example:**

```tsx
<div className="
  text-sm      // mobile
  md:text-base // tablet+
  lg:text-lg   // desktop+
">
```

---

## 🚀 Deployment Checklist

- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Environment variables set
- [ ] API endpoints tested
- [ ] Authentication works
- [ ] Mobile responsive
- [ ] Images optimized
- [ ] Performance tested

---

## 📚 Quick Links

**Documentation:**

- Next.js: https://nextjs.org/docs
- React: https://react.dev
- Tailwind: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com
- Supabase: https://supabase.com/docs

**Local URLs:**

- Dev: http://localhost:3000
- Prod: https://chatbuilds.com

---

## 💡 Pro Tips

### 1. Use TypeScript

```tsx
interface Props {
  title: string
  count: number
}

export function Component({ title, count }: Props) {
  return (
    <div>
      {title}: {count}
    </div>
  )
}
```

### 2. Extract Reusable Components

```tsx
// Bad
<div className="p-4 border rounded">...</div>
<div className="p-4 border rounded">...</div>

// Good
<Card>...</Card>
<Card>...</Card>
```

### 3. Use Custom Hooks

```tsx
// hooks/use-servers.ts
export function useServers() {
  const [servers, setServers] = useState([])
  // ... fetch logic
  return { servers }
}

// In component
const { servers } = useServers()
```

### 4. Error Boundaries

```tsx
// app/error.tsx catches errors automatically!
'use client'

export default function Error({ error, reset }) {
  return (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### 5. Loading States

```tsx
// app/loading.tsx shows while page loads!
export default function Loading() {
  return <Spinner />
}
```

---

## 🎯 Daily Workflow

**Morning:**

```bash
# Pull latest
git pull

# Start dev
npm run dev
```

**During development:**

```bash
# Make changes
# Save file → Hot reload automatically!

# Check console for errors
# Check Network tab for API calls
```

**Before committing:**

```bash
# Check for errors
npm run lint

# Test build
npm run build

# Commit
git add .
git commit -m "feat: Add feature"
git push
```

---

**Last Updated:** February 1, 2026  
**Quick, simple, always helpful** ⚡

---

_Keep this next to your keyboard. Copy-paste with confidence!_
