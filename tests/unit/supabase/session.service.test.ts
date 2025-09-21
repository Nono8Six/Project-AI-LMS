import { describe, expect, it, vi } from 'vitest';
import { SessionService } from '@/shared/services/session.service';

// Token simulant la structure des access tokens Supabase avec caracteres Base64URL (`-`, `_`).
const SUPABASE_SAMPLE_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiI1Yjc5N2RhYi0wZWY5LTQ3ZTEtOGRiNC02YjUyZDFiN2YxMWIiLCJpYXQiOjE3MTY5OTQ5OTEsImV4cCI6MTcxNjk5ODU5MSwibm9uY2UiOiI_ICIsImhpbnQiOiI-ICJ9.' +
  'ImR1bW15LXNpZ25hdHVyZSI';

function encodeSegment(segment: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(segment)).toString('base64url');
}

function createJwtToken(payload: Record<string, unknown>): string {
  const header = encodeSegment({ alg: 'HS256', typ: 'JWT' });
  const body = encodeSegment(payload);
  return `${header}.${body}.test-signature`;
}

type GetUserResponse = {
  data?: { user?: { id: string } | null } | null;
  error?: { message: string } | null;
};

type MaybeSingleResponse = {
  data: unknown;
  error: unknown;
};

function createAdminClientMock(options: {
  getUser: GetUserResponse;
  maybeSingle?: MaybeSingleResponse;
}) {
  const maybeSingleResult = options.maybeSingle ?? { data: null, error: null };
  const maybeSingle = vi.fn().mockResolvedValue(maybeSingleResult);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq, maybeSingle });
  const from = vi.fn().mockReturnValue({ select, eq, maybeSingle, upsert: vi.fn(), update: vi.fn(), delete: vi.fn() });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue(options.getUser),
      admin: { signOut: vi.fn().mockResolvedValue({}) },
    },
    from,
  } as unknown;
}

describe('SessionService', () => {
  it('genere un sessionId valide pour resolveUser avec un token Supabase Base64URL', () => {
    const sessionId = SessionService.getSessionIdFromToken(SUPABASE_SAMPLE_TOKEN);
    expect(sessionId).toBe('5b797dab-0ef9-47e1-8db4-6b52d1b7f11b_1716994991');
  });
});

describe('SessionService.validateSession', () => {
  const basePayload = {
    sub: 'user-123',
    iat: Math.floor(Date.now() / 1000) - 60,
    exp: Math.floor(Date.now() / 1000) + 600,
  };

  it('renvoie SUPABASE_AUTH_FAILED lorsque Supabase rejette le token', async () => {
    const token = createJwtToken(basePayload);
    const adminClient = createAdminClientMock({
      getUser: { data: null, error: { message: 'invalid token' } },
    });

    const result = await SessionService.validateSession(token, { requestId: 'test-auth-failed' }, adminClient as any);

    expect(result.isValid).toBe(false);
    expect(result.needsRefresh).toBe(true);
    expect(result.reason).toBe('SUPABASE_AUTH_FAILED');
  });

  it('renvoie TOKEN_USER_MISMATCH lorsque l'id Supabase ne correspond pas au JWT', async () => {
    const token = createJwtToken(basePayload);
    const adminClient = createAdminClientMock({
      getUser: { data: { user: { id: 'another-user' } }, error: null },
    });

    const result = await SessionService.validateSession(token, { requestId: 'test-mismatch' }, adminClient as any);

    expect(result.isValid).toBe(false);
    expect(result.needsRefresh).toBe(false);
    expect(result.reason).toBe('TOKEN_USER_MISMATCH');
  });
});
