export const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary?: () => void }) => {
  return (
    <div style={{ padding: '1rem', color: '#a6a6a6' }}>
      Unable to fetch products.
    </div>
  );
}
