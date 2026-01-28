import { SidebarNavigation } from '@/components/layout/sidebar-navigation'
import { TopBar } from '@/components/layout/top-bar'
import { ReactNode } from 'react'
import ProtectedRoute from '@/components/auth/protected-route'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div
        className='flex h-screen overflow-hidden'
        data-env={process.env.NODE_ENV}
      >
        <SidebarNavigation />
        <div className='flex flex-1 flex-col overflow-hidden'>
          <TopBar />
          <main className='flex-1 overflow-y-auto bg-gray-50 p-3 sm:p-4 md:p-6'>
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
