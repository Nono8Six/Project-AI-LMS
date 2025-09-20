/**
 * PermissionService - Gestion centralisée des permissions avec cache intelligent
 * Architecture extensible V1→V2 : simple member/admin → RBAC complet
 */
import type { UserProfile } from '@/orpc/server/context';

// Actions permissions V1 (extensible V2)
export const PERMISSIONS = {
  // Auth management
  AUTH_MANAGE: 'auth.manage',

  // Profile actions
  PROFILE_VIEW: 'profile.view',
  PROFILE_EDIT: 'profile.edit',

  // Purchase actions
  PURCHASE_VIEW: 'purchase.view',

  // Referral actions
  REFERRAL_MANAGE: 'referral.manage',

  // Admin actions
  ADMIN_USERS: 'admin.users',
  ADMIN_SETTINGS: 'admin.settings',
  ADMIN_ANALYTICS: 'admin.analytics',

  // System actions
  SYSTEM_AUDIT: 'system.audit',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Cache stateless (pas de timer global)
class PermissionCache {
  private cache = new Map<string, { permissions: Permission[]; expiresAt: number }>();

  get(userId: string): Permission[] | null {
    const entry = this.cache.get(userId);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(userId);
      return null;
    }

    return entry.permissions;
  }

  set(userId: string, permissions: Permission[]): void {
    this.cache.set(userId, {
      permissions: [...permissions],
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
  }

  invalidate(userId: string): void {
    this.cache.delete(userId);
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [userId, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(userId);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

const permissionCache = new PermissionCache();

/**
 * Interface extensible pour vérification permissions
 */
export interface PermissionContext {
  readonly action: Permission;
  readonly resource?: string; // resourceId pour ownership checks
  readonly metadata?: Record<string, unknown>;
}

/**
 * Service centralisé permissions avec architecture extensible
 */
export class PermissionService {
  static calculatePermissions(
    user: { id: string; email: string | null },
    profile: UserProfile | null
  ): Permission[] {
    if (!profile) {
      return [];
    }

    const role = profile.role;
    const status = profile.status;

    if (status === 'suspended') {
      return [];
    }

    const basePermissions: Permission[] = [
      PERMISSIONS.PROFILE_VIEW,
      PERMISSIONS.PROFILE_EDIT,
      PERMISSIONS.PURCHASE_VIEW,
      PERMISSIONS.REFERRAL_MANAGE,
    ];

    if (role === 'admin') {
      return [
        ...basePermissions,
        PERMISSIONS.AUTH_MANAGE,
        PERMISSIONS.ADMIN_USERS,
        PERMISSIONS.ADMIN_SETTINGS,
        PERMISSIONS.ADMIN_ANALYTICS,
        PERMISSIONS.SYSTEM_AUDIT,
      ];
    }

    return basePermissions;
  }

  static async hasPermission(
    user: { id: string; email: string | null },
    profile: UserProfile | null,
    context: PermissionContext
  ): Promise<boolean> {
    if (!user || !profile) return false;

    permissionCache.clearExpired();

    let permissions = permissionCache.get(user.id);

    if (!permissions) {
      permissions = this.calculatePermissions(user, profile);
      permissionCache.set(user.id, permissions);
    }

    const hasBasicPermission = permissions.includes(context.action);

    if (!context.resource) {
      return hasBasicPermission;
    }

    if (hasBasicPermission) {
      return this.checkResourceOwnership(user, context);
    }

    return false;
  }

  private static checkResourceOwnership(
    user: { id: string; email: string | null },
    context: PermissionContext
  ): boolean {
    switch (context.action) {
      case PERMISSIONS.PROFILE_VIEW:
      case PERMISSIONS.PROFILE_EDIT:
        return context.resource === user.id;

      case PERMISSIONS.PURCHASE_VIEW:
        return true;

      default:
        return true;
    }
  }

  static invalidateUserPermissions(userId: string): void {
    permissionCache.invalidate(userId);
  }

  static hasRole(profile: UserProfile | null, role: string): boolean {
    return profile?.role === role && profile?.status === 'active';
  }

  static isAdmin(profile: UserProfile | null): boolean {
    return this.hasRole(profile, 'admin');
  }

  static isActiveMember(profile: UserProfile | null): boolean {
    return profile?.status === 'active' && profile?.role === 'member';
  }

  static clearCache(): void {
    permissionCache.clear();
  }
}

export type { UserProfile };
export { permissionCache };
