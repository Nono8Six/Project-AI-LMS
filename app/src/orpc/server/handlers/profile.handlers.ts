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
import { PERMISSIONS, PermissionService } from '@/shared/services/permission.service';

/**
 * Handler pour récupérer un profil utilisateur
 * Validation complète avec nouveau ProfileSchema (11 colonnes)
 */
export async function getProfileHandler(ctx: AppContext, input: { id: string }) {
  ctx.logger.info('getProfileHandler called', {
    userId: input.id,
    requesterId: ctx.user?.id,
    isOwnProfile: ctx.user?.id === input.id
  });

  // SÉCURITÉ: Vérifier l'authentification
  if (!ctx.user) {
    throw new ORPCError('UNAUTHORIZED');
  }

  // SÉCURITÉ: Vérifier l'ownership ou permissions admin
  const isOwnProfile = ctx.user.id === input.id;
  const userPermissions = ctx.user.permissions ?? [];
  const canManageProfiles = PermissionService.isAdmin(ctx.user.profile) || userPermissions.includes(PERMISSIONS.ADMIN_USERS);

  if (!isOwnProfile && !canManageProfiles) {
    ctx.logger.warn('Unauthorized profile access attempt', {
      requesterId: ctx.user.id,
      targetUserId: input.id,
      hasAdminPermissions: canManageProfiles
    });
    throw new ORPCError('FORBIDDEN');
  }

  try {
    // Utiliser le client utilisateur pour les requêtes own profile (RLS)
    // Ou admin client seulement pour les admins
    const client = canManageProfiles ? ctx.supabase.getAdminClient() : ctx.supabase.getUserClient();
    if (!client) {
      throw new ORPCError('INTERNAL_SERVER_ERROR');
    }
    const profileService = createProfileService(client);

    ctx.logger.debug('Fetching profile from database', {
      userId: input.id,
      hasClient: !!client,
      hasProfileService: !!profileService,
      usingAdminClient: canManageProfiles
    });

    const { data, error } = await profileService.getProfile(input.id);

    if (error) {
      ctx.logger.error('Database error in getProfile', {
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        },
        userId: input.id
      });
      throw new ORPCError('INTERNAL_SERVER_ERROR');
    }

    if (!data) {
      ctx.logger.info('Profile not found', { userId: input.id });
      return null;
    }

    ctx.logger.debug('Profile data retrieved', {
      userId: input.id,
      hasData: !!data,
      dataKeys: Object.keys(data),
      role: data.role,
      status: data.status
    });

    // Validation schema avec toutes les 11 colonnes
    return ProfileSchema.parse(data);
  } catch (error) {
    // Gestion spécifique erreurs de parsing schema
    if (error instanceof Error && error.name === 'ZodError') {
      ctx.logger.error('Schema validation error', {
        error: error.message,
        userId: input.id,
        errorDetails: error.message
      });
      throw new ORPCError('INTERNAL_SERVER_ERROR');
    }

    ctx.logger.error('Profile handler error', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : error,
      userId: input.id
    });
    throw new ORPCError('INTERNAL_SERVER_ERROR');
  }
}

/**
 * Handler pour créer un nouveau profil utilisateur
 * Support complet des nouveaux champs (role, status, referrer_id, consents)
 */
export async function createProfileHandler(ctx: AppContext, input: ProfileCreateRequest) {
  ctx.logger.info('createProfileHandler called', { userId: input.id });

  // SÉCURITÉ: Vérifier l'authentification
  if (!ctx.user) {
    throw new ORPCError('UNAUTHORIZED');
  }

  // SÉCURITÉ: Vérifier que l'utilisateur crée son propre profil ou est admin
  const isOwnProfile = ctx.user.id === input.id;
  const userPermissions = ctx.user.permissions ?? [];
  const canManageProfiles = PermissionService.isAdmin(ctx.user.profile) || userPermissions.includes(PERMISSIONS.ADMIN_USERS);

  if (!isOwnProfile && !canManageProfiles) {
    ctx.logger.warn('Unauthorized profile creation attempt', {
      requesterId: ctx.user.id,
      targetUserId: input.id,
      hasAdminPermissions: canManageProfiles
    });
    throw new ORPCError('FORBIDDEN');
  }

  // Validation input avec nouveau schema complet
  const validatedInput = ProfileCreateSchema.parse(input);

  // SÉCURITÉ: Empêcher escalation de privilèges
  // Seuls les admins peuvent créer des profils avec role != 'member'
  if (validatedInput.role && validatedInput.role !== 'member' && !canManageProfiles) {
    ctx.logger.warn('Privilege escalation attempt in profile creation', {
      requesterId: ctx.user.id,
      attemptedRole: validatedInput.role
    });
    throw new ORPCError('FORBIDDEN');
  }

  // SÉCURITÉ: Empêcher modification de status pour non-admins
  if (validatedInput.status && validatedInput.status !== 'active' && !canManageProfiles) {
    ctx.logger.warn('Status modification attempt in profile creation', {
      requesterId: ctx.user.id,
      attemptedStatus: validatedInput.status
    });
    throw new ORPCError('FORBIDDEN');
  }

  try {
    // Utiliser le client approprié selon les permissions
    const client = canManageProfiles ? ctx.supabase.getAdminClient() : ctx.supabase.getUserClient();
    if (!client) {
      throw new ORPCError('INTERNAL_SERVER_ERROR');
    }
    const profileService = createProfileService(client);

    // Construire les données pour Supabase avec valeurs par défaut SÉCURISÉES
    const profileData: Database['public']['Tables']['user_profiles']['Insert'] = {
      id: validatedInput.id,
      full_name: validatedInput.full_name,
      // SÉCURITÉ: Role forcé à 'member' sauf pour les admins
      role: canManageProfiles ? (validatedInput.role ?? 'member') : 'member',
      // SÉCURITÉ: Status forcé à 'active' sauf pour les admins
      status: canManageProfiles ? (validatedInput.status ?? 'active') : 'active',
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

  // SÉCURITÉ: Vérifier l'authentification
  if (!ctx.user) {
    throw new ORPCError('UNAUTHORIZED');
  }

  // SÉCURITÉ: Vérifier l'ownership ou permissions admin
  const isOwnProfile = ctx.user.id === input.id;
  const userPermissions = ctx.user.permissions ?? [];
  const canManageProfiles = PermissionService.isAdmin(ctx.user.profile) || userPermissions.includes(PERMISSIONS.ADMIN_USERS);

  if (!isOwnProfile && !canManageProfiles) {
    ctx.logger.warn('Unauthorized profile update attempt', {
      requesterId: ctx.user.id,
      targetUserId: input.id,
      hasAdminPermissions: canManageProfiles
    });
    throw new ORPCError('FORBIDDEN');
  }

  // Validation input
  const validatedUpdates = ProfileUpdateSchema.parse(input.updates);

  // SÉCURITÉ: Empêcher escalation de privilèges pour non-admins
  if (!canManageProfiles) {
    if (validatedUpdates.role !== undefined) {
      ctx.logger.warn('Role modification attempt by non-admin', {
        requesterId: ctx.user.id,
        targetUserId: input.id,
        attemptedRole: validatedUpdates.role
      });
      throw new ORPCError('FORBIDDEN');
    }

    if (validatedUpdates.status !== undefined) {
      ctx.logger.warn('Status modification attempt by non-admin', {
        requesterId: ctx.user.id,
        targetUserId: input.id,
        attemptedStatus: validatedUpdates.status
      });
      throw new ORPCError('FORBIDDEN');
    }
  }

  try {
    // Utiliser le client approprié selon les permissions
    const client = canManageProfiles ? ctx.supabase.getAdminClient() : ctx.supabase.getUserClient();
    if (!client) {
      throw new ORPCError('INTERNAL_SERVER_ERROR');
    }
    const profileService = createProfileService(client);

    // Filtrer les champs undefined et convertir types pour Database
    const updateData: Database['public']['Tables']['user_profiles']['Update'] = {};

    if (validatedUpdates.full_name !== undefined) {
      updateData.full_name = validatedUpdates.full_name;
    }

    // SÉCURITÉ: Role et status seulement pour les admins (double vérification)
    if (canManageProfiles) {
      if (validatedUpdates.role !== undefined) {
        updateData.role = validatedUpdates.role;
      }
      if (validatedUpdates.status !== undefined) {
        updateData.status = validatedUpdates.status;
      }
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
