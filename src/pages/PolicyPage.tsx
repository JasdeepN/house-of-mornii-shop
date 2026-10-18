import { Link } from 'react-router-dom'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { usePolicy, type PolicyKind } from '@/lib/shopify'
import { sanitizeRichText } from '@/lib/sanitize-html'
import { useSEO } from '@/hooks/useSEO'

const POLICY_PAGES: { kind: PolicyKind; label: string; path: string }[] = [
  { kind: 'refund', label: 'Refund policy', path: '/policies/refund' },
  { kind: 'shipping', label: 'Shipping policy', path: '/policies/shipping' },
  { kind: 'privacy', label: 'Privacy policy', path: '/policies/privacy' },
  { kind: 'terms', label: 'Terms of service', path: '/policies/terms' },
]

/** One of the store's own policies, written in Shopify admin and shown here as-is. */
export function PolicyPage({ kind }: { kind: PolicyKind }) {
  const page = POLICY_PAGES.find((p) => p.kind === kind)!
  const { data: policy, isPending, isError } = usePolicy(kind)
  const title = policy?.title || page.label

  useSEO({ title, description: `${page.label} for House of Mornii.` })

  return (
    <div className="min-h-screen pt-8 pb-16">
      <div className="container mx-auto px-6 lg:px-20">
        <PageBreadcrumb items={[{ label: 'HOME', to: '/' }, { label: title.toUpperCase() }]} className="mb-10" />

        <h1 className="text-center text-3xl lg:text-5xl tracking-[0.15em] break-words">{title}</h1>
        <OrnamentalDivider className="my-10" />

        <div className="mx-auto max-w-3xl">
          {isPending ? (
            <p className="text-center text-muted-foreground" role="status">Loading...</p>
          ) : policy ? (
            <div
              data-testid="policy-body"
              className="prose prose-sm max-w-none break-words [overflow-wrap:anywhere] text-base leading-relaxed text-muted-foreground [&_a]:text-accent [&_a]:underline [&_h2]:mt-8 [&_h2]:text-xl [&_h3]:mt-6 [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6"
              dangerouslySetInnerHTML={{ __html: sanitizeRichText(policy.body) }}
            />
          ) : (
            <div className="text-center">
              <p className="text-base text-muted-foreground">
                {isError ? "We couldn't load this policy. Please try again shortly." : "This policy hasn't been published yet."}
              </p>
              <Link
                to="/contact"
                className="mt-4 inline-flex min-h-11 min-w-11 items-center justify-center px-4 text-sm tracking-[0.15em] text-accent underline underline-offset-4"
              >
                CONTACT US
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
