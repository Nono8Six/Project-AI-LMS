import { describe, it, expect, beforeEach, vi } from 'vitest'

import { EndpointTestService } from '../app/src/core/debug/services/EndpointTestService'

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

describe('EndpointTestService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('calls endpoint and returns structured result with requestId and rate-limit when present', async () => {
    const svc = EndpointTestService.getInstance()
    const ep = svc.availableEndpoints[0]!

    const fetchMock = vi.fn().mockResolvedValue(
      makeResponse({
        ok: true,
        status: 200,
        json: { status: 'ok' },
        headers: {
          'x-request-id': 'rid-1',
          'x-ratelimit-limit': '60',
          'x-ratelimit-remaining': '59',
          'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 60),
        },
      }),
    )

    ;(globalThis as any).fetch = fetchMock as any

    const res = await svc.testEndpoint({ endpoint: ep, headers: { 'user-agent': 'vitest' }, body: {} })
    expect(res.success).toBe(true)
    expect(res.status).toBe(200)
    expect(res.meta?.requestId).toBe('rid-1')
    expect(res.meta?.rateLimit?.limit).toBe(60)
    expect(fetchMock).toHaveBeenCalled()
  })
})
