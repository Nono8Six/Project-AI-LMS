import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { API_CONSTANTS } from '@/shared/constants/api';
import type { Database } from '@/shared/types/api.types';
import { randomUUID as nodeRandomUUID } from 'node:crypto';
import type { ExtendedRequestMeta, ConsoleLogger, ConsoleMethod } from '@/shared/types/orpc.types';

// Minimal structured logger (no secrets). Level via LOG_LEVEL
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface Logger {
  readonly level: LogLevel;
  debug: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
}

// Async logger implementation
interface LogEntry {
  kind: LogLevel;
  requestId: string;
  message: string;
  meta?: Record<string, unknown>;
  time: string;
}

class AsyncLogger {
  private queue: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly maxQueueSize = 100;
  private readonly flushInterval = 1000; // 1 second

  private scheduleFlush(): void {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flush();
      this.flushTimer = null;
    }, this.flushInterval);
  }

  private flush(): void {
    if (this.queue.length === 0) return;
    
    const entries = this.queue.splice(0);
    const consoleLogger = console as ConsoleLogger;
    
    // Process entries async to avoid blocking
    setImmediate(() => {
      for (const entry of entries) {
        try {
          const payload = JSON.stringify(entry);
          const consoleMethod = consoleLogger[entry.kind as ConsoleMethod];
          if (typeof consoleMethod === 'function') {
            consoleMethod(payload);
          } else {
            consoleLogger.log(payload);
          }
        } catch {
          // Silently ignore JSON.stringify errors to avoid recursion
          consoleLogger.error(`[LOGGER] Failed to serialize log entry: ${entry.message}`);
        }
      }
    });
  }

  enqueue(entry: LogEntry): void {
    this.queue.push(entry);
    
    // Force flush if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }
}

// Singleton logger instance
const _asyncLogger = new AsyncLogger();

function getLogLevel(): LogLevel {
  const v = (process.env.LOG_LEVEL || 'info').toLowerCase();
  if (v === 'debug' || v === 'info' || v === 'warn' || v === 'error') return v;
  return 'info';
}

function createLogger(requestId: string): Logger {
  const level = getLogLevel();
  const order: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  const threshold = order.indexOf(level);

  const emit = (kind: LogLevel, message: string, meta?: Record<string, unknown>) => {
    if (order.indexOf(kind) < threshold) return;
    
    const entry: LogEntry = {
      kind,
      requestId,
      message,
      ...(meta ? { meta } : {}),
      time: new Date().toISOString()
    };
    
    // Use async logger to avoid blocking
    _asyncLogger.enqueue(entry);
  };

  return {
    level,
    debug: (m, meta) => emit('debug', m, meta),
    info: (m, meta) => emit('info', m, meta),
    warn: (m, meta) => emit('warn', m, meta),
    error: (m, meta) => emit('error', m, meta),
  };
}

// Types
export interface RequestMeta {
  readonly requestId: string;
  readonly receivedAt: string;
  readonly ip: string | null;
  readonly userAgent: string | undefined;
}

export interface AppContext {
  readonly meta: ExtendedRequestMeta;
  readonly headers: Record<string, string>;
  readonly logger: Logger;
  readonly config: typeof API_CONSTANTS;
  readonly supabase: {
    readonly getUserClient: () => SupabaseClient<Database> | undefined;
    readonly getAdminClient: () => SupabaseClient<Database>;
  };
  // Set by auth middleware later
  readonly user: { id: string; email?: string | null; role?: string | null } | null;
}

export interface BuildContextInput {
  readonly headers: Headers | Record<string, string | undefined>;
  readonly ip?: string | null;
}

// Helpers
function headersToObject(h: Headers | Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  
  // Type guard strict instead of any cast
  if (h instanceof Headers) {
    h.forEach((v, k) => {
      out[k.toLowerCase()] = v;
    });
  } else {
    const rec = h as Record<string, string | undefined>;
    for (const k of Object.keys(rec)) {
      const v = rec[k];
      if (typeof v !== 'undefined') out[k.toLowerCase()] = String(v);
    }
  }
  return out;
}

function safeRandomUUID(): string {
  try {
    return nodeRandomUUID();
  } catch {
    return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function extractBearer(headers: Record<string, string>): string | undefined {
  const raw = headers['authorization'];
  if (!raw) return undefined;
  const parts = raw.split(' ');
  if (parts.length !== 2 || !/^bearer$/i.test(parts[0]!)) return undefined;
  const token = parts[1]!; // Safe after length check
  if (!token || typeof token !== 'string') return undefined;
  return token;
}

function maybeCreateSupabaseUserClient(headers: Record<string, string>): SupabaseClient<Database> | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return undefined;
  const token = extractBearer(headers);
  const globalHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;
  return createClient<Database>(url, anon, globalHeaders ? { global: { headers: globalHeaders } } : undefined);
}

// Singleton pattern pour le client admin (performance)
let _adminClientInstance: SupabaseClient<Database> | null = null;

function buildAdminClient(): SupabaseClient<Database> {
  if (_adminClientInstance) {
    return _adminClientInstance;
  }
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) {
    throw new Error('SERVICE_ROLE_NOT_CONFIGURED');
  }
  
  _adminClientInstance = createClient<Database>(url, service);
  return _adminClientInstance;
}

// Main builder
export function buildContext(input: BuildContextInput): AppContext {
  const headersObj = headersToObject(input.headers);
  const requestId = headersObj['x-request-id'] || safeRandomUUID();
  const logger = createLogger(requestId);

  // Lazy loading pour user client (créé seulement si nécessaire)
  let _userClient: SupabaseClient<Database> | undefined | null = null;
  const getUserClient = (): SupabaseClient<Database> | undefined => {
    if (_userClient === null) {
      _userClient = maybeCreateSupabaseUserClient(headersObj);
    }
    return _userClient || undefined;
  };

  return {
    meta: {
      requestId,
      receivedAt: new Date().toISOString(),
      ip: input.ip ?? null,
      userAgent: headersObj['user-agent'],
    } as ExtendedRequestMeta,
    headers: headersObj,
    logger,
    config: API_CONSTANTS,
    supabase: {
      getUserClient,
      getAdminClient: buildAdminClient,
    },
    user: null,
  };
}
