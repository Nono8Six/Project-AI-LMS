/**
 * SessionService - Gestion sécurisée des sessions utilisateur
 * Refresh automatique, invalidation serveur, persistance Postgres
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.generated';

const SESSION_TABLE = 'auth_sessions';
const SESSION_ID_SEPARATOR = '_';

export interface SessionMetadata {
  readonly userId: string;
  readonly sessionId: string;
  readonly issuedAt: number;
  readonly expiresAt: number;
  readonly lastActivity: number;
  readonly userAgent?: string | undefined;
  readonly ipAddress?: string | undefined;
}

export interface SessionRefreshResult {
  readonly success: boolean;
  readonly newToken?: string;
  readonly expiresAt?: number;
  readonly error?: string;
}

export interface SessionValidationResult {
  readonly isValid: boolean;
  readonly needsRefresh: boolean;
  readonly metadata?: SessionMetadata;
  readonly reason?: string;
  readonly isNewSession?: boolean;
}

type AuthSessionRow = Database['public']['Tables']['auth_sessions']['Row'];
type AuthSessionInsert = Database['public']['Tables']['auth_sessions']['Insert'];

type ValidationContext = {
  readonly userAgent?: string | undefined;
  readonly ipAddress?: string | undefined;
  readonly requestId: string;
};

interface JwtPayload extends Record<string, unknown> {
  sub?: string;
  iat?: number | string | undefined;
  exp?: number | string | undefined;
}

function decodeBase64Url(segment: string): string | null {
  try {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4;
    const padded = padding ? normalized + '='.repeat(4 - padding) : normalized;
    return Buffer.from(padded, 'base64').toString('utf-8');
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const payload = parts[1];
  if (!payload) return null;

  const decoded = decodeBase64Url(payload);
  if (!decoded) return null;

  try {
    const parsed = JSON.parse(decoded) as unknown;
    if (!isRecord(parsed)) {
      return null;
    }

    const result: JwtPayload = { ...parsed } as JwtPayload;

    if (typeof result.iat === 'string') {
      const numericIat = Number(result.iat);
      result.iat = Number.isFinite(numericIat) ? numericIat : undefined;
    }

    if (typeof result.exp === 'string') {
      const numericExp = Number(result.exp);
      result.exp = Number.isFinite(numericExp) ? numericExp : undefined;
    }

    return result;
  } catch {
    return null;
  }
}

function toSessionId(userId: string, issuedAtSeconds: number): string {
  return `${userId}${SESSION_ID_SEPARATOR}${issuedAtSeconds}`;
}

function isoFromMillis(value: number): string {
  return new Date(value).toISOString();
}

function rowToMetadata(row: AuthSessionRow): SessionMetadata {
  return {
    userId: row.user_id,
    sessionId: row.session_id,
    issuedAt: Date.parse(row.issued_at),
    expiresAt: Date.parse(row.expires_at),
    lastActivity: Date.parse(row.last_activity),
    userAgent: row.user_agent ?? undefined,
    ipAddress: row.ip_address ?? undefined,
  };
}

async function getSessionRow(
  adminClient: SupabaseClient<Database>,
  sessionId: string
): Promise<AuthSessionRow | null> {
  const { data, error } = await adminClient
    .from(SESSION_TABLE)
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data ?? null;
}

async function upsertSession(
  adminClient: SupabaseClient<Database>,
  metadata: SessionMetadata
): Promise<void> {
  const payload: AuthSessionInsert = {
    session_id: metadata.sessionId,
    user_id: metadata.userId,
    issued_at: isoFromMillis(metadata.issuedAt),
    expires_at: isoFromMillis(metadata.expiresAt),
    last_activity: isoFromMillis(metadata.lastActivity),
    user_agent: metadata.userAgent ?? null,
    ip_address: metadata.ipAddress ?? null,
    metadata: null,
    revoked: false,
    revoked_reason: null,
    revoked_at: null,
  };

  await adminClient.from(SESSION_TABLE).upsert(payload, { onConflict: 'session_id' });
}

async function markSessionRevoked(
  adminClient: SupabaseClient<Database>,
  sessionId: string,
  reason: 'LOGOUT' | 'SECURITY' | 'ADMIN' | 'REFRESH'
): Promise<void> {
  await adminClient
    .from(SESSION_TABLE)
    .update({
      revoked: true,
      revoked_reason: reason,
      revoked_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId);
}

export class SessionService {
  static async validateSession(
    token: string,
    context: ValidationContext,
    adminClient: SupabaseClient<Database>
  ): Promise<SessionValidationResult> {
    if (!token) {
      return { isValid: false, needsRefresh: false, reason: 'NO_TOKEN' };
    }

    const payload = parseJwtPayload(token);
    if (!payload) {
      return { isValid: false, needsRefresh: false, reason: 'INVALID_TOKEN_FORMAT' };
    }

    const nowSeconds = Date.now() / 1000;
    const expiresAt = typeof payload.exp === 'number' ? payload.exp : undefined;
    const issuedAt = typeof payload.iat === 'number' ? payload.iat : undefined;
    const userId = typeof payload.sub === 'string' ? payload.sub : undefined;

    if (!expiresAt || !issuedAt || !userId) {
      return { isValid: false, needsRefresh: false, reason: 'MISSING_TOKEN_CLAIMS' };
    }

    const sessionId = toSessionId(userId, issuedAt);
    const existing = await getSessionRow(adminClient, sessionId);
    if (existing?.revoked) {
      return { isValid: false, needsRefresh: true, reason: 'TOKEN_REVOKED' };
    }

    if (nowSeconds >= expiresAt) {
      return { isValid: false, needsRefresh: true, reason: 'TOKEN_EXPIRED' };
    }

    // SÉCURITÉ: Vérifier avec Supabase auth AVANT de faire confiance au JWT
    // Cela empêche l'insertion de sessions forgées dans la base
    try {
      const { data: authData, error: authError } = await adminClient.auth.getUser(token);

      if (authError || !authData?.user) {
        return { isValid: false, needsRefresh: true, reason: 'SUPABASE_AUTH_FAILED' };
      }

      // Vérifier que l'userId du JWT correspond à celui de Supabase
      if (authData.user.id !== userId) {
        return { isValid: false, needsRefresh: false, reason: 'TOKEN_USER_MISMATCH' };
      }
    } catch {
      return { isValid: false, needsRefresh: true, reason: 'SUPABASE_AUTH_ERROR' };
    }

    // Maintenant on peut faire confiance au token et upsert la session
    const metadata: SessionMetadata = {
      userId,
      sessionId,
      issuedAt: issuedAt * 1000,
      expiresAt: expiresAt * 1000,
      lastActivity: Date.now(),
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
    };

    await upsertSession(adminClient, metadata);

    const timeUntilExpiry = expiresAt - nowSeconds;
    const needsRefresh = timeUntilExpiry < 5 * 60;

    return {
      isValid: true,
      needsRefresh,
      metadata,
      reason: needsRefresh ? 'REFRESH_RECOMMENDED' : 'VALID',
      isNewSession: !existing,
    };
  }

  static async refreshSession(
    supabaseClient: SupabaseClient<Database>,
    refreshToken: string,
    accessToken: string | undefined,
    adminClient: SupabaseClient<Database>
  ): Promise<SessionRefreshResult> {
    try {
      const { data, error } = await supabaseClient.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.session) {
        return { success: false, error: 'NO_NEW_SESSION' };
      }

      const tokenToInvalidate = accessToken ?? refreshToken;
      const oldPayload = parseJwtPayload(tokenToInvalidate);
      if (oldPayload && typeof oldPayload.sub === 'string' && typeof oldPayload.iat === 'number') {
        const oldSessionId = toSessionId(oldPayload.sub, oldPayload.iat);
        await markSessionRevoked(adminClient, oldSessionId, 'REFRESH');
        if (accessToken) {
          await adminClient.auth.admin.signOut(accessToken, 'local');
        }
      }

      const expiresAtMs = data.session.expires_at
        ? new Date(data.session.expires_at).getTime()
        : undefined;

      return {
        success: true,
        newToken: data.session.access_token,
        ...(typeof expiresAtMs === 'number' ? { expiresAt: expiresAtMs } : {}),
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'REFRESH_FAILED',
      };
    }
  }

  static async invalidateSession(
    adminClient: SupabaseClient<Database>,
    sessionId: string,
    reason: 'LOGOUT' | 'SECURITY' | 'ADMIN' = 'LOGOUT',
    accessToken?: string
  ): Promise<boolean> {
    try {
      await markSessionRevoked(adminClient, sessionId, reason);
      if (accessToken) {
        await adminClient.auth.admin.signOut(accessToken, 'local');
      }
      return true;
    } catch {
      return false;
    }
  }

  static async invalidateUserSessions(
    adminClient: SupabaseClient<Database>,
    userId: string,
    reason: 'LOGOUT' | 'SECURITY' | 'ADMIN' = 'ADMIN',
    currentAccessToken?: string
  ): Promise<boolean> {
    const { data, error } = await adminClient
      .from(SESSION_TABLE)
      .select('session_id')
      .eq('user_id', userId)
      .eq('revoked', false);

    if (error || !data) {
      return false;
    }

    const results = await Promise.all(
      data.map((row) => SessionService.invalidateSession(adminClient, row.session_id, reason))
    );

    if (currentAccessToken) {
      try {
        await adminClient.auth.admin.signOut(currentAccessToken, 'global');
      } catch {
        // ignore errors; DB already marks sessions as revoked
      }
    }

    return results.every(Boolean);
  }

  static async updateSessionActivity(
    adminClient: SupabaseClient<Database>,
    sessionId: string
  ): Promise<void> {
    await adminClient
      .from(SESSION_TABLE)
      .update({ last_activity: new Date().toISOString() })
      .eq('session_id', sessionId)
      .eq('revoked', false);
  }

  static async getSessionMetadata(
    adminClient: SupabaseClient<Database>,
    sessionId: string
  ): Promise<SessionMetadata | null> {
    const row = await getSessionRow(adminClient, sessionId);
    return row ? rowToMetadata(row) : null;
  }

  static getSessionIdFromToken(token: string): string | null {
    const payload = parseJwtPayload(token);
    if (!payload || typeof payload.sub !== 'string' || typeof payload.iat !== 'number') return null;
    return toSessionId(payload.sub, payload.iat);
  }
}
