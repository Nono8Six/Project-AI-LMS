import { beforeAll, afterEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import {
  createSupabaseAdminClient,
  createSupabaseClient,
  getSupabaseEnvConfig,
  hasSupabaseAdminConfig,
} from '@/shared/lib/supabase';
import type { SupabaseAdminClient, SupabaseClient } from '@/shared/lib/supabase';
import { SessionService } from '@/shared/services/session.service';

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

const missingEnv = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
const SKIP_MESSAGE = `Tests auth sessions ignorés – variables manquantes : ${missingEnv.join(', ')}`;

interface TestUser {
  id: string;
  email: string;
  password: string;
}

interface SignedInSession {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  client: SupabaseClient;
}

const createdUsers = new Set<string>();

async function createTestUser(admin: SupabaseAdminClient): Promise<TestUser> {
  const email = `session-test-${randomUUID()}@example.com`;
  const password = `Test-${randomUUID()}!`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data?.user) {
    throw new Error(`Impossible de créer l'utilisateur de test: ${error?.message ?? 'unknown error'}`);
  }

  createdUsers.add(data.user.id);
  return { id: data.user.id, email, password };
}

function createAuthClient(url: string, anonKey: string) {
  return createSupabaseClient({ url, anonKey });
}

async function signIn(
  user: TestUser,
  client: SupabaseClient
): Promise<SignedInSession> {
  const { data, error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  if (error || !data.session) {
    throw new Error(`Impossible de se connecter: ${error?.message ?? 'unknown error'}`);
  }

  const accessToken = data.session.access_token;
  const refreshToken = data.session.refresh_token;

  if (!accessToken || !refreshToken) {
    throw new Error('Session Supabase invalide (tokens manquants)');
  }

  const sessionId = SessionService.getSessionIdFromToken(accessToken);
  if (!sessionId) {
    throw new Error('Impossible de calculer sessionId');
  }

  return { accessToken, refreshToken, sessionId, client };
}

async function cleanupUsers(admin: SupabaseAdminClient) {
  for (const userId of Array.from(createdUsers)) {
    await admin.auth.admin.deleteUser(userId);
    createdUsers.delete(userId);
  }
}

if (!hasSupabaseAdminConfig() || missingEnv.length) {
  describe.skip('Auth sessions – logout + refresh', () => {
    it(SKIP_MESSAGE, () => {
      expect(true).toBe(true);
    });
  });
} else {
  const envConfig = getSupabaseEnvConfig();
  const admin = createSupabaseAdminClient(envConfig);

  beforeAll(async () => {
    const { error } = await admin.from('auth_sessions').select('session_id').limit(1);
    if (error) {
      throw new Error(`Supabase indisponible pour les tests: ${error.message}`);
    }
  });

  afterEach(async () => {
    await cleanupUsers(admin);
  });

  describe('Auth sessions – logout + refresh', () => {
    it('révoque une session unique lors du logout simple', async () => {
      const user = await createTestUser(admin);
      const client = createAuthClient(envConfig.url, envConfig.anonKey);
      const session = await signIn(user, client);

      const validation = await SessionService.validateSession(
        session.accessToken,
        { requestId: 'test-logout-single', userAgent: 'vitest', ipAddress: '127.0.0.1' },
        admin
      );
      expect(validation.isValid).toBe(true);

      const { data: storedBefore } = await admin
        .from('auth_sessions')
        .select('revoked')
        .eq('session_id', session.sessionId)
        .single();
      expect(storedBefore?.revoked).toBe(false);

      await SessionService.invalidateSession(
        admin,
        session.sessionId,
        'LOGOUT',
        session.accessToken
      );

      const { data: storedAfter } = await admin
        .from('auth_sessions')
        .select('revoked, revoked_reason')
        .eq('session_id', session.sessionId)
        .single();
      expect(storedAfter?.revoked).toBe(true);
      expect(storedAfter?.revoked_reason).toBe('LOGOUT');

      const validationAfter = await SessionService.validateSession(
        session.accessToken,
        { requestId: 'test-logout-single-2', userAgent: 'vitest', ipAddress: '127.0.0.1' },
        admin
      );
      expect(validationAfter.isValid).toBe(false);
      expect(validationAfter.reason).toBe('TOKEN_REVOKED');

      const { error: refreshError } = await client.auth.refreshSession({
        refresh_token: session.refreshToken,
      });
      expect(refreshError).toBeTruthy();
    });

    it('révoque toutes les sessions lors du logout all devices', async () => {
      const user = await createTestUser(admin);

      const clientA = createAuthClient(envConfig.url, envConfig.anonKey);
      const sessionA = await signIn(user, clientA);
      await SessionService.validateSession(
        sessionA.accessToken,
        { requestId: 'test-logout-all-1', userAgent: 'vitest-A', ipAddress: '127.0.0.1' },
        admin
      );

      const clientB = createAuthClient(envConfig.url, envConfig.anonKey);
      const sessionB = await signIn(user, clientB);
      await SessionService.validateSession(
        sessionB.accessToken,
        { requestId: 'test-logout-all-2', userAgent: 'vitest-B', ipAddress: '127.0.0.2' },
        admin
      );

      await SessionService.invalidateUserSessions(
        admin,
        user.id,
        'ADMIN',
        sessionA.accessToken
      );

      const { data: remaining } = await admin
        .from('auth_sessions')
        .select('revoked')
        .eq('user_id', user.id)
        .eq('revoked', false);

      expect(remaining).toHaveLength(0);

      const { error: refreshErrorA } = await clientA.auth.refreshSession({
        refresh_token: sessionA.refreshToken,
      });
      expect(refreshErrorA).toBeTruthy();

      const { error: refreshErrorB } = await clientB.auth.refreshSession({
        refresh_token: sessionB.refreshToken,
      });
      expect(refreshErrorB).toBeTruthy();
    });
  });
}
