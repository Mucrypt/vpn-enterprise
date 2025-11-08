'use client';

import { useAuthStore } from '@/lib/store';
import { Bell, Search, User } from 'lucide-react';
import { Button } from './button';

export function TopBar() {
  const { user, logout } = useAuthStore();

  return (
    <div className="flex h-16 items-center justify-between border-b bg-white px-6">
      {/* Search */}
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* User Menu */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5 text-gray-600" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
            <User className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{user?.email || 'User'}</span>
            <span className="text-xs text-gray-500 capitalize">{user?.role || 'user'}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-gray-700">
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
