import { MeOutput, LogoutOutput, RefreshOutput } from '@/orpc/contracts/auth.contract';
import type { AppContext } from '@/orpc/server/context';
import { ORPCError } from '@orpc/client';
import { SessionService } from '@/shared/services/session.service';
import { AuditService } from '@/shared/services/audit.service';

export async function meHandler(ctx: AppContext) {
  ctx.logger.debug('meHandler called', {
    hasUser: !!ctx.user,
    hasAuth: !!ctx.headers['authorization'],
    hasAccessToken: !!ctx.session.accessToken
  });

  if (!ctx.user) {
    ctx.logger.debug('No user found in context', {
      sessionTokens: {
        hasAccessToken: !!ctx.session.accessToken,
        hasRefreshToken: !!ctx.session.refreshToken
      }
    });
    return null;
  }

  const out = {
    id: ctx.user.id,
    email: ctx.user.email ?? null,
    role: ctx.user.profile?.role ?? null
  };

  ctx.logger.debug('User data resolved', {
    userId: ctx.user.id,
    hasProfile: !!ctx.user.profile,
    role: ctx.user.profile?.role
  });

  return MeOutput.nullable().parse(out);
}

export async function meRequiredHandler(ctx: AppContext) {
  ctx.logger.debug('meRequiredHandler called', {
    hasUser: !!ctx.user,
    hasAuth: !!ctx.headers['authorization'],
    hasAccessToken: !!ctx.session.accessToken
  });

  if (!ctx.user) {
    ctx.logger.warn('Unauthorized access attempt', {
      hasAuth: !!ctx.headers['authorization'],
      hasAccessToken: !!ctx.session.accessToken,
      hasRefreshToken: !!ctx.session.refreshToken,
      ip: ctx.meta.ip,
      userAgent: ctx.meta.userAgent
    });
    throw new ORPCError('UNAUTHORIZED');
  }

  const out = {
    id: ctx.user.id,
    email: ctx.user.email ?? null,
    role: ctx.user.profile?.role ?? null
  };

  ctx.logger.debug('Secure endpoint access granted', {
    userId: ctx.user.id,
    role: ctx.user.profile?.role
  });

  return MeOutput.parse(out);
}

export async function logoutHandler(ctx: AppContext, input?: { allDevices?: boolean }) {
  if (!ctx.user) throw new ORPCError('UNAUTHORIZED');

  try {
    const token = extractToken(ctx.headers);
    if (!token) {
      return LogoutOutput.parse({
        success: false,
        message: 'No active session found'
      });
    }

    const sessionId = SessionService.getSessionIdFromToken(token);

    const auditContext = AuditService.createContext(
      ctx.meta.requestId,
      ctx.meta.ip || undefined,
      ctx.headers['user-agent'] || undefined,
      ctx.user.id
    );

    if (input?.allDevices) {
      // Logout de tous les appareils
      await SessionService.invalidateUserSessions(
        ctx.supabase.getAdminClient(),
        ctx.user.id,
        'ADMIN',
        token
      );
      ctx.logger.info('User logged out from all devices', { userId: ctx.user.id });

      // Audit logout all devices
      await AuditService.logAuth(
        ctx.supabase.getAdminClient(),
        'auth.signout',
        {
          ...auditContext,
          userId: ctx.user.id,
          success: true,
          sessionId: 'all_devices'
        },
        ctx.logger
      );

      return LogoutOutput.parse({
        success: true,
        message: 'Logged out from all devices'
      });
    } else {
      // Logout session courante uniquement
      if (sessionId) {
        await SessionService.invalidateSession(
          ctx.supabase.getAdminClient(),
          sessionId,
          'LOGOUT',
          token
        );
      }
      ctx.logger.info('User logged out', { userId: ctx.user.id, sessionId });

      // Audit logout single session
      await AuditService.logAuth(
        ctx.supabase.getAdminClient(),
        'auth.signout',
        {
          ...auditContext,
          userId: ctx.user.id,
          sessionId: sessionId || 'unknown',
          success: true
        },
        ctx.logger
      );

      return LogoutOutput.parse({
        success: true,
        message: 'Logged out successfully'
      });
    }
  } catch (e) {
    ctx.logger.error('Logout failed', {
      userId: ctx.user.id,
      error: e instanceof Error ? e.message : 'Unknown error'
    });

    return LogoutOutput.parse({
      success: false,
      message: 'Logout failed'
    });
  }
}

export async function refreshHandler(ctx: AppContext) {
  const token = extractToken(ctx.headers) ?? ctx.session.accessToken ?? undefined;
  const refreshToken = ctx.session.refreshToken;

  ctx.logger.debug('refreshHandler called', {
    hasToken: !!token,
    hasRefreshToken: !!refreshToken,
    hasAuthHeader: !!ctx.headers['authorization'],
    hasAccessTokenSession: !!ctx.session.accessToken
  });

  if (!token || !refreshToken) {
    ctx.logger.warn('Refresh attempted without required tokens', {
      hasToken: !!token,
      hasRefreshToken: !!refreshToken,
      tokenSource: token === ctx.session.accessToken ? 'session' :
                   token === extractToken(ctx.headers) ? 'header' : 'none'
    });
    return RefreshOutput.parse({
      success: false,
      needsRefresh: false,
      message: 'No token provided'
    });
  }

  try {
    // Valider session pour vérifier si refresh nécessaire
    const sessionContext = {
      requestId: ctx.meta.requestId,
      ...(ctx.headers['user-agent'] ? { userAgent: ctx.headers['user-agent'] } : {}),
      ...(ctx.meta.ip ? { ipAddress: ctx.meta.ip } : {})
    };
    const adminClient = ctx.supabase.getAdminClient();

    ctx.logger.debug('Validating session for refresh', {
      sessionContext,
      hasAdminClient: !!adminClient
    });

    const sessionValidation = await SessionService.validateSession(token, sessionContext, adminClient);

    ctx.logger.debug('Session validation result', {
      isValid: sessionValidation.isValid,
      needsRefresh: sessionValidation.needsRefresh,
      reason: sessionValidation.reason,
      hasMetadata: !!sessionValidation.metadata
    });

    if (!sessionValidation.isValid) {
      ctx.logger.warn('Session validation failed', {
        reason: sessionValidation.reason,
        userId: ctx.user?.id
      });
      return RefreshOutput.parse({
        success: false,
        needsRefresh: true,
        message: `Session invalid: ${sessionValidation.reason}`
      });
    }

    if (sessionValidation.needsRefresh) {
      // Tentative de refresh via Supabase
      const userClient = ctx.supabase.getUserClient();
      if (userClient) {
        const refreshResult = await SessionService.refreshSession(
          userClient,
          refreshToken,
          token,
          adminClient
        );

        if (refreshResult.success) {
          ctx.logger.info('Session refreshed successfully', {
            userId: ctx.user?.id,
            expiresAt: refreshResult.expiresAt
          });

          // Audit successful refresh
          const auditContext = AuditService.createContext(
            ctx.meta.requestId,
            ctx.meta.ip || undefined,
            ctx.headers['user-agent'] || undefined,
            ctx.user?.id
          );

          await AuditService.logAuth(
            adminClient,
            'auth.refresh',
            {
              ...auditContext,
              ...(ctx.user?.id ? { userId: ctx.user.id } : {}),
              success: true
            },
            ctx.logger
          );

          return RefreshOutput.parse({
            success: true,
            needsRefresh: false,
            expiresAt: refreshResult.expiresAt,
            message: 'Session refreshed successfully'
          });
        } else {
          return RefreshOutput.parse({
            success: false,
            needsRefresh: true,
            message: `Refresh failed: ${refreshResult.error}`
          });
        }
      }
    }

    // Session valide, pas de refresh nécessaire
    return RefreshOutput.parse({
      success: true,
      needsRefresh: false,
      expiresAt: sessionValidation.metadata?.expiresAt,
      message: 'Session is valid, no refresh needed'
    });
  } catch (e) {
    ctx.logger.error('Refresh check failed', {
      error: e instanceof Error ? e.message : 'Unknown error'
    });

    return RefreshOutput.parse({
      success: false,
      needsRefresh: true,
      message: 'Refresh check failed'
    });
  }
}

// Helper function pour extraire token (réutilisé du middleware)
function extractToken(headers: Record<string, string>): string | undefined {
  const h = headers['authorization'];
  if (!h) return undefined;
  const [scheme, token] = h.split(' ');
  if (scheme && token && /^bearer$/i.test(scheme)) return token;
  return undefined;
}
