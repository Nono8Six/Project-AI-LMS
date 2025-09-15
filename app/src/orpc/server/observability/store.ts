import type { PerformanceMetric, LogEntry, RateLimitBucket } from '@/shared/types/debug.types'
import { EventEmitter } from 'node:events'

type MetricEntry = PerformanceMetric
type LogItem = LogEntry

const MAX_LOGS = 1000
const MAX_METRICS = 500

function maskIp(ip: string | null): string {
  if (!ip) return 'unknown'
  const parts = ip.split('.')
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.x`
  return ip
}

class ObservabilityStore {
  private logs: LogItem[] = []
  private metrics: MetricEntry[] = []
  private rateLimitByKey: Map<string, RateLimitBucket> = new Map()
  private emitter = new EventEmitter()

  addMetric(entry: Omit<MetricEntry, 'requestId'> & { requestId: string }): void {
    this.metrics.push(entry)
    if (this.metrics.length > MAX_METRICS) this.metrics = this.metrics.slice(-MAX_METRICS)
    this.emitter.emit('metric', entry)
  }

  addLog(entry: Omit<LogItem, 'timestamp' | 'time'> & { time?: string; meta?: Record<string, unknown> }): void {
    const now = Date.now()
    const item: LogItem = {
      kind: entry.kind,
      requestId: entry.requestId,
      message: entry.message,
      time: entry.time ?? new Date(now).toISOString(),
      timestamp: now,
    }
    if (typeof entry.meta !== 'undefined') {
      ;(item as unknown as { meta?: Record<string, unknown> }).meta = entry.meta
    }
    this.logs.push(item)
    if (this.logs.length > MAX_LOGS) this.logs = this.logs.slice(-MAX_LOGS)
    this.emitter.emit('log', item)
  }

  updateRateLimit(key: string, limit: number, remaining: number, reset: number): void {
    const bucket: RateLimitBucket = {
      key,
      type: key.startsWith('user_') ? 'user' : key === 'unknown' ? 'anonymous' : 'ip',
      limit,
      remaining,
      reset,
      lastActivity: Date.now(),
      requests: (this.rateLimitByKey.get(key)?.requests ?? 0) + 1,
    }
    this.rateLimitByKey.set(key, bucket)
    this.emitter.emit('ratelimit', bucket)
  }

  getRecent(options?: { limit?: number }) {
    const limit = Math.max(1, Math.min(200, options?.limit ?? 50))
    return {
      logs: this.logs.slice(-limit).reverse(),
      metrics: this.metrics.slice(-limit).reverse(),
      rateLimitBuckets: Array.from(this.rateLimitByKey.values()).slice(-limit).reverse(),
    }
  }

  getStats(timeWindowMinutes = 15) {
    const cutoff = Date.now() - timeWindowMinutes * 60_000
    const recent = this.metrics.filter((m) => m.timestamp >= cutoff)
    const total = recent.length
    const successes = recent.filter((m) => m.status < 400).length
    const errors = total - successes
    const avg = total ? recent.reduce((s, m) => s + m.duration, 0) / total : 0
    const p = (n: number) => (total ? Math.round((n / total) * 10000) / 100 : 0)
    const p95Index = Math.floor(total * 0.95)
    const p99Index = Math.floor(total * 0.99)
    const sorted = [...recent].sort((a, b) => a.duration - b.duration)
    return {
      totalRequests: total,
      successRate: p(successes),
      errorRate: p(errors),
      avgDuration: Math.round(avg * 100) / 100,
      p95Duration: sorted[p95Index]?.duration ?? 0,
      p99Duration: sorted[p99Index]?.duration ?? 0,
    }
  }

  // Convenience to capture from context/meta
  recordFromContext(params: {
    requestId: string
    endpoint: string
    method: string
    status: number
    durationMs: number
    ip: string | null
    rateLimit?: { limit: number; remaining: number; reset: number }
    userId?: string | null
  }): void {
    const { requestId, endpoint, method, status, durationMs, ip, rateLimit } = params
    this.addMetric({
      endpoint,
      method,
      status,
      duration: durationMs,
      timestamp: Date.now(),
      requestId,
    })

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
    })

    if (rateLimit) {
      // Key based on IP only; userId is not reliably available at this stage
      this.updateRateLimit(maskIp(ip), rateLimit.limit, rateLimit.remaining, rateLimit.reset)
    }
  }

  on(event: 'metric' | 'log' | 'ratelimit', listener: (data: unknown) => void) {
    this.emitter.on(event, listener)
  }
  off(event: 'metric' | 'log' | 'ratelimit', listener: (data: unknown) => void) {
    this.emitter.off(event, listener)
  }
}

export const observabilityStore = new ObservabilityStore()
