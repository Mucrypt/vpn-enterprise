'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

export default function CreateDatabaseProjectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/databases'

  const [initialCheckLoading, setInitialCheckLoading] = useState(true)
  const [initialCheckError, setInitialCheckError] = useState<string | null>(
    null,
  )

  const [step, setStep] = useState<WizardStep>(1)
  const [projectName, setProjectName] = useState('')
  const [dbPassword, setDbPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CreateProjectResponse | null>(null)

  // If the user already has a project, don’t show onboarding.
  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        setInitialCheckLoading(true)
        setInitialCheckError(null)

        const res = await fetch('/api/v1/tenants/me', {
          credentials: 'include',
        })
        if (!res.ok) {
          if (res.status === 401) {
            if (!cancelled)
              setInitialCheckError('Please sign in to create a project.')
            return
          }
          // If /me isn’t available (self-host admin-only setups), allow the wizard.
          return
        }

        const json = await res.json().catch(() => ({}))
        const tenants = json?.tenants || json?.data || []
        if (Array.isArray(tenants) && tenants.length > 0) {
          router.replace('/databases')
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
      const resp = await fetch('/api/v1/tenants/self', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: projectName.trim(),
          plan_type: 'free',
          db_password: dbPassword.trim() || undefined,
        }),
      })

      const json = (await resp
        .json()
        .catch(() => ({}))) as CreateProjectResponse
      if (!resp.ok) {
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
      <div className='max-w-6xl mx-auto px-6 py-10'>
        <div className='mb-8'>
          <div className='text-sm text-gray-400'>Database</div>
          <h1 className='text-2xl font-semibold'>Create a new project</h1>
          <p className='text-gray-400 mt-2 max-w-2xl'>
            Projects are isolated. Tables, functions, triggers, and schemas you
            create live inside the project database.
          </p>
        </div>

        <div className='grid grid-cols-12 gap-6'>
          {/* Left: steps (Supabase-style) */}
          <div className='col-span-12 md:col-span-4'>
            <Card className='bg-[#111827] border-gray-800'>
              <CardHeader>
                <CardTitle className='text-base'>Setup</CardTitle>
                <CardDescription className='text-gray-400'>
                  A few quick steps.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3 text-sm'>
                <div
                  className={step === 1 ? 'text-emerald-300' : 'text-gray-300'}
                >
                  1. Project details
                </div>
                <div
                  className={step === 2 ? 'text-emerald-300' : 'text-gray-300'}
                >
                  2. Plan & limits
                </div>
                <div
                  className={step === 3 ? 'text-emerald-300' : 'text-gray-300'}
                >
                  3. Database password
                </div>
                <div
                  className={step === 4 ? 'text-emerald-300' : 'text-gray-300'}
                >
                  4. Done
                </div>
              </CardContent>
            </Card>

            <div className='mt-4 text-xs text-gray-400'>
              Free plan includes 1 project per user. Upgrade to create more.
              Admin accounts have no project limits.
            </div>
          </div>

          {/* Right: main form */}
          <div className='col-span-12 md:col-span-8'>
            <Card className='bg-[#1e1e1e] border-gray-800'>
              <CardHeader>
                <CardTitle>
                  {step === 1 && 'Project details'}
                  {step === 2 && 'Plan & limits'}
                  {step === 3 && 'Database password'}
                  {step === 4 && 'Project created'}
                </CardTitle>
                <CardDescription className='text-gray-300'>
                  {step === 1 && 'Choose a name for your project.'}
                  {step === 2 &&
                    'Free plan is available immediately. Premium unlocks multiple projects.'}
                  {step === 3 &&
                    'Set a password for the project database owner user.'}
                  {step === 4 &&
                    (result?.created === false
                      ? 'You already have a project. Continue to the database.'
                      : 'Your project database is ready. Save credentials shown once.')}
                </CardDescription>
              </CardHeader>

              <CardContent className='space-y-5'>
                {error && (
                  <div className='border border-red-500/20 bg-red-500/10 text-red-200 p-3 rounded-lg text-sm'>
                    {error}
                  </div>
                )}

                {step === 1 && (
                  <div className='space-y-2'>
                    <Label htmlFor='projectName' className='text-gray-200'>
                      Project name
                    </Label>
                    <Input
                      id='projectName'
                      placeholder='e.g. my-app'
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                    />
                    <div className='text-xs text-gray-400'>
                      This is what you’ll see in the dashboard.
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className='space-y-4'>
                    <div className='rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4'>
                      <div className='font-medium text-emerald-50'>
                        Free plan (selected)
                      </div>
                      <div className='text-sm text-emerald-100/80 mt-1'>
                        1 project per user. Project storage and compute are
                        capped.
                      </div>
                    </div>

                    <div className='rounded-lg border border-gray-700 bg-gray-900/40 p-4 opacity-70'>
                      <div className='font-medium text-gray-100'>
                        Premium plan
                      </div>
                      <div className='text-sm text-gray-400 mt-1'>
                        Multiple projects per user. Higher limits.
                      </div>
                      <div className='text-xs text-gray-500 mt-2'>
                        Upgrade flow coming next.
                      </div>
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
                      Used to create your project’s DB owner user.
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
                          Free plan includes 1 project per user. Upgrade to
                          Premium to create more projects.
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
                        <div className='mt-2 font-mono break-all text-amber-50'>
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
                        step === 1 ? () => router.push('/databases') : goBack
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
                      onClick={() => router.push(returnTo)}
                    >
                      Go to database
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
