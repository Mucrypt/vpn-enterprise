import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Loader2,
  Sparkles,
  FileCode2,
  Copy,
  Check,
  Rocket,
  Globe,
  Eye,
  Terminal as TerminalIcon,
  X,
  Menu,
  ArrowLeft,
  Database,
} from 'lucide-react'
import { CodePreview, LivePreview } from '@/components/CodePreview'
import { Terminal } from '@/components/Terminal'
import { DatabasePanel } from '@/components/DatabasePanel'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import {
  useAI,
  type MultiFileGenerateResponse,
  type FileOutput,
  type DeploymentResponse,
} from '@/services/aiService'
import { generatedAppsService } from '@/services/generatedAppsService'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import type { SavedApp } from '@/services/generatedAppsService'

const AppBuilder = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { generateFullApp, generateFullStackApp, deployApp } = useAI()

  // State from AppDescription page or MyApps page
  const appDetails = location.state as {
    description: string
    framework: string
    styling: string
    features: string[]
    fullStackMode?: boolean
    loadedApp?: SavedApp
  } | null

  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [generatedApp, setGeneratedApp] =
    useState<MultiFileGenerateResponse | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileOutput | null>(null)
  const [copiedFile, setCopiedFile] = useState<string | null>(null)
  const [deploying, setDeploying] = useState(false)
  const [deployment, setDeployment] = useState<DeploymentResponse | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [savedAppId, setSavedAppId] = useState<string | null>(null)

  // Load app from database if appId is in URL
  useEffect(() => {
    const loadAppFromDatabase = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const appId = urlParams.get('appId')

      if (appId) {
        try {
          setLoading(true)
          const savedApp = await generatedAppsService.getApp(appId)

          const files: FileOutput[] = (savedApp.files || []).map((file) => ({
            path: file.file_path,
            name: file.file_path,
            content: file.content,
            language: file.language,
          }))

          setGeneratedApp({
            files,
            instructions: savedApp.description || 'Loaded from saved apps',
            dependencies: savedApp.dependencies || {},
            requires_database: savedApp.requires_database,
          })

          if (files.length > 0) {
            setSelectedFile(files[0])
          }

          setSavedAppId(savedApp.id)
          setLoading(false)
          return true
        } catch (error) {
          console.error('Failed to load app from database:', error)
          return false
        }
      }
      return false
    }

    const init = async () => {
      // First, try to load from URL params
      const loaded = await loadAppFromDatabase()
      if (loaded) return

      // If no URL params, check if we have appDetails from navigation
      if (!appDetails) {
        navigate('/describe')
        return
      }

      // If loading a saved app from navigation state
      if (appDetails.loadedApp) {
        const savedApp = appDetails.loadedApp
        const files: FileOutput[] = (savedApp.files || []).map((file) => ({
          path: file.file_path,
          name: file.file_path,
          content: file.content,
          language: file.language,
        }))

        setGeneratedApp({
          files,
          instructions: savedApp.description || 'Loaded from saved apps',
          dependencies: savedApp.dependencies || {},
          requires_database: savedApp.requires_database,
        })

        if (files.length > 0) {
          setSelectedFile(files[0])
        }

        setSavedAppId(savedApp.id)

        // Update URL with appId so it persists on refresh
        navigate(`/build?appId=${savedApp.id}`, { replace: true })

        setLoading(false)
      } else {
        // Auto-generate on mount for new apps
        handleGenerate()
      }
    }

    init()
  }, [])

  const handleGenerate = async () => {
    if (!appDetails) return

    setLoading(true)
    setProgress(10)
    setGeneratedApp(null)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90))
      }, 800)

      // Use Full-Stack mode if enabled (Dual-AI: Claude + GPT-4)
      const generateFn = appDetails.fullStackMode
        ? generateFullStackApp
        : generateFullApp

      const result = await generateFn({
        description: appDetails.description,
        framework: appDetails.framework as any,
        styling: appDetails.styling as any,
        features: appDetails.features,
      })

      toast({
        title: appDetails.fullStackMode
          ? '🎉 Full-Stack App Generated!'
          : '✅ App Generated',
        description: appDetails.fullStackMode
          ? `Generated ${result.files?.length || 0} files with backend API, database, and Postman collection using dual-AI system!`
          : `Generated ${result.files?.length || 0} files successfully`,
      })

      clearInterval(progressInterval)
      setProgress(100)
      setGeneratedApp(result)

      // Select first file
      if (result.files && result.files.length > 0) {
        setSelectedFile(result.files[0])
      }

      // Save to database
      try {
        const appName = appDetails.description
          .split(' ')
          .slice(0, 5)
          .join(' ')
          .substring(0, 50)

        const savedApp = await generatedAppsService.saveApp({
          app_name: appName || 'Untitled App',
          description: appDetails.description,
          framework: appDetails.framework,
          styling: appDetails.styling,
          features: appDetails.features,
          dependencies: result.dependencies || {},
          requires_database: result.requires_database ?? false,
          files: (result.files || []).map((file) => ({
            file_path: file.path || file.name || 'unknown',
            content: file.content || '',
            language: file.language || 'text',
            is_entry_point:
              (file.path || file.name || '')?.toLowerCase().includes('index') ||
              (file.path || file.name || '')?.toLowerCase().includes('main'),
          })),
        })

        setSavedAppId(savedApp.id)

        // Update URL with appId so it persists on refresh
        navigate(`/build?appId=${savedApp.id}`, { replace: true })

        toast({
          title: '✨ App Generated & Saved!',
          description: `Created ${result.files?.length || 0} files and saved to your library`,
        })
      } catch (saveError) {
        // Still show success for generation even if save fails
        console.error('Failed to save app:', saveError)
        toast({
          title: '✨ App Generated!',
          description: `Created ${result.files?.length || 0} files (save failed - check authentication)`,
        })
      }
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description:
          error instanceof Error ? error.message : 'Failed to generate app',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyFile = async (content: string, fileName: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedFile(fileName)
    setTimeout(() => setCopiedFile(null), 2000)

    toast({
      title: 'Copied to Clipboard',
      description: `${fileName} copied successfully`,
    })
  }

  const handleDeploy = async () => {
    if (!generatedApp || !appDetails) return

    setDeploying(true)

    try {
      const appName = appDetails.description
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .substring(0, 30)

      const result = await deployApp({
        app_name: appName,
        framework: appDetails.framework,
        files: generatedApp.files || [],
        dependencies: generatedApp.dependencies || {},
        requires_database: generatedApp.requires_database ?? true,
        user_id: 'demo-user',
      })

      setDeployment(result)

      toast({
        title: '🚀 App Deployed!',
        description: `Your app is live at ${result.app_url}`,
      })
    } catch (error) {
      toast({
        title: 'Deployment Failed',
        description:
          error instanceof Error ? error.message : 'Failed to deploy app',
        variant: 'destructive',
      })
    } finally {
      setDeploying(false)
    }
  }

  // Loading Screen
  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-background via-primary/5 to-purple-600/10 flex items-center justify-center relative overflow-hidden'>
        <Helmet>
          <title>Generating Your App - NexusAI</title>
        </Helmet>

        {/* Animated background */}
        <div className='absolute inset-0 overflow-hidden'>
          <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse' />
          <div
            className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse'
            style={{ animationDelay: '1s' }}
          />
        </div>

        {/* Loading content */}
        <div className='relative z-10 max-w-2xl w-full mx-auto px-4 sm:px-6 text-center'>
          <div className='mb-6 sm:mb-8 flex justify-center'>
            <div className='relative'>
              <div className='w-20 h-20 sm:w-24 sm:h-24 border-4 border-primary/30 rounded-full' />
              <div className='absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 border-4 border-transparent border-t-primary rounded-full animate-spin' />
              <Sparkles className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 text-primary animate-pulse' />
            </div>
          </div>

          <h2 className='text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-foreground via-primary to-purple-600 bg-clip-text text-transparent'>
            Creating Your Application
          </h2>

          <p className='text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8'>
            AI is building your app with production-ready code
          </p>

          {/* Progress bar */}
          <div className='space-y-3 sm:space-y-4 mb-6 sm:mb-8'>
            <Progress value={progress} className='h-2 sm:h-3' />
            <div className='flex justify-between text-xs sm:text-sm text-muted-foreground px-2'>
              <span>Progress</span>
              <span className='font-semibold text-primary'>{progress}%</span>
            </div>
          </div>

          {/* Status messages */}
          <div className='space-y-2 sm:space-y-3'>
            <div
              className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border-2 transition-all ${progress >= 10 ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'}`}
            >
              {progress >= 30 ? (
                <Check className='w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0' />
              ) : (
                <Loader2 className='w-4 h-4 sm:w-5 sm:h-5 animate-spin text-muted-foreground shrink-0' />
              )}
              <span
                className={`text-xs sm:text-sm ${
                  progress >= 10
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                Analyzing requirements & planning architecture
              </span>
            </div>

            <div
              className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border-2 transition-all ${progress >= 30 && progress < 60 ? 'border-primary bg-primary/5' : progress >= 60 ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'}`}
            >
              {' '}
              {progress >= 60 ? (
                <Check className='w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0' />
              ) : progress >= 30 ? (
                <Loader2 className='w-4 h-4 sm:w-5 sm:h-5 animate-spin text-primary shrink-0' />
              ) : (
                <Loader2 className='w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0' />
              )}
              <span
                className={`text-xs sm:text-sm ${
                  progress >= 30
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                Generating components & project structure
              </span>
            </div>

            <div
              className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border-2 transition-all ${progress >= 60 && progress < 90 ? 'border-primary bg-primary/5' : progress >= 90 ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'}`}
            >
              {progress >= 90 ? (
                <Check className='w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0' />
              ) : progress >= 60 ? (
                <Loader2 className='w-4 h-4 sm:w-5 sm:h-5 animate-spin text-primary shrink-0' />
              ) : (
                <Loader2 className='w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0' />
              )}
              <span
                className={`text-xs sm:text-sm ${
                  progress >= 60
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                Writing code & configuring dependencies
              </span>
            </div>

            <div
              className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border-2 transition-all ${progress >= 90 ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'}`}
            >
              {progress >= 100 ? (
                <Check className='w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0' />
              ) : progress >= 90 ? (
                <Loader2 className='w-4 h-4 sm:w-5 sm:h-5 animate-spin text-primary shrink-0' />
              ) : (
                <Loader2 className='w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0' />
              )}
              <span
                className={`text-xs sm:text-sm ${
                  progress >= 90
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                Finalizing & optimizing your application
              </span>
            </div>
          </div>

          <p className='mt-6 sm:mt-8 text-xs sm:text-sm text-muted-foreground'>
            This usually takes 3-5 minutes. Hang tight! ☕
          </p>
        </div>
      </div>
    )
  }

  // Code Editor View
  return (
    <>
      <Helmet>
        <title>Code Editor - NexusAI</title>
      </Helmet>

      <div className='h-screen flex flex-col bg-background overflow-hidden'>
        {/* Top Navigation Bar */}
        <div className='flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 border-b bg-card/50 backdrop-blur-sm gap-2 min-h-[60px]'>
          <div className='flex items-center gap-2 sm:gap-4 min-w-0 flex-1'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => navigate('/describe')}
              className='gap-1 sm:gap-2 shrink-0'
            >
              <ArrowLeft className='w-4 h-4' />
              <span className='hidden sm:inline'>Back</span>
            </Button>
            <Separator orientation='vertical' className='h-6 hidden sm:block' />
            <div className='flex items-center gap-2 min-w-0'>
              <FileCode2 className='w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0' />
              <span className='font-semibold text-sm sm:text-lg truncate'>
                {appDetails?.description.substring(0, 30) || 'Generated App'}
              </span>
            </div>
          </div>

          <div className='flex items-center gap-1 sm:gap-2 shrink-0'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => navigate('/my-apps')}
              className='gap-1 sm:gap-2 hidden md:flex'
            >
              <FileCode2 className='w-4 h-4' />
              My Apps
            </Button>
            {deployment ? (
              <Button
                variant='outline'
                size='sm'
                onClick={() => window.open(deployment.app_url, '_blank')}
                className='gap-1 sm:gap-2 text-xs sm:text-sm'
              >
                <Globe className='w-4 h-4' />
                <span className='hidden sm:inline'>View Live App</span>
                <span className='sm:hidden'>Live</span>
              </Button>
            ) : (
              <Button
                onClick={handleDeploy}
                disabled={deploying}
                size='sm'
                className='gap-1 sm:gap-2 bg-gradient-to-r from-primary to-purple-600 text-xs sm:text-sm'
              >
                {deploying ? (
                  <>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    <span className='hidden sm:inline'>Deploying...</span>
                  </>
                ) : (
                  <>
                    <Rocket className='w-4 h-4' />
                    <span className='hidden sm:inline'>Deploy to Platform</span>
                    <span className='sm:hidden'>Deploy</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Main Editor Area */}
        <div className='flex-1 flex overflow-hidden relative'>
          {/* File Sidebar */}
          <div
            className={`${sidebarOpen ? 'w-48 sm:w-56 md:w-64' : 'w-0'} border-r bg-card/30 backdrop-blur-sm transition-all duration-300 overflow-hidden shrink-0`}
          >
            <div className='p-4 border-b flex items-center justify-between'>
              <span className='font-semibold text-sm uppercase tracking-wide text-muted-foreground'>
                Files
              </span>
              <Button
                variant='ghost'
                size='icon'
                className='h-6 w-6'
                onClick={() => setSidebarOpen(false)}
              >
                <X className='w-4 h-4' />
              </Button>
            </div>
            <ScrollArea className='h-[calc(100vh-8rem)]'>
              <div className='p-2'>
                {generatedApp?.files?.map((file, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors flex items-center gap-2 mb-1 ${
                      selectedFile?.path === file.path
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <FileCode2 className='w-4 h-4' />
                    <span className='truncate'>{file.path}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Toggle sidebar button (when closed) */}
          {!sidebarOpen && (
            <Button
              variant='ghost'
              size='icon'
              className='absolute left-0 top-20 h-8 w-8 rounded-l-none rounded-r-md bg-card border border-l-0'
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className='w-4 h-4' />
            </Button>
          )}

          {/* Code/Preview Area */}
          <div className='flex-1 flex flex-col min-w-0'>
            {selectedFile ? (
              <Tabs defaultValue='code' className='flex-1 flex flex-col'>
                <div className='px-2 sm:px-4 py-2 border-b bg-muted/30 flex items-center justify-between gap-2 overflow-x-auto'>
                  <div className='flex items-center gap-2 sm:gap-4 min-w-0 flex-1'>
                    <TabsList className='h-9'>
                      <TabsTrigger
                        value='code'
                        className='gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3'
                      >
                        <FileCode2 className='w-3 h-3 sm:w-4 sm:h-4' />
                        <span className='hidden sm:inline'>Code</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value='preview'
                        className='gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3'
                      >
                        <Eye className='w-3 h-3 sm:w-4 sm:h-4' />
                        <span className='hidden sm:inline'>Preview</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value='terminal'
                        className='gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3'
                      >
                        <TerminalIcon className='w-3 h-3 sm:w-4 sm:h-4' />
                        <span className='hidden sm:inline'>Terminal</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value='database'
                        className='gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3'
                      >
                        <Database className='w-3 h-3 sm:w-4 sm:h-4' />
                        <span className='hidden sm:inline'>Database</span>
                      </TabsTrigger>
                    </TabsList>
                    <span className='text-xs sm:text-sm text-muted-foreground truncate hidden md:block'>
                      {selectedFile.path}
                    </span>
                  </div>

                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() =>
                      handleCopyFile(selectedFile.content, selectedFile.path)
                    }
                    className='gap-1 sm:gap-2 shrink-0'
                  >
                    {copiedFile === selectedFile.path ? (
                      <>
                        <Check className='w-4 h-4' />
                        <span className='hidden sm:inline'>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className='w-4 h-4' />
                        <span className='hidden sm:inline'>Copy</span>
                      </>
                    )}
                  </Button>
                </div>

                <TabsContent value='code' className='flex-1 m-0 p-0'>
                  <ScrollArea className='h-full'>
                    <CodePreview
                      code={selectedFile.content}
                      language={selectedFile.language || 'typescript'}
                    />
                  </ScrollArea>
                </TabsContent>

                <TabsContent value='preview' className='flex-1 m-0 p-0'>
                  <div className='h-full bg-muted/20'>
                    {generatedApp && generatedApp.files && (
                      <LivePreview
                        files={generatedApp.files}
                        framework={appDetails?.framework || 'react'}
                      />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value='terminal' className='flex-1 m-0 p-0'>
                  <div className='h-full bg-black'>
                    <Terminal appId={savedAppId || undefined} />
                  </div>
                </TabsContent>

                <TabsContent
                  value='database'
                  className='flex-1 m-0 p-4 overflow-auto'
                >
                  <div className='max-w-3xl mx-auto'>
                    <DatabasePanel
                      appId={savedAppId}
                      requiresDatabase={generatedApp?.requires_database}
                      onDatabaseProvisioned={(connectionString) => {
                        toast({
                          title: '🎉 Database Ready!',
                          description:
                            'You can now use the connection string in your app',
                        })
                      }}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className='flex-1 flex items-center justify-center text-muted-foreground'>
                <div className='text-center'>
                  <FileCode2 className='w-16 h-16 mx-auto mb-4 opacity-50' />
                  <p className='text-lg'>Select a file to view its code</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default AppBuilder
