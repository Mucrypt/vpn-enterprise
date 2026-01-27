'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useDashboardStore, useAuthStore } from '@/lib/store'
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
} from 'lucide-react'

// Navigation items for regular users
const userNavItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/connect', label: 'Connect', icon: Zap },
  { href: '/dashboard/nexusAi', label: 'Nexus AI', icon: Zap },
  { href: '/dashboard/vpn-config', label: 'VPN Config', icon: FileKey },
  { href: '/dashboard/servers', label: 'Servers', icon: Server },
  { href: '/dashboard/hosting', label: 'Hosting', icon: Server },
  { href: '/dashboard/databases', label: 'Databases', icon: Database },
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

  return (
    <div
      className={cn(
        // Use min-h-0 to allow inner flex children to scroll
        'flex h-screen min-h-0 flex-col border-r bg-gray-50 transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-20',
      )}
    >
      {/* Logo */}
      <div className='flex h-16 shrink-0 items-center justify-between border-b px-6'>
        {sidebarOpen ? (
          <h1 className='text-xl font-bold text-gray-900'>VPN Enterprise</h1>
        ) : (
          <span className='text-xl font-bold text-gray-900'>VE</span>
        )}
      </div>

      {/* Navigation */}
      {/* Make nav scroll when there are many links */}
      <nav
        className={cn(
          'flex-1 overflow-y-auto space-y-1 p-4 scrollbar',
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
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-emerald-100 text-emerald-900 border-l-4 border-emerald-700 shadow-md font-semibold'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-emerald-700 border-l-4 border-transparent',
                !sidebarOpen && 'justify-center',
              )}
            >
              <Icon className='h-5 w-5 shrink-0' />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className='flex h-16 shrink-0 items-center justify-center border-t hover:bg-gray-200'
      >
        {sidebarOpen ? (
          <ChevronLeft className='h-5 w-5 text-gray-700' />
        ) : (
          <ChevronRight className='h-5 w-5 text-gray-700' />
        )}
      </button>
    </div>
  )
}
