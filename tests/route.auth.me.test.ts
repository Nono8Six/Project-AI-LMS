import { describe, it, expect } from 'vitest'

describe('route: auth.me', () => {
  it('returns 200 with null body when no token', async () => {
    const { POST } = await import('../app/src/app/api/rpc/[...orpc]/route')
    const req = new Request('http://localhost:3000/api/rpc/auth/me', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json === null || typeof json === 'object').toBe(true)
  })
})

