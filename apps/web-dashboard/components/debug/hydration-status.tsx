"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';

// Small dev-only badge showing hydration/auth state transitions.
export function HydrationStatus() {
  const { hasHydrated, isAuthenticated, isLoading } = useAuthStore();
  const [mountTime] = useState(() => Date.now());
  const [updates, setUpdates] = useState<string[]>([]);

  useEffect(() => {
    setUpdates((u) => [
      `t+${Date.now() - mountTime}ms hydrated=${hasHydrated} loading=${isLoading} auth=${isAuthenticated}`,
      ...u.slice(0, 9)
    ]);
  }, [hasHydrated, isLoading, isAuthenticated, mountTime]);

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-2 right-2 z-50 text-xs font-mono bg-gray-900/90 text-gray-100 border border-gray-700 rounded-md p-2 max-w-xs shadow-lg">
      <div className="mb-1 font-semibold">Hydration Debug</div>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {updates.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}

export default HydrationStatus;