'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Database,
  Server,
  Lock,
  Unlock,
  UserX,
  LogIn,
  LogOut,
  Search,
  Filter,
  Download,
} from 'lucide-react'

interface AuditLog {
  id: string
  timestamp: string
  user: {
    id: string
    email: string
    role: string
  }
  action: string
  resource: string
  resourceId?: string
  status: 'success' | 'failure' | 'warning'
  ipAddress: string
  userAgent: string
  details?: string
}

interface AuditLogsViewerProps {
  logs: AuditLog[]
  onRefresh?: () => void
  onExport?: () => void
  loading?: boolean
}

export function AuditLogsViewer({
  logs,
  onRefresh,
  onExport,
  loading = false,
}: AuditLogsViewerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterAction, setFilterAction] = useState<string>('all')

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === '' ||
      log.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === 'all' || log.status === filterStatus
    const matchesAction = filterAction === 'all' || log.action === filterAction

    return matchesSearch && matchesStatus && matchesAction
  })

  const getActionIcon = (action: string) => {
    if (action.includes('login')) return <LogIn className='w-4 h-4' />
    if (action.includes('logout')) return <LogOut className='w-4 h-4' />
    if (action.includes('create')) return <CheckCircle className='w-4 h-4' />
    if (action.includes('delete')) return <XCircle className='w-4 h-4' />
    if (action.includes('update')) return <Activity className='w-4 h-4' />
    if (action.includes('access')) return <Lock className='w-4 h-4' />
    return <Activity className='w-4 h-4' />
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge className='bg-green-500/20 text-green-500 border-green-500/30 gap-1'>
            <CheckCircle className='w-3 h-3' />
            Success
          </Badge>
        )
      case 'failure':
        return (
          <Badge className='bg-red-500/20 text-red-500 border-red-500/30 gap-1'>
            <XCircle className='w-3 h-3' />
            Failure
          </Badge>
        )
      case 'warning':
        return (
          <Badge className='bg-yellow-500/20 text-yellow-500 border-yellow-500/30 gap-1'>
            <AlertTriangle className='w-3 h-3' />
            Warning
          </Badge>
        )
      default:
        return null
    }
  }

  const getResourceIcon = (resource: string) => {
    if (resource.includes('user')) return <Users className='w-4 h-4' />
    if (resource.includes('database')) return <Database className='w-4 h-4' />
    if (resource.includes('service')) return <Server className='w-4 h-4' />
    if (resource.includes('security')) return <Shield className='w-4 h-4' />
    return <Activity className='w-4 h-4' />
  }

  return (
    <Card className='border-border/50 bg-card/50 backdrop-blur-sm'>
      <CardHeader>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
          <div>
            <CardTitle className='flex items-center gap-2 text-xl'>
              <Shield className='w-5 h-5 text-primary' />
              Audit Logs & Security Monitoring
            </CardTitle>
            <CardDescription className='mt-1.5'>
              Comprehensive activity tracking and security event monitoring
            </CardDescription>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' onClick={onRefresh} disabled={loading}>
              <Activity className='w-4 h-4 mr-2' />
              Refresh
            </Button>
            <Button variant='outline' size='sm' onClick={onExport}>
              <Download className='w-4 h-4 mr-2' />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Filters */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <Input
              placeholder='Search logs...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10'
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder='Filter by status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Statuses</SelectItem>
              <SelectItem value='success'>Success</SelectItem>
              <SelectItem value='failure'>Failure</SelectItem>
              <SelectItem value='warning'>Warning</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger>
              <SelectValue placeholder='Filter by action' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Actions</SelectItem>
              <SelectItem value='login'>Login</SelectItem>
              <SelectItem value='logout'>Logout</SelectItem>
              <SelectItem value='create'>Create</SelectItem>
              <SelectItem value='update'>Update</SelectItem>
              <SelectItem value='delete'>Delete</SelectItem>
              <SelectItem value='access'>Access</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Logs List */}
        <div className='space-y-2 max-h-[600px] overflow-y-auto'>
          {filteredLogs.length === 0 ? (
            <div className='text-center py-12'>
              <Activity className='w-12 h-12 text-muted-foreground mx-auto mb-3' />
              <p className='text-muted-foreground'>No audit logs found</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className='flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-4 rounded-lg border border-border/50 bg-background/50 hover:shadow-md transition-shadow'
              >
                <div className='flex-1 space-y-2'>
                  <div className='flex items-center gap-3 flex-wrap'>
                    <div
                      className={`p-1.5 rounded ${
                        log.status === 'success'
                          ? 'bg-green-500/10'
                          : log.status === 'failure'
                            ? 'bg-red-500/10'
                            : 'bg-yellow-500/10'
                      }`}
                    >
                      {getActionIcon(log.action)}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <span className='font-semibold text-sm'>{log.action}</span>
                        <span className='text-muted-foreground text-xs'>on</span>
                        <Badge variant='outline' className='gap-1'>
                          {getResourceIcon(log.resource)}
                          {log.resource}
                        </Badge>
                      </div>
                      <p className='text-xs text-muted-foreground mt-1'>
                        by <span className='font-medium'>{log.user.email}</span> •{' '}
                        <span className='font-mono'>{log.ipAddress}</span> •{' '}
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {log.details && (
                    <p className='text-xs text-muted-foreground ml-10 pl-1'>
                      {log.details}
                    </p>
                  )}
                </div>
                <div className='flex items-center gap-2'>
                  {getStatusBadge(log.status)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t'>
          <div className='text-center p-3 rounded-lg bg-muted/30'>
            <p className='text-2xl font-bold'>{logs.length}</p>
            <p className='text-xs text-muted-foreground'>Total Events</p>
          </div>
          <div className='text-center p-3 rounded-lg bg-green-500/10'>
            <p className='text-2xl font-bold text-green-500'>
              {logs.filter((l) => l.status === 'success').length}
            </p>
            <p className='text-xs text-muted-foreground'>Success</p>
          </div>
          <div className='text-center p-3 rounded-lg bg-red-500/10'>
            <p className='text-2xl font-bold text-red-500'>
              {logs.filter((l) => l.status === 'failure').length}
            </p>
            <p className='text-xs text-muted-foreground'>Failures</p>
          </div>
          <div className='text-center p-3 rounded-lg bg-yellow-500/10'>
            <p className='text-2xl font-bold text-yellow-500'>
              {logs.filter((l) => l.status === 'warning').length}
            </p>
            <p className='text-xs text-muted-foreground'>Warnings</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Mock audit logs for testing
export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    user: {
      id: 'user1',
      email: 'admin@example.com',
      role: 'admin',
    },
    action: 'user.login',
    resource: 'authentication',
    status: 'success',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
    details: 'Successful admin login from trusted IP',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    user: {
      id: 'user2',
      email: 'john@example.com',
      role: 'user',
    },
    action: 'database.create',
    resource: 'database',
    resourceId: 'db-123',
    status: 'success',
    ipAddress: '10.0.0.45',
    userAgent: 'Mozilla/5.0...',
    details: 'Created new PostgreSQL database "production-db"',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    user: {
      id: 'user3',
      email: 'malicious@example.com',
      role: 'user',
    },
    action: 'user.login',
    resource: 'authentication',
    status: 'failure',
    ipAddress: '198.51.100.42',
    userAgent: 'curl/7.68.0',
    details: 'Failed login attempt - invalid credentials',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    user: {
      id: 'user1',
      email: 'admin@example.com',
      role: 'admin',
    },
    action: 'service.restart',
    resource: 'service',
    resourceId: 'api-server',
    status: 'success',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
    details: 'Restarted API server for maintenance',
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    user: {
      id: 'user2',
      email: 'john@example.com',
      role: 'user',
    },
    action: 'security.access',
    resource: 'security',
    status: 'warning',
    ipAddress: '10.0.0.45',
    userAgent: 'Mozilla/5.0...',
    details: 'Attempted to access admin endpoint with user role',
  },
]
