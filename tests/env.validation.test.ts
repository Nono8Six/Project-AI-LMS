import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

async function loadEnvModule() {
  vi.resetModules();
  return await import('../app/src/shared/utils/env.server');
}

const ORIGINAL_ENV = { ...process.env };

describe('env.server - validateServerEnv (production)', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
    delete process.env.RATE_LIMIT_PROVIDER;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.API_MAX_BODY;
    delete process.env.API_RATE_LIMIT_ANON_PER_MIN;
    delete process.env.API_RATE_LIMIT_USER_PER_MIN;
    delete process.env.ORPC_PREFIX;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = { ...ORIGINAL_ENV };
  });

  it('accepts minimal valid production env', async () => {
    const { validateServerEnv } = await loadEnvModule();
    expect(() => validateServerEnv()).not.toThrow();
  });

  it('rejects non-positive numeric envs when provided', async () => {
    const { validateServerEnv } = await loadEnvModule();
    vi.stubEnv('API_MAX_BODY', '0');
    expect(() => validateServerEnv()).toThrow();
    vi.stubEnv('API_MAX_BODY', '-5');
    expect(() => validateServerEnv()).toThrow();
    vi.stubEnv('API_MAX_BODY', '1048576');
    expect(() => validateServerEnv()).not.toThrow();
  });

  it('requires Upstash envs when RATE_LIMIT_PROVIDER=redis', async () => {
    const { validateServerEnv } = await loadEnvModule();
    vi.stubEnv('RATE_LIMIT_PROVIDER', 'redis');
    expect(() => validateServerEnv()).toThrow();
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io');
    expect(() => validateServerEnv()).toThrow();
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token');
    expect(() => validateServerEnv()).not.toThrow();
  });

  it('rejects ORPC_PREFIX without leading slash', async () => {
    const { validateServerEnv } = await loadEnvModule();
    vi.stubEnv('ORPC_PREFIX', 'custom/rpc');
    expect(() => validateServerEnv()).toThrow();
    vi.stubEnv('ORPC_PREFIX', '/custom/rpc');
    expect(() => validateServerEnv()).not.toThrow();
  });

  it('rejects invalid URL formats when set', async () => {
    const { validateServerEnv } = await loadEnvModule();
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'not-a-url');
    expect(() => validateServerEnv()).toThrow();
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:3000/api');
    expect(() => validateServerEnv()).not.toThrow();
  });
});

