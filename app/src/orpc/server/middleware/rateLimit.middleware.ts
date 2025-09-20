import type { AppContext } from '../context';
import { ORPCError } from '@orpc/client';
import { AUTH_ACTION_RATE_LIMITS } from '@/shared/constants/api';
import { consumeRateLimit, cleanupRateLimitEntries } from '@/shared/services/security.service';
import { AuditService } from '@/shared/services/audit.service';

// Compteur déterministe pour le nettoyage périodique
let cleanupCallCounter = 0;
const CLEANUP_INTERVAL = 100; // Nettoyage tous les 100 appels

function getAuthActionType(endpoint?: string): keyof typeof AUTH_ACTION_RATE_LIMITS | null {
  if (!endpoint) return null;
  const authActionMap: Record<string, keyof typeof AUTH_ACTION_RATE_LIMITS> = {
    'auth.signup': 'signup',
    'auth.signin': 'login',
    'auth.login': 'login',
    'auth.logout': 'logout',
    'auth.refresh': 'refresh',
    'auth.resetPassword': 'passwordReset',
    'auth.forgotPassword': 'passwordReset',
  };
  return authActionMap[endpoint] || null;
}

function isExemptIP(ip: string | null, exemptIPs: string[]): boolean {
  if (!ip) return false;
  return exemptIPs.includes(ip) || exemptIPs.includes('*');
}

function buildRateLimitKey(userId: string | null, ip: string | null, endpoint: string | undefined): string {
  if (endpoint) {
    if (userId) return `auth:${endpoint}:user:${userId}`;
    if (ip) return `auth:${endpoint}:ip:${ip}`;
    return `auth:${endpoint}:anonymous`;
  }

  if (userId) return `user:${userId}`;
  if (ip) return `ip:${ip}`;
  return 'anonymous';
}

export async function enforceRateLimit(ctx: AppContext): Promise<void> {
  const userId = ctx.user?.id ?? null;
  const ip = ctx.meta.ip;
  const endpoint = ctx.meta.endpoint;
  const { rateLimits } = ctx.config;
  const adminClient = ctx.supabase.getAdminClient();

  if (ip && isExemptIP(ip, rateLimits.exemptIPs)) {
    ctx.logger.debug('IP exempted from rate limiting', { ip, endpoint });
    return;
  }

  const authActionType = getAuthActionType(endpoint);
  const budget = authActionType
    ? rateLimits.authActions[authActionType]
    : userId
      ? rateLimits.userPerMin
      : rateLimits.anonymousPerMin;

  const key = buildRateLimitKey(userId, ip, endpoint);
  ctx.meta.rateLimitKey = key;

  // Nettoyage déterministe tous les CLEANUP_INTERVAL appels
  cleanupCallCounter++;
  if (cleanupCallCounter >= CLEANUP_INTERVAL) {
    cleanupCallCounter = 0;
    await cleanupRateLimitEntries(adminClient);
    ctx.logger.debug('Rate limit cleanup executed', {
      interval: CLEANUP_INTERVAL,
      endpoint
    });
  }

  const result = await consumeRateLimit(adminClient, key, budget, endpoint ?? null);

  ctx.meta.rateLimit = {
    limit: result.limit,
    remaining: result.remaining,
    reset: result.resetAtEpochSeconds,
  };

  if (!result.allowed) {
    ctx.logger.warn('Rate limited', {
      key,
      budget,
      endpoint,
      authActionType,
      retryAfterSeconds: result.retryAfterSeconds,
    });

    ctx.meta.rateLimitRetryAfter = result.retryAfterSeconds;

    if (authActionType) {
      const auditContext = AuditService.createContext(
        ctx.meta.requestId,
        ip || undefined,
        ctx.headers['user-agent'] || undefined,
        userId || undefined
      );

      await AuditService.logSecurity(
        adminClient,
        'security.rate_limit_exceeded',
        {
          ...auditContext,
          riskLevel: 'HIGH',
          threatType: 'rate_limit',
        },
        ctx.logger
      );
    }

    throw new ORPCError('TOO_MANY_REQUESTS');
  }
}
