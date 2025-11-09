import { SidebarNavigation } from '@/components/ui/sidebar-navigation';
import { TopBar } from '@/components/ui/top-bar';
import { ReactNode } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen" data-env={process.env.NODE_ENV}>
      <SidebarNavigation />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
