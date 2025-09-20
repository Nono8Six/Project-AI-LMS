import { beforeEach, describe, expect, it, vi } from "vitest";

import { API_CONSTANTS } from "../app/src/shared/constants/api";

const rateLimitStore = new Map<string, RateLimitRow>();

type RateLimitRow = {
  key: string;
  window_start: string;
  requests: number;
  limit_value: number;
  endpoint: string | null;
  updated_at: string;
};

type Filter = {
  column: keyof RateLimitRow;
  value: string;
  op: "eq" | "lt";
};

function createAdminClient(store: Map<string, RateLimitRow>) {
  return {
    from(table: string) {
      if (table !== "auth_rate_limit_counters") {
        throw new Error(`Unsupported table: ${table}`);
      }

      const state: { action: "select" | "update" | "delete" | null; payload?: Partial<RateLimitRow>; filters: Filter[] } = {
        action: null,
        payload: undefined,
        filters: [],
      };

      const builder: any = {
        select() {
          state.action = "select";
          return builder;
        },
        insert(payload: RateLimitRow) {
          store.set(`${payload.key}|${payload.window_start}`, { ...payload });
          return Promise.resolve({ data: payload, error: null });
        },
        update(payload: Partial<RateLimitRow>) {
          state.action = "update";
          state.payload = payload;
          return builder;
        },
        delete() {
          state.action = "delete";
          return builder;
        },
        eq(column: keyof RateLimitRow, value: string) {
          state.filters.push({ column, value, op: "eq" });
          return builder;
        },
        lt(column: keyof RateLimitRow, value: string) {
          state.filters.push({ column, value, op: "lt" });
          return builder;
        },
        maybeSingle() {
          const rows = findMatches();
          const result = rows.length > 0 ? { ...rows[0] } : null;
          state.action = null;
          state.filters = [];
          return Promise.resolve({ data: result, error: null });
        },
        then(resolve: any, reject?: any) {
          return execute().then(resolve, reject);
        },
        catch(onRejected: any) {
          return execute().catch(onRejected);
        },
        finally(onFinally: any) {
          return execute().finally(onFinally);
        },
      };

      function findMatches(): RateLimitRow[] {
        return Array.from(store.values()).filter((row) => {
          return state.filters.every((filter) => {
            if (filter.op === "eq") {
              return (row as any)[filter.column] === filter.value;
            }
            if (filter.op === "lt") {
              const rowValue = (row as any)[filter.column];
              return rowValue < filter.value;
            }
            return false;
          });
        });
      }

      function execute() {
        if (state.action === "update") {
          const rows = findMatches();
          const nowIso = new Date().toISOString();
          const updatedRows = rows.map((row) => {
            const updated = {
              ...row,
              ...state.payload,
              updated_at: (state.payload?.updated_at as string) ?? nowIso,
            } as RateLimitRow;
            store.set(`${updated.key}|${updated.window_start}`, updated);
            return updated;
          });
          state.action = null;
          state.filters = [];
          state.payload = undefined;
          return Promise.resolve({ data: updatedRows, error: null });
        }

        if (state.action === "delete") {
          const rows = findMatches();
          rows.forEach((row) => store.delete(`${row.key}|${row.window_start}`));
          state.action = null;
          state.filters = [];
          return Promise.resolve({ data: rows, error: null });
        }

        state.action = null;
        state.filters = [];
        state.payload = undefined;
        return Promise.resolve({ data: null, error: null });
      }

      return builder;
    },
  };
}

function createTestConfig(): typeof API_CONSTANTS {
  return {
    ...API_CONSTANTS,
    rateLimits: {
      ...API_CONSTANTS.rateLimits,
      anonymousPerMin: 3,
      userPerMin: 4,
      authActions: {
        ...API_CONSTANTS.rateLimits.authActions,
        login: 2,
      },
      exemptIPs: [],
    },
  } as typeof API_CONSTANTS;
}

let adminClient = createAdminClient(rateLimitStore);

function baseCtx(options: { userId?: string; ip?: string; endpoint?: string; config?: typeof API_CONSTANTS } = {}) {
  const config = options.config ?? createTestConfig();
  const admin = adminClient;
  const meta: any = {
    requestId: 'req-test',
    receivedAt: new Date().toISOString(),
    ip: options.ip ?? '127.0.0.1',
    userAgent: 'vitest',
  };
  if (options.endpoint) meta.endpoint = options.endpoint;

  return {
    meta,
    headers: {},
    logger: {
      level: 'debug',
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
    config,
    supabase: {
      userClient: undefined,
      getAdminClient: () => admin,
    },
    user: options.userId ? { id: options.userId, email: null, profile: null, permissions: [] } : null,
  } as any;
}

beforeEach(() => {
  rateLimitStore.clear();
  adminClient = createAdminClient(rateLimitStore);
  vi.restoreAllMocks();
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

const { enforceRateLimit } = await import('../app/src/orpc/server/middleware/rateLimit.middleware');

describe('rate limiter (memory, fixed window)', () => {
  it('permet aux requêtes anonymes de consommer leur budget puis rejette au-delà', async () => {
    const ctx: any = baseCtx({ ip: '10.0.0.1' });
    const budget = ctx.config.rateLimits.anonymousPerMin;

    for (let i = 0; i < budget; i += 1) {
      await enforceRateLimit(ctx);
      expect(ctx.meta.rateLimit?.remaining).toBe(budget - (i + 1));
    }

    await expect(enforceRateLimit(ctx)).rejects.toThrowError();
    expect(ctx.meta.rateLimit?.remaining).toBe(0);
    expect(ctx.meta.rateLimitRetryAfter).toBeGreaterThan(0);
  });

  it('sépare les budgets par identité (IP anonyme vs utilisateur authentifié)', async () => {
    const anonymous: any = baseCtx({ ip: '10.0.0.2' });
    const user: any = baseCtx({ ip: '10.0.0.2', userId: 'user-42' });
    const anonLimit = anonymous.config.rateLimits.anonymousPerMin;
    const userLimit = user.config.rateLimits.userPerMin;

    for (let i = 0; i < anonLimit; i += 1) {
      await enforceRateLimit(anonymous);
    }

    for (let i = 0; i < userLimit; i += 1) {
      await enforceRateLimit(user);
    }

    await expect(enforceRateLimit(anonymous)).rejects.toThrowError();
    await expect(enforceRateLimit(user)).rejects.toThrowError();
  });

  it('applique le budget utilisateur et expose retry-after', async () => {
    const ctx: any = baseCtx({ userId: 'user-auth', ip: '10.0.0.3' });
    const userLimit = ctx.config.rateLimits.userPerMin;

    for (let i = 0; i < userLimit; i += 1) {
      await enforceRateLimit(ctx);
    }

    await expect(enforceRateLimit(ctx)).rejects.toThrowError();
    expect(ctx.meta.rateLimit?.remaining).toBe(0);
    expect(ctx.meta.rateLimitRetryAfter).toBeGreaterThan(0);
  });
});
