import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Loads KEY=value lines from git-ignored env files into process.env.
 * Real environment variables win; empty values are ignored.
 */
export function loadEnvFiles(): void {
  for (const file of ['.env.e2e.local', '.env.development.local']) {
    const path = resolve(process.cwd(), file)
    if (!existsSync(path)) continue
    for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq < 1) continue
      const key = line.slice(0, eq).trim()
      let value = line.slice(eq + 1).trim()
      if (/^(".*"|'.*')$/.test(value)) value = value.slice(1, -1)
      if (value && !process.env[key]) process.env[key] = value
    }
  }
}

loadEnvFiles()
