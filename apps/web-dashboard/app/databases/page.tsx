import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { DatabasePageClient } from './database-page-client'

async function isAdminUser() {
  const cookieStore = await cookies()
  const userRole = cookieStore.get('user_role')?.value
  return userRole === 'super_admin' || userRole === 'admin'
}

async function getTenants() {
  try {
    const cookieStore = await cookies()
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ')

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

    // Regular users: only fetch their tenants
    const response = await fetch(`${apiUrl}/api/v1/tenants/me`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: 'no-store',
    })

    if (!response.ok) return []

    const data = await response.json()
    return data.tenants || data.data || []
  } catch {
    return []
  }
}

export default async function DatabasePage() {
  // Check if user is admin first
  const isAdmin = await isAdminUser()

  // Admins get redirected to the platform admin view
  if (isAdmin) {
    redirect('/databases/admin')
  }

  // Regular users: check their tenants
  const tenants = await getTenants()

  // If no tenants, redirect to onboarding wizard
  if (tenants.length === 0) {
    redirect('/databases/new?returnTo=/databases')
  }

  // Render the user's database editor
  return <DatabasePageClient initialTenants={tenants} />
}
