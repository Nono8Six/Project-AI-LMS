import { beforeAll, afterEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import {
  createSupabaseAdminClient,
  createSupabaseClient,
  getSupabaseEnvConfig,
  hasSupabaseAdminConfig,
} from '@/shared/lib/supabase';
import type { SupabaseAdminClient, SupabaseClient } from '@/shared/lib/supabase';

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

const missingEnv = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);

const SKIP_MESSAGE = `Tests RLS Supabase ignorés – variables manquantes : ${missingEnv.join(', ')}`;

interface TestContext {
  admin: SupabaseAdminClient;
  publicClient: SupabaseClient;
}

type CreatedUser = {
  id: string;
  email: string;
  password: string;
};

const createdUsers: CreatedUser[] = [];

async function createTestUser(admin: SupabaseAdminClient): Promise<CreatedUser> {
  const email = `rls-test-${randomUUID()}@example.com`;
  const password = `Test-${randomUUID()}!`; // longueur suffisante
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data?.user) {
    throw new Error(`Impossible de créer l'utilisateur de test: ${error?.message ?? 'unknown error'}`);
  }

  const created: CreatedUser = { id: data.user.id, email, password };
  createdUsers.push(created);
  return created;
}

async function signIn(user: CreatedUser, client: SupabaseClient) {
  const { error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (error) {
    throw new Error(`Impossible de se connecter avec l'utilisateur de test: ${error.message}`);
  }
}

async function cleanupUsers(admin: SupabaseAdminClient) {
  if (!createdUsers.length) return;
  const ids = createdUsers.splice(0, createdUsers.length).map((u) => u.id);
  await admin.from('user_profiles').delete().in('id', ids);
  await Promise.all(ids.map((id) => admin.auth.admin.deleteUser(id)));
}

if (!hasSupabaseAdminConfig() || missingEnv.length) {
  describe.skip('Supabase profile RLS', () => {
    it(SKIP_MESSAGE, () => {
      expect(true).toBe(true);
    });
  });
} else {
  const envConfig = getSupabaseEnvConfig();
  const ctx: TestContext = {
    admin: createSupabaseAdminClient(envConfig),
    publicClient: createSupabaseClient({ url: envConfig.url, anonKey: envConfig.anonKey }),
  };

  beforeAll(async () => {
    // Vérifie que Supabase répond avant de lancer les tests
    const { error } = await ctx.admin.from('system_settings').select('key').limit(1);
    if (error) {
      throw new Error(`Supabase indisponible pour les tests: ${error.message}`);
    }
  });

  afterEach(async () => {
    await cleanupUsers(ctx.admin);
  });

  describe('Supabase profile RLS', () => {
    it('permet à un utilisateur authentifié de créer et lire son propre profil', async () => {
      const user = await createTestUser(ctx.admin);
      await signIn(user, ctx.publicClient);

      const insert = await ctx.publicClient
        .from('user_profiles')
        .insert({ id: user.id, full_name: 'Utilisateur Test' })
        .select()
        .single();

      expect(insert.error).toBeNull();
      expect(insert.data?.id).toBe(user.id);

      const select = await ctx.publicClient
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      expect(select.error).toBeNull();
      expect(select.data?.full_name).toBe('Utilisateur Test');
    });

    it("refuse la création d'un profil pour un autre utilisateur", async () => {
      const user = await createTestUser(ctx.admin);
      await signIn(user, ctx.publicClient);

      const otherId = randomUUID();

      const insert = await ctx.publicClient
        .from('user_profiles')
        .insert({ id: otherId, full_name: 'Doit échouer' })
        .select()
        .single();

      expect(insert.error).toBeTruthy();
      expect(insert.data).toBeNull();
      expect(insert.error?.code).toBe('42501');
    });

    it("empêche la lecture et la mise à jour du profil d'un autre utilisateur", async () => {
      const owner = await createTestUser(ctx.admin);
      const attacker = await createTestUser(ctx.admin);

      await ctx.admin
        .from('user_profiles')
        .insert({ id: owner.id, full_name: 'Owner User' })
        .select()
        .single();

      await signIn(attacker, ctx.publicClient);

      const readAttempt = await ctx.publicClient
        .from('user_profiles')
        .select('*')
        .eq('id', owner.id)
        .maybeSingle();

      expect(readAttempt.data).toBeNull();
      expect(readAttempt.error?.code).toBe('42501');

      const updateAttempt = await ctx.publicClient
        .from('user_profiles')
        .update({ full_name: 'Hacked' })
        .eq('id', owner.id)
        .select()
        .single();

      expect(updateAttempt.data).toBeNull();
      expect(updateAttempt.error?.code).toBe('42501');
    });
  });
}

