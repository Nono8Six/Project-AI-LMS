import { z } from 'zod'

export const ObservabilityQuery = z.object({
  limit: z.number().int().min(1).max(200).optional(),
})

export const LogEntrySchema = z.object({
  kind: z.enum(['debug', 'info', 'warn', 'error']),
  requestId: z.string(),
  message: z.string(),
  meta: z.record(z.string(), z.unknown()).optional(),
  time: z.string(),
  timestamp: z.number(),
})

export const PerformanceMetricSchema = z.object({
  endpoint: z.string(),
  method: z.string(),
  status: z.number(),
  duration: z.number(),
  timestamp: z.number(),
  requestId: z.string(),
})

export const RateLimitBucketSchema = z.object({
  key: z.string(),
  type: z.enum(['ip', 'user', 'anonymous']),
  limit: z.number(),
  remaining: z.number(),
  reset: z.number(),
  lastActivity: z.number(),
  requests: z.number(),
})

export const ObservabilityRecentOutput = z.object({
  logs: z.array(LogEntrySchema),
  metrics: z.array(PerformanceMetricSchema),
  rateLimitBuckets: z.array(RateLimitBucketSchema),
})

export const ObservabilityStatsOutput = z.object({
  totalRequests: z.number(),
  successRate: z.number(),
  errorRate: z.number(),
  avgDuration: z.number(),
  p95Duration: z.number(),
  p99Duration: z.number(),
})

export const debugContractSchemas = {
  recent: { input: ObservabilityQuery.optional(), output: ObservabilityRecentOutput },
  stats: { input: z.undefined().optional(), output: ObservabilityStatsOutput },
  openapi: { input: z.undefined().optional(), output: z.unknown() },
} as const

export type ObservabilityRecent = z.infer<typeof ObservabilityRecentOutput>
export type ObservabilityStats = z.infer<typeof ObservabilityStatsOutput>
