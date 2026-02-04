'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

// Component that handles session expiration notification
function SessionExpirationNotification() {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      toast.error('Your session has expired. Please log in again.', {
        duration: 5000,
        icon: '⏰',
      })
    }
  }, [searchParams])

  return null
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser, setAccessToken, setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Use central API client so absolute base URL is used on Vercel
      const data = await api.login(formData.email, formData.password)
      console.debug('Login: response', 200, data)

      // Use setAuth to update all state fields and mark as authenticated
      if (data.session?.access_token && data.user) {
        setAuth(
          {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role || 'user',
            last_login: data.user.last_login,
            subscription: data.user.subscription,
          },
          data.session.access_token,
        )
      }

      toast.success('Login successful!')

      // After successful login, wait a short moment and then fetch the
      // authoritative profile from the API before navigating. The tiny
      // delay helps ensure the browser has applied any server-set httpOnly
      // cookies (refresh_token) so the profile request can use them and
      // avoid a transient 401 which would trigger a logout redirect.
      try {
        await new Promise((r) => setTimeout(r, 120))
        const profileData = await api.getProfile().catch(() => null)
        if (profileData?.user) {
          setAuth(profileData.user, data.session.access_token)
        }
      } catch (e) {
        // ignore - we'll still redirect below as a safe fallback
      }

      // Check for redirect parameter (e.g., from nexusAi or other sub-apps)
      const redirectUrl = searchParams.get('redirect')
      
      if (redirectUrl) {
        // Decode and validate the redirect URL
        try {
          const decodedUrl = decodeURIComponent(redirectUrl)
          // Ensure it's from our domain or a safe subdomain
          if (
            decodedUrl.startsWith('https://chatbuilds.com') ||
            decodedUrl.startsWith('/') ||
            decodedUrl.includes('nexusai')
          ) {
            window.location.href = decodedUrl
            return
          }
        } catch (e) {
          console.error('Invalid redirect URL:', e)
        }
      }

      // Default redirect to dashboard
      try {
        router.push('/dashboard')
      } catch (e) {
        // fallback to a full redirect if the router is unavailable
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-linear-to-b from-gray-50 to-white p-4'>
      <div className='w-full max-w-md'>
        {/* Logo */}
        <div className='flex justify-center mb-8'>
          <div className='flex items-center gap-2'>
            <Shield className='h-12 w-12 text-blue-600' />
            <h1 className='text-3xl font-bold text-gray-900'>VPN Enterprise</h1>
          </div>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-2xl text-center text-gray-900'>
              Welcome back
            </CardTitle>
            <CardDescription className='text-center'>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              {error && (
                <div className='bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-800'>
                  <AlertCircle className='h-4 w-4 shrink-0' />
                  <p className='text-sm'>{error}</p>
                </div>
              )}

              {/* Email Field */}
              <div className='space-y-2'>
                <label
                  htmlFor='email'
                  className='text-sm font-medium text-gray-700'
                >
                  Email
                </label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
                  <input
                    id='email'
                    type='email'
                    required
                    autoComplete='email'
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900'
                    placeholder='you@example.com'
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className='space-y-2'>
                <label
                  htmlFor='password'
                  className='text-sm font-medium text-gray-700'
                >
                  Password
                </label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
                  <input
                    id='password'
                    type='password'
                    required
                    autoComplete='current-password'
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900'
                    placeholder='••••••••'
                  />
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className='flex items-center justify-end'>
                <Link
                  href='/auth/forgot-password'
                  className='text-sm text-blue-600 hover:underline'
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type='submit'
                className='w-full bg-black text-white hover:bg-gray-800'
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className='mt-6 text-center text-sm text-gray-600'>
              Don't have an account?{' '}
              <Link
                href='/auth/signup'
                className='text-blue-600 hover:underline font-medium'
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Dev-only hint */}
        {process.env.NODE_ENV !== 'production' && (
          <div className='mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <p className='text-sm text-blue-900 font-medium mb-2'>
              Local dev hint:
            </p>
            <p className='text-sm text-blue-800'>
              Use an account you created via Sign up (or in your Supabase Auth
              users).
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Main page component with Suspense boundary
export default function LoginPage() {
  return (
    <>
      <Suspense fallback={<div />}>
        <SessionExpirationNotification />
      </Suspense>
      <LoginForm />
    </>
  )
}
