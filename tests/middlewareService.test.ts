import { describe, it, expect, beforeEach, vi } from 'vitest'

import { MiddlewareTestService } from '../app/src/core/debug/services/MiddlewareTestService'

function makeResponse(options: {
  ok: boolean
  status: number
  statusText?: string
  json?: unknown
  headers?: Record<string, string>
}) {
  const map = new Map<string, string>(Object.entries(options.headers || {}))
  return {
    ok: options.ok,
    status: options.status,
    statusText: options.statusText || '',
    headers: {
      get: (k: string) => map.get(k) || null,
      entries: () => map.entries(),
    },
    json: async () => options.json,
    text: async () => JSON.stringify(options.json),
  } as unknown as Response
}

describe('MiddlewareTestService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('testAuthMiddleware returns user info when token valid', async () => {
    const svc = MiddlewareTestService.getInstance()
    const fetchMock = vi.fn().mockResolvedValue(
      makeResponse({
        ok: true,
        status: 200,
        json: { id: '00000000-0000-0000-0000-000000000000', email: 'u@example.com', role: 'admin' },
        headers: { 'x-request-id': 'rid-auth' },
      }),
    )
    ;(globalThis as any).fetch = fetchMock as any
    const res = await svc.testAuthMiddleware({ token: 't' })
    expect(res.success).toBe(true)
    expect(res.userInfo?.id).toBeDefined()
    expect(res.meta?.requestId).toBe('rid-auth')
  })

  it('testRateLimitMiddleware collects rate-limit headers and stops on 429', async () => {
    const svc = MiddlewareTestService.getInstance()
    let call = 0
    const fetchMock = vi.fn().mockImplementation(() => {
      call += 1
      if (call === 1)
        return makeResponse({ ok: true, status: 200, json: { status: 'ok' }, headers: { 'x-request-id': 'rid-1', 'x-ratelimit-limit': '60', 'x-ratelimit-remaining': '59', 'x-ratelimit-reset': String(Math.floor(Date.now()/1000)+60) } })
      return makeResponse({ ok: false, status: 429, json: { error: 'TOO_MANY_REQUESTS' }, headers: { 'x-request-id': 'rid-2', 'x-ratelimit-limit': '60', 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(Math.floor(Date.now()/1000)+60) } })
    })
    ;(globalThis as any).fetch = fetchMock as any
    const res = await svc.testRateLimitMiddleware({ requestCount: 5, ip: '1.2.3.4' })
    expect(res.length).toBe(2)
    expect(res[0]!.meta?.rateLimit?.remaining).toBe(59)
    expect(res[1]!.status).toBe(429)
  })
})
