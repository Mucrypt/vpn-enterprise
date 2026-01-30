'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import {
  Book,
  Key,
  Users,
  Table,
  FileCode,
  Shield,
  Zap,
  Database,
  Code,
  Link,
  Settings,
} from 'lucide-react'

export type ApiDocsSection =
  | 'introduction'
  | 'authentication'
  | 'user-management'
  | 'tables-views'
  | 'realtime'
  | 'edge-functions'
  | 'storage'
  | 'webhooks'
  | 'rate-limits'
  | 'errors'

interface ApiDocsLayoutProps {
  activeSection: ApiDocsSection
  onSectionChange: (section: ApiDocsSection) => void
  children: React.ReactNode
  activeTenant: string
}

const apiDocsSections = [
  {
    id: 'getting-started' as const,
    label: 'GETTING STARTED',
    items: [
      {
        id: 'introduction' as const,
        label: 'Introduction',
        icon: Book,
        description: 'Getting started with the API',
      },
      {
        id: 'authentication' as const,
        label: 'Authentication',
        icon: Key,
        description: 'Authenticate your requests',
      },
      {
        id: 'user-management' as const,
        label: 'User Management',
        icon: Users,
        description: 'Manage users and sessions',
      },
    ],
  },
  {
    id: 'database' as const,
    label: 'DATABASE',
    items: [
      {
        id: 'tables-views' as const,
        label: 'Tables and Views',
        icon: Table,
        description: 'Auto-generated table APIs',
      },
    ],
  },
  {
    id: 'advanced' as const,
    label: 'ADVANCED',
    items: [
      {
        id: 'realtime' as const,
        label: 'Realtime',
        icon: Zap,
        description: 'Subscribe to database changes',
      },
      {
        id: 'edge-functions' as const,
        label: 'Edge Functions',
        icon: Code,
        description: 'Deploy serverless functions',
      },
      {
        id: 'storage' as const,
        label: 'Storage',
        icon: Database,
        description: 'Store and serve files',
      },
      {
        id: 'webhooks' as const,
        label: 'Webhooks',
        icon: Link,
        description: 'Trigger external services',
      },
    ],
  },
  {
    id: 'reference' as const,
    label: 'REFERENCE',
    items: [
      {
        id: 'rate-limits' as const,
        label: 'Rate Limits',
        icon: Shield,
        description: 'API rate limiting rules',
      },
      {
        id: 'errors' as const,
        label: 'Error Codes',
        icon: Settings,
        description: 'HTTP error responses',
      },
    ],
  },
]

export function ApiDocsLayout({
  activeSection,
  onSectionChange,
  children,
  activeTenant,
}: ApiDocsLayoutProps) {
  return (
    <div className='flex h-full bg-gray-950'>
      {/* Sidebar Navigation */}
      <div className='w-64 border-r border-gray-800 bg-gray-900 overflow-y-auto'>
        <div className='p-4 border-b border-gray-800'>
          <div className='flex items-center gap-2 text-emerald-400'>
            <FileCode className='h-5 w-5' />
            <h2 className='font-semibold text-lg'>API Docs</h2>
          </div>
          <p className='text-xs text-gray-500 mt-1'>
            Auto-generated documentation
          </p>
        </div>

        <nav className='p-3 space-y-6'>
          {apiDocsSections.map((section) => (
            <div key={section.id}>
              <div className='px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                {section.label}
              </div>
              <div className='space-y-1'>
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => onSectionChange(item.id)}
                      className={cn(
                        'w-full flex items-start gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                        isActive
                          ? 'bg-emerald-600 text-white shadow-lg'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800',
                      )}
                    >
                      <Icon className='h-4 w-4 shrink-0 mt-0.5' />
                      <div className='flex-1 text-left'>
                        <div className='font-medium'>{item.label}</div>
                        {!isActive && (
                          <div className='text-xs text-gray-600 mt-0.5'>
                            {item.description}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className='flex-1 overflow-y-auto'>{children}</div>
    </div>
  )
}
