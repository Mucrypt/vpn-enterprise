import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Database,
  Code2,
  Zap,
  Shield,
  Rocket,
  Check,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function Landing() {
  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Generation',
      description:
        'Describe your app in plain English and watch as AI generates production-ready code',
    },
    {
      icon: Database,
      title: 'Instant Database',
      description:
        'Get a PostgreSQL database provisioned automatically with schema matching your app',
    },
    {
      icon: Code2,
      title: 'Modern Stack',
      description:
        'Built with React, TypeScript, Tailwind CSS, and your choice of framework',
    },
    {
      icon: Zap,
      title: 'Live Preview',
      description:
        'See your app come to life in real-time with instant preview and hot reload',
    },
    {
      icon: Shield,
      title: 'Secure by Default',
      description:
        'Built-in authentication, authorization, and security best practices',
    },
    {
      icon: Rocket,
      title: 'Deploy Anywhere',
      description:
        'Export your code and deploy to Vercel, Netlify, or your own infrastructure',
    },
  ]

  const creditPackages = [
    {
      name: 'Starter Pack',
      credits: 100,
      price: '$10',
      bonus: 0,
      description: 'Perfect for small projects',
      features: [
        '100 AI credits',
        'Generate 10-20 apps',
        'Database included',
        'Valid for 12 months',
        'Basic support',
      ],
      cta: 'Buy credits',
      popular: false,
      stripePriceId: 'price_1SxB6QKQ56fnaANW8CEtay6X',
    },
    {
      name: 'Popular Pack',
      credits: 500,
      price: '$45',
      bonus: 50,
      description: 'Best value for regular use',
      features: [
        '500 + 50 bonus credits',
        'Generate 50-100 apps',
        'Priority generation',
        'Valid for 12 months',
        'Priority support',
      ],
      cta: 'Buy credits',
      popular: true,
      stripePriceId: 'price_1SxB6SKQ56fnaANWc74bMAho',
    },
    {
      name: 'Pro Pack',
      credits: 1000,
      price: '$80',
      bonus: 200,
      description: 'For professional developers',
      features: [
        '1,000 + 200 bonus credits',
        'Generate 100-200 apps',
        'Priority generation',
        'Valid for 12 months',
        'Premium support',
      ],
      cta: 'Buy credits',
      popular: false,
      stripePriceId: 'price_1SxB6UKQ56fnaANWSEP2BtYh',
    },
    {
      name: 'Enterprise Pack',
      credits: 5000,
      price: '$350',
      bonus: 1500,
      description: 'For teams and agencies',
      features: [
        '5,000 + 1,500 bonus credits',
        'Generate 500+ apps',
        'Fastest generation',
        'Valid for 12 months',
        'Dedicated support',
      ],
      cta: 'Buy credits',
      popular: false,
      stripePriceId: 'price_1SxB6WKQ56fnaANW7DD6cDO2',
    },
  ]

  return (
    <div className='min-h-screen bg-background'>
      <Navbar />

      {/* Hero Section */}
      <section className='pt-32 pb-20 px-6'>
        <div className='container mx-auto max-w-6xl text-center'>
          <Badge className='mb-6' variant='secondary'>
            <Sparkles className='w-3 h-3 mr-1' />
            AI-Powered App Builder
          </Badge>
          <h1 className='text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent'>
            Build Full-Stack Apps
            <br />
            with Just a Description
          </h1>
          <p className='text-xl text-muted-foreground mb-8 max-w-2xl mx-auto'>
            Describe your idea in plain English and watch as NexusAI generates a
            complete, production-ready application with database,
            authentication, and beautiful UI.
          </p>
          <div className='flex items-center justify-center gap-4'>
            <Link to='/describe'>
              <Button size='lg' className='text-lg px-8'>
                Start building free
                <ArrowRight className='ml-2 w-5 h-5' />
              </Button>
            </Link>
            <Button size='lg' variant='outline' className='text-lg px-8'>
              View examples
            </Button>
          </div>
          <p className='text-sm text-muted-foreground mt-4'>
            No credit card required • 100 free credits
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-20 px-6 bg-secondary/20'>
        <div className='container mx-auto max-w-6xl'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl md:text-5xl font-bold mb-4'>
              Everything you need to build apps faster
            </h2>
            <p className='text-lg text-muted-foreground'>
              Powered by advanced AI and integrated with enterprise-grade
              infrastructure
            </p>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {features.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <feature.icon className='w-8 h-8 text-primary mb-2' />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Credits Section */}
      <section className='py-20 px-6'>
        <div className='container mx-auto max-w-6xl'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl md:text-5xl font-bold mb-4'>
              Simple, pay-as-you-go credits
            </h2>
            <p className='text-lg text-muted-foreground'>
              Buy credits once, use them anytime. No subscriptions, no expiration stress.
            </p>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {creditPackages.map((pkg, index) => (
              <Card
                key={index}
                className={
                  pkg.popular
                    ? 'border-primary shadow-lg scale-105 relative'
                    : 'border-border relative'
                }
              >
                {pkg.popular && (
                  <div className='bg-primary text-primary-foreground text-center py-2 text-sm font-semibold rounded-t-lg'>
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className='text-2xl'>{pkg.name}</CardTitle>
                  <div className='text-4xl font-bold mt-2'>
                    {pkg.price}
                  </div>
                  <CardDescription>{pkg.description}</CardDescription>
                  <div className='mt-4'>
                    <Badge variant='secondary' className='text-lg px-3 py-1'>
                      {pkg.credits}
                      {pkg.bonus > 0 && (
                        <span className='text-primary ml-1'>+{pkg.bonus}</span>
                      )}{' '}
                      credits
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <ul className='space-y-3'>
                    {pkg.features.map((feature, i) => (
                      <li key={i} className='flex items-center gap-2'>
                        <Check className='w-4 h-4 text-primary flex-shrink-0' />
                        <span className='text-sm'>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to='/credits'>
                    <Button
                      className='w-full'
                      variant={pkg.popular ? 'default' : 'outline'}
                    >
                      {pkg.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className='text-center mt-8'>
            <p className='text-sm text-muted-foreground'>
              All packages include database, authentication, and deployment support
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-20 px-6 bg-gradient-to-r from-primary/10 via-purple-600/10 to-pink-600/10'>
        <div className='container mx-auto max-w-4xl text-center'>
          <h2 className='text-3xl md:text-5xl font-bold mb-4'>
            Ready to build your next big idea?
          </h2>
          <p className='text-lg text-muted-foreground mb-8'>
            Join thousands of developers building with NexusAI
          </p>
          <Link to='/describe'>
            <Button size='lg' className='text-lg px-12'>
              Start building now
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
