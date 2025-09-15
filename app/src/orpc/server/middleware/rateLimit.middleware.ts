import type { AppContext } from '../context'
import { ORPCError } from '@orpc/client'
import type { UpstashRedisClient, UpstashRedisConstructor } from '@/shared/types/redis.types'
import { Redis as UpstashRedis } from '@upstash/redis'

interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
  remaining: number
  limit: number
  resetAtEpochSeconds: number
}

interface RateLimiter {
  consume(key: string, budget: number): Promise<RateLimitResult> | RateLimitResult
}

class MemoryFixedWindowLimiter implements RateLimiter {
  private readonly store = new Map<string, { count: number; windowStart: number }>()

  consume(key: string, budget: number): RateLimitResult {
    const now = Date.now()
    const windowStart = Math.floor(now / 60000) * 60000 // minute window
    const rec = this.store.get(key)
    if (!rec || rec.windowStart !== windowStart) {
      this.store.set(key, { count: 1, windowStart })
      return {
        allowed: true,
        retryAfterSeconds: 0,
        remaining: Math.max(0, budget - 1),
        limit: budget,
        resetAtEpochSeconds: Math.floor((windowStart + 60000) / 1000),
      }
    }
    if (rec.count < budget) {
      rec.count += 1
      return {
        allowed: true,
        retryAfterSeconds: 0,
        remaining: Math.max(0, budget - rec.count),
        limit: budget,
        resetAtEpochSeconds: Math.floor((windowStart + 60000) / 1000),
      }
    }
    const msUntilReset = 60000 - (now - rec.windowStart)
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(msUntilReset / 1000),
      remaining: 0,
      limit: budget,
      resetAtEpochSeconds: Math.floor((rec.windowStart + 60000) / 1000),
    }
  }
}

const limiter = new MemoryFixedWindowLimiter()

class RedisFixedWindowLimiter implements RateLimiter {
  constructor(private readonly client: UpstashRedisClient) {}

  async consume(key: string, budget: number): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = Math.floor(now / 60000) * 60000
    const redisKey = `rl:${key}:${windowStart}`
    // INCR and set expiry of 60s on first hit
    const count = await this.client.incr(redisKey)
    if (count === 1) {
      await this.client.expire(redisKey, 60)
    }
    if (count <= budget) {
      return {
        allowed: true,
        retryAfterSeconds: 0,
        remaining: Math.max(0, budget - count),
        limit: budget,
        resetAtEpochSeconds: Math.floor((windowStart + 60000) / 1000),
      }
    }
    const msUntilReset = 60000 - (now - windowStart)
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(msUntilReset / 1000),
      remaining: 0,
      limit: budget,
      resetAtEpochSeconds: Math.floor((windowStart + 60000) / 1000),
    }
  }
}

export type RateLimitIdentity = {
  key: string; // user-id or ip
  budget: number;
};

function buildLimiter(): RateLimiter {
  const provider = (process.env.RATE_LIMIT_PROVIDER || 'memory').toLowerCase()
  if (provider === 'redis') {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    if (url && token) {
      // Construct a typed client from the ESM import
      const Ctor = UpstashRedis as unknown as UpstashRedisConstructor
      const client = new Ctor({ url, token })
      return new RedisFixedWindowLimiter(client)
    }
  }
  return limiter
}

const chosenLimiter = buildLimiter()

export async function enforceRateLimit(ctx: AppContext): Promise<void> {
  const userId = ctx.user?.id ?? null
  const key = userId ?? ctx.meta.ip ?? 'unknown'
  const budget = userId ? ctx.config.rateLimits.userPerMin : ctx.config.rateLimits.anonymousPerMin
  const res = await chosenLimiter.consume(String(key), budget)

  // Expose rate limit meta for adapters to set headers
  ctx.meta.rateLimit = {
    limit: res.limit,
    remaining: res.remaining,
    reset: res.resetAtEpochSeconds,
  }

  if (!res.allowed) {
    ctx.logger.warn('Rate limited', { key, budget, retryAfterSeconds: res.retryAfterSeconds })
    ctx.meta.rateLimitRetryAfter = res.retryAfterSeconds
    throw new ORPCError('TOO_MANY_REQUESTS')
  }
}
