import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Loader2,
  Sparkles,
  FileCode2,
  Download,
  Copy,
  Check,
  Rocket,
  Database,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import {
  useAI,
  type MultiFileGenerateResponse,
  type FileOutput,
  type DeploymentResponse,
} from '@/services/aiService'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const AppBuilder = () => {
  const [description, setDescription] = useState('')
  const [framework, setFramework] = useState<
    'react' | 'nextjs' | 'vue' | 'express' | 'fastapi'
  >('react')
  const [styling, setStyling] = useState<
    'tailwind' | 'css' | 'styled-components'
  >('tailwind')
  const [features, setFeatures] = useState<string[]>([])
  const [featureInput, setFeatureInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedApp, setGeneratedApp] =
    useState<MultiFileGenerateResponse | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileOutput | null>(null)
  const [copiedFile, setCopiedFile] = useState<string | null>(null)
  const [deploying, setDeploying] = useState(false)
  const [deployment, setDeployment] = useState<DeploymentResponse | null>(null)
  const [appName, setAppName] = useState('')

  const { toast } = useToast()
  const { generateFullApp, deployApp } = useAI()

  const handleAddFeature = () => {
    if (featureInput.trim() && features.length < 10) {
      setFeatures([...features, featureInput.trim()])
      setFeatureInput('')
    }
  }

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
  }

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast({
        title: 'Description Required',
        description: 'Please describe your app in detail.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    setProgress(10)
    setGeneratedApp(null)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90))
      }, 500)

      const result = await generateFullApp({
        description,
        framework,
        features,
        styling,
      })

      clearInterval(progressInterval)
      setProgress(100)
      setGeneratedApp(result)

      if (result.files.length > 0) {
        setSelectedFile(result.files[0])
      }

      toast({
        title: '🎉 App Generated!',
        description: `Successfully generated ${result.files.length} files`,
      })
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description:
          error instanceof Error ? error.message : 'Failed to generate app',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const handleCopyFile = async (file: FileOutput) => {
    await navigator.clipboard.writeText(file.content)
    setCopiedFile(file.path)
    toast({
      title: 'Copied!',
      description: `${file.path} copied to clipboard`,
    })
    setTimeout(() => setCopiedFile(null), 2000)
  }

  const handleDownloadAll = () => {
    if (!generatedApp) return

    // Create a zip-like structure (simple concatenation with separators)
    let allContent = '# Generated App Files\n\n'
    generatedApp.files.forEach((file) => {
      allContent += `\n\n${'='.repeat(80)}\n`
      allContent += `FILE: ${file.path}\n`
      allContent += `${'='.repeat(80)}\n\n`
      allContent += file.content
    })

    allContent += `\n\n${'='.repeat(80)}\n`
    allContent += `SETUP INSTRUCTIONS\n`
    allContent += `${'='.repeat(80)}\n\n`
    allContent += generatedApp.instructions

    const blob = new Blob([allContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'generated-app.txt'
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: 'Downloaded!',
      description: 'All files downloaded successfully',
    })
  }

  const handleDeploy = async () => {
    if (!generatedApp) return

    const name =
      appName.trim() ||
      description.slice(0, 30).replace(/\s+/g, '-').toLowerCase()

    if (!name) {
      toast({
        title: 'App Name Required',
        description: 'Please enter an app name or description',
        variant: 'destructive',
      })
      return
    }

    setDeploying(true)

    try {
      const result = await deployApp({
        app_name: name,
        files: generatedApp.files,
        dependencies: generatedApp.dependencies,
        framework: framework,
        requires_database: generatedApp.requires_database ?? true,
        user_id: 'demo-user', // TODO: Get from auth context
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

  return (
    <>
      <Helmet>
        <title>NexusAI App Builder - Generate Full Applications with AI</title>
        <meta
          name='description'
          content='Build complete applications with AI. Describe your app and get production-ready code instantly.'
        />
      </Helmet>

      <div className='min-h-screen bg-gradient-to-b from-background to-muted/20'>
        <Navbar />

        <main className='container mx-auto px-4 py-8'>
          {/* Header */}
          <div className='text-center mb-8'>
            <div className='inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4'>
              <Sparkles className='h-4 w-4 text-primary' />
              <span className='text-sm font-medium text-primary'>
                Powered by OpenAI & Anthropic - Deploy to Platform
              </span>
            </div>
            <h1 className='text-4xl font-bold tracking-tight mb-3'>
              Build & Deploy Apps with AI
            </h1>
            <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
              Generate production-ready code and deploy instantly to your
              platform with automatic database and hosting
            </p>
          </div>

          {/* Main Content */}
          <div className='grid lg:grid-cols-2 gap-6'>
            {/* Left Panel - Input */}
            <Card>
              <CardHeader>
                <CardTitle>Describe Your App</CardTitle>
                <CardDescription>
                  Be specific about features, design, and functionality
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Description */}
                <div>
                  <label className='text-sm font-medium mb-2 block'>
                    App Description *
                  </label>
                  <Textarea
                    placeholder='E.g., Create a modern e-commerce store with product catalog, shopping cart, user authentication, and Stripe checkout. Include a responsive design with dark mode support...'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className='resize-none'
                  />
                </div>

                {/* Framework Selection */}
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='text-sm font-medium mb-2 block'>
                      Framework
                    </label>
                    <Select
                      value={framework}
                      onValueChange={(value: any) => setFramework(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='react'>React + Vite</SelectItem>
                        <SelectItem value='nextjs'>Next.js</SelectItem>
                        <SelectItem value='vue'>Vue.js</SelectItem>
                        <SelectItem value='express'>Express.js</SelectItem>
                        <SelectItem value='fastapi'>FastAPI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className='text-sm font-medium mb-2 block'>
                      Styling
                    </label>
                    <Select
                      value={styling}
                      onValueChange={(value: any) => setStyling(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='tailwind'>Tailwind CSS</SelectItem>
                        <SelectItem value='css'>Plain CSS</SelectItem>
                        <SelectItem value='styled-components'>
                          Styled Components
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <label className='text-sm font-medium mb-2 block'>
                    Features (Optional)
                  </label>
                  <div className='flex gap-2 mb-2'>
                    <input
                      type='text'
                      placeholder='Add a feature...'
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === 'Enter' && handleAddFeature()
                      }
                      className='flex-1 px-3 py-2 text-sm border rounded-md'
                    />
                    <Button size='sm' onClick={handleAddFeature}>
                      Add
                    </Button>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    {features.map((feature, index) => (
                      <Badge
                        key={index}
                        variant='secondary'
                        className='cursor-pointer'
                        onClick={() => handleRemoveFeature(index)}
                      >
                        {feature} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={loading || !description.trim()}
                  className='w-full'
                  size='lg'
                >
                  {loading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Generating... (3-5 min)
                    </>
                  ) : (
                    <>
                      <Sparkles className='mr-2 h-4 w-4' />
                      Generate Full App
                    </>
                  )}
                </Button>

                {/* Progress */}
                {loading && (
                  <div className='space-y-2'>
                    <Progress value={progress} className='h-2' />
                    <p className='text-xs text-muted-foreground text-center'>
                      {progress < 30 && 'Analyzing requirements...'}
                      {progress >= 30 &&
                        progress < 60 &&
                        'Generating project structure...'}
                      {progress >= 60 &&
                        progress < 90 &&
                        'Creating components and files...'}
                      {progress >= 90 && 'Finalizing code...'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right Panel - Generated Files */}
            <Card className='lg:h-[calc(100vh-12rem)]'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle>Generated Files</CardTitle>
                    <CardDescription>
                      {generatedApp
                        ? `${generatedApp.files.length} files ready`
                        : 'Your files will appear here'}
                    </CardDescription>
                  </div>
                  {generatedApp && (
                    <>
                      <Button
                        size='sm'
                        variant='default'
                        onClick={handleDeploy}
                        disabled={deploying}
                        className='bg-primary hover:bg-primary/90'
                      >
                        {deploying ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Deploying...
                          </>
                        ) : (
                          <>
                            <Rocket className='mr-2 h-4 w-4' />
                            Deploy to Platform
                          </>
                        )}
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={handleDownloadAll}
                      >
                        <Download className='mr-2 h-4 w-4' />
                        Download All
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className='h-[calc(100%-5rem)]'>
                {!generatedApp && !loading && (
                  <div className='h-full flex items-center justify-center text-center text-muted-foreground'>
                    <div>
                      <FileCode2 className='h-12 w-12 mx-auto mb-4 opacity-50' />
                      <p>Describe your app and click "Generate" to start</p>
                    </div>
                  </div>
                )}

                {loading && (
                  <div className='h-full flex items-center justify-center'>
                    <div className='text-center'>
                      <Loader2 className='h-12 w-12 animate-spin mx-auto mb-4 text-primary' />
                      <p className='text-muted-foreground'>
                        Generating your app...
                      </p>
                      <p className='text-sm text-muted-foreground mt-2'>
                        This may take 3-5 minutes
                      </p>
                    </div>
                  </div>
                )}

                {generatedApp && (
                  <Tabs defaultValue='files' className='h-full flex flex-col'>
                    <TabsList className='grid w-full grid-cols-3'>
                      <TabsTrigger value='files'>Files</TabsTrigger>
                      <TabsTrigger value='instructions'>Setup</TabsTrigger>
                      <TabsTrigger value='deployment'>
                        {deployment ? '✅ Deployed' : 'Deploy'}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent
                      value='files'
                      className='flex-1 overflow-hidden'
                    >
                      <div className='grid grid-cols-3 gap-4 h-full'>
                        {/* File List */}
                        <ScrollArea className='h-full border rounded-md p-2'>
                          <div className='space-y-1'>
                            {generatedApp.files.map((file) => (
                              <button
                                key={file.path}
                                onClick={() => setSelectedFile(file)}
                                className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-muted transition-colors ${
                                  selectedFile?.path === file.path
                                    ? 'bg-muted font-medium'
                                    : ''
                                }`}
                              >
                                <div className='flex items-center gap-2'>
                                  <FileCode2 className='h-4 w-4 shrink-0' />
                                  <span className='truncate'>{file.path}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </ScrollArea>

                        {/* File Content */}
                        <div className='col-span-2 border rounded-md overflow-hidden flex flex-col'>
                          {selectedFile && (
                            <>
                              <div className='bg-muted px-4 py-2 flex items-center justify-between'>
                                <span className='text-sm font-mono'>
                                  {selectedFile.path}
                                </span>
                                <Button
                                  size='sm'
                                  variant='ghost'
                                  onClick={() => handleCopyFile(selectedFile)}
                                >
                                  {copiedFile === selectedFile.path ? (
                                    <Check className='h-4 w-4 text-green-600' />
                                  ) : (
                                    <Copy className='h-4 w-4' />
                                  )}
                                </Button>
                              </div>
                              <ScrollArea className='flex-1 p-4'>
                                <pre className='text-xs font-mono'>
                                  <code>{selectedFile.content}</code>
                                </pre>
                              </ScrollArea>
                            </>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value='instructions' className='flex-1'>
                      <ScrollArea className='h-full border rounded-md p-4'>
                        <div className='space-y-4'>
                          <div>
                            <h3 className='font-semibold mb-2'>
                              📦 Dependencies
                            </h3>
                            <pre className='bg-muted p-3 rounded text-xs font-mono overflow-x-auto'>
                              {JSON.stringify(
                                generatedApp.dependencies,
                                null,
                                2,
                              )}
                            </pre>
                          </div>
                          <Separator />
                          <div>
                            <h3 className='font-semibold mb-2'>
                              🚀 Setup Instructions
                            </h3>
                            <pre className='whitespace-pre-wrap text-sm'>
                              {generatedApp.instructions}
                            </pre>
                          </div>
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value='deployment' className='flex-1'>
                      <ScrollArea className='h-full'>
                        <div className='space-y-6'>
                          {!deployment && !deploying && (
                            <div className='text-center py-12'>
                              <Rocket className='h-16 w-16 mx-auto mb-4 text-muted-foreground' />
                              <h3 className='text-lg font-semibold mb-2'>
                                Ready to Deploy
                              </h3>
                              <p className='text-muted-foreground mb-6'>
                                Deploy your app to VPN Enterprise Platform with
                                automatic database and hosting
                              </p>
                              <div className='flex flex-col items-center gap-4 max-w-md mx-auto'>
                                <input
                                  type='text'
                                  placeholder='App name (optional)'
                                  value={appName}
                                  onChange={(e) => setAppName(e.target.value)}
                                  className='w-full px-4 py-2 border rounded-md'
                                />
                                <Button onClick={handleDeploy} size='lg'>
                                  <Rocket className='mr-2 h-5 w-5' />
                                  Deploy to Platform
                                </Button>
                              </div>
                              <div className='mt-8 grid grid-cols-2 gap-4 text-sm'>
                                <div className='flex items-center gap-2 justify-center'>
                                  <Database className='h-4 w-4 text-primary' />
                                  <span>Auto Postgres Database</span>
                                </div>
                                <div className='flex items-center gap-2 justify-center'>
                                  <Globe className='h-4 w-4 text-primary' />
                                  <span>Managed Hosting</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {deploying && (
                            <div className='text-center py-12'>
                              <Loader2 className='h-16 w-16 mx-auto mb-4 animate-spin text-primary' />
                              <h3 className='text-lg font-semibold mb-2'>
                                Deploying Your App...
                              </h3>
                              <p className='text-muted-foreground'>
                                Setting up database, hosting, and deploying
                                files
                              </p>
                            </div>
                          )}

                          {deployment && (
                            <div className='space-y-4'>
                              <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6'>
                                <h3 className='text-lg font-semibold text-green-900 dark:text-green-100 mb-2'>
                                  🎉 Deployment Successful!
                                </h3>
                                <p className='text-green-700 dark:text-green-300 mb-4'>
                                  Your app is live and running
                                </p>
                                <div className='space-y-2'>
                                  <div className='flex items-center gap-2'>
                                    <Globe className='h-5 w-5' />
                                    <a
                                      href={deployment.app_url}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      className='text-blue-600 hover:underline font-medium'
                                    >
                                      {deployment.app_url}
                                    </a>
                                  </div>
                                </div>
                              </div>

                              {deployment.database && (
                                <Card>
                                  <CardHeader>
                                    <CardTitle className='flex items-center gap-2'>
                                      <Database className='h-5 w-5' />
                                      Database
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className='space-y-2 text-sm'>
                                    <div>
                                      <span className='font-medium'>Name:</span>{' '}
                                      {deployment.database.database_name}
                                    </div>
                                    <div>
                                      <span className='font-medium'>
                                        Tenant ID:
                                      </span>{' '}
                                      {deployment.database.tenant_id}
                                    </div>
                                    <div>
                                      <span className='font-medium'>
                                        Status:
                                      </span>{' '}
                                      <Badge variant='default'>Active</Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}

                              {deployment.hosting && (
                                <Card>
                                  <CardHeader>
                                    <CardTitle className='flex items-center gap-2'>
                                      <Globe className='h-5 w-5' />
                                      Hosting
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className='space-y-2 text-sm'>
                                    <div>
                                      <span className='font-medium'>
                                        Service ID:
                                      </span>{' '}
                                      {deployment.hosting.service_id}
                                    </div>
                                    <div>
                                      <span className='font-medium'>
                                        Domain:
                                      </span>{' '}
                                      {deployment.hosting.domain}
                                    </div>
                                    <div>
                                      <span className='font-medium'>
                                        Status:
                                      </span>{' '}
                                      <Badge variant='default'>
                                        {deployment.hosting.status}
                                      </Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}

                              {deployment.environment && (
                                <Card>
                                  <CardHeader>
                                    <CardTitle>Environment Variables</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <pre className='bg-muted p-3 rounded text-xs font-mono overflow-x-auto'>
                                      {Object.entries(deployment.environment)
                                        .map(
                                          ([key, value]) => `${key}=${value}`,
                                        )
                                        .join('\n')}
                                    </pre>
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}

export default AppBuilder
