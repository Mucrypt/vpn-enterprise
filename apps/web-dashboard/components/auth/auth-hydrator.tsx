"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

export default function AuthHydrator() {
  const { setUser, setAccessToken } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      // Try a few times with small backoff because the first profile call
      // can race with cookie storage in the browser during login. The
      // centralized `api.getProfile()` already attempts a refresh on 401,
      // but a tiny retry here smooths brief races without forcing logout.
      const attempts = [0, 150, 400];
      for (let i = 0; i < attempts.length; i++) {
        if (i > 0) await new Promise((r) => setTimeout(r, attempts[i]));
        try {
          const data = await api.getProfile().catch(() => null);
          if (data?.user) {
            console.debug('AuthHydrator: got user', data.user);
            // Avoid repeatedly setting the same user which can trigger
            // unnecessary re-renders or redirect loops. Only update the
            // store if the user is not already present or differs.
            try {
              // access the current store synchronously
              // eslint-disable-next-line @typescript-eslint/no-var-requires
              const { useAuthStore: _useAuthStore } = require('@/lib/store');
              const current = _useAuthStore.getState().user;
              if (!current || current.id !== data.user.id) {
                setUser(data.user);
              } else {
                console.debug('AuthHydrator: store already has same user, skipping setUser');
              }
            } catch (e) {
              // fallback: set user if any error occurred
              setUser(data.user);
            }

            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            if (token) setAccessToken(token);
            return; // success
          }
        } catch (err) {
          // ignore and retry
        }
      }
      // If we reach here, hydration didn't succeed; leave state as-is.
      return;
    };

    init();
  }, [setUser, setAccessToken]);

  return null;
}
