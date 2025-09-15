/**
 * Types pour le système de navigation et routes
 * Phase 3: Route Groups et Navigation
 */

import type { UserRole } from './auth.types';

// Types pour les route groups Next.js
export type RouteGroup = 'public' | 'member' | 'admin';

// Structure des routes typées
export interface RouteDefinition {
  readonly path: string;
  readonly group: RouteGroup;
  readonly requiredRole: UserRole;
  readonly title: string;
  readonly description?: string;
  readonly icon?: string;
  readonly children?: readonly RouteDefinition[];
}

// Types pour les paramètres de routes dynamiques
export interface CourseParams {
  readonly courseId: string;
}

export interface ModuleParams extends CourseParams {
  readonly moduleId: string;
}

export interface LessonParams extends ModuleParams {
  readonly lessonId: string;
}

export interface UserParams {
  readonly userId: string;
}

// Types pour les route handlers
export type RouteParams<T = Record<string, string>> = {
  readonly params: Promise<T>;
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

// Types pour la navigation principale
export interface NavigationItem {
  readonly key: string;
  readonly label: string;
  readonly href: string;
  readonly icon?: string;
  readonly badge?: string | number;
  readonly requiredRole?: UserRole;
  readonly isExternal?: boolean;
  readonly children?: readonly NavigationItem[];
}

// Types pour le breadcrumb
export interface BreadcrumbItem {
  readonly label: string;
  readonly href?: string;
  readonly isCurrentPage?: boolean;
}

// Types pour les layouts
export interface LayoutProps {
  readonly children: React.ReactNode;
  readonly params?: Promise<Record<string, string>>;
}

export interface AuthenticatedLayoutProps extends LayoutProps {
  readonly requiredRole?: UserRole;
}

// Types pour les metadata Next.js
export interface PageMetadata {
  readonly title: string;
  readonly description?: string;
  readonly keywords?: readonly string[];
  readonly openGraph?: {
    readonly title?: string;
    readonly description?: string;
    readonly image?: string;
  };
}

// Types pour la gestion d'état de navigation
export interface NavigationState {
  readonly currentPath: string;
  readonly userRole: UserRole | null;
  readonly isAuthenticated: boolean;
  readonly sidebarOpen: boolean;
}

// Constants pour les routes (utilisées dans la validation)
export const ROUTE_PATHS = {
  // Public routes
  HOME: '/',
  ABOUT: '/about',
  PRICING: '/pricing',
  COURSES: '/cours',
  COURSE_DETAIL: '/cours/[slug]',
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_RESET: '/auth/reset-password',

  // Member routes
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  LEARN: '/learn',
  LEARN_COURSE: '/learn/[courseId]',
  LEARN_MODULE: '/learn/[courseId]/[moduleId]',
  LEARN_LESSON: '/learn/[courseId]/[moduleId]/[lessonId]',
  CERTIFICATES: '/certificates',

  // Admin routes
  ADMIN_DASHBOARD: '/admin',
  ADMIN_CONTENT: '/admin/content',
  ADMIN_USERS: '/admin/users',
  ADMIN_AI: '/admin/ai',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_SETTINGS: '/admin/settings',
} as const;

export type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];

// Utility types pour l'extraction des paramètres de routes
export type ExtractRouteParams<T extends string> =
  T extends `${infer _Start}[${infer Param}]${infer Rest}`
    ? { [K in Param]: string } & ExtractRouteParams<Rest>
    : {};

// Type guards pour les rôles
export const isValidRole = (role: unknown): role is UserRole => {
  return typeof role === 'string' && ['visitor', 'member', 'moderator', 'admin'].includes(role);
};

export const hasRequiredRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy: Record<UserRole, number> = {
    visitor: 0,
    member: 1,
    moderator: 2,
    admin: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};
