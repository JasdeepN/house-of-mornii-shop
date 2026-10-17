import { isDevTarget } from './env'
import { ensureTestProducts } from './test-products'

export default async function globalSetup(): Promise<void> {
  if (!isDevTarget()) return
  await ensureTestProducts()
}
