import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { DatabasePageClient } from './database-page-client'

async function isAdminUser() {
  const cookieStore = await cookies()
  const userRole = cookieStore.get('user_role')?.value
  return userRole === 'super_admin' || userRole === 'admin'
}

async function isUserAuthenticated() {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value // Fixed: was 'token'
  const userRole = cookieStore.get('user_role')?.value // Check for user_role instead
  return !!(token && userRole)
}

async function getTenants(retryCount = 0): Promise<any[]> {
  const maxRetries = 2

  try {
    const cookieStore = await cookies()
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ')

    // Check if we have authentication cookies
    if (!cookieHeader || cookieHeader.trim() === '') {
      console.warn(
        '[Databases] No cookies found, user may not be authenticated',
      )
      return []
    }

    // For server-side requests, use internal Docker service URL in production
    // or localhost in development
    const apiUrl =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'http://api:5000'
        : 'http://localhost:5000')

    console.log('[Databases] Fetching tenants from:', apiUrl)

    // Regular users: only fetch their tenants
    const response = await fetch(`${apiUrl}/api/v1/tenants/me`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: 'no-store',
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      console.warn(
        '[Databases] API response not OK:',
        response.status,
        response.statusText,
      )

      // Retry on server errors (5xx) but not on auth errors (401, 403)
      if (response.status >= 500 && retryCount < maxRetries) {
        console.log(`[Databases] Retrying... (${retryCount + 1}/${maxRetries})`)
        await new Promise((resolve) => setTimeout(resolve, 500)) // Wait 500ms before retry
        return getTenants(retryCount + 1)
      }

      return []
    }

    const data = await response.json()
    const tenants = data.tenants || data.data || []
    console.log('[Databases] Fetched tenants:', tenants.length)
    return tenants
  } catch (error) {
    console.error('[Databases] Error fetching tenants:', error)

    // Retry on network errors
    if (retryCount < maxRetries) {
      console.log(
        `[Databases] Retrying after error... (${retryCount + 1}/${maxRetries})`,
      )
      await new Promise((resolve) => setTimeout(resolve, 500))
      return getTenants(retryCount + 1)
    }

    return []
  }
}

export default async function DatabasePage() {
  // First, verify user is authenticated
  const isAuthenticated = await isUserAuthenticated()

  if (!isAuthenticated) {
    console.warn('[Databases] User not authenticated, redirecting to login')
    redirect('/auth/login?returnTo=/databases')
  }

  // Check if user is admin
  const isAdmin = await isAdminUser()

  // Admins get redirected to the platform admin view
  if (isAdmin) {
    redirect('/databases/admin')
  }

  // Regular users: check their tenants with retry logic
  const tenants = await getTenants()

  // Only redirect to create project if we're certain there are no tenants
  // If the API call failed but user is authenticated, show the client component
  // which will handle fetching tenants on the client side
  if (tenants.length === 0) {
    // Double-check: try one more time before redirecting
    console.log('[Databases] No tenants found, attempting final check...')
    const tenantsRecheck = await getTenants()

    if (tenantsRecheck.length === 0) {
      console.log(
        '[Databases] Confirmed no tenants, redirecting to create project',
      )
      redirect('/databases/new?returnTo=/databases')
    } else {
      console.log(
        '[Databases] Found tenants on recheck:',
        tenantsRecheck.length,
      )
      return <DatabasePageClient initialTenants={tenantsRecheck} />
    }
  }

  // Render the user's database editor
  console.log(
    '[Databases] Rendering database page with',
    tenants.length,
    'tenants',
  )
  return <DatabasePageClient initialTenants={tenants} />
}
