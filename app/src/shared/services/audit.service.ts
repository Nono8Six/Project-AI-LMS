/**
 * AuditService - Service audit complet avec logging actions auth automatique
 * Détection brute force, tracking context request, intégration audit_logs
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.generated';
import type { Logger } from '@/orpc/server/context';
import {
  recordBruteforceFailure,
  isIpBlocked as isIpBlockedPersisted,
  clearBruteforceFailures,
  analyzeBruteforce,
} from '@/shared/services/security.service';
import type { BruteForceAnalysis } from '@/shared/services/security.service';
export type { BruteForceAnalysis };

// Types pour audit events
export type AuditAction =
  | 'auth.signup'
  | 'auth.signin'
  | 'auth.signout'
  | 'auth.refresh'
  | 'auth.failed_login'
  | 'auth.password_reset'
  | 'auth.email_verify'
  | 'profile.create'
  | 'profile.update'
  | 'profile.view'
  | 'security.suspicious_activity'
  | 'security.brute_force_detected'
  | 'security.rate_limit_exceeded'
  | 'admin.user_suspend'
  | 'admin.user_activate'
  | 'system.error'
  | 'system.health_check';

export type AuditResourceType =
  | 'user'
  | 'session'
  | 'profile'
  | 'system'
  | 'security'
  | 'admin';

// Interface pour audit entry
export interface AuditEntry {
  readonly action: AuditAction;
  readonly resourceType: AuditResourceType;
  readonly resourceId?: string | undefined;
  readonly userId?: string | undefined;
  readonly requestId?: string | undefined;
  readonly ipAddress?: string | undefined;
  readonly userAgent?: string | undefined;
  readonly details?: Record<string, unknown> | undefined;
}

// Context request enrichi pour audit
export interface AuditContext {
  readonly requestId: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  userId?: string | undefined;
  readonly timestamp: string;
}

/**
 * Service centralisé audit avec détection sécurité
 */
export class AuditService {
  /**
   * Log action générique dans audit_logs
   */
  static async logAction(
    supabaseClient: SupabaseClient<Database>,
    entry: AuditEntry,
    context: AuditContext,
    logger: Logger
  ): Promise<boolean> {
    try {
      const auditRecord: Database['public']['Tables']['audit_logs']['Insert'] = {
        action: entry.action,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId || null,
        user_id: entry.userId || context.userId || null,
        request_id: entry.requestId || context.requestId,
        ip_address: entry.ipAddress || context.ipAddress || null,
        user_agent: entry.userAgent || context.userAgent || null,
        details: (entry.details || {}) as any,
        created_at: context.timestamp
      };

      const { error } = await supabaseClient
        .from('audit_logs')
        .insert(auditRecord);

      if (error) {
        logger.error('Failed to insert audit log', {
          action: entry.action,
          error: error.message,
          requestId: context.requestId
        });
        return false;
      }

      logger.debug('Audit log recorded', {
        action: entry.action,
        resourceType: entry.resourceType,
        userId: entry.userId,
        requestId: context.requestId
      });

      return true;
    } catch (e) {
      logger.error('Audit logging exception', {
        action: entry.action,
        error: e instanceof Error ? e.message : 'Unknown error',
        requestId: context.requestId
      });
      return false;
    }
  }

  /**
   * Log spécialisé actions auth avec enrichissement automatique
   */
  static async logAuth(
    supabaseClient: SupabaseClient<Database>,
    action: Extract<AuditAction, `auth.${string}`>,
    context: AuditContext & {
      userId?: string | undefined;
      sessionId?: string | undefined;
      success?: boolean | undefined;
      failureReason?: string | undefined;
    },
    logger: Logger
  ): Promise<boolean> {
    const details: Record<string, unknown> = {
      timestamp: context.timestamp,
      sessionId: context.sessionId,
      success: context.success ?? true
    };

    if (context.failureReason) {
      details.failureReason = context.failureReason;
    }

    // Détection brute force pour échecs login
    if (action === 'auth.failed_login' && context.ipAddress) {
      const analysis = await recordBruteforceFailure(supabaseClient, context.ipAddress);
      details.bruteForceAnalysis = analysis;

      // Log séparé si suspicious
      if (analysis.isSuspicious) {
        await this.logSecurity(
          supabaseClient,
          analysis.riskLevel === 'CRITICAL' ? 'security.brute_force_detected' : 'security.suspicious_activity',
          {
            ...context,
            riskLevel: analysis.riskLevel,
            failedAttempts: analysis.failedAttempts,
            timeWindow: analysis.timeWindow
          },
          logger
        );
      }
    }

    return this.logAction(
      supabaseClient,
      {
        action,
        resourceType: 'user',
        resourceId: context.userId,
        userId: context.userId,
        requestId: context.requestId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        details
      },
      context,
      logger
    );
  }

  /**
   * Log spécialisé événements sécurité avec alertes
   */
  static async logSecurity(
    supabaseClient: SupabaseClient<Database>,
    action: Extract<AuditAction, `security.${string}`>,
    context: AuditContext & {
      riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      threatType?: string;
      failedAttempts?: number;
      timeWindow?: number;
      blockedUntil?: string;
    },
    logger: Logger
  ): Promise<boolean> {
    const details: Record<string, unknown> = {
      timestamp: context.timestamp,
      riskLevel: context.riskLevel || 'MEDIUM',
      threatType: context.threatType || 'authentication',
      failedAttempts: context.failedAttempts,
      timeWindow: context.timeWindow,
      blockedUntil: context.blockedUntil
    };

    // Log niveau approprié selon risk
    const logLevel = context.riskLevel === 'CRITICAL' ? 'error' :
                    context.riskLevel === 'HIGH' ? 'warn' : 'info';

    logger[logLevel]('Security event detected', {
      action,
      riskLevel: context.riskLevel,
      ipAddress: context.ipAddress,
      userId: context.userId,
      requestId: context.requestId
    });

    return this.logAction(
      supabaseClient,
      {
        action,
        resourceType: 'security',
        resourceId: context.ipAddress,
        userId: context.userId,
        requestId: context.requestId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        details
      },
      context,
      logger
    );
  }

  /**
   * Vérifier si IP est bloquée pour brute force
   */
  static async isBlocked(
    supabaseClient: SupabaseClient<Database>,
    ipAddress: string
  ): Promise<boolean> {
    return isIpBlockedPersisted(supabaseClient, ipAddress);
  }

  /**
   * Nettoyer tentatives pour IP (après succès login)
   */
  static async clearFailedAttempts(
    supabaseClient: SupabaseClient<Database>,
    ipAddress: string
  ): Promise<void> {
    await clearBruteforceFailures(supabaseClient, ipAddress);
  }

  /**
   * Analyser patterns pour IP donnée
   */
  static async analyzePattern(
    supabaseClient: SupabaseClient<Database>,
    ipAddress: string
  ): Promise<BruteForceAnalysis | null> {
    return analyzeBruteforce(supabaseClient, ipAddress);
  }

  /**
   * Helper pour créer context audit depuis AppContext
   */
  static createContext(
    requestId: string,
    ipAddress?: string,
    userAgent?: string,
    userId?: string
  ): AuditContext {
    const context: AuditContext = {
      requestId,
      timestamp: new Date().toISOString()
    };
    if (ipAddress) context.ipAddress = ipAddress;
    if (userAgent) context.userAgent = userAgent;
    if (userId) context.userId = userId;
    return context;
  }

  /**
   * Nettoyage cache (pour tests)
   */
  static clearCache(): void {
    // No-op: stockage persistant
  }
}
