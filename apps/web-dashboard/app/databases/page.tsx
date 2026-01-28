import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { DatabasePageClient } from './database-page-client'

async function getTenants() {
  try {
    const cookieStore = await cookies()
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ')

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const endpoints = [
      `${apiUrl}/api/v1/tenants/me`,
      `${apiUrl}/api/v1/tenants`,
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          headers: {
            Cookie: cookieHeader,
          },
          cache: 'no-store',
        })

        if (!response.ok) continue

        const data = await response.json()
        const tenantList = data.tenants || data.data || []

        // If membership endpoint returns empty, try admin endpoint
        if (endpoint.includes('/me') && tenantList.length === 0) {
          continue
        }

        return tenantList
      } catch {
        continue
      }
    }

    return []
  } catch {
    return []
  }
}

export default async function DatabasePage() {
  const tenants = await getTenants()

  // If no tenants, redirect immediately to onboarding - no flash!
  if (tenants.length === 0) {
    redirect('/databases/new?returnTo=/databases')
  }

  // Only render the client component if tenants exist
  return <DatabasePageClient initialTenants={tenants} />
}
