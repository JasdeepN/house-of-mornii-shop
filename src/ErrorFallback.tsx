import type { FallbackProps } from 'react-error-boundary'

export const ErrorFallback = ({ error }: FallbackProps) => {
  const message = error instanceof Error ? error.message : String(error)
  return (
    <div style={{ padding: '1rem', color: '#a6a6a6' }}>
      Unable to fetch products.
      {message ? <p style={{ fontSize: '0.8em' }}>{message}</p> : null}
    </div>
  );
}
