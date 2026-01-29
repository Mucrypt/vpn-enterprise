'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Settings,
  Database,
  Key,
  Lock,
  Boxes,
  HardDrive,
  Plug,
  Code,
  Server,
  Shield,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type SettingsSection =
  | 'general'
  | 'api'
  | 'api-keys'
  | 'jwt-keys'
  | 'compute-disk'
  | 'infrastructure'
  | 'integrations'
  | 'data-api'
  | 'security'
  | 'billing'

interface SettingsCategory {
  category: string
  items: Array<{
    id: SettingsSection
    label: string
    icon: React.ComponentType<{ className?: string }>
    description?: string
  }>
}

const SETTINGS_NAVIGATION: SettingsCategory[] = [
  {
    category: 'PROJECT SETTINGS',
    items: [
      {
        id: 'general',
        label: 'General',
        icon: Settings,
        description: 'Configure general options and project lifecycle',
      },
      {
        id: 'infrastructure',
        label: 'Infrastructure',
        icon: Server,
        description: 'General information regarding your server instance',
      },
      {
        id: 'compute-disk',
        label: 'Compute and Disk',
        icon: HardDrive,
        description: 'Configure the compute and disk settings',
      },
      {
        id: 'integrations',
        label: 'Integrations',
        icon: Plug,
        description: 'Connect external services to your project',
      },
    ],
  },
  {
    category: 'API',
    items: [
      {
        id: 'data-api',
        label: 'Data API',
        icon: Database,
        description: 'RESTful endpoint for querying and managing data',
      },
      {
        id: 'api-keys',
        label: 'API Keys',
        icon: Key,
        description: 'Configure API keys to securely control access',
      },
      {
        id: 'jwt-keys',
        label: 'JWT Keys',
        icon: Lock,
        description: 'Control the keys used to sign JSON Web Tokens',
      },
    ],
  },
  {
    category: 'SECURITY',
    items: [
      {
        id: 'security',
        label: 'Security Advisor',
        icon: Shield,
        description: 'Review security recommendations',
      },
    ],
  },
]

interface SettingsLayoutProps {
  activeSection: SettingsSection
  onSectionChange: (section: SettingsSection) => void
  children: React.ReactNode
  activeTenant: string
}

export function SettingsLayout({
  activeSection,
  onSectionChange,
  children,
  activeTenant,
}: SettingsLayoutProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(),
  )

  const toggleCategory = (category: string) => {
    const newSet = new Set(collapsedCategories)
    if (newSet.has(category)) {
      newSet.delete(category)
    } else {
      newSet.add(category)
    }
    setCollapsedCategories(newSet)
  }

  return (
    <div className='flex h-full bg-[#0a0a0a]'>
      {/* Sidebar */}
      <div className='w-64 border-r border-gray-800 bg-[#1e1e1e] overflow-y-auto'>
        <div className='p-4 border-b border-gray-800'>
          <h2 className='text-lg font-semibold text-white'>Settings</h2>
          <p className='text-sm text-gray-400 mt-1'>
            Configure your project settings
          </p>
        </div>

        <div className='p-3'>
          {SETTINGS_NAVIGATION.map((category) => {
            const isCollapsed = collapsedCategories.has(category.category)

            return (
              <div key={category.category} className='mb-4'>
                <button
                  onClick={() => toggleCategory(category.category)}
                  className='flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-400 hover:text-gray-200 transition-colors'
                >
                  <span>{category.category}</span>
                  {isCollapsed ? (
                    <ChevronRight className='h-3 w-3' />
                  ) : (
                    <ChevronDown className='h-3 w-3' />
                  )}
                </button>

                {!isCollapsed && (
                  <div className='mt-1 space-y-1'>
                    {category.items.map((item) => {
                      const Icon = item.icon
                      const isActive = activeSection === item.id

                      return (
                        <button
                          key={item.id}
                          onClick={() => onSectionChange(item.id)}
                          className={cn(
                            'flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors',
                            isActive
                              ? 'bg-emerald-600/10 text-emerald-400 font-medium'
                              : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                          )}
                        >
                          <Icon className='h-4 w-4 shrink-0' />
                          <span>{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className='flex-1 overflow-y-auto'>
        <div className='max-w-5xl mx-auto p-8'>{children}</div>
      </div>
    </div>
  )
}
