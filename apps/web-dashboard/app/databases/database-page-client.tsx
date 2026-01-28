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

  // Database connection state
  const [tenants, setTenants] = useState<any[]>(initialTenants)
  const [activeTenant, setActiveTenant] = useState<string>(
    initialTenants[0]?.tenant_id || initialTenants[0]?.id || '',
  )
  const [tenantsError, setTenantsError] = useState<string | null>(null)
  const [canCreateProject, setCanCreateProject] = useState(false)
  const [activeSection, setActiveSection] =
    useState<DatabaseSection>('sql-editor')
  const [showSampleDataBanner, setShowSampleDataBanner] = useState(false)

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
              activeTenant={activeTenant}
              onCreateTable={handleCreateTable}
            />
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
