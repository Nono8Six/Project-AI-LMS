import { beforeEach, describe, expect, it, vi } from 'vitest';

async function loadStore() {
  const module = await import('@/orpc/server/observability/store');
  return module.observabilityStore;
}

describe('ObservabilityStore rate limit classification', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('classifies auth user keys as user buckets', async () => {
    const store = await loadStore();
    store.updateRateLimit('auth:auth.login:user:1234567890', 10, 9, 1_700_000_000);

    const { rateLimitBuckets } = store.getRecent({ limit: 1 });
    const bucket = rateLimitBuckets[0];

    expect(bucket?.type).toBe('user');
    expect(bucket?.key).toBe('auth:auth.login:user:1234***90');
  });

  it('classifies auth ip keys as ip buckets and masks the identifier', async () => {
    const store = await loadStore();
    store.updateRateLimit('auth:auth.refresh:ip:203.0.113.42', 5, 4, 1_700_000_100);

    const { rateLimitBuckets } = store.getRecent({ limit: 1 });
    const bucket = rateLimitBuckets[0];

    expect(bucket?.type).toBe('ip');
    expect(bucket?.key).toBe('auth:auth.refresh:ip:203.0.113.x');
  });

  it('classifies anonymous auth keys correctly', async () => {
    const store = await loadStore();
    store.updateRateLimit('auth:auth.signup:anonymous', 3, 0, 1_700_000_200);

    const { rateLimitBuckets } = store.getRecent({ limit: 1 });
    const bucket = rateLimitBuckets[0];

    expect(bucket?.type).toBe('anonymous');
    expect(bucket?.key).toBe('auth:auth.signup:anonymous');
  });
});
