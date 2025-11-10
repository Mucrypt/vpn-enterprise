'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setAccessToken } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      console.debug('Login: sending request to', `${apiUrl}/api/v1/auth/login`);
      const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        // include credentials so server-set httpOnly cookies (refresh_token) are stored
        credentials: 'include',
      });

      let data: any;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Login: failed to parse JSON response', e);
        throw new Error('Invalid JSON response from server');
      }

      console.debug('Login: response', response.status, data);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store user and token
      if (data.session?.access_token) {
        // Persist access token in localStorage for Authorization header use
        localStorage.setItem('access_token', data.session.access_token);
        // In local development, also persist refresh token so the client can
        // perform refresh flow when httpOnly cookies are not available.
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production' && data.session?.refresh_token) {
          try {
            localStorage.setItem('refresh_token', data.session.refresh_token);
          } catch (e) {
            // ignore
          }
        }
        // Also update the zustand store so the rest of the app sees the token immediately
        setAccessToken(data.session.access_token);
        // Note: don't set a client-side cookie for the API host here (cross-origin).
        // The server will set a httpOnly refresh_token cookie when credentials are included.
      }
      
      setUser({
        id: data.user.id,
        email: data.user.email,
        role: data.user.role || 'user',
      });

      toast.success('Login successful!');

      // After successful login, wait a short moment and then fetch the
      // authoritative profile from the API before navigating. The tiny
      // delay helps ensure the browser has applied any server-set httpOnly
      // cookies (refresh_token) so the profile request can use them and
      // avoid a transient 401 which would trigger a logout redirect.
      try {
        await new Promise((r) => setTimeout(r, 120));
        const profileData = await api.getProfile().catch(() => null);
        if (profileData?.user) {
          setUser(profileData.user);
        }
      } catch (e) {
        // ignore - we'll still redirect below as a safe fallback
      }

      // navigate after ensuring we attempted to hydrate the profile
      try {
        router.push('/dashboard');
      } catch (e) {
        // fallback to a full redirect if the router is unavailable
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <Shield className="h-12 w-12 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">VPN Enterprise</h1>
          </div>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-gray-900">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex items-center justify-end">
                <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-blue-600 hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900 font-medium mb-2">Demo Credentials:</p>
          <p className="text-sm text-blue-800">Email: admin@example.com</p>
          <p className="text-sm text-blue-800">Password: (any password)</p>
        </div>
      </div>
    </div>
  );
}
