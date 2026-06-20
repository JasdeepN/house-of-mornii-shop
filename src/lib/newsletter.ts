import { getNewsletterConfig } from '@/lib/siteConfig'

export interface NewsletterSubscriptionInput {
  email: string
  source: string
}

export interface NewsletterSubscriptionResult {
  mode: 'prototype' | 'endpoint'
}

export class NewsletterSubscriptionError extends Error {
  constructor(message = 'Newsletter subscription failed') {
    super(message)
    this.name = 'NewsletterSubscriptionError'
  }
}

export async function subscribeToNewsletter({ email, source }: NewsletterSubscriptionInput): Promise<NewsletterSubscriptionResult> {
  const { endpoint } = getNewsletterConfig()

  if (!endpoint) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return { mode: 'prototype' }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, source }),
  })

  if (!response.ok) {
    throw new NewsletterSubscriptionError()
  }

  return { mode: 'endpoint' }
}