import { describe, expect, it, vi, afterEach } from 'vitest';
import { validateServerEnv } from '@/shared/utils/env.server';

const BASE_ENV = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_APP_URL: 'https://example.com',
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
  SUPABASE_SERVICE_ROLE_KEY: 's'.repeat(32),
  SUPABASE_JWT_SECRET: 'j'.repeat(32),
  SUPABASE_PROJECT_REF: 'abcd123456abcd123456',
  SUPABASE_DATABASE_PASSWORD: 'p'.repeat(16),
  SUPABASE_ACCESS_TOKEN: 'sbp_'.padEnd(24, 'x'),
};

describe('validateServerEnv', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('success when critical environment variables are set', () => {
    vi.stubGlobal('process', { env: { ...BASE_ENV } } as any);
    expect(() => validateServerEnv()).not.toThrow();
  });

  it('throws if SUPABASE_SERVICE_ROLE_KEY is missing', () => {
    vi.stubGlobal('process', { env: { ...BASE_ENV, SUPABASE_SERVICE_ROLE_KEY: undefined } } as any);
    expect(() => validateServerEnv()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it('throws if NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
    vi.stubGlobal('process', { env: { ...BASE_ENV, NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined } } as any);
    expect(() => validateServerEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it('throws when SUPABASE_PROJECT_REF format is invalid', () => {
    vi.stubGlobal('process', { env: { ...BASE_ENV, SUPABASE_PROJECT_REF: ' invalid-ref ' } } as any);
    expect(() => validateServerEnv()).toThrow(/SUPABASE_PROJECT_REF/);
  });
});
