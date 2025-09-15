import { describe, it, expect } from 'vitest';
import { enforceRateLimit } from '../app/src/orpc/server/middleware/rateLimit.middleware';
import { API_CONSTANTS } from '../app/src/shared/constants/api';

function baseCtx(userId?: string, ip?: string) {
  return {
    meta: { requestId: 'r-1', receivedAt: new Date().toISOString(), ip: ip ?? '127.0.0.1', userAgent: 'vitest' },
    headers: {},
    logger: { level: 'error', debug() {}, info() {}, warn() {}, error() {} },
    config: API_CONSTANTS,
    supabase: { userClient: undefined, getAdminClient: () => { throw new Error('not used'); } },
    user: userId ? { id: userId, email: null, role: null } : null,
  } as const;
}

describe('rate limiter (memory, fixed window)', () => {
  it('allows under budget and blocks when exceeded (anonymous)', async () => {
    const ctx: any = baseCtx(undefined, '10.0.0.1');
    const budget = ctx.config.rateLimits.anonymousPerMin;
    for (let i = 0; i < budget; i++) await enforceRateLimit(ctx);
    await expect(enforceRateLimit(ctx)).rejects.toThrowError();
  });

  it('separates keys for user vs anonymous', async () => {
    const anon: any = baseCtx(undefined, '10.0.0.2');
    const user: any = baseCtx('user-1', '10.0.0.2');
    for (let i = 0; i < anon.config.rateLimits.anonymousPerMin; i++) await enforceRateLimit(anon);
    // user still has its own budget
    for (let i = 0; i < user.config.rateLimits.userPerMin; i++) await enforceRateLimit(user);
    await expect(enforceRateLimit(anon)).rejects.toThrowError();
    await expect(enforceRateLimit(user)).rejects.toThrowError();
  });
});
