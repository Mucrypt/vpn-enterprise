'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/lib/store';
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
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/servers', label: 'Servers', icon: Server },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/security', label: 'Security', icon: Shield },
  { href: '/dashboard/admin', label: 'Admin', icon: Settings },
];

export function SidebarNavigation() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useDashboardStore();

  return (
    <div
      className={cn(
        'flex h-screen flex-col border-r bg-gray-50 transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-6">
        {sidebarOpen ? (
          <h1 className="text-xl font-bold text-gray-900">VPN Enterprise</h1>
        ) : (
          <span className="text-xl font-bold text-gray-900">VE</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 hover:bg-gray-200',
                !sidebarOpen && 'justify-center'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="flex h-16 items-center justify-center border-t hover:bg-gray-200"
      >
        {sidebarOpen ? (
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-700" />
        )}
      </button>
    </div>
  );
}
