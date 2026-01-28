'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function defaultPassword(): string {
  // Reasonable client-side default; API will accept and set it.
  // If left empty, API generates a strong password and returns it once.
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const length = 20
  let out = ''
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length]
  return out
}

export interface CreateFirstProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => Promise<void> | void
}

export function CreateFirstProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateFirstProjectDialogProps) {
  const [projectName, setProjectName] = useState('')
  const [dbPassword, setDbPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [oneTimePassword, setOneTimePassword] = useState<string | null>(null)

  function reset() {
    setProjectName('')
    setDbPassword('')
    setError(null)
    setOneTimePassword(null)
  }

  function handleOpenChange(nextOpen: boolean) {
    // Don't allow closing while a one-time password is being displayed.
    if (!nextOpen && oneTimePassword) return

    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  const canSubmit = useMemo(() => {
    return !isSubmitting && projectName.trim().length >= 2
  }, [isSubmitting, projectName])

  async function submit() {
    setIsSubmitting(true)
    setError(null)
    setOneTimePassword(null)

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

      const json = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${resp.status}`)
      }

      // If the API generated a password (because the user left it blank), show it once.
      if (json?.database_password) {
        setOneTimePassword(String(json.database_password))
      }

      // Refresh the tenant list in the background.
      await onCreated()

      // If we did NOT get a one-time password, we can close immediately.
      // If we DID get one, keep the dialog open so the user can copy it.
      if (!json?.database_password) {
        onOpenChange(false)
      }
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message)
      else setError('Failed to create project')
    } finally {
      setIsSubmitting(false)
    }
  }

  function closeAndReset() {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-xl bg-[#1e1e1e] border-gray-700 text-white'>
        <DialogHeader>
          <DialogTitle>Create a new project</DialogTitle>
          <DialogDescription className='text-gray-300'>
            Your project gets its own dedicated Postgres database so you can
            create tables, functions, triggers, and schemas.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className='border border-red-500/20 bg-red-500/10 text-red-200 p-3 rounded-lg text-sm'>
            {error}
          </div>
        )}

        {oneTimePassword && (
          <div className='border border-emerald-500/20 bg-emerald-500/10 text-emerald-100 p-3 rounded-lg text-sm'>
            <div className='font-medium'>Database password (shown once)</div>
            <div className='mt-1 font-mono break-all text-emerald-50'>
              {oneTimePassword}
            </div>
          </div>
        )}

        <div className='space-y-4'>
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

          <div className='space-y-2'>
            <Label htmlFor='dbPassword' className='text-gray-200'>
              Database password
            </Label>
            <div className='flex gap-2'>
              <Input
                id='dbPassword'
                type='password'
                placeholder='Set now, or leave blank to auto-generate'
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
        </div>

        <DialogFooter className='mt-2'>
          {oneTimePassword ? (
            <>
              <Button
                type='button'
                variant='outline'
                className='border-gray-600 text-gray-100 hover:bg-gray-800'
                onClick={closeAndReset}
              >
                I saved it — continue
              </Button>
            </>
          ) : (
            <>
              <Button
                type='button'
                variant='outline'
                className='border-gray-600 text-gray-100 hover:bg-gray-800'
                onClick={closeAndReset}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type='button'
                className='bg-emerald-600 hover:bg-emerald-700 text-white'
                onClick={submit}
                disabled={!canSubmit}
              >
                {isSubmitting ? 'Creating…' : 'Create project'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
