import { RPCHandler } from '@orpc/server/fetch'
import { appRouter, fetchPlugins } from '@/orpc/server/router'
import { buildContext } from '@/orpc/server/context'
import { observabilityStore } from '@/orpc/server/observability/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Single RPC handler instance (stateless) reused per invocation
const handler = new RPCHandler(appRouter, { plugins: fetchPlugins })

function getIp(req: Request): string | null {
  const xfwd = req.headers.get('x-forwarded-for')
  if (!xfwd) return null
  const first = xfwd.split(',')[0]?.trim()
  return first && first.length > 0 ? first : null
}

async function handleRPC(request: Request): Promise<Response> {
  const context = buildContext({ headers: request.headers, ip: getIp(request) })
  const started = performance.now()

  // Use the physical route prefix here to match Next.js rewritten requests
  const result = await handler.handle(request, {
    prefix: '/api/rpc' satisfies `/${string}`,
    context,
  })

  if (!result.matched || !result.response) {
    const notFound = new Response('Not Found', { status: 404 })
    notFound.headers.set('x-request-id', context.meta.requestId)
    return notFound
  }

  const res = result.response
  // Always propagate x-request-id
  try {
    res.headers.set('x-request-id', context.meta.requestId)
  } catch {
    /* ignore headers set errors (locked response) */
  }

  // Propagate standard rate limit headers if present
  const rl = context.meta.rateLimit
  if (rl) {
    try {
      res.headers.set('x-ratelimit-limit', String(rl.limit))
      res.headers.set('x-ratelimit-remaining', String(rl.remaining))
      res.headers.set('x-ratelimit-reset', String(rl.reset))
    } catch {
      /* ignore */
    }
  }

  // If rate-limited and handler didn't set retry-after, propagate from context
  if (res.status === 429 && !res.headers.get('retry-after')) {
    const retry = context.meta.rateLimitRetryAfter
    if (typeof retry === 'number' && Number.isFinite(retry) && retry > 0) {
      try {
        res.headers.set('retry-after', String(retry))
      } catch {
        /* ignore */
      }
    }
  }

  // Record observability metric/log for this request
  try {
    const duration = performance.now() - started
    const url = new URL(request.url)
    const endpoint = url.pathname
    observabilityStore.recordFromContext({
      requestId: context.meta.requestId,
      endpoint,
      method: request.method,
      status: res.status,
      durationMs: duration,
      ip: context.meta.ip,
      ...(rl ? { rateLimit: { limit: rl.limit, remaining: rl.remaining, reset: rl.reset } } : {}),
      ...(context.user?.id ? { userId: context.user.id } : {}),
    })
  } catch {
    // non-fatal
  }

  return res
}

export async function POST(request: Request) {
  return handleRPC(request)
}

// Optional: respond to preflight if needed by callers
export function OPTIONS() {
  return new Response(null, { status: 204 })
}
