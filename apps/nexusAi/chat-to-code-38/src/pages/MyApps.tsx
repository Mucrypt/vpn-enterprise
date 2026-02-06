import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Loader2,
  FileCode2,
  Trash2,
  Eye,
  Calendar,
  Layers,
  ArrowLeft,
  Search,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  generatedAppsService,
  type SavedApp,
} from '@/services/generatedAppsService'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const MyApps = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [apps, setApps] = useState<SavedApp[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteAppId, setDeleteAppId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterFramework, setFilterFramework] = useState<string>('all')

  useEffect(() => {
    loadApps()
  }, [])

  const loadApps = async () => {
    setLoading(true)
    try {
      const loadedApps = await generatedAppsService.listApps()
      setApps(loadedApps)
    } catch (error) {
      toast({
        title: 'Failed to Load Apps',
        description:
          error instanceof Error ? error.message : 'Could not load your apps',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteApp = async (appId: string) => {
    try {
      await generatedAppsService.deleteApp(appId)
      setApps((prev) => prev.filter((app) => app.id !== appId))
      setDeleteAppId(null)
      toast({
        title: 'App Deleted',
        description: 'The app has been removed from your library',
      })
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description:
          error instanceof Error ? error.message : 'Could not delete app',
        variant: 'destructive',
      })
    }
  }

  const handleViewApp = async (appId: string) => {
    try {
      const app = await generatedAppsService.getApp(appId)

      // Navigate to build page with loaded app data
      navigate('/build', {
        state: {
          description: app.description,
          framework: app.framework,
          styling: app.styling || 'tailwind',
          features: app.features || [],
          loadedApp: app, // Pass the loaded app
        },
      })
    } catch (error) {
      toast({
        title: 'Failed to Load App',
        description:
          error instanceof Error ? error.message : 'Could not load app details',
        variant: 'destructive',
      })
    }
  }

  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      searchQuery === '' ||
      app.app_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFramework =
      filterFramework === 'all' || app.framework === filterFramework

    return matchesSearch && matchesFramework
  })

  const frameworks = Array.from(new Set(apps.map((app) => app.framework)))

  return (
    <>
      <Helmet>
        <title>My Apps - NexusAI</title>
      </Helmet>

      <div className='min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900'>
        {/* Header */}
        <header className='border-b border-white/10 bg-black/20 backdrop-blur-lg'>
          <div className='container mx-auto px-4 sm:px-6 py-4'>
            <div className='flex items-center justify-between gap-3'>
              <div className='flex items-center gap-2 sm:gap-4 min-w-0'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => navigate('/')}
                  className='hover:bg-white/10 shrink-0'
                >
                  <ArrowLeft className='h-5 w-5' />
                </Button>
                <div className='min-w-0'>
                  <h1 className='text-xl sm:text-2xl font-bold text-white truncate'>
                    My Apps
                  </h1>
                  <p className='text-xs sm:text-sm text-gray-400'>
                    {apps.length} generated {apps.length === 1 ? 'app' : 'apps'}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/describe')}
                size='sm'
                className='bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-xs sm:text-sm whitespace-nowrap'
              >
                <FileCode2 className='mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
                <span className='hidden sm:inline'>Create New App</span>
                <span className='sm:hidden'>New</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className='container mx-auto px-4 py-6'>
          <div className='flex flex-col gap-4 sm:flex-row'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
              <Input
                placeholder='Search apps...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500'
              />
            </div>
            <Select value={filterFramework} onValueChange={setFilterFramework}>
              <SelectTrigger className='w-full sm:w-[200px] bg-white/5 border-white/10 text-white'>
                <Filter className='mr-2 h-4 w-4' />
                <SelectValue placeholder='All Frameworks' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Frameworks</SelectItem>
                {frameworks.map((framework) => (
                  <SelectItem key={framework} value={framework}>
                    {framework.charAt(0).toUpperCase() + framework.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Apps Grid */}
        <div className='container mx-auto px-4 pb-12'>
          {loading ? (
            <div className='flex h-64 items-center justify-center'>
              <Loader2 className='h-8 w-8 animate-spin text-purple-500' />
            </div>
          ) : filteredApps.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-16 text-center'>
              <FileCode2 className='h-16 w-16 text-gray-600 mb-4' />
              <h2 className='text-2xl font-semibold text-white mb-2'>
                {searchQuery || filterFramework !== 'all'
                  ? 'No apps found'
                  : 'No apps yet'}
              </h2>
              <p className='text-gray-400 mb-6 max-w-md'>
                {searchQuery || filterFramework !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start creating amazing apps with AI'}
              </p>
              <Button
                onClick={() => navigate('/describe')}
                className='bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
              >
                <FileCode2 className='mr-2 h-4 w-4' />
                Create Your First App
              </Button>
            </div>
          ) : (
            <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {filteredApps.map((app) => (
                <Card
                  key={app.id}
                  className='bg-white/5 backdrop-blur-sm border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20'
                >
                  <CardHeader>
                    <div className='flex items-start justify-between gap-2'>
                      <CardTitle className='text-white line-clamp-1'>
                        {app.app_name}
                      </CardTitle>
                      <Badge
                        variant='secondary'
                        className='bg-purple-500/20 text-purple-300 border-purple-500/30'
                      >
                        {app.framework}
                      </Badge>
                    </div>
                    <CardDescription className='text-gray-400 line-clamp-2'>
                      {app.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='flex flex-wrap gap-2 mb-4'>
                      {app.features?.slice(0, 3).map((feature, idx) => (
                        <Badge
                          key={idx}
                          variant='outline'
                          className='text-xs border-white/20 text-gray-300'
                        >
                          {feature}
                        </Badge>
                      ))}
                      {app.features && app.features.length > 3 && (
                        <Badge
                          variant='outline'
                          className='text-xs border-white/20 text-gray-300'
                        >
                          +{app.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <div className='flex items-center gap-4 text-sm text-gray-400'>
                      <div className='flex items-center gap-1'>
                        <Layers className='h-4 w-4' />
                        <span>{app.files?.length || 0} files</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Calendar className='h-4 w-4' />
                        <span>
                          {new Date(app.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className='flex gap-2'>
                    <Button
                      onClick={() => handleViewApp(app.id)}
                      className='flex-1 bg-purple-600 hover:bg-purple-700'
                    >
                      <Eye className='mr-2 h-4 w-4' />
                      View
                    </Button>
                    <Button
                      onClick={() => setDeleteAppId(app.id)}
                      variant='outline'
                      size='icon'
                      className='border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteAppId !== null}
        onOpenChange={() => setDeleteAppId(null)}
      >
        <AlertDialogContent className='bg-gray-900 border-white/10'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-white'>
              Delete App?
            </AlertDialogTitle>
            <AlertDialogDescription className='text-gray-400'>
              This action cannot be undone. This will permanently delete the app
              and all its files from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteAppId(null)}
              className='bg-white/5 border-white/10 text-white hover:bg-white/10'
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAppId && handleDeleteApp(deleteAppId)}
              className='bg-red-600 hover:bg-red-700 text-white'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default MyApps
