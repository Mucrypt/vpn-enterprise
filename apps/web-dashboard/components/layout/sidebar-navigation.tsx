'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useDashboardStore, useAuthStore } from '@/lib/store'
import { useEffect } from 'react'
import {
  LayoutDashboard,
  Server,
  Users,
  BarChart3,
  CreditCard,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  User,
  Building2,
  Split,
  AlertTriangle,
  Webhook,
  Activity,
  Lock,
  FileKey,
  Network,
  Database,
  X,
} from 'lucide-react'

// Navigation items for regular users
const userNavItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/connect', label: 'Connect', icon: Zap },
  { href: '/dashboard/nexusAi', label: 'Nexus AI', icon: Zap },
  { href: '/dashboard/vpn-config', label: 'VPN Config', icon: FileKey },
  { href: '/dashboard/servers', label: 'Servers', icon: Server },
  { href: '/dashboard/hosting', label: 'Hosting', icon: Server },
  { href: '/databases', label: 'Databases', icon: Database },
  { href: '/dashboard/tenants', label: 'Tenants', icon: Building2 },
  {
    href: '/dashboard/hosting/my-services',
    label: 'My Services',
    icon: Settings,
  },
  { href: '/dashboard/hosting/nodes', label: 'Hosting Nodes', icon: Network },
  { href: '/dashboard/hosting/create', label: 'Create Service', icon: Zap },
  { href: '/dashboard/split-tunnel', label: 'Split Tunnel', icon: Split },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/security', label: 'Security', icon: Shield },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
]

// Additional items for admins
const adminNavItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/connect', label: 'Connect', icon: Zap },

  { href: '/dashboard/nexusAi', label: 'Nexus AI', icon: Zap },
  { href: '/dashboard/vpn-config', label: 'VPN Config', icon: FileKey },
  { href: '/dashboard/servers', label: 'Servers', icon: Server },
  { href: '/dashboard/hosting', label: 'Hosting', icon: Server },
  { href: '/databases', label: 'Databases', icon: Database },
  { href: '/dashboard/tenants', label: 'Tenants', icon: Building2 },
  {
    href: '/dashboard/hosting/my-services',
    label: 'My Services',
    icon: Settings,
  },
  { href: '/dashboard/hosting/nodes', label: 'Hosting Nodes', icon: Network },
  { href: '/dashboard/hosting/create', label: 'Create Service', icon: Zap },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/threats', label: 'Threats', icon: AlertTriangle },
  { href: '/dashboard/split-tunnel', label: 'Split Tunnel', icon: Split },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/security', label: 'Security', icon: Shield },
  {
    href: '/dashboard/admin/organizations',
    label: 'Organizations',
    icon: Building2,
  },
  { href: '/dashboard/admin/realtime', label: 'Realtime', icon: Activity },
  { href: '/dashboard/admin/n8n', label: 'Automation', icon: Webhook },
  { href: '/dashboard/admin', label: 'Admin Panel', icon: Settings },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
]

export function SidebarNavigation() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useDashboardStore()
  const { user } = useAuthStore()

  // Determine which nav items to show based on user role
  const roleKey = (user?.role || '').toLowerCase().replace(/[\s_-]/g, '')
  const isAdmin =
    roleKey === 'superadmin' ||
    roleKey === 'admin' ||
    roleKey === 'administrator'
  const navItems = isAdmin ? adminNavItems : userNavItems
  const navScrollbarClass = isAdmin ? 'scrollbar--admin' : 'scrollbar--neutral'

  // Close sidebar on mobile when route changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && sidebarOpen) {
        toggleSidebar()
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [sidebarOpen, toggleSidebar])

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-40 bg-black/50 md:hidden'
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'flex h-screen min-h-0 flex-col border-r bg-gray-50 transition-all duration-300 z-50',
          // Desktop
          'hidden md:flex',
          sidebarOpen ? 'md:w-64' : 'md:w-20',
          // Mobile - slide in from left
          sidebarOpen && 'fixed inset-y-0 left-0 flex w-64 md:relative',
        )}
      >
        {/* Logo */}
        <div className='flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6'>
          {sidebarOpen ? (
            <>
              <h1 className='text-lg sm:text-xl font-bold text-gray-900'>
                VPN Enterprise
              </h1>
              <button
                onClick={toggleSidebar}
                className='md:hidden p-2 hover:bg-gray-200 rounded-lg'
                aria-label='Close menu'
              >
                <X className='h-5 w-5 text-gray-700' />
              </button>
            </>
          ) : (
            <span className='text-xl font-bold text-gray-900'>VE</span>
          )}
        </div>

        {/* Navigation */}
        {/* Make nav scroll when there are many links */}
        <nav
          className={cn(
            'flex-1 overflow-y-auto space-y-1 p-3 md:p-4 scrollbar',
            navScrollbarClass,
          )}
        >
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                onClick={() => {
                  // Close mobile menu on navigation
                  if (window.innerWidth < 768 && sidebarOpen) {
                    toggleSidebar()
                  }
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 touch-manipulation',
                  isActive
                    ? 'bg-emerald-100 text-emerald-900 border-l-4 border-emerald-700 shadow-md font-semibold'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-emerald-700 border-l-4 border-transparent active:bg-gray-200',
                  !sidebarOpen && 'justify-center md:px-3',
                )}
              >
                <Icon className='h-5 w-5 shrink-0' />
                {sidebarOpen && <span className='text-sm'>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className='hidden md:flex h-16 shrink-0 items-center justify-center border-t hover:bg-gray-200 transition-colors'
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? (
            <ChevronLeft className='h-5 w-5 text-gray-700' />
          ) : (
            <ChevronRight className='h-5 w-5 text-gray-700' />
          )}
        </button>
      </div>
    </>
  )
}
