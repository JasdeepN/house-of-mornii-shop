import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrustBadges, PaymentIcons } from './TrustBadges'

describe('TrustBadges', () => {
  it.each(['full', 'compact'] as const)('renders Secure Checkout and no unconfirmed claims (%s)', (variant) => {
    render(<TrustBadges variant={variant} />)
    expect(screen.getByText('Secure Checkout')).toBeInTheDocument()
    expect(screen.queryByText(/free shipping/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/easy returns/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/authenticity/i)).not.toBeInTheDocument()
  })

  it('keeps the payment icons', () => {
    render(<PaymentIcons />)
    expect(screen.getByText('Visa')).toBeInTheDocument()
  })
})
