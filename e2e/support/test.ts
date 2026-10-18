import { test as base } from '@playwright/test'
import { passAccess } from './access'

/**
 * The read-only tier's `test`: Playwright's, with every context let through Cloudflare Access
 * when the target needs it (the private preview). Read-only specs import `test` and `expect`
 * from here, not from @playwright/test.
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    await passAccess(context)
    await use(context)
  },
})

export { expect } from '@playwright/test'
