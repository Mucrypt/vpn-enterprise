'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Database,
  Table,
  Eye,
  Settings,
  Zap,
  Hash,
  Key,
  Layers,
  FileText,
  Share,
  Shield,
  Users,
  Lock,
  Cog,
  Server,
  Archive,
  GitBranch,
  Package,
  Webhook,
  ShieldCheck,
  Activity,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  Search,
  Plus,
  Menu,
  Clock,
  Bookmark,
  Sparkles,
} from 'lucide-react'

interface DatabaseLayoutProps {
  children: React.ReactNode
  activeTenant: string
  tenants: any[]
  onTenantChange: (tenantId: string) => void
  activeSection: DatabaseSection
  onSectionChange: (section: DatabaseSection) => void
  onLoadQuery?: (sql: string, name: string) => void
  onRefreshSchema?: () => void // Callback to refresh schema after DDL operations
}

export type DatabaseSection =
  | 'ai-assistant'
  | 'monitoring'
  | 'schema-visualizer'
  | 'tables'
  | 'functions'
  | 'triggers'
  | 'enumerated-types'
  | 'extensions'
  | 'indexes'
  | 'publications'
  | 'roles'
  | 'policies'
  | 'settings'
  | 'authentication'
  | 'replication'
  | 'backups'
  | 'migrations'
  | 'wrappers'
  | 'webhooks'
  | 'security-advisor'
  | 'performance-advisor'
  | 'query-performance'
  | 'sql-editor'
  | 'query-history'
  | 'sql-templates'
  | 'saved-queries'
  | 'visual-query-builder'

const SQL_TEMPLATES = [
  {
    name: 'Create Table',
    sql: `CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);`,
  },
  {
    name: 'Create Index',
    sql: 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
  },
  {
    name: 'Select with Join',
    sql: `SELECT u.name, u.email, p.title 
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE u.created_at > NOW() - INTERVAL '7 days';`,
  },
  {
    name: 'Add Column',
    sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);',
  },
  {
    name: 'Update Records',
    sql: `UPDATE users 
SET name = 'Updated Name', updated_at = NOW()
WHERE email = 'user@example.com';`,
  },
]

const NAVIGATION_ITEMS = [
  {
    category: 'AI & Automation',
    items: [
      {
        id: 'ai-assistant',
        label: 'AI SQL Assistant',
        icon: Sparkles,
        badge: 'NEW',
        badgeColor: 'bg-purple-500',
      },
      {
        id: 'schema-visualizer',
        label: 'Schema Visualizer',
        icon: GitBranch,
        badge: 'NEW',
        badgeColor: 'bg-cyan-500',
      },
      {
        id: 'monitoring',
        label: 'Live Monitoring',
        icon: Activity,
        badge: 'NEW',
        badgeColor: 'bg-emerald-500',
      },
    ],
  },
  {
    category: 'Essential Tools',
    items: [
      { id: 'sql-editor', label: 'SQL Editor', icon: FileText },
      {
        id: 'query-history',
        label: 'Query History',
        icon: Clock,
        expandable: true,
      },
      {
        id: 'sql-templates',
        label: 'SQL Templates',
        icon: FileText,
        expandable: true,
      },
      { id: 'saved-queries', label: 'Saved Queries', icon: Bookmark },
      { id: 'tables', label: 'Tables', icon: Table },
    ],
  },
  {
    category: 'Database Management',
    items: [
      { id: 'functions', label: 'Functions', icon: Zap },
      { id: 'triggers', label: 'Triggers', icon: Layers },
      { id: 'enumerated-types', label: 'Enumerated Types', icon: Hash },
      { id: 'extensions', label: 'Extensions', icon: Package },
      { id: 'indexes', label: 'Indexes', icon: Key },
      { id: 'publications', label: 'Publications', icon: Share },
    ],
  },
  {
    category: 'Configuration',
    items: [
      { id: 'roles', label: 'Roles', icon: Users },
      { id: 'policies', label: 'Policies', icon: Shield },
      { id: 'authentication', label: 'Authentication', icon: Lock },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
  {
    category: 'Platform',
    items: [
      { id: 'replication', label: 'Replication', icon: Server },
      { id: 'backups', label: 'Backups', icon: Archive },
      { id: 'migrations', label: 'Migrations', icon: GitBranch },
      { id: 'wrappers', label: 'Wrappers', icon: Package },
      { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    ],
  },
  {
    category: 'Tools',
    items: [
      { id: 'security-advisor', label: 'Security Advisor', icon: ShieldCheck },
      {
        id: 'performance-advisor',
        label: 'Performance Advisor',
        icon: Activity,
      },
      { id: 'query-performance', label: 'Query Performance', icon: BarChart3 },
    ],
  },
]

export function DatabaseLayout({
  children,
  activeTenant,
  tenants,
  onTenantChange,
  activeSection,
  onSectionChange,
  onLoadQuery,
  onRefreshSchema,
}: DatabaseLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  )
  const [queryHistory, setQueryHistory] = useState<any[]>([])
  const [tableCount, setTableCount] = useState<number>(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [tables, setTables] = useState<any[]>([])
  const [isTablesExpanded, setIsTablesExpanded] = useState(true)

  // Load tables from all schemas
  const loadTables = async () => {
    if (!activeTenant) return

    setIsRefreshing(true)
    try {
      // Get all schemas first
      const schemasResponse = await fetch(
        `/api/v1/tenants/${activeTenant}/schemas`,
      )
      if (!schemasResponse.ok) return

      const schemasData = await schemasResponse.json()
      const schemas = schemasData.data || schemasData.schemas || []

      let totalCount = 0
      let allTables: any[] = []

      // Count tables from all schemas
      for (const schema of schemas) {
        const schemaName = schema.schema_name || schema.name
        const tablesResponse = await fetch(
          `/api/v1/tenants/${activeTenant}/schemas/${schemaName}/tables`,
        )

        if (tablesResponse.ok) {
          const tablesData = await tablesResponse.json()
          const tables = tablesData.data || tablesData.tables || []
          // Only count BASE TABLEs, not VIEWs
          const baseTables = tables.filter(
            (t: any) => (t.table_type || t.type) === 'BASE TABLE',
          )
          totalCount += baseTables.length

          // Add tables to the list with schema info
          baseTables.forEach((t: any) => {
            allTables.push({
              name: t.table_name || t.name,
              schema: schemaName,
              fullName:
                schemaName === 'public'
                  ? t.table_name || t.name
                  : `${schemaName}.${t.table_name || t.name}`,
            })
          })
        }
      }

      setTableCount(totalCount)
      setTables(allTables)
    } catch (error) {
      console.warn('Failed to load table count:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadTables()
  }, [activeTenant])

  // Load query history when tenant changes
  useEffect(() => {
    const loadHistory = () => {
      try {
        const history = localStorage.getItem(`sql-history-${activeTenant}`)
        if (history) {
          setQueryHistory(JSON.parse(history))
        } else {
          setQueryHistory([])
        }
      } catch (error) {
        console.warn('Failed to load query history:', error)
        setQueryHistory([])
      }
    }

    if (activeTenant) {
      loadHistory()
    }
  }, [activeTenant])

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  return (
    <div className='h-screen flex bg-[#1e1e1e]'>
      {/* Left Sidebar - Collapsible Supabase style */}
      <div
        className={cn(
          'bg-[#181818] border-r border-[#2d2d30] flex flex-col transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-72',
        )}
      >
        {/* Header */}
        <div className='p-4 border-b border-[#2d2d30]'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center'>
                <Database className='h-4 w-4 text-white' />
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className='font-semibold text-white text-sm'>Database</h1>
                  <p className='text-xs text-gray-400'>Manage your database</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className='p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#2d2d30] transition-colors'
            >
              {isCollapsed ? (
                <ChevronRight className='h-4 w-4' />
              ) : (
                <ChevronLeft className='h-4 w-4' />
              )}
            </button>
          </div>

          {/* Database Selector */}
          {!isCollapsed && (
            <>
              <div className='relative'>
                <select
                  value={activeTenant}
                  onChange={(e) => onTenantChange(e.target.value)}
                  className='w-full bg-[#2d2d30] border border-[#3e3e42] rounded-md px-3 py-2 text-sm text-white appearance-none cursor-pointer hover:bg-[#3e3e42] transition-colors'
                >
                  <option value=''>Select Database</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.tenant_id} value={tenant.tenant_id}>
                      {tenant.name || tenant.tenant_id}
                    </option>
                  ))}
                </select>
                <ChevronRight className='absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 h-3 w-3 text-gray-400 pointer-events-none' />
              </div>

              {/* Subtle Upgrade Badge */}
              {tenants.length === 1 && (
                <div className='mt-2 flex items-center justify-between px-2 py-1.5 bg-emerald-600/10 border border-emerald-500/20 rounded text-xs'>
                  <span className='text-gray-300'>Free Plan</span>
                  <button
                    onClick={() =>
                      (window.location.href = '/dashboard/billing')
                    }
                    className='text-emerald-400 hover:text-emerald-300 font-medium'
                  >
                    Upgrade
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Collapsible Tables Section - Supabase Style */}
        {!isCollapsed && activeTenant && (
          <div className='px-2 py-2 border-b border-[#2d2d30]'>
            <button
              onClick={() => setIsTablesExpanded(!isTablesExpanded)}
              className='w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm text-gray-300 hover:text-white hover:bg-[#2d2d30] transition-colors'
            >
              <div className='flex items-center gap-2'>
                <Table className='h-4 w-4' />
                <span className='font-medium'>Tables</span>
                <span className='text-xs bg-[#3e3e42] text-gray-400 px-1.5 py-0.5 rounded-full'>
                  {tableCount}
                </span>
              </div>
              <div className='flex items-center gap-1'>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    loadTables()
                    if (onRefreshSchema) onRefreshSchema()
                  }}
                  disabled={isRefreshing}
                  className='p-0.5 hover:bg-[#3e3e42] rounded transition-colors'
                  title='Refresh tables'
                >
                  <svg
                    className={cn(
                      'h-3 w-3 text-gray-400',
                      isRefreshing && 'animate-spin',
                    )}
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                    />
                  </svg>
                </button>
                <ChevronRight
                  className={cn(
                    'h-3 w-3 transition-transform',
                    isTablesExpanded && 'rotate-90',
                  )}
                />
              </div>
            </button>

            {/* Tables List */}
            {isTablesExpanded && (
              <div className='mt-1 ml-6 max-h-80 overflow-y-auto scrollbar scrollbar--neutral'>
                {tables.length === 0 ? (
                  <div className='px-2 py-4 text-xs text-gray-500 text-center'>
                    No tables yet
                  </div>
                ) : (
                  tables.map((table) => (
                    <button
                      key={`${table.schema}.${table.name}`}
                      onClick={() => {
                        onSectionChange('tables' as DatabaseSection)
                        // You can add logic here to select/highlight the specific table
                      }}
                      className='w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-gray-300 hover:text-white hover:bg-[#2d2d30] transition-colors text-left'
                    >
                      <Table className='h-3 w-3 shrink-0' />
                      <span className='truncate'>{table.fullName}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className='flex-1 overflow-y-auto scrollbar scrollbar--neutral'>
          <div className={cn('p-2', isCollapsed && 'px-1')}>
            {NAVIGATION_ITEMS.map((category) => {
              // Filter out the Tables item from Essential Tools since we show it separately
              const filteredItems = category.items.filter(
                (item) => item.id !== 'tables',
              )
              if (filteredItems.length === 0) return null

              return (
                <div
                  key={category.category}
                  className={cn('mb-6', isCollapsed && 'mb-4')}
                >
                  {!isCollapsed && (
                    <h3 className='text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2'>
                      {category.category}
                    </h3>
                  )}
                  <nav className='space-y-1'>
                    {filteredItems.map((item: any) => {
                      const Icon = item.icon
                      const isActive = activeSection === item.id
                      const isExpanded = expandedSections.has(item.id)
                      const isExpandable = item.expandable && !isCollapsed

                      return (
                        <div key={item.id}>
                          <button
                            onClick={() => {
                              if (isExpandable) {
                                toggleSection(item.id)
                              } else {
                                onSectionChange(item.id as DatabaseSection)
                              }
                            }}
                            className={cn(
                              'w-full flex items-center rounded-md text-sm transition-colors text-left relative',
                              isCollapsed
                                ? 'gap-0 px-2 py-3 justify-center'
                                : 'gap-3 px-3 py-2',
                              isActive && !isExpandable
                                ? 'bg-emerald-600 text-white'
                                : 'text-gray-300 hover:text-white hover:bg-[#2d2d30]',
                            )}
                            title={isCollapsed ? item.label : undefined}
                          >
                            <Icon className='h-4 w-4' />
                            {!isCollapsed && (
                              <>
                                <span>{item.label}</span>
                                {item.badge && (
                                  <span
                                    className={cn(
                                      'ml-auto text-xs px-2 py-0.5 rounded-full font-medium',
                                      item.badgeColor || 'bg-emerald-500',
                                      'text-white',
                                    )}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                                {item.id === 'query-history' && (
                                  <span className='ml-auto text-xs bg-[#3e3e42] text-gray-300 px-1.5 py-0.5 rounded-full'>
                                    {queryHistory.length}
                                  </span>
                                )}
                                {item.id === 'sql-templates' && (
                                  <span className='ml-auto text-xs bg-[#3e3e42] text-gray-300 px-1.5 py-0.5 rounded-full'>
                                    {SQL_TEMPLATES.length}
                                  </span>
                                )}
                                {item.id === 'tables' && (
                                  <div className='ml-auto flex items-center gap-1'>
                                    <span className='text-xs bg-[#3e3e42] text-gray-300 px-1.5 py-0.5 rounded-full'>
                                      {tableCount}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        loadTables()
                                        if (onRefreshSchema) onRefreshSchema()
                                      }}
                                      disabled={isRefreshing}
                                      className='p-0.5 hover:bg-[#3e3e42] rounded transition-colors'
                                      title='Refresh table list'
                                    >
                                      <svg
                                        className={cn(
                                          'h-3 w-3 text-gray-400',
                                          isRefreshing && 'animate-spin',
                                        )}
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        stroke='currentColor'
                                      >
                                        <path
                                          strokeLinecap='round'
                                          strokeLinejoin='round'
                                          strokeWidth={2}
                                          d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                                {item.id === 'functions' && (
                                  <span className='ml-auto text-xs bg-[#3e3e42] text-gray-300 px-1.5 py-0.5 rounded-full'>
                                    3
                                  </span>
                                )}
                                {isExpandable && (
                                  <span className='ml-auto text-gray-400'>
                                    {isExpanded ? '−' : '+'}
                                  </span>
                                )}
                              </>
                            )}
                            {isCollapsed &&
                              (item.id === 'tables' ||
                                item.id === 'functions' ||
                                item.id === 'query-history') && (
                                <span className='absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full'></span>
                              )}
                          </button>

                          {/* Expandable Content */}
                          {isExpandable && isExpanded && (
                            <div className='ml-6 mt-1 space-y-1'>
                              {item.id === 'query-history' && (
                                <div className='max-h-48 overflow-y-auto'>
                                  {queryHistory.length === 0 ? (
                                    <div className='px-3 py-2 text-xs text-gray-500'>
                                      No queries yet
                                    </div>
                                  ) : (
                                    queryHistory
                                      .slice(0, 10)
                                      .map((query, index) => (
                                        <button
                                          key={query.id}
                                          onClick={() => {
                                            if (onLoadQuery) {
                                              onLoadQuery(query.sql, query.name)
                                              onSectionChange('sql-editor')
                                            }
                                          }}
                                          className='w-full text-left px-3 py-2 text-xs rounded hover:bg-[#2d2d30] text-gray-300 hover:text-white group'
                                        >
                                          <div className='truncate font-medium mb-1'>
                                            {query.name}
                                          </div>
                                          <div className='text-gray-500 truncate'>
                                            {new Date(
                                              query.created_at,
                                            ).toLocaleTimeString()}
                                          </div>
                                        </button>
                                      ))
                                  )}
                                  {queryHistory.length > 10 && (
                                    <button
                                      onClick={() =>
                                        onSectionChange('query-history')
                                      }
                                      className='w-full text-left px-3 py-2 text-xs text-emerald-400 hover:text-emerald-300'
                                    >
                                      View all {queryHistory.length} queries →
                                    </button>
                                  )}
                                </div>
                              )}

                              {item.id === 'sql-templates' && (
                                <div className='space-y-1'>
                                  {SQL_TEMPLATES.map((template, index) => (
                                    <button
                                      key={index}
                                      onClick={() => {
                                        if (onLoadQuery) {
                                          onLoadQuery(
                                            template.sql,
                                            template.name,
                                          )
                                          onSectionChange('sql-editor')
                                        }
                                      }}
                                      className='w-full text-left px-3 py-2 text-xs rounded hover:bg-[#2d2d30] text-gray-300 hover:text-white'
                                    >
                                      <div className='truncate font-medium'>
                                        {template.name}
                                      </div>
                                    </button>
                                  ))}
                                  <button
                                    onClick={() =>
                                      onSectionChange('sql-templates')
                                    }
                                    className='w-full text-left px-3 py-2 text-xs text-emerald-400 hover:text-emerald-300'
                                  >
                                    View all templates →
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </nav>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className='flex-1 flex flex-col overflow-hidden'>{children}</div>
    </div>
  )
}
