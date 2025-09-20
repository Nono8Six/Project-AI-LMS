import { beforeAll, afterEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import {
  createSupabaseAdminClient,
  getSupabaseEnvConfig,
  hasSupabaseAdminConfig,
} from '@/shared/lib/supabase';
import type { SupabaseAdminClient } from '@/shared/lib/supabase';
import {
  recordBruteforceFailure,
  clearBruteforceFailures,
  analyzeBruteforce,
  consumeRateLimit,
  cleanupRateLimitEntries,
} from '@/shared/services/security.service';

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

const missingEnv = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
const SKIP_MESSAGE = `Tests rate limiting ignorés – variables manquantes : ${missingEnv.join(', ')}`;

function uniqueIp() {
  const rand = randomUUID().split('-')[0];
  return `203.0.113.${rand.slice(0, 2)}`;
}

if (!hasSupabaseAdminConfig() || missingEnv.length) {
  describe.skip('Rate limiting persistant', () => {
    it(SKIP_MESSAGE, () => {
      expect(true).toBe(true);
    });
  });
} else {
  const envConfig = getSupabaseEnvConfig();
  const admin: SupabaseAdminClient = createSupabaseAdminClient(envConfig);

  beforeAll(async () => {
    const { error } = await admin.from('auth_rate_limit_counters').select('key').limit(1);
    if (error) {
      throw new Error(`Supabase indisponible pour les tests: ${error.message}`);
    }
  });

  afterEach(async () => {
    await admin.from('auth_bruteforce_attempts').delete().neq('ip_address', '');
    await admin.from('auth_rate_limit_counters').delete().neq('key', '');
  });

  describe('Rate limiting persistant', () => {
    it('persiste les tentatives brute force et bloque après redémarrage simulé', async () => {
      const ip = uniqueIp();

      let analysis = await recordBruteforceFailure(admin, ip);
      expect(analysis.failedAttempts).toBe(1);
      expect(analysis.isSuspicious).toBe(false);

      analysis = await recordBruteforceFailure(admin, ip);
      expect(analysis.failedAttempts).toBe(2);

      analysis = await recordBruteforceFailure(admin, ip);
      expect(analysis.failedAttempts).toBe(3);
      expect(analysis.isSuspicious).toBe(true);

      // Simule un redémarrage : nouvelle requête après lecture directe en base
      const dbRow = await admin
        .from('auth_bruteforce_attempts')
        .select('failure_count, blocked_until')
        .eq('ip_address', ip)
        .single();
      expect(dbRow.data?.failure_count).toBe(3);

      const analysisAfter = await analyzeBruteforce(admin, ip);
      expect(analysisAfter?.failedAttempts).toBe(3);

      await clearBruteforceFailures(admin, ip);
      const { data: cleared } = await admin
        .from('auth_bruteforce_attempts')
        .select('ip_address')
        .eq('ip_address', ip)
        .maybeSingle();
      expect(cleared).toBeNull();
    });

    it('persiste les compteurs de rate limit sur plusieurs appels', async () => {
      const key = `user:${randomUUID()}`;
      const endpoint = 'auth.signin';

      const first = await consumeRateLimit(admin, key, 2, endpoint);
      expect(first.allowed).toBe(true);
      expect(first.remaining).toBe(1);

      const second = await consumeRateLimit(admin, key, 2, endpoint);
      expect(second.allowed).toBe(true);
      expect(second.remaining).toBe(0);

      const third = await consumeRateLimit(admin, key, 2, endpoint);
      expect(third.allowed).toBe(false);
      expect(third.retryAfterSeconds).toBeGreaterThanOrEqual(0);

      await cleanupRateLimitEntries(admin, 0);
      const { data: remaining } = await admin
        .from('auth_rate_limit_counters')
        .select('key')
        .eq('key', key);
      expect(remaining).toHaveLength(0);
    });
  });
}
