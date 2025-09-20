import type { AppContext, UserProfile, AuthUser } from '../context';
import { ORPCError } from '@orpc/client';
import { z } from 'zod';
import { PermissionService } from '@/shared/services/permission.service';
import { SessionService } from '@/shared/services/session.service';
import { AuditService } from '@/shared/services/audit.service';

// Zod schema pour valider les utilisateurs Supabase de manière sécurisée
const SupabaseUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable().optional(),
  user_metadata: z.object({
    role: z.string().optional(),
  }).optional(),
});

type _ValidatedSupabaseUser = z.infer<typeof SupabaseUserSchema>;

// Helper pour extraire message d'erreur de manière sécurisée
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

function extractToken(headers: Record<string, string>): string | undefined {
  const h = headers['authorization'];
  if (!h) return undefined;
  const [scheme, token] = h.split(' ');
  if (scheme && token && /^bearer$/i.test(scheme)) return token;
  return undefined;
}

/**
 * Récupérer profile complet utilisateur depuis user_profiles
 */
async function fetchUserProfile(
  userId: string,
  supabaseClient: ReturnType<AppContext['supabase']['getAdminClient']>,
  logger: AppContext['logger']
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      logger.warn('Failed to fetch user profile', { userId, error: error.message });
      return null;
    }

    if (!data) {
      logger.warn('User profile not found', { userId });
      return null;
    }

    // Transform database row to UserProfile type
    return {
      id: data.id,
      full_name: data.full_name,
      email: null, // Will be filled from auth user
      role: data.role,
      status: data.status,
      onboarding_completed: data.onboarding_completed,
      onboarding_completed_at: data.onboarding_completed_at,
      referral_code: data.referral_code,
      referrer_id: data.referrer_id,
      consents: data.consents,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (e) {
    logger.error('Exception fetching user profile', { userId, err: getErrorMessage(e) });
    return null;
  }
}

export async function resolveUser(ctx: AppContext): Promise<AppContext> {
  const token = extractToken(ctx.headers) ?? ctx.session.accessToken ?? undefined;
  const adminClient = ctx.supabase.getAdminClient();

  // Vérifier brute force AVANT traitement auth
  if (ctx.meta.ip && (await AuditService.isBlocked(adminClient, ctx.meta.ip))) {
    const auditContext = AuditService.createContext(
      ctx.meta.requestId,
      ctx.meta.ip || undefined,
      ctx.headers['user-agent'] || undefined
    );

    await AuditService.logSecurity(
      adminClient,
      'security.brute_force_detected',
      {
        ...auditContext,
        riskLevel: 'CRITICAL',
        threatType: 'blocked_ip'
      },
      ctx.logger
    );

    ctx.logger.warn('Blocked IP attempted access', { ip: ctx.meta.ip });
    return { ...ctx, user: null };
  }

  if (!token) {
    return { ...ctx, user: null };
  }

  try {
    // NOUVEAU: Validation session avec détection expiration
    const sessionContext = {
      requestId: ctx.meta.requestId,
      ...(ctx.headers['user-agent'] ? { userAgent: ctx.headers['user-agent'] } : {}),
      ...(ctx.meta.ip ? { ipAddress: ctx.meta.ip } : {})
    };
    const sessionValidation = await SessionService.validateSession(token, sessionContext, adminClient);

    if (!sessionValidation.isValid) {
      ctx.logger.debug('Session validation failed', {
        reason: sessionValidation.reason,
        needsRefresh: sessionValidation.needsRefresh
      });

      if (sessionValidation.reason && sessionValidation.reason !== 'NO_TOKEN') {
        const auditContext = AuditService.createContext(
          ctx.meta.requestId,
          ctx.meta.ip || undefined,
          ctx.headers['user-agent'] || undefined
        );

        await AuditService.logAuth(
          adminClient,
          'auth.failed_login',
          {
            ...auditContext,
            success: false,
            failureReason: sessionValidation.reason || 'INVALID_SESSION'
          },
          ctx.logger
        );
      }

      return { ...ctx, user: null };
    }

    // Log si refresh recommandé
    if (sessionValidation.needsRefresh) {
      ctx.logger.info('Token expires soon, refresh recommended', {
        sessionId: sessionValidation.metadata?.sessionId,
        expiresAt: sessionValidation.metadata?.expiresAt
      });
    }

    let authUser: { id: string; email: string | null } | null = null;

    // Prefer service role for reliable verification
    try {
      const { data, error } = await adminClient.auth.getUser(token);
      if (!error && data?.user) {
        // Validation sécurisée avec Zod au lieu de cast dangereux
        const parseResult = SupabaseUserSchema.safeParse(data.user);
        if (parseResult.success) {
          const user = parseResult.data;
          authUser = { id: user.id, email: user.email ?? null };
        } else {
          ctx.logger.warn('Invalid user data from Supabase admin client', { userId: data.user?.id });
        }
      } else {
        ctx.logger.debug('Admin getUser failed, fallback to anon client', { reason: error?.message });
      }
    } catch (e) {
      ctx.logger.debug('Admin client unavailable, fallback to anon client', { err: getErrorMessage(e) });
    }

    // Fallback to user client if admin failed
    if (!authUser) {
      const userClient = ctx.supabase.getUserClient();
      if (userClient) {
        const { data, error } = await userClient.auth.getUser(token);
        if (!error && data?.user) {
          // Validation sécurisée avec Zod au lieu de cast dangereux
          const parseResult = SupabaseUserSchema.safeParse(data.user);
          if (parseResult.success) {
            const user = parseResult.data;
            authUser = { id: user.id, email: user.email ?? null };
          } else {
            ctx.logger.warn('Invalid user data from Supabase user client', { userId: data.user?.id });
          }
        } else {
          ctx.logger.debug('Anon getUser failed', { reason: error?.message });
        }
      }
    }

    // If we have an authenticated user, fetch their complete profile
    if (authUser) {
      const profile = await fetchUserProfile(authUser.id, adminClient, ctx.logger);

      if (profile) {
        // Add email from auth to profile
        const completeProfile: UserProfile = {
          ...profile,
          email: authUser.email,
        };

        // Calculate permissions using PermissionService
        const permissions = PermissionService.calculatePermissions(authUser, completeProfile);

        const enhancedUser: AuthUser = {
          id: authUser.id,
          email: authUser.email,
          profile: completeProfile,
          permissions,
        };

        ctx.logger.debug('User resolved with complete profile', {
          userId: authUser.id,
          role: completeProfile.role,
          status: completeProfile.status,
          onboardingCompleted: completeProfile.onboarding_completed,
          permissionsCount: permissions.length
        });

        // Mettre à jour activité session
        if (sessionValidation.metadata?.sessionId) {
          await SessionService.updateSessionActivity(adminClient, sessionValidation.metadata.sessionId);
        }

        // Audit successful auth
        const auditContext = AuditService.createContext(
          ctx.meta.requestId,
          ctx.meta.ip || undefined,
          ctx.headers['user-agent'] || undefined,
          authUser.id
        );

        if (sessionValidation.isNewSession) {
          await AuditService.logAuth(
            adminClient,
            'auth.signin',
            {
              ...auditContext,
              userId: authUser.id,
              ...(sessionValidation.metadata?.sessionId
                ? { sessionId: sessionValidation.metadata.sessionId }
                : {}),
              success: true
            },
            ctx.logger
          );
        }

        // Nettoyer tentatives failed login pour cette IP (audit et rate limiting)
        if (ctx.meta.ip) {
          await AuditService.clearFailedAttempts(adminClient, ctx.meta.ip);
        }

        return { ...ctx, user: enhancedUser };
      } else {
        ctx.logger.warn('Auth user found but no profile - creating basic user context', { userId: authUser.id });
        // User exists in auth but no profile - return basic user without profile
        const basicUser: AuthUser = {
          id: authUser.id,
          email: authUser.email,
          profile: null,
          permissions: [], // Empty permissions array instead of null
        };
        return { ...ctx, user: basicUser };
      }
    }

    return { ...ctx, user: null };
  } catch (e) {
    ctx.logger.warn('Auth resolution failed', { err: getErrorMessage(e) });
    // treat as unauthenticated instead of throwing
    return { ...ctx, user: null };
  }
}

export function requireAuth(ctx: AppContext): void {
  if (!ctx.user) throw new ORPCError('UNAUTHORIZED');
}

export function requireRole(ctx: AppContext, role: string): void {
  if (!ctx.user) throw new ORPCError('UNAUTHORIZED');
  if (!ctx.user.profile || ctx.user.profile.role !== role) throw new ORPCError('FORBIDDEN');
}

export function requirePermission(ctx: AppContext, permission: string): void {
  if (!ctx.user) throw new ORPCError('UNAUTHORIZED');
  if (!ctx.user.permissions || !ctx.user.permissions.includes(permission)) {
    throw new ORPCError('FORBIDDEN');
  }
}
