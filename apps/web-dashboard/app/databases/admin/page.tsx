import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { DatabasePlatformAdmin } from './database-platform-admin'

async function getAllTenants() {
  try {
    const cookieStore = await cookies()
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ')

    const apiUrl =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'http://api:5000'
        : 'http://localhost:5000')

    const response = await fetch(`${apiUrl}/api/v1/tenants`, {
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

async function isAdminUser() {
  const cookieStore = await cookies()
  const userRole = cookieStore.get('user_role')?.value
  return userRole === 'super_admin' || userRole === 'admin'
}

export default async function DatabaseAdminPage() {
  const isAdmin = await isAdminUser()

  // Non-admins should not access this page
  if (!isAdmin) {
    redirect('/databases')
  }

  const tenants = await getAllTenants()

  return <DatabasePlatformAdmin initialTenants={tenants} />
}
