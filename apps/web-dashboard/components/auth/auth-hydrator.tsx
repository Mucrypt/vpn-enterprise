"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

export default function AuthHydrator() {
  const { setAuth, setLoading, clearAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const hydrateAuth = async () => {
      // Always set access token cookie from localStorage before profile fetch
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
      if (token) {
        try {
          document.cookie = `access_token=${token}; path=/; max-age=3600; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
        } catch (e) {}
      }
      // Only hydrate if not authenticated
      if (!isAuthenticated) {
        setLoading(true);
        try {
          const profile = await api.getProfile();
          if (profile?.user) {
            setAuth(profile.user, token || '');
          }
        } catch (error) {
          console.warn('Auth hydration failed:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    hydrateAuth();
  }, [setAuth, setLoading, isAuthenticated]);

  return null;
}