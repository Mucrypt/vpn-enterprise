import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Sparkles, ArrowRight, Plus, X, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import Navbar from '@/components/Navbar'

const AppDescription = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const [description, setDescription] = useState('')
  const [framework, setFramework] = useState<string>('react')
  const [styling, setStyling] = useState<string>('tailwind')
  const [features, setFeatures] = useState<string[]>([])
  const [featureInput, setFeatureInput] = useState('')
  const [fullStackMode, setFullStackMode] = useState(true)

  // Pre-fill description if coming from home page
  useEffect(() => {
    if (location.state?.initialPrompt) {
      setDescription(location.state.initialPrompt)
    }
  }, [location.state])

  const handleAddFeature = () => {
    if (featureInput.trim() && features.length < 10) {
      setFeatures([...features, featureInput.trim()])
      setFeatureInput('')
    }
  }

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
  }

  const handleGenerate = () => {
    if (!description.trim()) {
      toast({
        title: 'Description Required',
        description: 'Please describe your app in detail.',
        variant: 'destructive',
      })
      return
    }

    // Navigate to build page with state
    navigate('/build', {
      state: {
        description,
        framework,
        styling,
        features,
        fullStackMode,
      },
    })
  }

  return (
    <>
      <Helmet>
        <title>Describe Your App - NexusAI</title>
        <meta
          name='description'
          content='Describe your application and let AI generate production-ready code'
        />
      </Helmet>

      <div className='min-h-screen bg-gradient-to-br from-background via-primary/5 to-purple-600/10'>
        <Navbar />

        <main className='container mx-auto px-4 py-12'>
          {/* Header */}
          <div className='text-center mb-12 animate-fade-up'>
            <div className='inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6 backdrop-blur-sm border border-primary/20'>
              <Sparkles className='h-4 w-4 text-primary animate-pulse' />
              <span className='text-sm font-medium text-primary'>
                AI-Powered Application Generator
              </span>
            </div>
            <h1 className='text-5xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-r from-foreground via-primary to-purple-600 bg-clip-text text-transparent'>
              Describe Your App
            </h1>
            <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
              Be specific about features, design, and functionality. The more
              detail you provide, the better your app will be.
            </p>
          </div>

          {/* Form Card */}
          <Card className='max-w-4xl mx-auto shadow-2xl border-2 backdrop-blur-sm bg-card/80 animate-scale-in'>
            <CardHeader className='space-y-4 pb-8'>
              <CardTitle className='text-3xl font-bold'>App Details</CardTitle>
              <CardDescription className='text-base'>
                Provide a detailed description of your application. Include
                features, design preferences, and any specific requirements.
              </CardDescription>
            </CardHeader>

            <CardContent className='space-y-8'>
              {/* App Description */}
              <div className='space-y-3'>
                <label className='text-sm font-semibold text-foreground flex items-center gap-2'>
                  App Description
                  <span className='text-destructive'>*</span>
                </label>
                <Textarea
                  placeholder='E.g., Create a modern e-commerce store with product catalog, shopping cart, user authentication, and Stripe checkout. Include a responsive design with dark mode support...'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className='min-h-[200px] text-base resize-none bg-background/50 backdrop-blur-sm border-2 focus:border-primary transition-all'
                />
                <p className='text-xs text-muted-foreground'>
                  {description.length} characters • Be as detailed as possible
                  for better results
                </p>
              </div>

              {/* Framework Selection */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-3'>
                  <label className='text-sm font-semibold text-foreground'>
                    Framework
                  </label>
                  <Select value={framework} onValueChange={setFramework}>
                    <SelectTrigger className='h-12 text-base bg-background/50 border-2'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='react'>React + Vite</SelectItem>
                      <SelectItem value='nextjs'>Next.js</SelectItem>
                      <SelectItem value='vue'>Vue 3</SelectItem>
                      <SelectItem value='express'>
                        Express.js (Backend)
                      </SelectItem>
                      <SelectItem value='fastapi'>FastAPI (Python)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-3'>
                  <label className='text-sm font-semibold text-foreground'>
                    Styling
                  </label>
                  <Select value={styling} onValueChange={setStyling}>
                    <SelectTrigger className='h-12 text-base bg-background/50 border-2'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='tailwind'>Tailwind CSS</SelectItem>
                      <SelectItem value='css'>Plain CSS</SelectItem>
                      <SelectItem value='styled-components'>
                        Styled Components
                      </SelectItem>
                      <SelectItem value='mui'>Material-UI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Features */}
              <div className='space-y-3'>
                <label className='text-sm font-semibold text-foreground'>
                  Features (Optional)
                </label>
                <div className='flex gap-2'>
                  <Input
                    placeholder='Add a feature (e.g., User authentication)'
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddFeature()
                      }
                    }}
                    className='h-12 text-base bg-background/50 border-2'
                  />
                  <Button
                    onClick={handleAddFeature}
                    disabled={!featureInput.trim() || features.length >= 10}
                    className='h-12 px-6'
                  >
                    <Plus className='w-4 h-4' />
                  </Button>
                </div>

                {features.length > 0 && (
                  <div className='flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg border-2'>
                    {features.map((feature, index) => (
                      <Badge
                        key={index}
                        variant='secondary'
                        className='px-3 py-1.5 text-sm flex items-center gap-2'
                      >
                        {feature}
                        <button
                          onClick={() => handleRemoveFeature(index)}
                          className='hover:text-destructive transition-colors'
                        >
                          <X className='w-3 h-3' />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className='text-xs text-muted-foreground'>
                  {features.length}/10 features added
                </p>
              </div>

              {/* Full-Stack Mode Toggle */}
              <div className='p-6 bg-gradient-to-br from-primary/10 to-purple-600/10 border-2 border-primary/30 rounded-lg space-y-3'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-1 flex-1'>
                    <div className='flex items-center gap-2'>
                      <Zap className='w-5 h-5 text-primary' />
                      <h3 className='text-lg font-bold'>Full-Stack Mode</h3>
                      <Badge variant='default' className='animate-pulse'>
                        ADVANCED
                      </Badge>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      Generate complete app with backend API + Postman
                      collection. Uses dual-AI (Claude + GPT-4) for maximum
                      power. More capable than Cursor, Lovable, or Bolt!
                    </p>
                  </div>
                  <Switch
                    checked={fullStackMode}
                    onCheckedChange={setFullStackMode}
                    className='ml-4'
                  />
                </div>
                {fullStackMode && (
                  <div className='mt-3 p-3 bg-background/80 rounded-md border'>
                    <p className='text-xs text-muted-foreground flex items-center gap-2'>
                      <Sparkles className='w-4 h-4 text-primary' />
                      Generates: Frontend + Backend API + Database Schema +
                      Postman Collection + Docker Compose + Tests
                    </p>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <div className='pt-6 border-t'>
                <Button
                  onClick={handleGenerate}
                  disabled={!description.trim()}
                  size='lg'
                  className='w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-xl hover:shadow-2xl hover:shadow-primary/50 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <Sparkles className='w-5 h-5 mr-2 animate-pulse' />
                  {fullStackMode
                    ? 'Generate Full-Stack App'
                    : 'Generate Frontend App'}
                  <ArrowRight className='w-5 h-5 ml-2' />
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  )
}

export default AppDescription
