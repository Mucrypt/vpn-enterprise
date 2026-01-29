'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Mail,
  MoreVertical,
  Shield,
} from 'lucide-react'

interface User {
  id: string
  email: string
  display_name?: string
  phone?: string
  provider: string
  provider_type?: string
  created_at: string
  last_sign_in?: string
  role?: string
}

interface AuthUsersPageProps {
  activeTenant: string
}

export function AuthUsersPage({ activeTenant }: AuthUsersPageProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedColumn, setSelectedColumn] = useState('email')

  const loadUsers = async () => {
    setLoading(true)
    try {
      // Simulate API call - replace with actual Supabase call
      const mockUsers: User[] = [
        {
          id: '7e03d529-f20f-4430-be7e-d1a7a8720f29',
          email: 'romeomukulah@gmail.com',
          display_name: '-',
          phone: '-',
          provider: 'Email',
          provider_type: 'email',
          created_at: '2026-01-15T10:30:00Z',
          last_sign_in: '2026-01-30T08:15:00Z',
          role: 'super_admin',
        },
        {
          id: '5c7cb98c-2539-49b0-9969-1f73d6b8e6f3',
          email: 'romeoyongi@gmail.com',
          display_name: '-',
          phone: '-',
          provider: 'Email',
          provider_type: 'email',
          created_at: '2026-01-20T14:22:00Z',
          last_sign_in: '2026-01-29T16:45:00Z',
          role: 'user',
        },
      ]
      setUsers(mockUsers)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [activeTenant])

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold text-white mb-2'>Users</h1>
        <p className='text-gray-400'>
          Manage and view all users in your project
        </p>
      </div>

      {/* Actions Bar */}
      <Card className='p-4 bg-gray-900 border-gray-800'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3 flex-1'>
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Search by email'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10 bg-gray-800 border-gray-700 text-white'
              />
            </div>
            <select
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
              className='px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm'
            >
              <option value='email'>Email address</option>
              <option value='display_name'>Display name</option>
              <option value='phone'>Phone</option>
            </select>
            <Button variant='outline' size='sm' className='border-gray-700'>
              <Filter className='h-4 w-4 mr-2' />
              All columns
            </Button>
            <span className='text-sm text-gray-400'>Sorted by user ID</span>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={loadUsers}
              disabled={loading}
              className='border-gray-700'
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
            </Button>
            <Button
              size='sm'
              className='bg-emerald-600 hover:bg-emerald-700 text-white'
            >
              <Plus className='h-4 w-4 mr-2' />
              Add user
            </Button>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className='bg-gray-900 border-gray-800 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-800/50 border-b border-gray-800'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  <input type='checkbox' className='rounded border-gray-600' />
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  UID
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Display name
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Email
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Phone
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Providers
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Provider type
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Role
                </th>
                <th className='px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-800'>
              {loading ? (
                <tr>
                  <td colSpan={9} className='px-6 py-12 text-center'>
                    <RefreshCw className='h-6 w-6 animate-spin text-emerald-400 mx-auto mb-2' />
                    <p className='text-gray-400'>Loading users...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className='px-6 py-12 text-center'>
                    <Users className='h-12 w-12 text-gray-600 mx-auto mb-3' />
                    <p className='text-gray-400'>No users found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className='hover:bg-gray-800/30 transition-colors cursor-pointer'
                  >
                    <td className='px-6 py-4'>
                      <input
                        type='checkbox'
                        className='rounded border-gray-600'
                      />
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <Shield className='h-4 w-4 text-gray-500' />
                        <span className='text-sm text-gray-300 font-mono'>
                          {user.id.substring(0, 8)}...
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-300'>
                      {user.display_name || '-'}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <Mail className='h-4 w-4 text-gray-500' />
                        <span className='text-sm text-gray-300'>
                          {user.email}
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-300'>
                      {user.phone || '-'}
                    </td>
                    <td className='px-6 py-4'>
                      <Badge
                        variant='outline'
                        className='border-gray-700 text-gray-300 bg-gray-800'
                      >
                        <Mail className='h-3 w-3 mr-1' />
                        {user.provider}
                      </Badge>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-300'>
                      {user.provider_type || '-'}
                    </td>
                    <td className='px-6 py-4'>
                      {user.role === 'super_admin' ? (
                        <Badge className='bg-red-500/10 text-red-400 border-red-500/20'>
                          Super Admin
                        </Badge>
                      ) : user.role === 'admin' ? (
                        <Badge className='bg-blue-500/10 text-blue-400 border-blue-500/20'>
                          Admin
                        </Badge>
                      ) : (
                        <Badge className='bg-gray-500/10 text-gray-400 border-gray-500/20'>
                          User
                        </Badge>
                      )}
                    </td>
                    <td className='px-6 py-4 text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-gray-400 hover:text-white'
                      >
                        <MoreVertical className='h-4 w-4' />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className='px-6 py-4 border-t border-gray-800 flex items-center justify-between'>
          <div className='text-sm text-gray-400'>
            Total:{' '}
            <span className='text-white font-medium'>
              {filteredUsers.length} users
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled
              className='border-gray-700'
            >
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              disabled
              className='border-gray-700'
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
