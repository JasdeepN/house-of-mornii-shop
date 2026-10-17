/** Thrown when the Worker answers 401: the Customer session has ended or never existed. */
export class SignedOutError extends Error {
  constructor(message = 'Customer is signed out') {
    super(message)
    this.name = 'SignedOutError'
  }
}

export interface UserError {
  field: string[] | null
  message: string
  code?: string
}

/** Shopify userErrors from a mutation payload; the message is the first error's message. */
export class CustomerUserError extends Error {
  userErrors: UserError[]
  constructor(userErrors: UserError[]) {
    super(userErrors[0]?.message ?? 'Request failed')
    this.name = 'CustomerUserError'
    this.userErrors = userErrors
  }
}

/** Throws CustomerUserError when the payload carries any userErrors. */
export function assertNoUserErrors(payload: { userErrors?: UserError[] | null } | null | undefined): void {
  if (payload?.userErrors && payload.userErrors.length > 0) {
    throw new CustomerUserError(payload.userErrors)
  }
}
