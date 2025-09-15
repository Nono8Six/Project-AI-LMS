import { boolFromEnv } from "../utils/env";
import { deriveApiPrefix, type ApiPrefix } from "../utils/prefix";

// Helpers (internal)
function safeIntFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

// Constants (frozen)
export const ORPC_PREFIX: ApiPrefix = deriveApiPrefix();
export const MAX_BODY_SIZE = safeIntFromEnv("API_MAX_BODY", 1_048_576); // 1 MiB default

export type RateLimits = Readonly<{
  anonymousPerMin: number;
  userPerMin: number;
}>;

export const RATE_LIMITS: RateLimits = Object.freeze({
  anonymousPerMin: safeIntFromEnv("API_RATE_LIMIT_ANON_PER_MIN", 60),
  userPerMin: safeIntFromEnv("API_RATE_LIMIT_USER_PER_MIN", 120),
});

export type ApiConstants = Readonly<{
  prefix: ApiPrefix;
  maxBodyBytes: number;
  rateLimits: RateLimits;
  testNavEnabled: boolean | undefined;
}>;

// Expose a single object for ergonomic consumption
export const API_CONSTANTS: ApiConstants = Object.freeze({
  prefix: ORPC_PREFIX,
  maxBodyBytes: MAX_BODY_SIZE,
  rateLimits: RATE_LIMITS,
  // This is client-exposed flag, but reading here is safe (undefined on server if not set)
  testNavEnabled: boolFromEnv(process.env.NEXT_PUBLIC_ENABLE_TEST_NAV),
});
