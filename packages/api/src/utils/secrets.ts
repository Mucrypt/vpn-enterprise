import fs from 'node:fs'

function readFileTrimmed(path: string): string | undefined {
  try {
    if (!path) return undefined
    if (!fs.existsSync(path)) return undefined
    const raw = fs.readFileSync(path, 'utf8')
    const value = raw.replace(/\r?\n/g, '').trim()
    return value.length ? value : undefined
  } catch {
    return undefined
  }
}

export function resolveSecret(opts: {
  valueEnv?: string
  fileEnv?: string
  defaultFilePath?: string
}): string | undefined {
  const value = opts.valueEnv ? process.env[opts.valueEnv] : undefined
  if (value && value.trim().length) return value.trim()

  const filePath = opts.fileEnv ? process.env[opts.fileEnv] : undefined
  const fromEnvFile = filePath ? readFileTrimmed(filePath) : undefined
  if (fromEnvFile) return fromEnvFile

  const fromDefault = opts.defaultFilePath
    ? readFileTrimmed(opts.defaultFilePath)
    : undefined
  if (fromDefault) return fromDefault

  return undefined
}
