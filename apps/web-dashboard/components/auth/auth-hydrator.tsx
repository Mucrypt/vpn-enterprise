"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

export default function AuthHydrator() {
  const { setAuth, setLoading, clearAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const hydrateAuth = async () => {
      // Skip if already authenticated
      if (isAuthenticated) return;

      setLoading(true);

      try {
        const profile = await api.getProfile();
        
        if (profile?.user) {
          const token = localStorage.getItem('access_token');
          if (token) {
            setAuth(profile.user, token);
          }
        }
      } catch (error) {
        console.warn('Auth hydration failed:', error);
        // Don't clear auth here - let individual requests handle 401s
      } finally {
        setLoading(false);
      }
    };

    hydrateAuth();
  }, [setAuth, setLoading, isAuthenticated]);

  return null;
}