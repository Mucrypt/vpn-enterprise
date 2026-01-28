'use client'

import React, { useState, useMemo, useEffect } from 'react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
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
  UserPlus,
  Shield,
  Mail,
  Calendar,
  RefreshCw,
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
  owner_name?: string
}

interface User {
  id: string
  email: string
  role?: string
  created_at: string
  last_sign_in_at?: string
}

interface DatabasePlatformAdminProps {
  initialTenants: Tenant[]
  initialUsers: User[]
}

export function DatabasePlatformAdmin({
  initialTenants,
  initialUsers,
}: DatabasePlatformAdminProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants)
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [activeTab, setActiveTab] = useState<'projects' | 'users'>('projects')
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    password: '',
    role: 'user' as 'user' | 'admin' | 'super_admin',
  })

  // Auto-fetch users when switching to users tab
  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) {
      refreshUsers()
    }
  }, [activeTab])

  const refreshUsers = async () => {
    setIsRefreshing(true)
    try {
      const token = getAuthToken()
      if (!token) {
        console.warn('No auth token found, skipping user refresh')
        return
      }

      const apiUrl = getApiUrl()
      console.log(
        '[refreshUsers] Fetching from:',
        `${apiUrl}/api/v1/admin/users`,
      )

      const response = await fetch(`${apiUrl}/api/v1/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      console.log('[refreshUsers] Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[refreshUsers] Error response:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log('[refreshUsers] Received users:', data.users?.length || 0)

      setUsers(data.users || [])

      if (data.users && data.users.length > 0) {
        showNotification(
          'success',
          `Loaded ${data.users.length} users from Supabase`,
        )
      }
    } catch (error) {
      console.error('Refresh users error:', error)
      showNotification(
        'error',
        `Failed to load users: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    } finally {
      setIsRefreshing(false)
    }
  }

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

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users

    const query = searchQuery.toLowerCase()
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(query) ||
        u.role?.toLowerCase().includes(query) ||
        u.id?.toLowerCase().includes(query),
    )
  }, [users, searchQuery])

  const handleDeleteTenant = async (tenant: Tenant) => {
    if (
      !confirm(
        `Are you sure you want to delete project "${tenant.name}"?\n\nThis will:\n- Drop the database ${tenant.db_name || tenant.id}\n- Remove all project data\n- Remove tenant memberships\n\nThis action cannot be undone.`,
      )
    ) {
      return
    }

    setIsDeleting(true)
    setTenantToDelete(tenant)

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.')
      }

      const apiUrl = getApiUrl()
      const endpoint = `${apiUrl}/api/v1/admin/tenants/${tenant.id}`

      console.log('DELETE request to:', endpoint)

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: `HTTP ${response.status}` }))
        throw new Error(error.message || 'Failed to delete project')
      }

      // Remove tenant from local state
      setTenants(tenants.filter((t) => t.id !== tenant.id))

      showNotification('success', 'Project deleted successfully')
    } catch (error) {
      console.error('Delete project error:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      showNotification('error', `Failed to delete project: ${errorMessage}`)
    } finally {
      setIsDeleting(false)
      setTenantToDelete(null)
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const getAuthToken = () => {
    return (
      localStorage.getItem('access_token') ||
      document.cookie
        .split('; ')
        .find((row) => row.startsWith('access_token='))
        ?.split('=')[1]
    )
  }

  const getApiUrl = () => {
    // Match logic from /lib/api.ts to ensure consistency
    const envUrl = process.env.NEXT_PUBLIC_API_URL
    const windowOrigin =
      typeof window !== 'undefined' ? window.location.origin : ''

    console.log('[getApiUrl] envUrl:', envUrl)
    console.log('[getApiUrl] windowOrigin:', windowOrigin)

    // If we're on production (not localhost), use same-origin (nginx proxy)
    // This is critical for httpOnly cookies and auth to work
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const isLocalhost =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1'

      // For production deployments, always use same-origin
      if (!isLocalhost) {
        console.log(
          '[getApiUrl] Production mode, using same-origin:',
          windowOrigin,
        )
        return windowOrigin
      }
    }

    // For local development, prefer env var if set
    if (envUrl && envUrl.trim()) {
      console.log('[getApiUrl] Dev mode, using envUrl:', envUrl)
      return envUrl.trim()
    }

    // Fallback for local dev
    console.log('[getApiUrl] Falling back to localhost:5000')
    return 'http://localhost:5000'
  }

  const handleCreateUser = async () => {
    if (!newUserForm.email || !newUserForm.password) {
      showNotification('error', 'Email and password are required')
      return
    }

    if (newUserForm.password.length < 8) {
      showNotification('error', 'Password must be at least 8 characters')
      return
    }

    setIsCreatingUser(true)

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/v1/admin/users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUserForm),
      })

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: `HTTP ${response.status}` }))
        throw new Error(error.message || 'Failed to create user')
      }

      const result = await response.json()

      // Add new user to local state
      setUsers([result.user, ...users])

      // Reset form and close dialog
      setNewUserForm({ email: '', password: '', role: 'user' })
      setShowCreateDialog(false)

      showNotification(
        'success',
        `User ${result.user.email} created successfully`,
      )
    } catch (error) {
      console.error('Create user error:', error)
      showNotification(
        'error',
        `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    } finally {
      setIsCreatingUser(false)
    }
  }

  const handleUpdateUserRole = async (user: User, newRole: string) => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const apiUrl = getApiUrl()
      const response = await fetch(
        `${apiUrl}/api/v1/admin/users/${user.id}/role`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: newRole }),
        },
      )

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: `HTTP ${response.status}` }))
        throw new Error(error.message || 'Failed to update role')
      }

      // Update user in local state
      setUsers(
        users.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
      )

      showNotification('success', `Role updated to ${newRole}`)
    } catch (error) {
      console.error('Update role error:', error)
      showNotification(
        'error',
        `Failed to update role: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (user.role === 'admin' || user.role === 'super_admin') {
      showNotification('error', 'Cannot delete admin users')
      return
    }

    if (
      !confirm(
        `Delete user ${user.email}?\n\nThis will:\n• Remove the user account\n• Remove all tenant memberships\n• Mark orphaned tenants as deleted\n\nThis cannot be undone.`,
      )
    ) {
      return
    }

    setIsDeleting(true)

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/v1/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: `HTTP ${response.status}` }))
        throw new Error(error.message || 'Failed to delete user')
      }

      // Remove user from local state
      setUsers(users.filter((u) => u.id !== user.id))

      // Refresh tenants to update owner assignments
      const tenantsResponse = await fetch(`${apiUrl}/api/v1/admin/tenants`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (tenantsResponse.ok) {
        const data = await tenantsResponse.json()
        setTenants(data.tenants || [])
      }

      showNotification('success', 'User deleted successfully')
    } catch (error) {
      console.error('Delete user error:', error)
      showNotification(
        'error',
        `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    } finally {
      setIsDeleting(false)
    }
  }

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
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg border ${
            notification.type === 'success'
              ? 'bg-emerald-950 border-emerald-700 text-emerald-100'
              : 'bg-red-950 border-red-700 text-red-100'
          } animate-in slide-in-from-top-5 duration-300`}
        >
          <div className='flex items-center gap-3'>
            {notification.type === 'success' ? (
              <Shield className='h-5 w-5 text-emerald-500' />
            ) : (
              <Trash2 className='h-5 w-5 text-red-500' />
            )}
            <p className='font-medium'>{notification.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className='border-b border-gray-800 bg-[#1a1a1a]'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 py-4'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
            <div className='flex items-center gap-3'>
              <Database className='h-5 w-5 sm:h-6 sm:w-6 text-emerald-500' />
              <div>
                <div className='flex items-center gap-2 mb-1'>
                  <h1 className='text-lg sm:text-xl font-bold'>
                    Database Platform Admin
                  </h1>
                  <Badge className='bg-linear-to-r from-emerald-500 to-emerald-600 text-white border-0 px-2 py-0.5 text-xs font-semibold'>
                    <Shield className='h-3 w-3 mr-1' />
                    ADMIN
                  </Badge>
                </div>
                <p className='text-xs sm:text-sm text-gray-400'>
                  Manage all database projects and tenants
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/dashboard')}
              variant='outline'
              size='sm'
              className='border-gray-700 text-gray-300 hover:bg-gray-800 active:bg-gray-700 w-full sm:w-auto'
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8'>
        {/* Stats Cards */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8'>
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

        {/* Tabs */}
        <div className='flex gap-2 mb-6 overflow-x-auto'>
          <Button
            variant={activeTab === 'projects' ? 'default' : 'outline'}
            onClick={() => setActiveTab('projects')}
            className={`whitespace-nowrap ${
              activeTab === 'projects'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'border-gray-700 text-gray-300 hover:bg-gray-800 active:bg-gray-700'
            }`}
          >
            <Database className='h-4 w-4 mr-2' />
            <span className='hidden sm:inline'>Database Projects</span>
            <span className='sm:hidden'>Projects</span> ({tenants.length})
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
            className={`whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'border-gray-700 text-gray-300 hover:bg-gray-800 active:bg-gray-700'
            }`}
          >
            <Users className='h-4 w-4 mr-2' />
            <span className='hidden sm:inline'>Platform Users</span>
            <span className='sm:hidden'>Users</span> ({users.length})
          </Button>
        </div>

        {/* Search and Actions */}
        {activeTab === 'projects' ? (
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
              <div className='flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6'>
                <div className='relative flex-1'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500' />
                  <Input
                    type='text'
                    placeholder='Search...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pl-10 bg-gray-900 border-gray-700 text-white text-sm sm:text-base'
                  />
                </div>
              </div>

              {/* Tenants Table */}
              <div className='overflow-x-auto -mx-4 sm:mx-0'>
                <table className='w-full min-w-[900px]'>
                  <thead>
                    <tr className='border-b border-gray-800 text-left'>
                      <th className='pb-3 text-sm font-medium text-gray-400'>
                        Project
                      </th>
                      <th className='pb-3 text-sm font-medium text-gray-400'>
                        Owner
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
                          colSpan={7}
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
                            </div>
                          </td>
                          <td className='py-4'>
                            {tenant.owner_email ? (
                              <div className='flex items-center gap-2'>
                                <div className='flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-400 text-xs font-semibold'>
                                  {tenant.owner_name
                                    ?.slice(0, 2)
                                    .toUpperCase() ||
                                    tenant.owner_email
                                      ?.slice(0, 2)
                                      .toUpperCase()}
                                </div>
                                <div>
                                  <div className='text-sm text-white'>
                                    {tenant.owner_name ||
                                      tenant.owner_email?.split('@')[0]}
                                  </div>
                                  <div className='text-xs text-gray-500'>
                                    {tenant.owner_email}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className='text-xs text-gray-600'>
                                No owner
                              </span>
                            )}
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
                                {tenant.db_name ||
                                  tenant.tenant_id ||
                                  tenant.id}
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
                            <div className='flex items-center gap-1 sm:gap-2'>
                              <Button
                                size='sm'
                                variant='ghost'
                                className='h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800 active:bg-gray-700'
                                title='View details'
                              >
                                <Eye className='h-4 w-4' />
                              </Button>
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={() => handleDeleteTenant(tenant)}
                                disabled={
                                  isDeleting && tenantToDelete?.id === tenant.id
                                }
                                className='h-8 px-2 sm:px-3 text-red-400 hover:text-red-300 hover:bg-red-950/30 active:bg-red-950/50'
                                title='Delete project'
                              >
                                {isDeleting &&
                                tenantToDelete?.id === tenant.id ? (
                                  <Activity className='h-4 w-4 animate-spin' />
                                ) : (
                                  <Trash2 className='h-4 w-4' />
                                )}
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
        ) : (
          <Card className='bg-[#1e1e1e] border-gray-800 mb-6'>
            <CardHeader>
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                <div>
                  <CardTitle>Platform Users</CardTitle>
                  <CardDescription className='text-gray-400'>
                    Manage user accounts and permissions
                  </CardDescription>
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    onClick={refreshUsers}
                    disabled={isRefreshing}
                    size='sm'
                    className='border-gray-700 text-gray-300 hover:bg-gray-800 active:bg-gray-700 flex-1 sm:flex-initial'
                  >
                    <RefreshCw
                      className={`h-4 w-4 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
                    />
                    <span className='hidden sm:inline'>
                      {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </span>
                  </Button>
                  <Dialog
                    open={showCreateDialog}
                    onOpenChange={setShowCreateDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size='sm'
                        className='bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 flex-1 sm:flex-initial'
                      >
                        <UserPlus className='h-4 w-4 sm:mr-2' />
                        <span className='hidden sm:inline'>Create User</span>
                        <span className='sm:hidden'>Create</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='bg-[#1a1a1a] border-gray-800 text-white'>
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription className='text-gray-400'>
                          Add a new user to the platform. They will receive
                          access immediately.
                        </DialogDescription>
                      </DialogHeader>
                      <div className='space-y-4 py-4'>
                        <div className='space-y-2'>
                          <Label
                            htmlFor='email'
                            className='text-sm font-medium'
                          >
                            Email Address
                          </Label>
                          <Input
                            id='email'
                            type='email'
                            placeholder='user@example.com'
                            value={newUserForm.email}
                            onChange={(e) =>
                              setNewUserForm({
                                ...newUserForm,
                                email: e.target.value,
                              })
                            }
                            className='bg-gray-900 border-gray-700 text-white'
                          />
                        </div>
                        <div className='space-y-2'>
                          <Label
                            htmlFor='password'
                            className='text-sm font-medium'
                          >
                            Password
                          </Label>
                          <Input
                            id='password'
                            type='password'
                            placeholder='Minimum 8 characters'
                            value={newUserForm.password}
                            onChange={(e) =>
                              setNewUserForm({
                                ...newUserForm,
                                password: e.target.value,
                              })
                            }
                            className='bg-gray-900 border-gray-700 text-white'
                          />
                          <p className='text-xs text-gray-500'>
                            User can change this after first login
                          </p>
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor='role' className='text-sm font-medium'>
                            Role
                          </Label>
                          <Select
                            value={newUserForm.role}
                            onValueChange={(value: any) =>
                              setNewUserForm({ ...newUserForm, role: value })
                            }
                          >
                            <SelectTrigger className='bg-gray-900 border-gray-700 text-white'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className='bg-gray-900 border-gray-700'>
                              <SelectItem value='user'>User</SelectItem>
                              <SelectItem value='admin'>Admin</SelectItem>
                              <SelectItem value='super_admin'>
                                Super Admin
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <p className='text-xs text-gray-500'>
                            {newUserForm.role === 'user' &&
                              'Can create and manage their own projects'}
                            {newUserForm.role === 'admin' &&
                              'Can access admin dashboard and manage users'}
                            {newUserForm.role === 'super_admin' &&
                              'Full platform access including system settings'}
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant='outline'
                          onClick={() => setShowCreateDialog(false)}
                          className='border-gray-700 text-gray-300 hover:bg-gray-800'
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateUser}
                          disabled={
                            isCreatingUser ||
                            !newUserForm.email ||
                            !newUserForm.password
                          }
                          className='bg-emerald-600 hover:bg-emerald-700'
                        >
                          {isCreatingUser ? (
                            <>
                              <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                              Creating...
                            </>
                          ) : (
                            <>
                              <UserPlus className='h-4 w-4 mr-2' />
                              Create User
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6'>
                <div className='relative flex-1'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500' />
                  <Input
                    type='text'
                    placeholder='Search...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pl-10 bg-gray-900 border-gray-700 text-white text-sm sm:text-base'
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className='overflow-x-auto -mx-4 sm:mx-0'>
                <table className='w-full min-w-[700px]'>
                  <thead>
                    <tr className='border-b border-gray-800 text-left'>
                      <th className='pb-3 text-sm font-medium text-gray-400'>
                        User
                      </th>
                      <th className='pb-3 text-sm font-medium text-gray-400'>
                        Role
                      </th>
                      <th className='pb-3 text-sm font-medium text-gray-400'>
                        Created
                      </th>
                      <th className='pb-3 text-sm font-medium text-gray-400'>
                        Last Active
                      </th>
                      <th className='pb-3 text-sm font-medium text-gray-400'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className='py-12 text-center text-gray-500'
                        >
                          {searchQuery.trim()
                            ? 'No users match your search'
                            : 'No users yet'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className='border-b border-gray-800 hover:bg-gray-900/50 transition-colors'
                        >
                          <td className='py-4'>
                            <div className='flex items-center gap-3'>
                              <div className='h-10 w-10 rounded-full bg-linear-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-semibold'>
                                {user.email.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className='font-medium text-white flex items-center gap-2'>
                                  {user.email}
                                  {(user.role === 'admin' ||
                                    user.role === 'super_admin') && (
                                    <Shield className='h-4 w-4 text-emerald-500' />
                                  )}
                                </div>
                                <div className='text-xs text-gray-500 flex items-center gap-1'>
                                  <Mail className='h-3 w-3' />
                                  {user.id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className='py-4'>
                            <Select
                              value={user.role || 'user'}
                              onValueChange={(newRole) =>
                                handleUpdateUserRole(user, newRole)
                              }
                              disabled={user.role === 'super_admin'}
                            >
                              <SelectTrigger className='w-[140px] h-8 bg-gray-900 border-gray-700 text-white text-sm'>
                                <SelectValue>
                                  {user.role === 'super_admin' ? (
                                    <Badge className='bg-purple-600 hover:bg-purple-700 border-0'>
                                      <Shield className='h-3 w-3 mr-1' />
                                      Super Admin
                                    </Badge>
                                  ) : user.role === 'admin' ? (
                                    <Badge className='bg-emerald-600 hover:bg-emerald-700 border-0'>
                                      <Shield className='h-3 w-3 mr-1' />
                                      Admin
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant='outline'
                                      className='border-gray-600 text-gray-300'
                                    >
                                      <Users className='h-3 w-3 mr-1' />
                                      User
                                    </Badge>
                                  )}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className='bg-gray-900 border-gray-700'>
                                <SelectItem value='user'>
                                  <span className='flex items-center gap-2'>
                                    <Users className='h-3 w-3' />
                                    User
                                  </span>
                                </SelectItem>
                                <SelectItem value='admin'>
                                  <span className='flex items-center gap-2'>
                                    <Shield className='h-3 w-3 text-emerald-500' />
                                    Admin
                                  </span>
                                </SelectItem>
                                <SelectItem value='super_admin' disabled>
                                  <span className='flex items-center gap-2'>
                                    <Shield className='h-3 w-3 text-purple-500' />
                                    Super Admin
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className='py-4'>
                            <div className='flex items-center gap-2 text-sm text-gray-400'>
                              <Calendar className='h-3 w-3' />
                              {formatDate(user.created_at)}
                            </div>
                          </td>
                          <td className='py-4'>
                            <div className='text-sm text-gray-400'>
                              {user.last_sign_in_at ? (
                                <div className='flex items-center gap-2'>
                                  <Activity className='h-3 w-3 text-emerald-500' />
                                  {formatDate(user.last_sign_in_at)}
                                </div>
                              ) : (
                                <span className='text-gray-600'>Never</span>
                              )}
                            </div>
                          </td>
                          <td className='py-4'>
                            {user.role === 'admin' ||
                            user.role === 'super_admin' ? (
                              <Badge
                                variant='outline'
                                className='border-emerald-700 text-emerald-400 bg-emerald-950/30'
                              >
                                <Shield className='h-3 w-3 mr-1' />
                                Protected
                              </Badge>
                            ) : (
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={() => handleDeleteUser(user)}
                                disabled={isDeleting}
                                className='h-8 px-3 text-red-400 hover:text-red-300 hover:bg-red-950/30'
                                title='Delete user'
                              >
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length > 0 && (
                <div className='mt-6 text-sm text-gray-500 text-center'>
                  Showing {filteredUsers.length} of {users.length} users
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Region Distribution - only show on projects tab */}
        {activeTab === 'projects' && (
          <Card className='bg-[#1e1e1e] border-gray-800 mt-6'>
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
                  <div
                    key={region}
                    className='flex items-center justify-between'
                  >
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
        )}
      </div>
    </div>
  )
}
