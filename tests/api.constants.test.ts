import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Dynamic import to ensure it reads current process.env on each test
async function loadConstants() {
  // Reset module graph so env-dependent module is re-evaluated
  vi.resetModules();
  return (await import('../app/src/shared/constants/api')) as typeof import('../app/src/shared/constants/api');
}

const ORIGINAL_ENV = { ...process.env };

describe('API constants derivation', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.ORPC_PREFIX;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.API_MAX_BODY;
    delete process.env.API_RATE_LIMIT_ANON_PER_MIN;
    delete process.env.API_RATE_LIMIT_USER_PER_MIN;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('falls back to /api/rpc when nothing is set', async () => {
    const { ORPC_PREFIX, API_CONSTANTS } = await loadConstants();
    expect(ORPC_PREFIX).toBe('/api/rpc');
    expect(API_CONSTANTS.prefix).toBe('/api/rpc');
  });

  it('derives prefix from NEXT_PUBLIC_API_BASE_URL', async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3000/api';
    const { ORPC_PREFIX } = await loadConstants();
    expect(ORPC_PREFIX).toBe('/api/rpc');
  });

  it('uses explicit ORPC_PREFIX when provided', async () => {
    process.env.ORPC_PREFIX = 'custom/rpc';
    const { ORPC_PREFIX } = await loadConstants();
    expect(ORPC_PREFIX).toBe('/custom/rpc');
  });

  it('parses numeric limits with fallbacks', async () => {
    process.env.API_MAX_BODY = '262144';
    process.env.API_RATE_LIMIT_ANON_PER_MIN = '10';
    process.env.API_RATE_LIMIT_USER_PER_MIN = '20';
    const { MAX_BODY_SIZE, RATE_LIMITS } = await loadConstants();
    expect(MAX_BODY_SIZE).toBe(262144);
    expect(RATE_LIMITS.anonymousPerMin).toBe(10);
    expect(RATE_LIMITS.userPerMin).toBe(20);
  });

  it('guards invalid numeric envs', async () => {
    process.env.API_MAX_BODY = '-5';
    process.env.API_RATE_LIMIT_ANON_PER_MIN = 'NaN';
    process.env.API_RATE_LIMIT_USER_PER_MIN = '0';
    const { MAX_BODY_SIZE, RATE_LIMITS } = await loadConstants();
    expect(MAX_BODY_SIZE).toBe(1_048_576);
    expect(RATE_LIMITS.anonymousPerMin).toBe(60);
    expect(RATE_LIMITS.userPerMin).toBe(120);
  });
});
