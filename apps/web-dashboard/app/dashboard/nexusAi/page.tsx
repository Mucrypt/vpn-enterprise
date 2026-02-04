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
      <section className='pt-12 pb-16 px-6'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-8'>
            <Badge className='mb-4 bg-linear-to-r from-purple-600 to-pink-600 text-white border-0'>
              <Bot className='w-3 h-3 mr-1' />
              AI-Powered Development Platform
            </Badge>
            <h1 className='text-4xl md:text-6xl font-bold mb-6 bg-linear-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent leading-tight'>
              Build Full-Stack Apps
              <br />
              with Just a Description
            </h1>
            <p className='text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed'>
              Introducing{' '}
              <span className='font-semibold text-purple-600'>NexusAI</span> -
              your intelligent app builder. Describe your idea in plain English
              and watch as AI generates a complete, production-ready application
              with database, authentication, and beautiful UI.
            </p>

            <div className='flex items-center justify-center gap-4 mb-6'>
              <Link href='/nexusai'>
                <Button
                  size='lg'
                  className='text-lg px-10 py-6 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all'
                >
                  Launch NexusAI
                  <ArrowRight className='ml-2 w-5 h-5' />
                </Button>
              </Link>
              <Button
                size='lg'
                variant='outline'
                className='text-lg px-10 py-6 border-2 hover:border-purple-600 hover:text-purple-600 transition-all'
              >
                Watch Demo
              </Button>
            </div>

            <div className='flex items-center justify-center gap-6 text-sm text-gray-500'>
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
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mt-12'>
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
                <CardContent className='pt-6 text-center'>
                  <stat.icon className='w-8 h-8 mx-auto mb-2 text-purple-600' />
                  <div className='text-2xl font-bold text-gray-900'>
                    {stat.value}
                  </div>
                  <div className='text-sm text-gray-600'>{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-16 px-6 bg-white/60 backdrop-blur-sm'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl md:text-4xl font-bold mb-4 text-gray-900'>
              Everything you need to build apps faster
            </h2>
            <p className='text-lg text-gray-600'>
              Powered by advanced AI and integrated with enterprise-grade
              infrastructure
            </p>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {features.map((feature, index) => (
              <Card
                key={index}
                className='hover:shadow-lg transition-shadow border-gray-200 bg-white'
              >
                <CardHeader>
                  <div className='w-12 h-12 rounded-lg bg-linear-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4'>
                    <feature.icon className='w-6 h-6 text-purple-600' />
                  </div>
                  <CardTitle className='text-xl'>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className='text-gray-600'>
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className='py-16 px-6'>
        <div className='max-w-6xl mx-auto'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
            <div>
              <Badge className='mb-4 bg-purple-100 text-purple-700 border-purple-200'>
                <Sparkles className='w-3 h-3 mr-1' />
                Powerful Capabilities
              </Badge>
              <h2 className='text-3xl md:text-4xl font-bold mb-6 text-gray-900'>
                From idea to production
                <br />
                in minutes, not weeks
              </h2>
              <p className='text-lg text-gray-600 mb-8 leading-relaxed'>
                NexusAI combines the power of large language models with
                enterprise-grade infrastructure to deliver complete applications
                that are ready for production use.
              </p>
              <Link href='/nexusai'>
                <Button
                  size='lg'
                  className='bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                >
                  Get Started Now
                  <ArrowRight className='ml-2 w-5 h-5' />
                </Button>
              </Link>
            </div>
            <Card className='bg-white border-gray-200 shadow-lg'>
              <CardHeader>
                <CardTitle className='text-2xl'>What NexusAI Can Do</CardTitle>
                <CardDescription>
                  Comprehensive features for modern app development
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className='space-y-3'>
                  {capabilities.map((capability, index) => (
                    <li key={index} className='flex items-start gap-3'>
                      <div className='mt-0.5'>
                        <div className='w-5 h-5 rounded-full bg-linear-to-br from-green-400 to-emerald-500 flex items-center justify-center'>
                          <Check className='w-3 h-3 text-white' />
                        </div>
                      </div>
                      <span className='text-gray-700 leading-relaxed'>
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
      <section className='py-16 px-6'>
        <div className='max-w-4xl mx-auto'>
          <Card className='bg-linear-to-br from-purple-600 via-pink-600 to-orange-500 border-0 shadow-2xl'>
            <CardContent className='pt-12 pb-12 text-center'>
              <Sparkles className='w-16 h-16 mx-auto mb-6 text-white' />
              <h2 className='text-3xl md:text-4xl font-bold text-white mb-4'>
                Ready to build something amazing?
              </h2>
              <p className='text-xl text-white/90 mb-8 max-w-2xl mx-auto'>
                Join thousands of developers who are building faster with
                NexusAI. Start your first project today and see the magic
                happen.
              </p>
              <div className='flex items-center justify-center gap-4'>
                <Link href='/nexusai'>
                  <Button
                    size='lg'
                    variant='secondary'
                    className='text-lg px-10 py-6 bg-white text-purple-600 hover:bg-gray-100 shadow-lg'
                  >
                    Launch NexusAI Now
                    <Rocket className='ml-2 w-5 h-5' />
                  </Button>
                </Link>
              </div>
              <p className='text-sm text-white/80 mt-6'>
                Using your existing credits • No additional cost
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
