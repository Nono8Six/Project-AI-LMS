import { ProfileSchema, ProfileCreateSchema } from '@/orpc/contracts/profile.contract';
import type { AppContext } from '@/orpc/server/context';
import { profileService } from '@/shared/lib/supabase';
import { ORPCError } from '@orpc/client';

/**
 * Handler pour récupérer un profil utilisateur
 * Test de l'intégration Database + orpc + types
 */
export async function getProfileHandler(ctx: AppContext, input: { id: string }) {
  ctx.logger.info('getProfileHandler called', { userId: input.id });

  try {
    const { data, error } = await profileService.getProfile(input.id);
    
    if (error) {
      ctx.logger.error('Database error', { error, userId: input.id });
      throw new ORPCError('INTERNAL_SERVER_ERROR');
    }

    if (!data) {
      ctx.logger.info('Profile not found', { userId: input.id });
      return null;
    }

    // Validation schema avant retour
    return ProfileSchema.parse(data);
  } catch (error) {
    ctx.logger.error('Profile handler error', { error, userId: input.id });
    throw new ORPCError('INTERNAL_SERVER_ERROR');
  }
}

/**
 * Handler pour créer un nouveau profil utilisateur
 * Test de l'intégration Database + orpc + types
 */
export async function createProfileHandler(ctx: AppContext, input: { id: string; full_name: string }) {
  ctx.logger.info('createProfileHandler called', { userId: input.id });

  // Validation input
  const validatedInput = ProfileCreateSchema.parse(input);

  try {
    const { data, error } = await profileService.createProfile({
      id: validatedInput.id,
      full_name: validatedInput.full_name,
      // created_at et updated_at sont automatiques (DEFAULT now())
    });
    
    if (error) {
      ctx.logger.error('Database error', { error, userId: input.id });
      
      // Gestion erreur contrainte unique
      if (error.code === '23505') {
        throw new ORPCError('CONFLICT');
      }
      
      throw new ORPCError('INTERNAL_SERVER_ERROR');
    }

    if (!data) {
      ctx.logger.error('Profile created but no data returned', { userId: input.id });
      throw new ORPCError('INTERNAL_SERVER_ERROR');
    }

    ctx.logger.info('Profile created successfully', { userId: input.id });
    return ProfileSchema.parse(data);
  } catch (error) {
    ctx.logger.error('Create profile handler error', { error, userId: input.id });
    
    // Re-throw ORPCError
    if (error instanceof ORPCError) {
      throw error;
    }
    
    throw new ORPCError('INTERNAL_SERVER_ERROR');
  }
}