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

export type AuthActionRateLimits = Readonly<{
  signup: number;
  login: number;
  logout: number;
  refresh: number;
  passwordReset: number;
}>;

export type RateLimits = Readonly<{
  anonymousPerMin: number;
  userPerMin: number;
  authActions: AuthActionRateLimits;
  exemptIPs: string[];
}>;

export type ProgressiveBackoffConfig = Readonly<{
  thresholds: readonly number[];
  blockDurations: readonly number[]; // en minutes
}>;

export const AUTH_ACTION_RATE_LIMITS: AuthActionRateLimits = Object.freeze({
  signup: safeIntFromEnv("API_RATE_LIMIT_AUTH_SIGNUP_PER_MIN", 3),
  login: safeIntFromEnv("API_RATE_LIMIT_AUTH_LOGIN_PER_MIN", 10),
  logout: safeIntFromEnv("API_RATE_LIMIT_AUTH_LOGOUT_PER_MIN", 30),
  refresh: safeIntFromEnv("API_RATE_LIMIT_AUTH_REFRESH_PER_MIN", 20),
  passwordReset: safeIntFromEnv("API_RATE_LIMIT_AUTH_PASSWORD_RESET_PER_MIN", 5),
});

export const PROGRESSIVE_BACKOFF_CONFIG: ProgressiveBackoffConfig = Object.freeze({
  thresholds: [3, 5, 10, 15] as const,
  blockDurations: [1, 5, 30, 120] as const, // 1min, 5min, 30min, 2h
});

export const RATE_LIMITS: RateLimits = Object.freeze({
  anonymousPerMin: safeIntFromEnv("API_RATE_LIMIT_ANON_PER_MIN", 60),
  userPerMin: safeIntFromEnv("API_RATE_LIMIT_USER_PER_MIN", 120),
  authActions: AUTH_ACTION_RATE_LIMITS,
  exemptIPs: (process.env.API_RATE_LIMIT_EXEMPT_IPS || '127.0.0.1,::1').split(',').map(ip => ip.trim()).filter(Boolean),
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
