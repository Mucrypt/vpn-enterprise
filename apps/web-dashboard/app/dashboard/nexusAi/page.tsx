'use client'

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
  Bot,
  Terminal,
  GitBranch,
  Layers,
} from 'lucide-react'
import Link from 'next/link'

export default function NexusAiPage() {
  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Generation',
      description:
        'Describe your app in plain English and watch as AI generates production-ready code instantly',
    },
    {
      icon: Database,
      title: 'Instant Database',
      description:
        'Get a PostgreSQL database provisioned automatically with schema matching your app needs',
    },
    {
      icon: Code2,
      title: 'Modern Stack',
      description:
        'Built with React, TypeScript, Tailwind CSS - the latest web technologies',
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

  const capabilities = [
    'Generate full-stack applications with one prompt',
    'Automatic database schema design and setup',
    'Beautiful, responsive UI components',
    'Authentication & authorization built-in',
    'Real-time code editing and preview',
    'Export and download complete projects',
    'Integration with your existing infrastructure',
    'Enterprise-grade security and performance',
  ]

  return (
    <div className='min-h-screen bg-linear-to-br from-slate-50 via-purple-50/30 to-pink-50/20'>
      {/* Hero Section */}
      <section className='pt-6 sm:pt-8 md:pt-12 pb-10 sm:pb-12 md:pb-16 px-4 sm:px-6'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-6 sm:mb-8'>
            <Badge className='mb-3 sm:mb-4 bg-linear-to-r from-purple-600 to-pink-600 text-white border-0 text-xs sm:text-sm px-3 py-1.5'>
              <Bot className='w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5' />
              AI-Powered Development Platform
            </Badge>
            <h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-linear-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent leading-tight px-4'>
              Build Full-Stack Apps
              <br />
              with Just a Description
            </h1>
            <p className='text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4'>
              Introducing{' '}
              <span className='font-semibold text-purple-600'>NexusAI</span> -
              your intelligent app builder. Describe your idea in plain English
              and watch as AI generates a complete, production-ready application
              with database, authentication, and beautiful UI.
            </p>

            <div className='flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 px-4'>
              <Link href='/nexusai' className='w-full sm:w-auto'>
                <Button
                  size='lg'
                  className='w-full sm:w-auto text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-6 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all'
                >
                  Launch NexusAI
                  <ArrowRight className='ml-2 w-4 h-4 sm:w-5 sm:h-5' />
                </Button>
              </Link>
              <Button
                size='lg'
                variant='outline'
                className='w-full sm:w-auto text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-6 border-2 hover:border-purple-600 hover:text-purple-600 transition-all'
              >
                Watch Demo
              </Button>
            </div>

            <div className='flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500 px-4'>
              <div className='flex items-center gap-2'>
                <Check className='w-4 h-4 text-green-600' />
                <span>No coding required</span>
              </div>
              <div className='flex items-center gap-2'>
                <Check className='w-4 h-4 text-green-600' />
                <span>Production-ready code</span>
              </div>
              <div className='flex items-center gap-2'>
                <Check className='w-4 h-4 text-green-600' />
                <span>Deploy in minutes</span>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mt-8 sm:mt-10 md:mt-12 px-4'>
            {[
              { icon: Terminal, label: 'Apps Generated', value: '10,000+' },
              { icon: GitBranch, label: 'Lines of Code', value: '5M+' },
              { icon: Layers, label: 'Components', value: '500+' },
              { icon: Zap, label: 'Avg Build Time', value: '< 2 min' },
            ].map((stat, index) => (
              <Card
                key={index}
                className='bg-white/80 backdrop-blur border-gray-200 hover:shadow-lg transition-shadow'
              >
                <CardContent className='pt-4 sm:pt-5 md:pt-6 pb-4 text-center'>
                  <stat.icon className='w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mx-auto mb-2 text-purple-600' />
                  <div className='text-lg sm:text-xl md:text-2xl font-bold text-gray-900'>
                    {stat.value}
                  </div>
                  <div className='text-xs sm:text-sm text-gray-600 mt-1'>{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-10 sm:py-12 md:py-16 px-4 sm:px-6 bg-white/60 backdrop-blur-sm'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-8 sm:mb-10 md:mb-12'>
            <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-gray-900 px-4'>
              Everything you need to build apps faster
            </h2>
            <p className='text-sm sm:text-base md:text-lg text-gray-600 px-4 max-w-3xl mx-auto'>
              Powered by advanced AI and integrated with enterprise-grade
              infrastructure
            </p>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6'>
            {features.map((feature, index) => (
              <Card
                key={index}
                className='hover:shadow-lg transition-shadow border-gray-200 bg-white'
              >
                <CardHeader className='pb-3'>
                  <div className='w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-linear-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-3 sm:mb-4'>
                    <feature.icon className='w-5 h-5 sm:w-6 sm:h-6 text-purple-600' />
                  </div>
                  <CardTitle className='text-base sm:text-lg md:text-xl'>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className='pt-0'>
                  <CardDescription className='text-sm sm:text-base text-gray-600 leading-relaxed'>
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className='py-10 sm:py-12 md:py-16 px-4 sm:px-6'>
        <div className='max-w-6xl mx-auto'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center'>
            <div>
              <Badge className='mb-3 sm:mb-4 bg-purple-100 text-purple-700 border-purple-200 text-xs sm:text-sm px-3 py-1.5'>
                <Sparkles className='w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5' />
                Powerful Capabilities
              </Badge>
              <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-5 md:mb-6 text-gray-900'>
                From idea to production
                <br />
                in minutes, not weeks
              </h2>
              <p className='text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed'>
                NexusAI combines the power of large language models with
                enterprise-grade infrastructure to deliver complete applications
                that are ready for production use.
              </p>
              <Link href='/nexusai' className='w-full sm:w-auto inline-block'>
                <Button
                  size='lg'
                  className='w-full sm:w-auto bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                >
                  Get Started Now
                  <ArrowRight className='ml-2 w-4 h-4 sm:w-5 sm:h-5' />
                </Button>
              </Link>
            </div>
            <Card className='bg-white border-gray-200 shadow-lg'>
              <CardHeader>
                <CardTitle className='text-lg sm:text-xl md:text-2xl'>What NexusAI Can Do</CardTitle>
                <CardDescription className='text-sm sm:text-base'>
                  Comprehensive features for modern app development
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2.5 sm:space-y-3'>
                  {capabilities.map((capability, index) => (
                    <li key={index} className='flex items-start gap-2.5 sm:gap-3'>
                      <div className='mt-0.5 shrink-0'>
                        <div className='w-5 h-5 rounded-full bg-linear-to-br from-green-400 to-emerald-500 flex items-center justify-center'>
                          <Check className='w-3 h-3 text-white' />
                        </div>
                      </div>
                      <span className='text-sm sm:text-base text-gray-700 leading-relaxed'>
                        {capability}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-12 sm:py-16 px-4 sm:px-6'>
        <div className='max-w-4xl mx-auto'>
          <Card className='bg-linear-to-br from-purple-600 via-pink-600 to-orange-500 border-0 shadow-2xl'>
            <CardContent className='pt-8 sm:pt-12 pb-8 sm:pb-12 px-4 sm:px-6 text-center'>
              <Sparkles className='w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-white' />
              <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4'>
                Ready to build something amazing?
              </h2>
              <p className='text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto'>
                Join thousands of developers who are building faster with
                NexusAI. Start your first project today and see the magic
                happen.
              </p>
              <div className='flex items-center justify-center gap-4'>
                <Link href='/nexusai' className='w-full sm:w-auto'>
                  <Button
                    size='lg'
                    variant='secondary'
                    className='w-full sm:w-auto text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-6 bg-white text-purple-600 hover:bg-gray-100 shadow-lg'
                  >
                    Launch NexusAI Now
                    <Rocket className='ml-2 w-4 h-4 sm:w-5 sm:h-5' />
                  </Button>
                </Link>
              </div>
              <p className='text-xs sm:text-sm text-white/80 mt-4 sm:mt-6'>
                Using your existing credits • No additional cost
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
