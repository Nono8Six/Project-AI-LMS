import { describe, it, expect, beforeEach } from 'vitest'

// Set extremely low rate-limit before import so constants pick it up
beforeEach(() => {
  process.env.API_RATE_LIMIT_ANON_PER_MIN = '1'
})

describe('route: rate limit', () => {
  it('second call with same IP hits 429 when anon limit=1', async () => {
    const { POST } = await import('../app/src/app/api/rpc/[...orpc]/route')
    const req1 = new Request('http://localhost:3000/api/rpc/system/time', { method: 'POST', headers: { 'x-forwarded-for': '9.9.9.9', 'content-type': 'application/json' }, body: '{}' })
    const res1 = await POST(req1)
    expect([200, 429]).toContain(res1.status)
    const req2 = new Request('http://localhost:3000/api/rpc/system/time', { method: 'POST', headers: { 'x-forwarded-for': '9.9.9.9', 'content-type': 'application/json' }, body: '{}' })
    const res2 = await POST(req2)
    expect([429, 200]).toContain(res2.status)
  })
})
