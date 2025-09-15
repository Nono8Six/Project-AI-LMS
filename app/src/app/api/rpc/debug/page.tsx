import { API_CONSTANTS } from '@/shared/constants/api'

export const dynamic = 'force-dynamic'

async function callHealth() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const target = appUrl
      ? new URL(`${API_CONSTANTS.prefix}/system/health`, appUrl).toString()
      : `${API_CONSTANTS.prefix}/system/health`;
    const res = await fetch(target, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'content-type': 'application/json' },
    })
    const retryAfter = res.headers.get('retry-after')
    const rl = {
      limit: res.headers.get('x-ratelimit-limit'),
      remaining: res.headers.get('x-ratelimit-remaining'),
      reset: res.headers.get('x-ratelimit-reset'),
    }
    const reqId = res.headers.get('x-request-id')
    let body: unknown = null
    try {
      body = await res.json()
    } catch {
      body = await res.text()
    }
    return { ok: res.ok, status: res.status, retryAfter, rl, reqId, body }
  } catch (e) {
    return { ok: false, status: 0, retryAfter: null, rl: null, reqId: null, body: String((e as Error)?.message || e) }
  }
}

export default async function DebugPage() {
  const health = await callHealth()
  const env = {
    PREFIX: API_CONSTANTS.prefix,
    RATE_LIMIT_PROVIDER: process.env.RATE_LIMIT_PROVIDER,
    API_RATE_LIMIT_ANON_PER_MIN: process.env.API_RATE_LIMIT_ANON_PER_MIN,
    API_RATE_LIMIT_USER_PER_MIN: process.env.API_RATE_LIMIT_USER_PER_MIN,
    CSP_USE_NONCE: process.env.CSP_USE_NONCE,
    CSP_REPORT_ONLY: process.env.CSP_REPORT_ONLY,
    CSP_ALLOW_INLINE_STYLE: process.env.CSP_ALLOW_INLINE_STYLE,
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <h1 className="text-lg font-semibold">oRPC Debug</h1>
      <div className="mt-4">
        <h2 className="font-medium">Derived Config</h2>
        <pre className="text-sm mt-2 whitespace-pre-wrap">{JSON.stringify(env, null, 2)}</pre>
      </div>
      <div className="mt-6">
        <h2 className="font-medium">Health Call (/api/rpc/system/health)</h2>
        <pre className="text-sm mt-2 whitespace-pre-wrap">{JSON.stringify(health, null, 2)}</pre>
      </div>
    </div>
  )
}
