'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Database,
  Search,
  BarChart3,
  Users,
  Server,
  Eye,
  Trash2,
  Activity,
  Globe,
} from 'lucide-react'

interface Tenant {
  id: string
  tenant_id?: string
  name: string
  subdomain?: string
  region?: string
  plan_type?: string
  created_at: string
  db_host?: string
  db_port?: number
  db_name?: string
  owner_email?: string
}

interface DatabasePlatformAdminProps {
  initialTenants: Tenant[]
}

export function DatabasePlatformAdmin({
  initialTenants,
}: DatabasePlatformAdminProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [tenants] = useState<Tenant[]>(initialTenants)

  const filteredTenants = useMemo(() => {
    if (!searchQuery.trim()) return tenants

    const query = searchQuery.toLowerCase()
    return tenants.filter(
      (t) =>
        t.name?.toLowerCase().includes(query) ||
        t.subdomain?.toLowerCase().includes(query) ||
        t.owner_email?.toLowerCase().includes(query) ||
        t.id?.toLowerCase().includes(query),
    )
  }, [tenants, searchQuery])

  const stats = useMemo(() => {
    const totalProjects = tenants.length
    const planCounts = tenants.reduce(
      (acc, t) => {
        const plan = t.plan_type || 'free'
        acc[plan] = (acc[plan] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const regionCounts = tenants.reduce(
      (acc, t) => {
        const region = t.region || 'us-east-1'
        acc[region] = (acc[region] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return { totalProjects, planCounts, regionCounts }
  }, [tenants])

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className='min-h-screen bg-gray-950 text-white'>
      {/* Header */}
      <div className='border-b border-gray-800 bg-[#1a1a1a]'>
        <div className='max-w-7xl mx-auto px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Database className='h-6 w-6 text-emerald-500' />
              <div>
                <h1 className='text-xl font-bold'>Database Platform Admin</h1>
                <p className='text-sm text-gray-400'>
                  Manage all database projects and tenants
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/dashboard')}
              variant='outline'
              className='border-gray-700 text-gray-300 hover:bg-gray-800'
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-6 py-8'>
        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
          <Card className='bg-[#1e1e1e] border-gray-800'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-gray-400 flex items-center gap-2'>
                <Database className='h-4 w-4' />
                Total Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-white'>
                {stats.totalProjects}
              </div>
            </CardContent>
          </Card>

          <Card className='bg-[#1e1e1e] border-gray-800'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-gray-400 flex items-center gap-2'>
                <Users className='h-4 w-4' />
                Free Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-white'>
                {stats.planCounts.free || 0}
              </div>
            </CardContent>
          </Card>

          <Card className='bg-[#1e1e1e] border-gray-800'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-gray-400 flex items-center gap-2'>
                <BarChart3 className='h-4 w-4' />
                Premium Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-emerald-500'>
                {stats.planCounts.premium || 0}
              </div>
            </CardContent>
          </Card>

          <Card className='bg-[#1e1e1e] border-gray-800'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-gray-400 flex items-center gap-2'>
                <Globe className='h-4 w-4' />
                Regions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-white'>
                {Object.keys(stats.regionCounts).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <Card className='bg-[#1e1e1e] border-gray-800 mb-6'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>All Database Projects</CardTitle>
                <CardDescription className='text-gray-400'>
                  View and manage all tenant database projects
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-4 mb-6'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500' />
                <Input
                  type='text'
                  placeholder='Search by name, subdomain, email, or ID...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-10 bg-gray-900 border-gray-700 text-white'
                />
              </div>
            </div>

            {/* Tenants Table */}
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-gray-800 text-left'>
                    <th className='pb-3 text-sm font-medium text-gray-400'>
                      Project
                    </th>
                    <th className='pb-3 text-sm font-medium text-gray-400'>
                      Region
                    </th>
                    <th className='pb-3 text-sm font-medium text-gray-400'>
                      Plan
                    </th>
                    <th className='pb-3 text-sm font-medium text-gray-400'>
                      Database
                    </th>
                    <th className='pb-3 text-sm font-medium text-gray-400'>
                      Created
                    </th>
                    <th className='pb-3 text-sm font-medium text-gray-400'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className='py-8 text-center text-gray-500'
                      >
                        {searchQuery.trim()
                          ? 'No projects match your search'
                          : 'No projects yet'}
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((tenant) => (
                      <tr
                        key={tenant.id}
                        className='border-b border-gray-800 hover:bg-gray-900/50 transition-colors'
                      >
                        <td className='py-4'>
                          <div>
                            <div className='font-medium text-white'>
                              {tenant.name}
                            </div>
                            {tenant.subdomain && (
                              <div className='text-sm text-gray-500'>
                                {tenant.subdomain}
                              </div>
                            )}
                            {tenant.owner_email && (
                              <div className='text-xs text-gray-600 mt-0.5'>
                                {tenant.owner_email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className='py-4'>
                          <Badge
                            variant='outline'
                            className='border-gray-700 text-gray-300'
                          >
                            {tenant.region || 'us-east-1'}
                          </Badge>
                        </td>
                        <td className='py-4'>
                          <Badge
                            variant={
                              tenant.plan_type === 'premium'
                                ? 'default'
                                : 'secondary'
                            }
                            className={
                              tenant.plan_type === 'premium'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-800 text-gray-300'
                            }
                          >
                            {tenant.plan_type || 'free'}
                          </Badge>
                        </td>
                        <td className='py-4'>
                          <div className='text-sm'>
                            <div className='font-mono text-xs text-gray-400'>
                              {tenant.db_name || tenant.tenant_id || tenant.id}
                            </div>
                            {tenant.db_host && (
                              <div className='text-xs text-gray-600'>
                                {tenant.db_host}:{tenant.db_port || 5432}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className='py-4 text-sm text-gray-400'>
                          {formatDate(tenant.created_at)}
                        </td>
                        <td className='py-4'>
                          <div className='flex items-center gap-2'>
                            <Button
                              size='sm'
                              variant='ghost'
                              className='h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800'
                              title='View details'
                            >
                              <Eye className='h-4 w-4' />
                            </Button>
                            <Button
                              size='sm'
                              variant='ghost'
                              className='h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800'
                              title='Monitor activity'
                            >
                              <Activity className='h-4 w-4' />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredTenants.length > 0 && (
              <div className='mt-6 text-sm text-gray-500 text-center'>
                Showing {filteredTenants.length} of {tenants.length} projects
              </div>
            )}
          </CardContent>
        </Card>

        {/* Region Distribution */}
        <Card className='bg-[#1e1e1e] border-gray-800'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Globe className='h-5 w-5' />
              Regional Distribution
            </CardTitle>
            <CardDescription className='text-gray-400'>
              Database projects by region
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {Object.entries(stats.regionCounts).map(([region, count]) => (
                <div key={region} className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Server className='h-4 w-4 text-gray-500' />
                    <span className='text-sm text-gray-300'>{region}</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <div className='w-32 h-2 bg-gray-800 rounded-full overflow-hidden'>
                      <div
                        className='h-full bg-emerald-600'
                        style={{
                          width: `${(count / stats.totalProjects) * 100}%`,
                        }}
                      />
                    </div>
                    <span className='text-sm font-medium text-white w-8 text-right'>
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
