import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.generated';
import { PROGRESSIVE_BACKOFF_CONFIG } from '@/shared/constants/api';

const BRUTEFORCE_TABLE = 'auth_bruteforce_attempts';
const RATE_LIMIT_TABLE = 'auth_rate_limit_counters';
const _BRUTEFORCE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes (reserved for future use)

export type BruteForceAnalysis = {
  readonly isSuspicious: boolean;
  readonly riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  readonly failedAttempts: number;
  readonly timeWindow: number;
  readonly lastAttempt: string;
  readonly blockedUntil?: string | null;
};

export type RateLimitResult = {
  readonly allowed: boolean;
  readonly retryAfterSeconds: number;
  readonly remaining: number;
  readonly limit: number;
  readonly resetAtEpochSeconds: number;
};

function nowIso(): string {
  return new Date().toISOString();
}

function riskLevelFromAttempts(attempts: number): BruteForceAnalysis['riskLevel'] {
  if (attempts >= PROGRESSIVE_BACKOFF_CONFIG.thresholds.slice(-1)[0]!) return 'CRITICAL';
  if (attempts >= 10) return 'HIGH';
  if (attempts >= 3) return 'MEDIUM';
  return 'LOW';
}

export async function recordBruteforceFailure(
  client: SupabaseClient<Database>,
  ipAddress: string
): Promise<BruteForceAnalysis> {
  const now = new Date();
  const { data } = await client
    .from(BRUTEFORCE_TABLE)
    .select('*')
    .eq('ip_address', ipAddress)
    .maybeSingle();

  if (data?.blocked_until && Date.parse(data.blocked_until) > now.getTime()) {
    return {
      isSuspicious: true,
      riskLevel: 'CRITICAL',
      failedAttempts: data.failure_count,
      timeWindow: Math.round(
        (Date.parse(data.last_failure_at) - Date.parse(data.first_failure_at)) / (60 * 1000)
      ),
      lastAttempt: data.last_failure_at,
      blockedUntil: data.blocked_until,
    };
  }

  const firstFailureAt = data ? data.first_failure_at : nowIso();
  const failureCount = (data?.failure_count ?? 0) + 1;
  const blockDurations = PROGRESSIVE_BACKOFF_CONFIG.blockDurations;
  const thresholds = PROGRESSIVE_BACKOFF_CONFIG.thresholds;
  let blockedUntil: string | null = null;

  for (let i = thresholds.length - 1; i >= 0; i -= 1) {
    const threshold = thresholds[i]!;
    if (failureCount >= threshold) {
      blockedUntil = new Date(now.getTime() + blockDurations[i]! * 60 * 1000).toISOString();
      break;
    }
  }

  await client.from(BRUTEFORCE_TABLE).upsert({
    ip_address: ipAddress,
    failure_count: failureCount,
    first_failure_at: failureCount === 1 ? nowIso() : firstFailureAt,
    last_failure_at: nowIso(),
    blocked_until: blockedUntil,
  });

  return {
    isSuspicious: failureCount >= 3,
    riskLevel: riskLevelFromAttempts(failureCount),
    failedAttempts: failureCount,
    timeWindow: Math.round(
      (now.getTime() - Date.parse(firstFailureAt)) / (60 * 1000)
    ),
    lastAttempt: nowIso(),
    blockedUntil,
  };
}

export async function clearBruteforceFailures(
  client: SupabaseClient<Database>,
  ipAddress: string
): Promise<void> {
  await client.from(BRUTEFORCE_TABLE).delete().eq('ip_address', ipAddress);
}

export async function isIpBlocked(
  client: SupabaseClient<Database>,
  ipAddress: string
): Promise<boolean> {
  const { data } = await client
    .from(BRUTEFORCE_TABLE)
    .select('blocked_until')
    .eq('ip_address', ipAddress)
    .maybeSingle();
  if (!data?.blocked_until) return false;
  return Date.parse(data.blocked_until) > Date.now();
}

export async function analyzeBruteforce(
  client: SupabaseClient<Database>,
  ipAddress: string
): Promise<BruteForceAnalysis | null> {
  const { data } = await client
    .from(BRUTEFORCE_TABLE)
    .select('*')
    .eq('ip_address', ipAddress)
    .maybeSingle();
  if (!data) return null;
  return {
    isSuspicious: data.failure_count >= 3,
    riskLevel: riskLevelFromAttempts(data.failure_count),
    failedAttempts: data.failure_count,
    timeWindow: Math.round(
      (Date.parse(data.last_failure_at) - Date.parse(data.first_failure_at)) / (60 * 1000)
    ),
    lastAttempt: data.last_failure_at,
    blockedUntil: data.blocked_until,
  };
}

export async function consumeRateLimit(
  client: SupabaseClient<Database>,
  key: string,
  budget: number,
  endpoint: string | null,
  windowMs = 60_000
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStartMs = Math.floor(now / windowMs) * windowMs;
  const windowStartIso = new Date(windowStartMs).toISOString();

  const { data } = await client
    .from(RATE_LIMIT_TABLE)
    .select('requests')
    .eq('key', key)
    .eq('window_start', windowStartIso)
    .maybeSingle();

  if (!data) {
    await client.from(RATE_LIMIT_TABLE).insert({
      key,
      window_start: windowStartIso,
      requests: 1,
      limit_value: budget,
      endpoint,
      updated_at: nowIso(),
    });
    return {
      allowed: true,
      retryAfterSeconds: 0,
      remaining: Math.max(0, budget - 1),
      limit: budget,
      resetAtEpochSeconds: Math.floor((windowStartMs + windowMs) / 1000),
    };
  }

  if (data.requests < budget) {
    await client
      .from(RATE_LIMIT_TABLE)
      .update({
        requests: data.requests + 1,
        limit_value: budget,
        endpoint,
        updated_at: nowIso(),
      })
      .eq('key', key)
      .eq('window_start', windowStartIso);

    return {
      allowed: true,
      retryAfterSeconds: 0,
      remaining: Math.max(0, budget - (data.requests + 1)),
      limit: budget,
      resetAtEpochSeconds: Math.floor((windowStartMs + windowMs) / 1000),
    };
  }

  const msUntilReset = windowMs - (now - windowStartMs);
  await client
    .from(RATE_LIMIT_TABLE)
    .update({ limit_value: budget, endpoint, updated_at: nowIso() })
    .eq('key', key)
    .eq('window_start', windowStartIso);

  return {
    allowed: false,
    retryAfterSeconds: Math.ceil(msUntilReset / 1000),
    remaining: 0,
    limit: budget,
    resetAtEpochSeconds: Math.floor((windowStartMs + windowMs) / 1000),
  };
}

export async function cleanupRateLimitEntries(
  client: SupabaseClient<Database>,
  olderThanMs = 60 * 60 * 1000
): Promise<void> {
  const thresholdIso = new Date(Date.now() - olderThanMs).toISOString();
  await client
    .from(RATE_LIMIT_TABLE)
    .delete()
    .lt('window_start', thresholdIso);
}
