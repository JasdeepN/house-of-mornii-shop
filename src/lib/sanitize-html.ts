import DOMPurify from 'dompurify'

// Restrictive allowlist for Shopify rich text (Product descriptions, store policies):
// no scripts, no event handlers, no forms/objects/iframes.
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's',
    'ul', 'ol', 'li',
    'a',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'span', 'blockquote',
    'table', 'thead', 'tbody', 'tr', 'td', 'th',
  ],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
}

// Any anchor with a target also gets rel="noopener noreferrer" to prevent reverse-tabnabbing.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.hasAttribute('target')) {
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE_CONFIG)
}
