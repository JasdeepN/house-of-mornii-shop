import './load-env'

const DEV_ORIGIN = 'https://dev.houseofmornii.com'

export const BASE_URL: string = process.env.E2E_BASE_URL || DEV_ORIGIN

/** True only for https://dev.houseofmornii.com. Never for production or anything else. */
export function isDevTarget(url: string = BASE_URL): boolean {
  try {
    return new URL(url).origin === DEV_ORIGIN
  } catch {
    return false
  }
}

/** Throws unless the suite targets the dev site: dev-only journeys place real Orders and sign in. */
export function requireDevTarget(): void {
  if (!isDevTarget()) {
    throw new Error(
      `Dev-only journeys place real Orders and sign in, so they run only against ${DEV_ORIGIN}. ` +
        `The current target is ${BASE_URL}.`,
    )
  }
}

/**
 * False when the target was built without the enquiry form (E2E_ENQUIRIES=off): the private
 * preview has no /api/enquiry route, so it is built without a Turnstile key. Explicit, so a form
 * that vanishes from dev or production still fails its specs.
 */
export const ENQUIRIES_EXPECTED: boolean = process.env.E2E_ENQUIRIES !== 'off'

/** Reads a required env var or throws, naming the variable (never its value). */
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable ${name}`)
  return value
}
