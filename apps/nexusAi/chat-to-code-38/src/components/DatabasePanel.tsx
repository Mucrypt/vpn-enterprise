import { useState } from 'react'
import {
  Database,
  Check,
  Loader2,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { generatedAppsService } from '@/services/generatedAppsService'
import { useToast } from '@/hooks/use-toast'
import type {
  GetDatabaseResponse,
  ProvisionDatabaseResponse,
} from '@/types/database'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface DatabasePanelProps {
  appId: string | null
  requiresDatabase?: boolean
  onDatabaseProvisioned?: (connectionString: string) => void
}

export function DatabasePanel({
  appId,
  requiresDatabase = false,
  onDatabaseProvisioned,
}: DatabasePanelProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [databaseInfo, setDatabaseInfo] = useState<GetDatabaseResponse | null>(
    null,
  )
  const [provisionResult, setProvisionResult] =
    useState<ProvisionDatabaseResponse | null>(null)
  const [initializeSchema, setInitializeSchema] = useState(true)
  const [showConnectionString, setShowConnectionString] = useState(false)
  const [copied, setCopied] = useState(false)

  const checkDatabaseStatus = async () => {
    if (!appId) return

    setChecking(true)
    try {
      const info = await generatedAppsService.getDatabaseInfo(appId)
      setDatabaseInfo(info)
    } catch (error) {
      console.error('Failed to check database status:', error)
    } finally {
      setChecking(false)
    }
  }

  const provisionDatabase = async () => {
    if (!appId) {
      toast({
        title: 'Error',
        description:
          'Please save your app first before provisioning a database',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const result = await generatedAppsService.provisionDatabase(appId, {
        initialize_schema: initializeSchema,
      })

      setProvisionResult(result)
      setDatabaseInfo({
        has_database: true,
        database: result.database,
        connection_string: result.connection_string,
      })

      if (onDatabaseProvisioned) {
        onDatabaseProvisioned(result.connection_string)
      }

      toast({
        title: '✅ Database Provisioned!',
        description: result.already_exists
          ? 'Database already exists for this app'
          : 'Your PostgreSQL database is ready to use',
      })
    } catch (error) {
      toast({
        title: 'Provisioning Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to provision database',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const copyConnectionString = async () => {
    if (!provisionResult?.connection_string) return

    await navigator.clipboard.writeText(provisionResult.connection_string)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    toast({
      title: 'Copied!',
      description: 'Connection string copied to clipboard',
    })
  }

  // Auto-check status when appId changes
  useState(() => {
    if (appId) {
      checkDatabaseStatus()
    }
  })

  if (!appId) {
    return (
      <Card className='border-dashed'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Database className='w-5 h-5' />
            Database (Optional)
          </CardTitle>
          <CardDescription>
            Save your app first to provision a dedicated PostgreSQL database
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <Database className='w-5 h-5 text-primary' />
              Database Provisioning
              {databaseInfo?.has_database && (
                <Badge variant='secondary' className='ml-2'>
                  <Check className='w-3 h-3 mr-1' />
                  Provisioned
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {requiresDatabase
                ? 'This app requires a database to function'
                : 'Add a PostgreSQL database to your app (optional)'}
            </CardDescription>
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={checkDatabaseStatus}
            disabled={checking}
          >
            {checking ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              'Refresh'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {!databaseInfo?.has_database ? (
          <>
            <Alert>
              <AlertCircle className='w-4 h-4' />
              <AlertDescription>
                Get a dedicated PostgreSQL database with 1GB storage, automated
                backups, and instant provisioning
              </AlertDescription>
            </Alert>

            <div className='flex items-center space-x-2'>
              <Switch
                id='initialize-schema'
                checked={initializeSchema}
                onCheckedChange={setInitializeSchema}
              />
              <Label htmlFor='initialize-schema' className='text-sm'>
                Initialize with starter schema (recommended)
              </Label>
            </div>

            <Button
              onClick={provisionDatabase}
              disabled={loading}
              className='w-full'
              size='lg'
            >
              {loading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Provisioning Database...
                </>
              ) : (
                <>
                  <Database className='w-4 h-4 mr-2' />
                  Provision PostgreSQL Database
                </>
              )}
            </Button>
          </>
        ) : (
          <div className='space-y-4'>
            <Alert className='bg-green-50 border-green-200'>
              <Check className='w-4 h-4 text-green-600' />
              <AlertDescription className='text-green-800'>
                Database is active and ready to use
                {provisionResult?.tables_created &&
                  provisionResult.tables_created > 0 && (
                    <span className='block mt-1 font-semibold'>
                      🎉 {provisionResult.tables_created} tables created
                      automatically from your app code!
                    </span>
                  )}
              </AlertDescription>
            </Alert>

            {provisionResult && (
              <div className='space-y-3'>
                {provisionResult.schema_generated && (
                  <Alert className='bg-blue-50 border-blue-200'>
                    <Database className='w-4 h-4 text-blue-600' />
                    <AlertDescription className='text-blue-800'>
                      <strong>Auto-Schema Generation:</strong> We analyzed your
                      app code and created {provisionResult.tables_created}{' '}
                      database tables automatically. Your app is fully
                      connected!
                    </AlertDescription>
                  </Alert>
                )}

                <div className='flex items-center justify-between'>
                  <Label className='text-sm font-medium'>
                    Connection String
                  </Label>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() =>
                      setShowConnectionString(!showConnectionString)
                    }
                  >
                    {showConnectionString ? (
                      <EyeOff className='w-4 h-4' />
                    ) : (
                      <Eye className='w-4 h-4' />
                    )}
                  </Button>
                </div>
                <div className='flex gap-2'>
                  <code className='flex-1 bg-muted p-3 rounded text-xs break-all font-mono'>
                    {showConnectionString
                      ? provisionResult.connection_string
                      : provisionResult.connection_string.replace(
                          /:(.*?)@/,
                          ':***@',
                        )}
                  </code>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={copyConnectionString}
                  >
                    {copied ? (
                      <Check className='w-4 h-4 text-green-600' />
                    ) : (
                      <Copy className='w-4 h-4' />
                    )}
                  </Button>
                </div>

                <Alert>
                  <AlertDescription className='text-xs'>
                    <strong>Next steps:</strong>
                    <ul className='list-disc list-inside mt-2 space-y-1'>
                      <li>
                        Use this connection string in your app's environment
                        variables
                      </li>
                      <li>Access the database editor in your dashboard</li>
                      <li>Run migrations and seed data as needed</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className='grid grid-cols-2 gap-2'>
              <Button variant='outline' size='sm' asChild>
                <a href='/dashboard/databases' target='_blank'>
                  <Database className='w-4 h-4 mr-2' />
                  Open Editor
                </a>
              </Button>
              <Button variant='outline' size='sm' onClick={checkDatabaseStatus}>
                View Details
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
