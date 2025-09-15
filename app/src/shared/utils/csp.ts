/**
 * CSP helper utilities
 * - Server: extract request nonce from incoming headers (set by middleware when CSP_USE_NONCE=true)
 * - Client: optional hook to read a <meta name="csp-nonce" content="..."> if you choose to expose it
 *   (we do not inject such meta by default to keep CSP strict and avoid leaking nonces)
 */

export function getRequestNonceFromHeaders(hdrs: Headers | Record<string, string | undefined>): string | null {
  if (hdrs instanceof Headers) {
    return hdrs.get('x-nonce') || null
  }
  const rec = hdrs as Record<string, string | undefined>
  return rec['x-nonce'] ?? rec['X-Nonce'] ?? null
}

// Server-only helper (Next.js App Router)
export async function getRequestNonce(): Promise<string | null> {
  try {
    const mod = await import('next/headers')
    const h = await mod.headers()
    return h.get('x-nonce') || null
  } catch {
    return null
  }
}

// Client-side hook to read a meta tag if present
export function useCSPNonce(): string | null {
  if (typeof document === 'undefined') return null
  const meta = document.querySelector('meta[name="csp-nonce"]') as HTMLMetaElement | null
  return meta?.content ?? null
}
