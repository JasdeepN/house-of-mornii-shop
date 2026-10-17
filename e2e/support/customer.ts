import type { BrowserContext } from '@playwright/test'
import { requireDevTarget, requireEnv } from './env'

export const TEST_CUSTOMER_EMAIL = 'jasdeepn4+hom-e2e@gmail.com'

/** Adds the saved Customer session cookie for dev.houseofmornii.com to the context. */
export async function useTestCustomerSession(context: BrowserContext): Promise<void> {
  requireDevTarget()
  await context.addCookies([
    {
      name: 'hom_customer_session',
      value: requireEnv('E2E_CUSTOMER_SESSION'),
      domain: 'dev.houseofmornii.com',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    },
  ])
}
