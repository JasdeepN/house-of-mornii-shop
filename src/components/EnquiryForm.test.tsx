import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EnquiryForm } from './EnquiryForm'

const render_ = vi.fn()
const reset = vi.fn()
const remove = vi.fn()
const fetchMock = vi.fn()

function mockTurnstile() {
  render_.mockImplementation((_el: HTMLElement, opts: { callback: (t: string) => void }) => {
    opts.callback('token-1')
    return 'widget-1'
  })
  window.turnstile = { render: render_, reset, remove }
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Name'), 'Ada Lovelace')
  await user.type(screen.getByLabelText('Email'), 'ada@example.com')
  await user.type(screen.getByLabelText('Message'), 'Is this pendant available in gold?')
}

describe('EnquiryForm', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'site-key')
    mockTurnstile()
    fetchMock.mockReset()
    render_.mockClear()
    reset.mockClear()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    delete window.turnstile
  })

  it('renders nothing without a site key', () => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '')
    const { container } = render(<EnquiryForm kind="styling" />)
    expect(container).toBeEmptyDOMElement()
  })

  // The normal widget is a fixed 300px; on a 320px phone it pushed the page sideways.
  it.each([
    [272, 'compact'],
    [300, 'normal'],
  ])('renders the security check in a %ipx space at the %s size', async (width, size) => {
    const clientWidth = vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(width)
    try {
      render(<EnquiryForm kind="styling" />)
      await waitFor(() => expect(render_).toHaveBeenCalled())
      expect(render_.mock.calls[0][1]).toMatchObject({ size })
    } finally {
      clientWidth.mockRestore()
    }
  })

  it('shows tied validation errors for an empty submit and does not send', async () => {
    const user = userEvent.setup()
    render(<EnquiryForm kind="styling" />)
    await user.click(screen.getByRole('button', { name: 'Send message' }))

    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('Please tell us your name.')
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Please enter a valid email address.')
    expect(screen.getByLabelText('Message')).toHaveAccessibleDescription('Please write at least 10 characters.')
    expect(screen.getByLabelText('Name')).toHaveFocus()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('enforces the length limits', async () => {
    const user = userEvent.setup()
    render(<EnquiryForm kind="styling" />)
    await fillValid(user)
    await user.type(screen.getByLabelText('Phone (optional)'), '1'.repeat(31))
    await user.click(screen.getByRole('button', { name: 'Send message' }))
    expect(screen.getByLabelText('Phone (optional)')).toHaveAccessibleDescription(/30 characters/)
  })

  it('sends a product enquiry with the Turnstile token from the widget', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    const user = userEvent.setup()
    const product = { title: 'Aria Pendant', url: '/products/aria-pendant', variant: 'Gold' }
    render(<EnquiryForm kind="product" product={product} />)
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: 'Send message' }))

    await screen.findByText(/we've received your message and will reply by email/)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/enquiry')
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(JSON.parse(init.body)).toEqual({
      kind: 'product',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'Is this pendant available in gold?',
      product,
      turnstileToken: 'token-1',
    })
  })

  it('sends a styling enquiry with a phone and no product', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    const user = userEvent.setup()
    render(<EnquiryForm kind="styling" product={{ title: 'ignored', url: '/x' }} />)
    await fillValid(user)
    await user.type(screen.getByLabelText('Phone (optional)'), '555 0100')
    await user.click(screen.getByRole('button', { name: 'Send message' }))

    await screen.findByRole('status')
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.kind).toBe('styling')
    expect(body.phone).toBe('555 0100')
    expect(body).not.toHaveProperty('product')
  })

  it('disables the button and shows Sending… while the request is open, then resets the token', async () => {
    let finish!: (r: Response) => void
    fetchMock.mockReturnValue(new Promise<Response>((r) => (finish = r)))
    const user = userEvent.setup()
    render(<EnquiryForm kind="styling" />)
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: 'Send message' }))

    const sending = screen.getByRole('button', { name: 'Sending…' })
    expect(sending).toBeDisabled()
    finish(new Response(JSON.stringify({ error: 'send_failed' }), { status: 502 }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled())
    expect(reset).toHaveBeenCalledWith('widget-1')
  })

  it('shows the server field errors from a 400', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'invalid', fields: { email: 'That email looks wrong.' } }), { status: 400 }),
    )
    const user = userEvent.setup()
    render(<EnquiryForm kind="styling" />)
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: 'Send message' }))

    await waitFor(() => expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('That email looks wrong.'))
    expect(screen.getByLabelText('Email')).toHaveFocus()
  })

  it('explains a 429', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429 }))
    const user = userEvent.setup()
    render(<EnquiryForm kind="styling" />)
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: 'Send message' }))
    expect(await screen.findByText(/sent several messages just now; please try again in a few minutes/)).toBeInTheDocument()
  })

  it.each([
    ['a 502', () => Promise.resolve(new Response('{}', { status: 502 }))],
    ['a 403', () => Promise.resolve(new Response('{}', { status: 403 }))],
    ['a network error', () => Promise.reject(new TypeError('offline'))],
  ])('offers a mailto fallback after %s', async (_name, respond) => {
    fetchMock.mockImplementation(respond)
    const user = userEvent.setup()
    render(<EnquiryForm kind="styling" />)
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: 'Send message' }))
    const link = await screen.findByRole('link', { name: 'contact@houseofmornii.com' })
    expect(link).toHaveAttribute('href', 'mailto:contact@houseofmornii.com')
  })

  it('does not send until the security check has produced a token', async () => {
    render_.mockImplementation(() => 'widget-1')
    const user = userEvent.setup()
    render(<EnquiryForm kind="styling" />)
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: 'Send message' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/security check/)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
