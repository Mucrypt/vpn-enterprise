'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

function defaultPassword(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const length = 20
  let out = ''
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length]
  return out
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null

  // Try store first
  try {
    const { useAuthStore } = require('@/lib/store')
    const token = useAuthStore.getState().accessToken
    if (token) return token
  } catch {}

  // Try localStorage
  try {
    const token = localStorage.getItem('access_token')
    if (token) return token
  } catch {}

  // Try cookies
  try {
    const cookies = document.cookie.split('; ')
    for (const cookie of cookies) {
      const [name, value] = cookie.split('=')
      if (name === 'access_token') return value
    }
  } catch {}

  return null
}

type WizardStep = 1 | 2 | 3 | 4

type CreateProjectResponse = {
  created?: boolean
  tenant?: {
    id?: string
    tenant_id?: string
    name?: string
    subdomain?: string
  }
  database?: { host: string; port: number; database: string; username: string }
  database_password?: string
}

const REGIONS = [
  { id: 'us-east-1', name: 'US East (N. Virginia)', flag: '🇺🇸' },
  { id: 'us-west-1', name: 'US West (N. California)', flag: '🇺🇸' },
  { id: 'eu-central-1', name: 'EU Central (Frankfurt)', flag: '🇪🇺' },
  { id: 'eu-west-1', name: 'EU West (Ireland)', flag: '🇪🇺' },
  { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', flag: '🇸🇬' },
  { id: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)', flag: '🇯🇵' },
]

export function CreateDatabaseProjectWizard({
  returnTo,
}: {
  returnTo: string
}) {
  const router = useRouter()

  const [initialCheckLoading, setInitialCheckLoading] = useState(true)
  const [initialCheckError, setInitialCheckError] = useState<string | null>(
    null,
  )

  const [step, setStep] = useState<WizardStep>(1)
  const [projectName, setProjectName] = useState('')
  const [dbPassword, setDbPassword] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('us-east-1')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CreateProjectResponse | null>(null)

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        setInitialCheckLoading(true)
        setInitialCheckError(null)

        const token = getAuthToken()
        const res = await fetch('/api/v1/tenants/me', {
          credentials: 'include',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        })
        if (!res.ok) {
          if (res.status === 401) {
            if (!cancelled)
              setInitialCheckError('Please sign in to create a project.')
            return
          }
          return
        }

        const json = await res.json().catch(() => ({}))
        const tenants = json?.tenants || json?.data || []

        // If user has tenants, redirect to database page
        // Server will handle showing them their database editor
        if (Array.isArray(tenants) && tenants.length > 0) {
          window.location.href = '/databases'
          return
        }
      } catch {
        // Allow the wizard to proceed even if the API is temporarily unreachable.
      } finally {
        if (!cancelled) setInitialCheckLoading(false)
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [router])

  const canContinueFromStep1 = useMemo(
    () => projectName.trim().length >= 2,
    [projectName],
  )

  const canCreate = useMemo(() => {
    return !isSubmitting && projectName.trim().length >= 2
  }, [isSubmitting, projectName])

  async function submit() {
    setIsSubmitting(true)
    setError(null)

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Please log in to create a project.')
      }

      const resp = await fetch('/api/v1/tenants/self', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name: projectName.trim(),
          plan_type: 'free',
          db_password: dbPassword.trim() || undefined,
          region: selectedRegion,
        }),
      })

      const json = (await resp
        .json()
        .catch(() => ({}))) as CreateProjectResponse
      if (!resp.ok) {
        // Handle payment required
        if (resp.status === 402) {
          throw new Error(
            'Free plan limit reached. Upgrade to create more projects.',
          )
        }
        throw new Error(
          (json as any)?.message ||
            (json as any)?.error ||
            `HTTP ${resp.status}`,
        )
      }

      setResult(json)
      setStep(4)
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message)
      else setError('Failed to create project')
    } finally {
      setIsSubmitting(false)
    }
  }

  function goNext() {
    setError(null)
    if (step === 1) setStep(2)
    else if (step === 2) setStep(3)
  }

  function goBack() {
    setError(null)
    if (step === 3) setStep(2)
    else if (step === 2) setStep(1)
  }

  if (initialCheckLoading) {
    return (
      <div className='min-h-screen bg-gray-950 text-white flex items-center justify-center p-6'>
        <div className='text-sm text-gray-300'>Loading…</div>
      </div>
    )
  }

  if (initialCheckError) {
    return (
      <div className='min-h-screen bg-gray-950 text-white flex items-center justify-center p-6'>
        <Card className='w-full max-w-lg bg-[#1e1e1e] border-gray-800'>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription className='text-gray-300'>
              {initialCheckError}
            </CardDescription>
          </CardHeader>
          <CardFooter className='flex justify-end'>
            <Button onClick={() => router.push('/dashboard')}>Go back</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-950 text-white'>
      <div className='max-w-4xl mx-auto px-6 py-10'>
        <div className='mb-8 text-center'>
          <h1 className='text-3xl font-bold mb-2'>Create a new project</h1>
          <p className='text-gray-400 max-w-2xl mx-auto'>
            Your project comes with a dedicated Postgres database. Projects are
            isolated environments.
          </p>
        </div>

        {/* Progress Steps */}
        <div className='flex items-center justify-center mb-10'>
          {[1, 2, 3, 4].map((num) => (
            <React.Fragment key={num}>
              <div className='flex flex-col items-center'>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  {num}
                </div>
                <div
                  className={`text-xs mt-2 ${step >= num ? 'text-emerald-400' : 'text-gray-500'}`}
                >
                  {num === 1 && 'Details'}
                  {num === 2 && 'Region'}
                  {num === 3 && 'Password'}
                  {num === 4 && 'Done'}
                </div>
              </div>
              {num < 4 && (
                <div
                  className={`h-0.5 w-16 mx-3 ${
                    step > num ? 'bg-emerald-600' : 'bg-gray-800'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <Card className='bg-[#1e1e1e] border-gray-800 max-w-2xl mx-auto'>
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Project details'}
              {step === 2 && 'Select a region'}
              {step === 3 && 'Database password'}
              {step === 4 && 'Project created'}
            </CardTitle>
            <CardDescription className='text-gray-400'>
              {step === 1 && 'Choose a name for your project.'}
              {step === 2 &&
                'Select the region closest to your users for best performance.'}
              {step === 3 &&
                'Set a secure password for your database owner user.'}
              {step === 4 &&
                (result?.created === false
                  ? 'You already have a project. Continue to the database.'
                  : 'Your project is ready. Save the credentials below.')}
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-5'>
            {error && (
              <div className='border border-red-500/20 bg-red-500/10 text-red-200 p-3 rounded-lg text-sm flex items-start justify-between'>
                <span>{error}</span>
                {error.includes('Upgrade') && (
                  <Button
                    size='sm'
                    variant='outline'
                    className='ml-3 border-red-500/30 text-red-100 hover:bg-red-500/10'
                    onClick={() => router.push('/dashboard/billing')}
                  >
                    Upgrade
                  </Button>
                )}
              </div>
            )}

            {step === 1 && (
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='projectName' className='text-gray-200'>
                    Project name
                  </Label>
                  <Input
                    id='projectName'
                    placeholder='my-awesome-project'
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className='bg-gray-900 border-gray-700'
                  />
                  <div className='text-xs text-gray-400'>
                    A unique name to identify your project.
                  </div>
                </div>
                <div className='bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-100'>
                  💡 Free plan includes 1 project.{' '}
                  <Button
                    variant='link'
                    className='text-blue-300 hover:text-blue-200 p-0 h-auto'
                    onClick={() => router.push('/dashboard/billing')}
                  >
                    Upgrade to Premium
                  </Button>{' '}
                  for multiple projects.
                </div>
              </div>
            )}

            {step === 2 && (
              <div className='space-y-3'>
                <Label className='text-gray-200'>Region</Label>
                <div className='grid grid-cols-1 gap-2'>
                  {REGIONS.map((region) => (
                    <button
                      key={region.id}
                      type='button'
                      onClick={() => setSelectedRegion(region.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        selectedRegion === region.id
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-gray-700 bg-gray-900/40 hover:border-gray-600'
                      }`}
                    >
                      <div className='flex items-center gap-3'>
                        <span className='text-2xl'>{region.flag}</span>
                        <div className='text-left'>
                          <div className='text-sm font-medium text-gray-100'>
                            {region.name}
                          </div>
                          <div className='text-xs text-gray-400'>
                            {region.id}
                          </div>
                        </div>
                      </div>
                      {selectedRegion === region.id && (
                        <div className='w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center'>
                          <svg
                            className='w-3 h-3 text-white'
                            fill='none'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path d='M5 13l4 4L19 7' />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className='text-xs text-gray-500 mt-2'>
                  Note: Region selection is saved for future reference. Your
                  database will be provisioned in the configured infrastructure.
                </div>
              </div>
            )}

            {step === 3 && (
              <div className='space-y-2'>
                <Label htmlFor='dbPassword' className='text-gray-200'>
                  Database password
                </Label>
                <div className='flex gap-2'>
                  <Input
                    id='dbPassword'
                    type='password'
                    placeholder='Leave blank to auto-generate'
                    value={dbPassword}
                    onChange={(e) => setDbPassword(e.target.value)}
                    className='bg-gray-900 border-gray-700'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    className='border-gray-600 text-gray-100 hover:bg-gray-800'
                    onClick={() => setDbPassword(defaultPassword())}
                    disabled={isSubmitting}
                  >
                    Generate
                  </Button>
                </div>
                <div className='text-xs text-gray-400'>
                  Used to create your project's DB owner user. Save this
                  securely.
                </div>
              </div>
            )}

            {step === 4 && (
              <div className='space-y-4'>
                {result?.created === false && (
                  <div className='rounded-lg border border-blue-500/20 bg-blue-500/10 p-4'>
                    <div className='font-medium text-blue-50'>
                      Project already exists
                    </div>
                    <div className='text-sm text-blue-100/80 mt-1'>
                      Free plan includes 1 project per user.{' '}
                      <Button
                        variant='link'
                        className='text-blue-300 hover:text-blue-200 p-0 h-auto'
                        onClick={() => router.push('/dashboard/billing')}
                      >
                        Upgrade to Premium
                      </Button>{' '}
                      to create more projects.
                    </div>
                  </div>
                )}
                <div className='rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4'>
                  <div className='font-medium text-emerald-50'>
                    Database ready
                  </div>
                  <div className='text-sm text-emerald-100/80 mt-1'>
                    Your project has a dedicated Postgres database.
                  </div>
                </div>

                {result?.database_password && (
                  <div className='rounded-lg border border-amber-500/20 bg-amber-500/10 p-4'>
                    <div className='font-medium text-amber-50'>
                      Database password (shown once)
                    </div>
                    <div className='mt-2 font-mono break-all text-amber-50 text-sm'>
                      {String(result.database_password)}
                    </div>
                  </div>
                )}

                <div className='rounded-lg border border-gray-800 bg-gray-900/40 p-4 text-sm text-gray-200'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    <div>
                      <div className='text-xs text-gray-400'>Database</div>
                      <div className='font-mono break-all'>
                        {result?.database?.database || '—'}
                      </div>
                    </div>
                    <div>
                      <div className='text-xs text-gray-400'>Username</div>
                      <div className='font-mono break-all'>
                        {result?.database?.username || '—'}
                      </div>
                    </div>
                    <div>
                      <div className='text-xs text-gray-400'>Region</div>
                      <div className='font-mono break-all'>
                        {REGIONS.find((r) => r.id === selectedRegion)?.name ||
                          selectedRegion}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className='flex items-center justify-between'>
            {step < 4 ? (
              <>
                <Button
                  type='button'
                  variant='outline'
                  className='border-gray-700 text-gray-100 hover:bg-gray-800'
                  onClick={
                    step === 1 ? () => router.push('/dashboard') : goBack
                  }
                  disabled={isSubmitting}
                >
                  {step === 1 ? 'Cancel' : 'Back'}
                </Button>

                {step === 1 && (
                  <Button
                    type='button'
                    className='bg-emerald-600 hover:bg-emerald-700 text-white'
                    onClick={goNext}
                    disabled={!canContinueFromStep1}
                  >
                    Continue
                  </Button>
                )}

                {step === 2 && (
                  <Button
                    type='button'
                    className='bg-emerald-600 hover:bg-emerald-700 text-white'
                    onClick={goNext}
                  >
                    Continue
                  </Button>
                )}

                {step === 3 && (
                  <Button
                    type='button'
                    className='bg-emerald-600 hover:bg-emerald-700 text-white'
                    onClick={submit}
                    disabled={!canCreate}
                  >
                    {isSubmitting ? 'Creating…' : 'Create project'}
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  type='button'
                  variant='outline'
                  className='border-gray-700 text-gray-100 hover:bg-gray-800'
                  onClick={() => router.push('/dashboard/billing')}
                >
                  Upgrade to Premium
                </Button>
                <Button
                  type='button'
                  className='bg-emerald-600 hover:bg-emerald-700 text-white'
                  onClick={() => {
                    // Force hard navigation to refresh server component and fetch new tenant list
                    window.location.href = '/databases'
                  }}
                >
                  Go to database
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
