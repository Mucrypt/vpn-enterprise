import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type RouteContext = {
  // Next 16's generated types model `params` as a Promise.
  // `await` also works if runtime provides a plain object.
  params: Promise<{
    path?: string[]
  }>
}

function joinUrl(base: string, restPath: string, search: string) {
  const trimmedBase = base.replace(/\/+$/, '')
  const trimmedRest = restPath.replace(/^\/+/, '')
  const pathPart = trimmedRest ? `/${trimmedRest}` : ''
  return `${trimmedBase}${pathPart}${search}`
}

async function proxyToN8n(req: NextRequest, ctx: RouteContext) {
  // In production, nginx should own /admin/n8n/ routing. This route exists mainly
  // for local dev (no nginx) and preview environments.
  const base = (process.env.N8N_DEV_URL || '').trim() || 'http://localhost:5678'

  const { path } = await ctx.params
  const rest = path?.join('/') ?? ''
  const targetUrl = joinUrl(base, rest, req.nextUrl.search)

  const headers = new Headers(req.headers)
  headers.delete('host')
  headers.delete('connection')
  headers.delete('content-length')

  // Basic reverse-proxy headers (helps n8n generate correct links in dev)
  headers.set('x-forwarded-proto', req.nextUrl.protocol.replace(':', ''))
  headers.set('x-forwarded-host', req.headers.get('host') || '')
  headers.set('x-forwarded-prefix', '/admin/n8n')

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  const body = hasBody ? await req.arrayBuffer() : undefined

  let upstream: Response
  try {
    upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: 'manual',
    })
  } catch (e) {
    return NextResponse.json(
      {
        error: 'n8n unavailable',
        hint: 'Start n8n (e.g. docker compose) or set N8N_DEV_URL to its base URL (default http://localhost:5678).',
        target: targetUrl,
      },
      { status: 502 },
    )
  }

  const resHeaders = new Headers(upstream.headers)

  // If n8n redirects to its own absolute URL, rewrite it back under /admin/n8n
  const location = resHeaders.get('location')
  if (location && location.startsWith(base)) {
    resHeaders.set('location', location.replace(base, '/admin/n8n'))
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  })
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  return proxyToN8n(req, ctx)
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  return proxyToN8n(req, ctx)
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  return proxyToN8n(req, ctx)
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  return proxyToN8n(req, ctx)
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  return proxyToN8n(req, ctx)
}

export async function OPTIONS(req: NextRequest, ctx: RouteContext) {
  return proxyToN8n(req, ctx)
}
