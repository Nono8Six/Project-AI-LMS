import type { SupabaseClient } from './clients';
import type { Database } from '@/shared/types/database.generated';

export function createProfileService(client: SupabaseClient) {
  return {
    async getProfile(userId: string) {
      return client.from('user_profiles').select('*').eq('id', userId).single();
    },

    async createProfile(profile: Database['public']['Tables']['user_profiles']['Insert']) {
      return client.from('user_profiles').insert(profile).select().single();
    },

    async updateProfile(userId: string, updates: Database['public']['Tables']['user_profiles']['Update']) {
      return client
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
    },

    async deleteProfile(userId: string) {
      return client.from('user_profiles').delete().eq('id', userId);
    },
  } as const;
}

export type ProfileService = ReturnType<typeof createProfileService>;
