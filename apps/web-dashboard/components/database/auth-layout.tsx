'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  Shield,
  Mail,
  Settings,
  Key,
  Clock,
  ShieldAlert,
  Webhook,
  FileText,
  Zap,
  Lock,
  Globe,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

export type AuthSection =
  | 'users'
  | 'oauth-apps'
  | 'email'
  | 'policies'
  | 'providers'
  | 'oauth-server'
  | 'sessions'
  | 'rate-limits'
  | 'multi-factor'
  | 'url-config'
  | 'attack-protection'
  | 'auth-hooks'
  | 'audit-logs'
  | 'performance'

interface AuthLayoutProps {
  activeSection: AuthSection
  onSectionChange: (section: AuthSection) => void
  children: React.ReactNode
  activeTenant: string
}

interface NavItemGroup {
  title: string
  items: {
    id: AuthSection
    label: string
    icon: React.ElementType
    badge?: string
    badgeColor?: string
  }[]
}

const NAVIGATION_GROUPS: NavItemGroup[] = [
  {
    title: 'MANAGE',
    items: [
      { id: 'users', label: 'Users', icon: Users },
      { id: 'oauth-apps', label: 'OAuth Apps', icon: Key },
    ],
  },
  {
    title: 'NOTIFICATIONS',
    items: [{ id: 'email', label: 'Email', icon: Mail }],
  },
  {
    title: 'CONFIGURATION',
    items: [
      { id: 'policies', label: 'Policies', icon: Shield },
      { id: 'providers', label: 'Sign In / Providers', icon: Users },
      {
        id: 'oauth-server',
        label: 'OAuth Server',
        icon: Key,
        badge: 'BETA',
        badgeColor: 'bg-orange-500/10 text-orange-400',
      },
      { id: 'sessions', label: 'Sessions', icon: Clock },
      { id: 'rate-limits', label: 'Rate Limits', icon: Zap },
      { id: 'multi-factor', label: 'Multi-Factor', icon: Lock },
      { id: 'url-config', label: 'URL Configuration', icon: Globe },
      {
        id: 'attack-protection',
        label: 'Attack Protection',
        icon: ShieldAlert,
      },
      {
        id: 'auth-hooks',
        label: 'Auth Hooks',
        icon: Webhook,
        badge: 'BETA',
        badgeColor: 'bg-orange-500/10 text-orange-400',
      },
      { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
      { id: 'performance', label: 'Performance', icon: Settings },
    ],
  },
]

export function AuthLayout({
  activeSection,
  onSectionChange,
  children,
  activeTenant,
}: AuthLayoutProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (groupTitle: string) => {
    setCollapsedGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(groupTitle)) {
        newSet.delete(groupTitle)
      } else {
        newSet.add(groupTitle)
      }
      return newSet
    })
  }

  return (
    <div className='flex h-screen bg-gray-950'>
      {/* Sidebar */}
      <div className='w-64 border-r border-gray-800 bg-gray-950 overflow-y-auto'>
        <div className='p-4'>
          <h2 className='text-xl font-semibold text-white mb-1'>
            Authentication
          </h2>
          <p className='text-sm text-gray-400'>
            Manage authentication settings
          </p>
        </div>

        <nav className='px-2 pb-4'>
          {NAVIGATION_GROUPS.map((group) => (
            <div key={group.title} className='mb-4'>
              <button
                onClick={() => toggleGroup(group.title)}
                className='flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-gray-300 transition-colors'
              >
                <span>{group.title}</span>
                {collapsedGroups.has(group.title) ? (
                  <ChevronRight className='h-3 w-3' />
                ) : (
                  <ChevronDown className='h-3 w-3' />
                )}
              </button>

              {!collapsedGroups.has(group.title) && (
                <div className='mt-1 space-y-0.5'>
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const isActive = activeSection === item.id

                    return (
                      <button
                        key={item.id}
                        onClick={() => onSectionChange(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                          isActive
                            ? 'bg-gray-800 text-emerald-400'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                        }`}
                      >
                        <Icon className='h-4 w-4 shrink-0' />
                        <span className='flex-1 text-left'>{item.label}</span>
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                              item.badgeColor ||
                              'bg-emerald-500/10 text-emerald-400'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Upgrade Badge */}
        <div className='mx-2 mb-4'>
          <Card className='p-3 bg-linear-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/20'>
            <div className='flex items-center gap-2 mb-2'>
              <Shield className='h-4 w-4 text-emerald-400' />
              <span className='text-sm font-medium text-emerald-400'>
                Pro Features
              </span>
            </div>
            <p className='text-xs text-gray-400 mb-3'>
              Unlock advanced authentication features
            </p>
            <Button
              size='sm'
              className='w-full bg-emerald-600 hover:bg-emerald-700 text-white'
            >
              Upgrade Plan
            </Button>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex-1 overflow-y-auto'>
        <div className='max-w-6xl mx-auto p-8'>{children}</div>
      </div>
    </div>
  )
}
