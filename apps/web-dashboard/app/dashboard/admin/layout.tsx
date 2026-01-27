import { ReactNode } from 'react'
import ProtectedRoute from '@/components/auth/protected-route'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute
      requiredRole={['super_admin', 'superadmin', 'admin', 'administrator']}
    >
      {children}
    </ProtectedRoute>
  )
}
