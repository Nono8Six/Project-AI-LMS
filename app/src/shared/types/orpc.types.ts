/**
 * Types stricts pour oRPC et Context étendu
 * Élimine le besoin de `any` dans le rate limiting et context
 */

export interface RateLimitMetadata {
  limit: number;
  remaining: number;
  reset: number;
}

export interface ExtendedRequestMeta {
  readonly requestId: string;
  readonly receivedAt: string;
  readonly ip: string | null;
  readonly userAgent: string | undefined;
  readonly endpoint?: string; // orpc endpoint path (ex: 'auth.login', 'system.health')
  rateLimit?: RateLimitMetadata;
  rateLimitRetryAfter?: number;
  rateLimitKey?: string;
}


export type ConsoleMethod = 'debug' | 'info' | 'warn' | 'error';

export interface ConsoleLogger {
  debug: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  log: (message: string) => void;
}
