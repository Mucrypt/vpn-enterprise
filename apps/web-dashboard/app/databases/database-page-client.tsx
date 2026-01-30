'use client'

import React, {
  useState,
  useEffect,
  useRef,
  Suspense,
  lazy,
  useCallback,
} from 'react'
import { useRouter } from 'next/navigation'
import { useQueryStorage } from '@/hooks/use-query-storage'
import { Database, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DatabaseSection } from '@/components/database/database-layout'
import type { SettingsSection } from '@/components/database/settings/settings-layout'
import type { AuthSection } from '@/components/database/auth-layout'
import type { ApiDocsSection } from '@/components/database/api-docs-layout'
// Import lightweight editor directly - no lazy loading needed for fast component
import { SqlEditorPageLight } from '@/components/database/sql-editor-page-light'

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className='flex items-center justify-center h-96'>
    <div className='text-center'>
      <Loader2 className='h-8 w-8 animate-spin text-emerald-600 mx-auto mb-2' />
      <p className='text-sm text-gray-600'>Loading...</p>
    </div>
  </div>
)

// Lazy load only heavy/rarely used components
const DatabaseLayout = lazy(() =>
  import('@/components/database/database-layout').then((module) => ({
    default: module.DatabaseLayout,
  })),
)
const TablesPage = lazy(() =>
  import('@/components/database/tables-page').then((module) => ({
    default: module.TablesPage,
  })),
)
const AiSqlAssistant = lazy(() =>
  import('@/components/database/ai-sql-assistant').then((module) => ({
    default: module.AiSqlAssistant,
  })),
)
const SmartMonitoringPanel = lazy(() =>
  import('@/components/database/smart-monitoring-panel').then((module) => ({
    default: module.SmartMonitoringPanel,
  })),
)
const LiveSchemaVisualizer = lazy(() =>
  import('@/components/database/live-schema-visualizer').then((module) => ({
    default: module.LiveSchemaVisualizer,
  })),
)
const AuthLayout = lazy(() =>
  import('@/components/database/auth-layout').then((module) => ({
    default: module.AuthLayout,
  })),
)
const AuthUsersPage = lazy(() =>
  import('@/components/database/auth-users-page').then((module) => ({
    default: module.AuthUsersPage,
  })),
)
const AuthProvidersPage = lazy(() =>
  import('@/components/database/auth-providers-page').then((module) => ({
    default: module.AuthProvidersPage,
  })),
)
const AuthSessionsPage = lazy(() =>
  import('@/components/database/auth-sessions-page').then((module) => ({
    default: module.AuthSessionsPage,
  })),
)
const AuthRateLimitsPage = lazy(() =>
  import('@/components/database/auth-rate-limits-page').then((module) => ({
    default: module.AuthRateLimitsPage,
  })),
)
const SettingsLayout = lazy(() =>
  import('@/components/database/settings/settings-layout').then((module) => ({
    default: module.SettingsLayout,
  })),
)
const GeneralSettings = lazy(() =>
  import('@/components/database/settings/general-settings').then((module) => ({
    default: module.GeneralSettings,
  })),
)
const ApiKeysSettings = lazy(() =>
  import('@/components/database/settings/api-keys-settings').then((module) => ({
    default: module.ApiKeysSettings,
  })),
)
const JwtKeysSettings = lazy(() =>
  import('@/components/database/settings/jwt-keys-settings').then((module) => ({
    default: module.JwtKeysSettings,
  })),
)
const ComputeDiskSettings = lazy(() =>
  import('@/components/database/settings/compute-disk-settings').then(
    (module) => ({
      default: module.ComputeDiskSettings,
    }),
  ),
)
const InfrastructureSettings = lazy(() =>
  import('@/components/database/settings/infrastructure-settings').then(
    (module) => ({
      default: module.InfrastructureSettings,
    }),
  ),
)
const IntegrationsSettings = lazy(() =>
  import('@/components/database/settings/integrations-settings').then(
    (module) => ({
      default: module.IntegrationsSettings,
    }),
  ),
)
const DataApiSettings = lazy(() =>
  import('@/components/database/settings/data-api-settings').then((module) => ({
    default: module.DataApiSettings,
  })),
)
const FunctionsPage = lazy(() =>
  import('@/components/database/functions-page').then((module) => ({
    default: module.FunctionsPage,
  })),
)
const TriggersPage = lazy(() =>
  import('@/components/database/triggers-page').then((module) => ({
    default: module.TriggersPage,
  })),
)
const ExtensionsPage = lazy(() =>
  import('@/components/database/extensions-page').then((module) => ({
    default: module.ExtensionsPage,
  })),
)
const IndexesPage = lazy(() =>
  import('@/components/database/indexes-page').then((module) => ({
    default: module.IndexesPage,
  })),
)
const PublicationsPage = lazy(() =>
  import('@/components/database/publications-page').then((module) => ({
    default: module.PublicationsPage,
  })),
)
const QueryHistoryPage = lazy(() =>
  import('@/components/database/query-history-page').then((module) => ({
    default: module.QueryHistoryPage,
  })),
)
const SqlTemplatesPage = lazy(() =>
  import('@/components/database/sql-templates-page').then((module) => ({
    default: module.SqlTemplatesPage,
  })),
)
const SavedQueriesPage = lazy(() =>
  import('@/components/database/saved-queries-page').then((module) => ({
    default: module.SavedQueriesPage,
  })),
)
const VisualQueryBuilder = lazy(() =>
  import('@/components/database/visual-query-builder').then((module) => ({
    default: module.VisualQueryBuilder,
  })),
)

// API Docs - lazy load
const ApiDocsLayout = lazy(() =>
  import('@/components/database/api-docs-layout').then((module) => ({
    default: module.ApiDocsLayout,
  })),
)
const ApiIntroductionPage = lazy(() =>
  import('@/components/database/api-introduction-page').then((module) => ({
    default: module.ApiIntroductionPage,
  })),
)
const ApiAuthenticationPage = lazy(() =>
  import('@/components/database/api-authentication-page').then((module) => ({
    default: module.ApiAuthenticationPage,
  })),
)
const ApiTablesViewsPage = lazy(() =>
  import('@/components/database/api-tables-views-page').then((module) => ({
    default: module.ApiTablesViewsPage,
  })),
)

// Lazy load dialogs only when needed
const CreateTableDialog = lazy(() =>
  import('@/components/database/create-table-dialog').then((module) => ({
    default: module.CreateTableDialog,
  })),
)
const CreateSchemaDialog = lazy(() =>
  import('@/components/database/create-schema-dialog').then((module) => ({
    default: module.CreateSchemaDialog,
  })),
)

interface DatabasePageClientProps {
  initialTenants: any[]
}

export function DatabasePageClient({
  initialTenants,
}: DatabasePageClientProps) {
  const router = useRouter()

  // Query storage hook
  const { addToHistory } = useQueryStorage()

  // Database connection state - with localStorage persistence
  const [tenants, setTenants] = useState<any[]>(() => {
    // Try to restore from localStorage first, fallback to initialTenants
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('database_tenants')
        if (stored) {
          const parsed = JSON.parse(stored)
          // Use stored tenants if they exist, otherwise use initial
          return parsed.length > 0 ? parsed : initialTenants
        }
      } catch (error) {
        console.error(
          '[DatabasePageClient] Error loading stored tenants:',
          error,
        )
      }
    }
    return initialTenants
  })

  const [activeTenant, setActiveTenant] = useState<string>(() => {
    // Try to restore from localStorage first
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('active_tenant')
        if (stored) {
          return stored
        }
      } catch (error) {
        console.error(
          '[DatabasePageClient] Error loading stored tenant:',
          error,
        )
      }
    }
    return initialTenants[0]?.tenant_id || initialTenants[0]?.id || ''
  })

  const [tenantsError, setTenantsError] = useState<string | null>(null)
  const [canCreateProject, setCanCreateProject] = useState(false)
  const [activeSection, setActiveSection] =
    useState<DatabaseSection>('sql-editor')
  const [showSampleDataBanner, setShowSampleDataBanner] = useState(false)

  // Settings state
  const [activeSettingsSection, setActiveSettingsSection] =
    useState<SettingsSection>('general')

  // Authentication state
  const [activeAuthSection, setActiveAuthSection] =
    useState<AuthSection>('users')

  // API Docs state
  const [activeApiDocsSection, setActiveApiDocsSection] =
    useState<ApiDocsSection>('introduction')

  // SQL Editor state
  const [sql, setSql] = useState<string>(`-- Welcome to the SQL Editor!
-- Try these example queries:

-- View blog posts
SELECT * FROM blog.posts LIMIT 5;

-- View ecommerce products
-- SELECT * FROM ecommerce.products LIMIT 5;

-- Current database info
-- SELECT current_database(), current_user, version();`)
  const [queryResult, setQueryResult] = useState<any[] | null>(null)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const [activeQueryName, setActiveQueryName] =
    useState<string>('Welcome Query')

  // Dialog state
  const [showCreateTableDialog, setShowCreateTableDialog] = useState(false)
  const [showCreateSchemaDialog, setShowCreateSchemaDialog] = useState(false)
  const [selectedSchemaForTable, setSelectedSchemaForTable] = useState('')

  // Persist tenants to localStorage when they change
  useEffect(() => {
    if (tenants.length > 0) {
      try {
        localStorage.setItem('database_tenants', JSON.stringify(tenants))
        console.log(
          '[DatabasePageClient] Persisted',
          tenants.length,
          'tenants to localStorage',
        )
      } catch (error) {
        console.error('[DatabasePageClient] Error saving tenants:', error)
      }
    }
  }, [tenants])

  // Persist activeTenant to localStorage when it changes
  useEffect(() => {
    if (activeTenant) {
      try {
        localStorage.setItem('active_tenant', activeTenant)
        console.log(
          '[DatabasePageClient] Persisted activeTenant to localStorage:',
          activeTenant,
        )
      } catch (error) {
        console.error('[DatabasePageClient] Error saving activeTenant:', error)
      }
    }
  }, [activeTenant])

  // Sync with initialTenants when they change (after successful API fetch)
  useEffect(() => {
    if (initialTenants.length > 0) {
      setTenants(initialTenants)

      // If we don't have an activeTenant yet, set the first one
      if (!activeTenant && initialTenants[0]) {
        const firstTenantId =
          initialTenants[0].tenant_id || initialTenants[0].id
        setActiveTenant(firstTenantId)
        console.log(
          '[DatabasePageClient] Set initial activeTenant:',
          firstTenantId,
        )
      }
    }
  }, [initialTenants])

  // Check for existing data when tenant changes - define before use
  const checkForExistingData = useCallback(async () => {
    if (!activeTenant) return

    try {
      // Optimized: single query instead of fetching all schemas
      const response = await fetch(`/api/v1/tenants/${activeTenant}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sql: "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast');",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const tableCount = parseInt(data.data?.[0]?.count || '0')
        setShowSampleDataBanner(tableCount === 0)
      }
    } catch (error) {
      console.warn('Could not check for existing data:', error)
      setShowSampleDataBanner(false)
    }
  }, [activeTenant])

  // Check for existing data when tenant changes - optimized with callback
  useEffect(() => {
    if (activeTenant) {
      const timer = setTimeout(() => {
        checkForExistingData()
      }, 500) // Debounce
      return () => clearTimeout(timer)
    }
  }, [activeTenant, checkForExistingData])

  // Query execution with cancel capability
  const abortControllerRef = useRef<AbortController | null>(null)
  const [queryStatus, setQueryStatus] = useState<
    'idle' | 'running' | 'cancelled'
  >('idle')

  // Schema refresh trigger
  const [schemaRefreshKey, setSchemaRefreshKey] = useState(0)

  const refreshSchema = () => {
    setSchemaRefreshKey((prev) => prev + 1)
  }

  // Check if SQL contains DDL statements that modify schema
  const isDDLStatement = (sql: string): boolean => {
    const ddlKeywords =
      /\b(CREATE|ALTER|DROP|TRUNCATE|RENAME)\s+(TABLE|INDEX|VIEW|FUNCTION|TRIGGER|SCHEMA|DATABASE)/i
    return ddlKeywords.test(sql)
  }

  const cancelQuery = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setQueryStatus('cancelled')
      setIsLoading(false)
      setQueryError('Query cancelled by user')
    }
  }

  const handleSqlChange = (value: string) => {
    setSql(value)
    setQueryStatus('idle')
  }

  const executeQuery = async () => {
    if (!sql.trim()) {
      setQueryError('Please enter a SQL query')
      return
    }

    if (!activeTenant) {
      setQueryError('No active tenant selected')
      return
    }

    setIsLoading(true)
    setQueryError(null)
    setQueryResult(null)
    setExecutionTime(null)
    setQueryStatus('running')

    // Create abort controller
    abortControllerRef.current = new AbortController()

    const startTime = Date.now()
    try {
      const response = await fetch(`/api/v1/tenants/${activeTenant}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sql }),
        signal: abortControllerRef.current.signal,
      })

      const endTime = Date.now()
      setExecutionTime(endTime - startTime)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      setQueryResult(data.data || [])
      setQueryStatus('idle')
      addToHistory(sql, 'success', {
        rowCount: data.data?.length,
        duration: endTime - startTime,
      })

      // Auto-refresh schema if DDL statement was executed
      if (isDDLStatement(sql)) {
        console.log('DDL statement detected, refreshing schema...')
        setTimeout(() => refreshSchema(), 500)
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setQueryError('Query cancelled by user')
        setQueryStatus('cancelled')
      } else {
        setQueryError(error.message || 'Failed to execute query')
        setQueryStatus('idle')
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  // Handle CREATE TABLE button
  const handleCreateTable = (schemaName?: string) => {
    setSelectedSchemaForTable(schemaName || '')
    setShowCreateTableDialog(true)
  }

  // Handle sample data import
  const importSampleData = async () => {
    if (!activeTenant) return

    try {
      const response = await fetch(
        `/api/v1/tenants/${activeTenant}/sample-data`,
        {
          method: 'POST',
          credentials: 'include',
        },
      )

      if (response.ok) {
        setShowSampleDataBanner(false)
        // Refresh the page to show new data
        window.location.reload()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to import sample data')
      }
    } catch (error) {
      console.error('Error importing sample data:', error)
      alert('Failed to import sample data')
    }
  }

  // Handle query template
  const loadQueryTemplate = (templateSql: string, name: string) => {
    setSql(templateSql)
    setActiveQueryName(name)
    setActiveSection('sql-editor')
  }

  // Handle saved query
  const loadSavedQuery = (savedSql: string, name: string) => {
    setSql(savedSql)
    setActiveQueryName(name)
    setActiveSection('sql-editor')
  }

  // Error display for tenant loading issues
  if (tenantsError) {
    return (
      <div className='min-h-screen bg-gray-50 p-8'>
        <div className='max-w-2xl mx-auto'>
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <div className='flex items-center gap-3 text-red-600 mb-4'>
              <Database className='h-6 w-6' />
              <h2 className='text-xl font-semibold'>Database Access Issue</h2>
            </div>
            <p className='text-gray-600 mb-4'>{tenantsError}</p>
            {canCreateProject && (
              <Button
                onClick={() => router.push('/databases/new')}
                className='bg-emerald-600 hover:bg-emerald-700'
              >
                Create Your First Project
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DatabaseLayout
        tenants={tenants}
        activeTenant={activeTenant}
        onTenantChange={setActiveTenant}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLoadQuery={loadQueryTemplate}
        onRefreshSchema={refreshSchema}
      >
        {activeSection === 'sql-editor' && (
          <SqlEditorPageLight
            activeTenant={activeTenant}
            sql={sql}
            setSql={setSql}
            runQuery={executeQuery}
            cancelQuery={cancelQuery}
            queryResult={queryResult}
            queryError={queryError}
            isLoading={isLoading}
            executionTime={executionTime}
            queryStatus={queryStatus}
            activeQueryName={activeQueryName}
            setActiveQueryName={setActiveQueryName}
          />
        )}

        {activeSection === 'tables' && (
          <Suspense fallback={<LoadingSpinner />}>
            <TablesPage
              key={schemaRefreshKey}
              activeTenant={activeTenant}
              onCreateTable={handleCreateTable}
            />
          </Suspense>
        )}

        {activeSection === 'ai-assistant' && (
          <Suspense fallback={<LoadingSpinner />}>
            <AiSqlAssistant
              activeTenant={activeTenant}
              onQueryGenerated={(sql) => {
                setSql(sql)
                setActiveSection('sql-editor')
              }}
            />
          </Suspense>
        )}

        {activeSection === 'monitoring' && (
          <Suspense fallback={<LoadingSpinner />}>
            <SmartMonitoringPanel activeTenant={activeTenant} />
          </Suspense>
        )}

        {activeSection === 'schema-visualizer' && (
          <Suspense fallback={<LoadingSpinner />}>
            <LiveSchemaVisualizer activeTenant={activeTenant} tables={[]} />
          </Suspense>
        )}

        {activeSection === 'visual-query-builder' && (
          <Suspense fallback={<LoadingSpinner />}>
            <VisualQueryBuilder
              availableTables={[]}
              onQueryGenerated={(sql) => {
                setSql(sql)
                setActiveSection('sql-editor')
              }}
              onExecuteQuery={executeQuery}
            />
          </Suspense>
        )}

        {activeSection === 'query-history' && (
          <Suspense fallback={<LoadingSpinner />}>
            <QueryHistoryPage
              activeTenant={activeTenant}
              onLoadQuery={loadQueryTemplate}
            />
          </Suspense>
        )}

        {activeSection === 'sql-templates' && (
          <Suspense fallback={<LoadingSpinner />}>
            <SqlTemplatesPage onLoadTemplate={loadQueryTemplate} />
          </Suspense>
        )}

        {activeSection === 'saved-queries' && (
          <Suspense fallback={<LoadingSpinner />}>
            <SavedQueriesPage
              activeTenant={activeTenant}
              onLoadQuery={loadSavedQuery}
            />
          </Suspense>
        )}

        {activeSection === 'functions' && (
          <Suspense fallback={<LoadingSpinner />}>
            <FunctionsPage activeTenant={activeTenant} />
          </Suspense>
        )}

        {activeSection === 'triggers' && (
          <Suspense fallback={<LoadingSpinner />}>
            <TriggersPage activeTenant={activeTenant} />
          </Suspense>
        )}

        {activeSection === 'extensions' && (
          <Suspense fallback={<LoadingSpinner />}>
            <ExtensionsPage activeTenant={activeTenant} />
          </Suspense>
        )}

        {activeSection === 'indexes' && (
          <Suspense fallback={<LoadingSpinner />}>
            <IndexesPage activeTenant={activeTenant} />
          </Suspense>
        )}

        {activeSection === 'publications' && (
          <Suspense fallback={<LoadingSpinner />}>
            <PublicationsPage activeTenant={activeTenant} />
          </Suspense>
        )}

        {activeSection === 'settings' && (
          <Suspense fallback={<LoadingSpinner />}>
            <SettingsLayout
              activeSection={activeSettingsSection}
              onSectionChange={setActiveSettingsSection}
              activeTenant={activeTenant}
            >
              {activeSettingsSection === 'general' && (
                <GeneralSettings activeTenant={activeTenant} />
              )}
              {activeSettingsSection === 'api-keys' && (
                <ApiKeysSettings activeTenant={activeTenant} />
              )}
              {activeSettingsSection === 'jwt-keys' && (
                <JwtKeysSettings activeTenant={activeTenant} />
              )}
              {activeSettingsSection === 'compute-disk' && (
                <ComputeDiskSettings activeTenant={activeTenant} />
              )}
              {activeSettingsSection === 'infrastructure' && (
                <InfrastructureSettings activeTenant={activeTenant} />
              )}
              {activeSettingsSection === 'integrations' && (
                <IntegrationsSettings activeTenant={activeTenant} />
              )}
              {activeSettingsSection === 'data-api' && (
                <DataApiSettings activeTenant={activeTenant} />
              )}
            </SettingsLayout>
          </Suspense>
        )}

        {activeSection === 'authentication' && (
          <Suspense fallback={<LoadingSpinner />}>
            <AuthLayout
              activeSection={activeAuthSection}
              onSectionChange={setActiveAuthSection}
              activeTenant={activeTenant}
            >
              {activeAuthSection === 'users' && (
                <AuthUsersPage activeTenant={activeTenant} />
              )}
              {activeAuthSection === 'providers' && (
                <AuthProvidersPage activeTenant={activeTenant} />
              )}
              {activeAuthSection === 'sessions' && (
                <AuthSessionsPage activeTenant={activeTenant} />
              )}
              {activeAuthSection === 'rate-limits' && (
                <AuthRateLimitsPage activeTenant={activeTenant} />
              )}
              {/* Add more auth sections as needed */}
            </AuthLayout>
          </Suspense>
        )}

        {activeSection === 'api-docs' && (
          <Suspense fallback={<LoadingSpinner />}>
            <ApiDocsLayout
              activeSection={activeApiDocsSection}
              onSectionChange={setActiveApiDocsSection}
              activeTenant={activeTenant}
            >
              {activeApiDocsSection === 'introduction' && (
                <ApiIntroductionPage activeTenant={activeTenant} />
              )}
              {activeApiDocsSection === 'authentication' && (
                <ApiAuthenticationPage activeTenant={activeTenant} />
              )}
              {activeApiDocsSection === 'tables-views' && (
                <ApiTablesViewsPage activeTenant={activeTenant} />
              )}
              {/* Add more API docs sections as they are created */}
            </ApiDocsLayout>
          </Suspense>
        )}
      </DatabaseLayout>

      {showCreateTableDialog && (
        <Suspense fallback={null}>
          <CreateTableDialog
            isOpen={showCreateTableDialog}
            onClose={() => {
              setShowCreateTableDialog(false)
              setSelectedSchemaForTable('')
            }}
            schemaName={selectedSchemaForTable}
            onCreateTable={async () => {
              setShowCreateTableDialog(false)
              setSelectedSchemaForTable('')
            }}
          />
        </Suspense>
      )}

      {showCreateSchemaDialog && (
        <Suspense fallback={null}>
          <CreateSchemaDialog
            isOpen={showCreateSchemaDialog}
            onClose={() => setShowCreateSchemaDialog(false)}
            onCreateSchema={async () => {
              setShowCreateSchemaDialog(false)
            }}
          />
        </Suspense>
      )}
    </Suspense>
  )
}
