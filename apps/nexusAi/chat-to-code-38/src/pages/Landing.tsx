import {
  ArrowRight,
  Sparkles,
  Code2,
  Rocket,
  Zap,
  CheckCircle2,
  Globe,
  Shield,
  Wand2,
  BookOpen,
  Coins,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Navbar from '@/components/Navbar'

const Landing = () => {
  const features = [
    {
      icon: Code2,
      title: 'AI Code Generation',
      description:
        'Describe your app in plain English and watch as AI generates production-ready code instantly with best practices built-in.',
    },
    {
      icon: Wand2,
      title: 'Smart Components',
      description:
        'Pre-built React components and templates powered by AI to accelerate your development workflow significantly.',
    },
    {
      icon: Rocket,
      title: 'One-Click Deploy',
      description:
        'Deploy your application to the cloud with a single click. No DevOps knowledge or infrastructure management required.',
    },
    {
      icon: Zap,
      title: 'Real-time Preview',
      description:
        'See your changes instantly with live preview as AI builds your application. Iterate quickly and efficiently.',
    },
    {
      icon: Globe,
      title: 'Custom Domains',
      description:
        'Connect your custom domain and launch your app with professional branding. SSL certificates included automatically.',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description:
        'Bank-level security with SSL certificates, data encryption, authentication, and compliance-ready infrastructure.',
    },
  ]

  const creditPackages = [
    {
      name: 'Starter',
      credits: 'Free',
      amount: 10,
      price: 0,
      features: ['Basic AI models', '1 active project', 'Community support'],
      popular: false,
    },
    {
      name: 'Basic',
      credits: 100,
      amount: 100,
      price: 9.99,
      features: [
        'Advanced AI models',
        'Unlimited projects',
        'Priority support',
        'Custom domains',
      ],
      popular: false,
    },
    {
      name: 'Pro',
      credits: 500,
      amount: 500,
      price: 39.99,
      features: [
        'Advanced AI models',
        'Unlimited projects',
        'Priority support',
        'Custom domains',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      credits: 1000,
      amount: 1000,
      price: 69.99,
      features: [
        'Advanced AI models',
        'Unlimited projects',
        'Priority support',
        'Custom domains',
      ],
      popular: false,
    },
  ]

  return (
    <div className='min-h-screen bg-background'>
      <Navbar />

      {/* Hero Section */}
      <section className='relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden px-4 py-20 sm:py-24 lg:py-32 mt-16'>
        {/* Background Effects */}
        <div className='absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent' />
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent' />

        <div className='container relative z-10 mx-auto text-center'>
          <div className='space-y-4 sm:space-y-6 lg:space-y-8'>
            {/* Badge */}
            <div className='flex justify-center'>
              <Badge className='px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'>
                <Sparkles className='mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
                Powered by Advanced AI
              </Badge>
            </div>

            {/* Main Headline */}
            <h1 className='text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight tracking-tight'>
              <span className='bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent'>
                Build Full-Stack Apps
              </span>
              <br />
              <span className='text-foreground mt-2 block'>
                with Just a Description
              </span>
            </h1>

            {/* Subtitle */}
            <p className='mx-auto max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground px-4'>
              Describe your idea in plain English and watch as NexusAI generates
              a complete, production-ready application with database,
              authentication, and beautiful UI.
            </p>

            {/* CTA Buttons */}
            <div className='flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 sm:pt-6 px-4'>
              <Link to='/describe' className='w-full sm:w-auto'>
                <Button
                  size='lg'
                  className='w-full sm:w-auto group bg-gradient-to-r from-primary to-purple-600 text-white hover:opacity-90 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 shadow-lg'
                >
                  Start Building Free
                  <ArrowRight className='ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform' />
                </Button>
              </Link>
              <Button
                size='lg'
                variant='outline'
                className='w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-2'
              >
                View Examples
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className='flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 pt-8 sm:pt-12 text-xs sm:text-sm text-muted-foreground px-4'>
              <div className='flex items-center gap-2'>
                <CheckCircle2 className='h-4 w-4 sm:h-5 sm:w-5 text-green-500' />
                <span>No Credit Card Required</span>
              </div>
              <div className='flex items-center gap-2'>
                <CheckCircle2 className='h-4 w-4 sm:h-5 sm:w-5 text-green-500' />
                <span>100 Free Credits</span>
              </div>
              <div className='flex items-center gap-2'>
                <CheckCircle2 className='h-4 w-4 sm:h-5 sm:w-5 text-green-500' />
                <span>Deploy in Seconds</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-12 sm:py-16 lg:py-24 px-4 bg-secondary/20'>
        <div className='container mx-auto'>
          <div className='text-center mb-10 sm:mb-12 lg:mb-16'>
            <h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4'>
              Everything You Need to Build Apps Faster
            </h2>
            <p className='text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4'>
              Powered by advanced AI and integrated with enterprise-grade
              infrastructure
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto'>
            {features.map((feature, index) => (
              <Card
                key={index}
                className='hover:shadow-xl transition-all hover:scale-[1.02] border-2'
              >
                <CardHeader className='pb-3 sm:pb-4'>
                  <div className='w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-primary/10 to-purple-600/10 flex items-center justify-center mb-3 sm:mb-4'>
                    <feature.icon className='w-6 h-6 sm:w-7 sm:h-7 text-primary' />
                  </div>
                  <CardTitle className='text-lg sm:text-xl'>
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className='text-sm sm:text-base'>
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Credits/Pricing Section */}
      <section className='py-12 sm:py-16 lg:py-24 px-4'>
        <div className='container mx-auto'>
          <div className='text-center mb-10 sm:mb-12 lg:mb-16'>
            <h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4'>
              Simple, Transparent Pricing
            </h2>
            <p className='text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4'>
              Start free and scale as you grow. Only pay for what you use.
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto'>
            {creditPackages.map((pkg, index) => (
              <Card
                key={index}
                className={`p-5 sm:p-6 lg:p-8 hover:shadow-xl transition-all hover:scale-[1.02] border-2 ${
                  pkg.popular
                    ? 'border-primary shadow-lg ring-2 ring-primary/20 relative'
                    : ''
                }`}
              >
                {pkg.popular && (
                  <div className='absolute -top-3 left-1/2 -translate-x-1/2'>
                    <Badge className='bg-gradient-to-r from-primary to-purple-600 text-white text-xs sm:text-sm px-3 py-1'>
                      Most Popular
                    </Badge>
                  </div>
                )}
                <div className='text-center'>
                  <Badge
                    className={`mb-3 sm:mb-4 text-xs sm:text-sm ${pkg.popular ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground'}`}
                  >
                    {pkg.name}
                  </Badge>
                  <div className='mb-4 sm:mb-6'>
                    <div className='text-3xl sm:text-4xl lg:text-5xl font-bold'>
                      {pkg.price === 0 ? 'Free' : `$${pkg.price}`}
                    </div>
                    <div className='text-xs sm:text-sm text-muted-foreground mt-2'>
                      {pkg.amount} credits{pkg.price === 0 ? ' included' : ''}
                    </div>
                  </div>
                  <ul className='space-y-2 sm:space-y-3 text-xs sm:text-sm mb-5 sm:mb-6 text-left'>
                    {pkg.features.map((feature, fIndex) => (
                      <li key={fIndex} className='flex items-start gap-2'>
                        <CheckCircle2 className='h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0 mt-0.5' />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full text-sm sm:text-base py-4 sm:py-5 ${
                      pkg.popular
                        ? 'bg-gradient-to-r from-primary to-purple-600 text-white hover:opacity-90'
                        : pkg.price === 0
                          ? 'variant-outline'
                          : ''
                    }`}
                    variant={pkg.price === 0 ? 'outline' : 'default'}
                  >
                    {pkg.price === 0 ? 'Get Started' : 'Buy Now'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className='text-center mt-8 sm:mt-10 lg:mt-12 px-4'>
            <p className='text-xs sm:text-sm text-muted-foreground'>
              All plans include automatic credit rollover. Credits never expire.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className='py-12 sm:py-16 lg:py-24 px-4 bg-gradient-to-br from-primary/10 via-purple-600/10 to-pink-600/10'>
        <div className='container mx-auto text-center'>
          <div className='max-w-3xl mx-auto space-y-6 sm:space-y-8'>
            <h2 className='text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold'>
              Ready to Build Something Amazing?
            </h2>
            <p className='text-base sm:text-lg lg:text-xl text-muted-foreground px-4'>
              Join thousands of developers who are already building the future
              with NexusAI
            </p>
            <div className='flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 px-4'>
              <Link to='/describe' className='w-full sm:w-auto'>
                <Button
                  size='lg'
                  className='w-full sm:w-auto group bg-gradient-to-r from-primary to-purple-600 text-white hover:opacity-90 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 shadow-lg'
                >
                  <Sparkles className='mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-pulse' />
                  Start Building Now
                </Button>
              </Link>
              <Link to='/credits' className='w-full sm:w-auto'>
                <Button
                  size='lg'
                  variant='outline'
                  className='w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-2'
                >
                  <Coins className='mr-2 h-4 w-4 sm:h-5 sm:w-5' />
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='py-8 sm:py-12 px-4 border-t border-border/50 bg-secondary/20'>
        <div className='container mx-auto'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8'>
            {/* Column 1: About */}
            <div>
              <div className='flex items-center gap-2 mb-3 sm:mb-4'>
                <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center'>
                  <Sparkles className='w-4 h-4 text-white' />
                </div>
                <span className='text-lg font-bold'>NexusAI</span>
              </div>
              <p className='text-xs sm:text-sm text-muted-foreground'>
                Build full-stack applications with AI. Transform your ideas into
                reality in minutes.
              </p>
            </div>

            {/* Column 2: Product */}
            <div>
              <h3 className='font-semibold mb-3 sm:mb-4 text-sm sm:text-base'>
                Product
              </h3>
              <ul className='space-y-2 text-xs sm:text-sm text-muted-foreground'>
                <li>
                  <Link
                    to='/describe'
                    className='hover:text-foreground transition-colors'
                  >
                    App Builder
                  </Link>
                </li>
                <li>
                  <Link
                    to='/my-apps'
                    className='hover:text-foreground transition-colors'
                  >
                    My Apps
                  </Link>
                </li>
                <li>
                  <Link
                    to='/credits'
                    className='hover:text-foreground transition-colors'
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <a
                    href='https://chatbuilds.com/docs'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='hover:text-foreground transition-colors'
                  >
                    Documentation
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Platform */}
            <div>
              <h3 className='font-semibold mb-3 sm:mb-4 text-sm sm:text-base'>
                Platform
              </h3>
              <ul className='space-y-2 text-xs sm:text-sm text-muted-foreground'>
                <li>
                  <a
                    href='https://chatbuilds.com'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='hover:text-foreground transition-colors'
                  >
                    ChatBuilds Platform
                  </a>
                </li>
                <li>
                  <a
                    href='https://chatbuilds.com/dashboard'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='hover:text-foreground transition-colors'
                  >
                    Dashboard
                  </a>
                </li>
                <li>
                  <a
                    href='https://chatbuilds.com/docs'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='hover:text-foreground transition-colors'
                  >
                    API Reference
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Legal */}
            <div>
              <h3 className='font-semibold mb-3 sm:mb-4 text-sm sm:text-base'>
                Legal
              </h3>
              <ul className='space-y-2 text-xs sm:text-sm text-muted-foreground'>
                <li>
                  <a
                    href='#'
                    className='hover:text-foreground transition-colors'
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href='#'
                    className='hover:text-foreground transition-colors'
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href='#'
                    className='hover:text-foreground transition-colors'
                  >
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className='pt-6 sm:pt-8 border-t border-border/50 text-center'>
            <p className='text-xs sm:text-sm text-muted-foreground'>
              © {new Date().getFullYear()} NexusAI by ChatBuilds. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
