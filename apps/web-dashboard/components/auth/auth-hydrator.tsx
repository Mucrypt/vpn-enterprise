"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

export default function AuthHydrator() {
  const { setAuth, setLoading, clearAuth, isAuthenticated, hasHydrated } = useAuthStore();

  // Single client-side hydration pass
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const state = useAuthStore.getState();
    // Mark hydration complete immediately if not yet done
    if (!state.hasHydrated) {
      state.setHydrated(true);
    }
    // Sync token from localStorage into store accessToken if missing
    const token = localStorage.getItem('access_token') || '';
    if (token && !state.accessToken) {
      state.setAccessToken(token);
    }
    // If user not authenticated, attempt lightweight profile fetch
    if (!state.isAuthenticated) {
      setLoading(true);
      (async () => {
        try {
          if (token) {
            try {
              document.cookie = `access_token=${token}; path=/; max-age=3600; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
            } catch {}
          }
          const profile = await api.getProfile().catch(() => null);
          if (profile?.user && token) {
            setAuth(profile.user, token);
          }
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [setAuth, setLoading]);

  return null;
}