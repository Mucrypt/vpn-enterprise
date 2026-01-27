"use client";

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

export default function AuthHydrator() {
  const { setAuth, setLoading } = useAuthStore();
  const ranRef = useRef(false);

  // Single client-side hydration pass
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (ranRef.current) return; // prevent re-run on Fast Refresh
    ranRef.current = true;

    const state = useAuthStore.getState();
    if (!state.hasHydrated) state.setHydrated(true);

    const token = localStorage.getItem('access_token') || '';
    if (token && !state.accessToken) {
      state.setAccessToken(token);
    }

    if (!state.isAuthenticated && token) {
      setLoading(true);
      (async () => {
        try {
          try {
            const isHttps = window.location.protocol === 'https:'
            const sameSite = isHttps ? 'None' : 'Lax'
            document.cookie = `access_token=${token}; path=/; max-age=3600; SameSite=${sameSite}${isHttps ? '; Secure' : ''}`;
          } catch {}
          const profile = await api.getProfile().catch(() => null);
          if (profile?.user) {
            setAuth(profile.user, token);
          }
        } finally {
          setLoading(false);
        }
      })();
    } else {
      // No token -> ensure we are not stuck loading
      setLoading(false);
    }
  }, [setAuth, setLoading]);

  return null;
}