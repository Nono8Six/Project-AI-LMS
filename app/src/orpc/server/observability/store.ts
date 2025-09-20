import { EventEmitter } from 'node:events';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface PerformanceMetric {
  readonly endpoint: string;
  readonly method: string;
  readonly status: number;
  readonly duration: number;
  readonly timestamp: number;
  readonly requestId: string;
}

interface LogEntry {
  readonly kind: LogLevel;
  readonly requestId: string;
  readonly message: string;
  readonly timestamp: number;
  readonly time?: string;
  readonly meta?: Record<string, unknown>;
}

interface RateLimitBucket {
  readonly key: string;
  readonly type: 'ip' | 'user' | 'anonymous';
  readonly limit: number;
  readonly remaining: number;
  readonly reset: number;
  readonly lastActivity: number;
  readonly requests?: number;
}

type MetricEntry = PerformanceMetric;
type LogItem = LogEntry;

const MAX_LOGS = 1000;
const MAX_METRICS = 500;

function maskIp(ip: string | null | undefined): string {
  if (!ip) return 'unknown';
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
  }
  if (ip.includes(':')) {
    const segments = ip.split(':').filter(Boolean);
    if (segments.length >= 2) return `${segments[0]}:${segments[1]}::xxxx`;
    if (segments.length === 1) return `${segments[0]}::xxxx`;
    return 'ipv6::xxxx';
  }
  return 'unknown';
}

function maskUserId(userId: string | null | undefined): string {
  if (!userId) return 'unknown';
  const trimmed = userId.trim();
  if (trimmed.length <= 8) return trimmed;
  return `${trimmed.slice(0, 4)}***${trimmed.slice(-2)}`;
}

type RateLimitScope = 'auth' | 'global' | 'legacy' | 'unknown';

interface ParsedRateLimitKey {
  readonly raw: string;
  readonly scope: RateLimitScope;
  readonly type: 'ip' | 'user' | 'anonymous';
  readonly endpoint?: string;
  readonly identifier?: string;
}

function parseRateLimitKey(key: string): ParsedRateLimitKey {
  const raw = key ?? '';
  const trimmed = raw.trim();
  if (!trimmed) {
    return { raw, scope: 'unknown', type: 'anonymous' };
  }

  if (trimmed === 'anonymous') {
    return { raw, scope: 'global', type: 'anonymous' };
  }

  if (trimmed.startsWith('auth:')) {
    const withoutPrefix = trimmed.slice('auth:'.length);
    const firstSep = withoutPrefix.indexOf(':');
    const endpoint = firstSep === -1 ? withoutPrefix : withoutPrefix.slice(0, firstSep);
    const remainder = firstSep === -1 ? '' : withoutPrefix.slice(firstSep + 1);

    if (!remainder) {
      return { raw, scope: 'auth', type: 'anonymous', endpoint };
    }

    if (remainder.startsWith('user:')) {
      return {
        raw,
        scope: 'auth',
        type: 'user',
        endpoint,
        identifier: remainder.slice('user:'.length),
      };
    }

    if (remainder.startsWith('ip:')) {
      return {
        raw,
        scope: 'auth',
        type: 'ip',
        endpoint,
        identifier: remainder.slice('ip:'.length),
      };
    }

    if (remainder === 'anonymous') {
      return { raw, scope: 'auth', type: 'anonymous', endpoint };
    }

    return { raw, scope: 'auth', type: 'anonymous', endpoint };
  }

  if (trimmed.startsWith('user:')) {
    return {
      raw,
      scope: 'global',
      type: 'user',
      identifier: trimmed.slice('user:'.length),
    };
  }

  if (trimmed.startsWith('ip:')) {
    return {
      raw,
      scope: 'global',
      type: 'ip',
      identifier: trimmed.slice('ip:'.length),
    };
  }

  if (trimmed.startsWith('user_')) {
    return {
      raw,
      scope: 'legacy',
      type: 'user',
      identifier: trimmed.slice('user_'.length),
    };
  }

  if (trimmed === 'unknown') {
    return { raw, scope: 'legacy', type: 'anonymous' };
  }

  if (trimmed.includes('.') || trimmed.includes(':')) {
    return { raw, scope: 'legacy', type: 'ip', identifier: trimmed };
  }

  return { raw, scope: 'legacy', type: 'user', identifier: trimmed };
}

function formatRateLimitKey(parsed: ParsedRateLimitKey): string {
  const endpoint = parsed.endpoint && parsed.endpoint.length > 0 ? parsed.endpoint : 'unknown';

  if (parsed.type === 'anonymous') {
    return parsed.scope === 'auth' ? `auth:${endpoint}:anonymous` : 'anonymous';
  }

  const identifier = parsed.type === 'ip'
    ? maskIp(parsed.identifier)
    : maskUserId(parsed.identifier);

  if (parsed.scope === 'auth') {
    return `auth:${endpoint}:${parsed.type}:${identifier}`;
  }

  return `${parsed.type}:${identifier}`;
}

class ObservabilityStore {
  private logs: LogItem[] = [];
  private metrics: MetricEntry[] = [];
  private rateLimitByKey: Map<string, RateLimitBucket> = new Map();
  private emitter = new EventEmitter();

  addMetric(entry: Omit<MetricEntry, 'requestId'> & { requestId: string }): void {
    this.metrics.push(entry);
    if (this.metrics.length > MAX_METRICS) this.metrics = this.metrics.slice(-MAX_METRICS);
    this.emitter.emit('metric', entry);
  }

  addLog(entry: Omit<LogItem, 'timestamp' | 'time'> & { time?: string; meta?: Record<string, unknown> }): void {
    const now = Date.now();
    const item: LogItem = {
      kind: entry.kind,
      requestId: entry.requestId,
      message: entry.message,
      time: entry.time ?? new Date(now).toISOString(),
      timestamp: now,
    };
    if (typeof entry.meta !== 'undefined') {
      (item as unknown as { meta?: Record<string, unknown> }).meta = entry.meta;
    }
    this.logs.push(item);
    if (this.logs.length > MAX_LOGS) this.logs = this.logs.slice(-MAX_LOGS);
    this.emitter.emit('log', item);
  }

  updateRateLimit(key: string, limit: number, remaining: number, reset: number): void {
    const parsed = parseRateLimitKey(key);
    const normalizedKey = formatRateLimitKey(parsed);
    const previous = this.rateLimitByKey.get(normalizedKey);

    const bucket: RateLimitBucket = {
      key: normalizedKey,
      type: parsed.type,
      limit,
      remaining,
      reset,
      lastActivity: Date.now(),
      requests: (previous?.requests ?? 0) + 1,
    };
    this.rateLimitByKey.set(normalizedKey, bucket);
    this.emitter.emit('ratelimit', bucket);
  }

  getRecent(options?: { limit?: number }) {
    const limit = Math.max(1, Math.min(200, options?.limit ?? 50));
    return {
      logs: this.logs.slice(-limit).reverse(),
      metrics: this.metrics.slice(-limit).reverse(),
      rateLimitBuckets: Array.from(this.rateLimitByKey.values()).slice(-limit).reverse(),
    };
  }

  getStats(timeWindowMinutes = 15) {
    const cutoff = Date.now() - timeWindowMinutes * 60_000;
    const recent = this.metrics.filter((m) => m.timestamp >= cutoff);
    const total = recent.length;
    const successes = recent.filter((m) => m.status < 400).length;
    const errors = total - successes;
    const avg = total ? recent.reduce((s, m) => s + m.duration, 0) / total : 0;
    const p = (n: number) => (total ? Math.round((n / total) * 10000) / 100 : 0);
    const p95Index = Math.floor(total * 0.95);
    const p99Index = Math.floor(total * 0.99);
    const sorted = [...recent].sort((a, b) => a.duration - b.duration);
    return {
      totalRequests: total,
      successRate: p(successes),
      errorRate: p(errors),
      avgDuration: Math.round(avg * 100) / 100,
      p95Duration: sorted[p95Index]?.duration ?? 0,
      p99Duration: sorted[p99Index]?.duration ?? 0,
    };
  }

  // Convenience to capture from context/meta
  recordFromContext(params: {
    requestId: string;
    endpoint: string;
    method: string;
    status: number;
    durationMs: number;
    ip: string | null;
    rateLimit?: { limit: number; remaining: number; reset: number };
    userId?: string | null;
    rateLimitKey?: string;
  }): void {
    const { requestId, endpoint, method, status, durationMs, ip, rateLimit } = params;
    this.addMetric({
      endpoint,
      method,
      status,
      duration: durationMs,
      timestamp: Date.now(),
      requestId,
    });

    this.addLog({
      kind: status < 400 ? 'info' : status === 429 ? 'warn' : 'error',
      requestId,
      message: `${method} ${endpoint} → ${status} in ${Math.round(durationMs)}ms`,
      meta: {
        ip: maskIp(ip),
        ...(rateLimit
          ? { rateLimit: { limit: rateLimit.limit, remaining: rateLimit.remaining, reset: rateLimit.reset } }
          : {}),
      },
    });

    if (rateLimit) {
      const rateKey = params.rateLimitKey
        ?? (params.userId
          ? `user:${params.userId}`
          : ip
            ? `ip:${ip}`
            : 'anonymous');
      this.updateRateLimit(rateKey, rateLimit.limit, rateLimit.remaining, rateLimit.reset);
    }
  }

  on(event: 'metric' | 'log' | 'ratelimit', listener: (data: unknown) => void) {
    this.emitter.on(event, listener);
  }
  off(event: 'metric' | 'log' | 'ratelimit', listener: (data: unknown) => void) {
    this.emitter.off(event, listener);
  }
}

export const observabilityStore = new ObservabilityStore();