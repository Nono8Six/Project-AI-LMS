import { createClient, type SupabaseClient as SupabaseJsClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.generated';

export type SupabaseClient = SupabaseJsClient<Database>;
export type SupabaseAdminClient = SupabaseClient;

export interface SupabasePublicConfig {
  readonly url: string;
  readonly anonKey: string;
}

export interface SupabaseAdminConfig extends SupabasePublicConfig {
  readonly serviceRoleKey: string;
}

export interface SupabaseClients {
  readonly public: SupabaseClient;
  readonly admin: SupabaseAdminClient;
}

export function hasSupabasePublicConfig(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function hasSupabaseAdminConfig(env: NodeJS.ProcessEnv = process.env): boolean {
  return hasSupabasePublicConfig(env) && Boolean(env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseEnvConfig(env: NodeJS.ProcessEnv = process.env): SupabaseAdminConfig {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    throw new Error('SUPABASE_CONFIG_MISSING: NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY manquant');
  }
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant');
  }

  return { url, anonKey, serviceRoleKey };
}

export function createSupabaseClient(config: SupabasePublicConfig): SupabaseClient {
  return createClient<Database>(config.url, config.anonKey);
}

export function createSupabaseAdminClient(config: SupabaseAdminConfig): SupabaseAdminClient {
  return createClient<Database>(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createSupabaseClients(config: SupabaseAdminConfig): SupabaseClients {
  return {
    public: createSupabaseClient(config),
    admin: createSupabaseAdminClient(config),
  } as const;
}
