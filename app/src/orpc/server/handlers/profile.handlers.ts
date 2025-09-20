import {
  ProfileSchema,
  ProfileCreateSchema,
  ProfileUpdateSchema,
  type ProfileCreateRequest,
  type ProfileUpdateRequest
} from '@/orpc/contracts/profile.contract';
import type { AppContext } from '@/orpc/server/context';
import { ORPCError } from '@orpc/client';
import type { Database, Json } from '@/shared/types/database.generated';
import { createProfileService } from '@/shared/services/supabase/profile.service';

/**
 * Handler pour récupérer un profil utilisateur
 * Validation complète avec nouveau ProfileSchema (11 colonnes)
 */
export async function getProfileHandler(ctx: AppContext, input: { id: string }) {
  ctx.logger.info('getProfileHandler called', { userId: input.id });

  try {
    const adminClient = ctx.supabase.getAdminClient();
    const profileService = createProfileService(adminClient);
    const { data, error } = await profileService.getProfile(input.id);

    if (error) {
      ctx.logger.error('Database error', { error, userId: input.id });
      throw new ORPCError('INTERNAL_SERVER_ERROR');
    }

    if (!data) {
      ctx.logger.info('Profile not found', { userId: input.id });
      return null;
    }

    // Validation schema avec toutes les 11 colonnes
    return ProfileSchema.parse(data);
  } catch (error) {
    // Gestion spécifique erreurs de parsing schema
    if (error instanceof Error && error.name === 'ZodError') {
      ctx.logger.error('Schema validation error', { error: error.message, userId: input.id });
      throw new ORPCError('INTERNAL_SERVER_ERROR');
    }

    ctx.logger.error('Profile handler error', { error, userId: input.id });
    throw new ORPCError('INTERNAL_SERVER_ERROR');
  }
}

/**
 * Handler pour créer un nouveau profil utilisateur
 * Support complet des nouveaux champs (role, status, referrer_id, consents)
 */
export async function createProfileHandler(ctx: AppContext, input: ProfileCreateRequest) {
  ctx.logger.info('createProfileHandler called', { userId: input.id });

  // Validation input avec nouveau schema complet
  const validatedInput = ProfileCreateSchema.parse(input);

  try {
    const adminClient = ctx.supabase.getAdminClient();
    const profileService = createProfileService(adminClient);
    // Construire les données pour Supabase avec valeurs par défaut
    const profileData: Database['public']['Tables']['user_profiles']['Insert'] = {
      id: validatedInput.id,
      full_name: validatedInput.full_name,
      // Champs avec valeurs par défaut explicites si non fournis
      role: validatedInput.role ?? 'member',
      status: validatedInput.status ?? 'active',
      referrer_id: validatedInput.referrer_id ?? null,
      onboarding_completed: validatedInput.onboarding_completed ?? false,
      consents: validatedInput.consents ?? {
        marketing: false,
        analytics: false,
        cookies: true
      },
      // created_at et updated_at sont automatiques via triggers
    };

    const { data, error } = await profileService.createProfile(profileData);

    if (error) {
      ctx.logger.error('Database error', { error, userId: input.id });

      // Gestion erreurs spécifiques
      if (error.code === '23505') {
        throw new ORPCError('CONFLICT');
      }
      if (error.code === '23514') {
        throw new ORPCError('BAD_REQUEST');
      }

      throw new ORPCError('INTERNAL_SERVER_ERROR');
    }

    if (!data) {
      ctx.logger.error('Profile created but no data returned', { userId: input.id });
      throw new ORPCError('INTERNAL_SERVER_ERROR');
    }

    ctx.logger.info('Profile created successfully', { userId: input.id, role: data.role });
    return ProfileSchema.parse(data);
  } catch (error) {
    ctx.logger.error('Create profile handler error', { error, userId: input.id });

    // Re-throw ORPCError
    if (error instanceof ORPCError) {
      throw error;
    }

    // Gestion erreur schema validation
    if (error instanceof Error && error.name === 'ZodError') {
      throw new ORPCError('BAD_REQUEST');
    }

    throw new ORPCError('INTERNAL_SERVER_ERROR');
  }
}

/**
 * Handler pour mettre à jour un profil utilisateur
 * Nouveau handler pour support update complet
 */
export async function updateProfileHandler(ctx: AppContext, input: { id: string; updates: ProfileUpdateRequest }) {
  ctx.logger.info('updateProfileHandler called', { userId: input.id });

  // Validation input
  const validatedUpdates = ProfileUpdateSchema.parse(input.updates);

  try {
    const adminClient = ctx.supabase.getAdminClient();
    const profileService = createProfileService(adminClient);
    // Filtrer les champs undefined et convertir types pour Database
    const updateData: Database['public']['Tables']['user_profiles']['Update'] = {};

    if (validatedUpdates.full_name !== undefined) {
      updateData.full_name = validatedUpdates.full_name;
    }
    if (validatedUpdates.role !== undefined) {
      updateData.role = validatedUpdates.role;
    }
    if (validatedUpdates.status !== undefined) {
      updateData.status = validatedUpdates.status;
    }
    if (validatedUpdates.referrer_id !== undefined) {
      updateData.referrer_id = validatedUpdates.referrer_id;
    }
    if (validatedUpdates.onboarding_completed !== undefined) {
      updateData.onboarding_completed = validatedUpdates.onboarding_completed;
    }
    if (validatedUpdates.onboarding_completed_at !== undefined) {
      updateData.onboarding_completed_at = validatedUpdates.onboarding_completed_at;
    }
    if (validatedUpdates.consents !== undefined) {
      updateData.consents = validatedUpdates.consents as Json; // Consents -> Json
    }

    const { data, error } = await profileService.updateProfile(input.id, updateData);

    if (error) {
      ctx.logger.error('Database error', { error, userId: input.id });

      if (error.code === '23514') {
        throw new ORPCError('BAD_REQUEST');
      }

      throw new ORPCError('INTERNAL_SERVER_ERROR');
    }

    if (!data) {
      ctx.logger.info('Profile not found for update', { userId: input.id });
      throw new ORPCError('NOT_FOUND');
    }

    ctx.logger.info('Profile updated successfully', { userId: input.id });
    return ProfileSchema.parse(data);
  } catch (error) {
    ctx.logger.error('Update profile handler error', { error, userId: input.id });

    if (error instanceof ORPCError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'ZodError') {
      throw new ORPCError('BAD_REQUEST');
    }

    throw new ORPCError('INTERNAL_SERVER_ERROR');
  }
}
