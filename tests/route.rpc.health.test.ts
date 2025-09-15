import { describe, it, expect } from 'vitest'

// Import the Next.js route handler directly
import { POST } from '../app/src/app/api/rpc/[...orpc]/route'

describe('route: /api/rpc/system/health', () => {
  it('responds with ok status and JSON body', async () => {
    const req = new Request('http://localhost:3000/api/rpc/system/health', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    const payload = (body && typeof body === 'object' && 'status' in body)
      ? (body as any)
      : ((body && typeof body === 'object' && 'json' in body) ? (body as any).json : body)
    expect(payload).toHaveProperty('status', 'ok')
    expect(typeof (payload as any).time).toBe('string')
    expect(typeof (payload as any).version).toBe('string')
    // x-request-id is always propagated
    expect(res.headers.get('x-request-id')).toBeTruthy()
  })
})
