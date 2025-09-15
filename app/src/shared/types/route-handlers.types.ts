/**
 * Types pour les Route Handlers Next.js 15
 * Spécifiques à l'App Router et aux route groups
 */

import type { NextRequest, NextResponse } from 'next/server';
import type {
  CourseParams,
  ModuleParams,
  LessonParams,
  UserParams,
  UserRole,
  ApiResponse,
} from './';
import type {
  User,
  Course,
  Lesson,
  UserProgress,
  Certificate,
  AuthResponse,
  SystemStats,
  SystemSettings,
  ActivityLog,
  Recommendation,
  UsageAnalytics,
  AIUsageStats,
  AIConversation,
} from './entities.types';

// Types de base pour les route handlers
export interface RouteContext<TParams = Record<string, string>> {
  params: Promise<TParams>;
}

export interface RouteSearchParams {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export type RouteHandler<TParams = Record<string, string>, TResponse = Record<string, unknown>> = (
  request: NextRequest,
  context: RouteContext<TParams> & RouteSearchParams,
) => Promise<NextResponse<ApiResponse<TResponse>>> | NextResponse<ApiResponse<TResponse>>;

// Types pour les paramètres de routes dynamiques spécifiques
export interface AuthRouteParams {
  provider?: string;
  token?: string;
}

export interface AdminUserRouteParams extends UserParams {
  action?: 'activate' | 'deactivate' | 'promote' | 'demote';
}

export interface ContentManagementParams extends CourseParams {
  action?: 'publish' | 'unpublish' | 'archive' | 'duplicate';
}

// Types pour les route handlers par groupe
export namespace PublicRoutes {
  export type HomeHandler = RouteHandler<{}, { message: string }>;
  export type CoursesHandler = RouteHandler<{}, { courses: Course[] }>;
  export type CourseDetailHandler = RouteHandler<{ slug: string }, { course: Course }>;
  export type AuthLoginHandler = RouteHandler<{}, AuthResponse>;
  export type AuthRegisterHandler = RouteHandler<{}, AuthResponse>;
  export type ContactHandler = RouteHandler<{}, { success: boolean }>;
}

export namespace MemberRoutes {
  export type DashboardHandler = RouteHandler<
    {},
    {
      user: User;
      progress: UserProgress[];
      recommendations: Recommendation[];
    }
  >;
  export type ProfileHandler = RouteHandler<{}, { user: User }>;
  export type LearnHandler = RouteHandler<CourseParams, { course: Course; progress: UserProgress }>;
  export type LessonHandler = RouteHandler<
    LessonParams,
    {
      lesson: Lesson;
      progress: UserProgress;
      nextLesson?: Lesson;
    }
  >;
  export type ProgressHandler = RouteHandler<{}, { progress: UserProgress[] }>;
  export type CertificatesHandler = RouteHandler<{}, { certificates: Certificate[] }>;
  export type SettingsHandler = RouteHandler<{}, { settings: SystemSettings }>;
}

export namespace AdminRoutes {
  export type AdminDashboardHandler = RouteHandler<
    {},
    {
      stats: SystemStats;
      analytics: UsageAnalytics;
      recentActivity: ActivityLog[];
    }
  >;
  export type UsersHandler = RouteHandler<{}, { users: User[] }>;
  export type UserDetailHandler = RouteHandler<UserParams, { user: User }>;
  export type ContentHandler = RouteHandler<{}, { content: Course[] }>;
  export type CourseManagementHandler = RouteHandler<CourseParams, { course: Course }>;
  export type AIAnalyticsHandler = RouteHandler<
    {},
    {
      usage: AIUsageStats;
      costs: { total_cents: number; period: string };
      conversations: AIConversation[];
    }
  >;
  export type SystemSettingsHandler = RouteHandler<{}, { settings: SystemSettings }>;
}

// Types pour les middlewares spécifiques aux routes
export interface AuthMiddlewareContext {
  user: { id: string; role: UserRole } | null;
  isAuthenticated: boolean;
}

export interface RoleGuardContext extends AuthMiddlewareContext {
  requiredRole: UserRole;
  hasAccess: boolean;
}

export type AuthenticatedRouteHandler<TParams = Record<string, string>, TResponse = Record<string, unknown>> = (
  request: NextRequest,
  context: RouteContext<TParams> & RouteSearchParams & AuthMiddlewareContext,
) => Promise<NextResponse<ApiResponse<TResponse>>> | NextResponse<ApiResponse<TResponse>>;

export type RoleProtectedRouteHandler<TParams = Record<string, string>, TResponse = Record<string, unknown>> = (
  request: NextRequest,
  context: RouteContext<TParams> & RouteSearchParams & RoleGuardContext,
) => Promise<NextResponse<ApiResponse<TResponse>>> | NextResponse<ApiResponse<TResponse>>;

// Types pour les réponses standardisées
export interface SuccessResponse<T = Record<string, unknown>> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type StandardResponse<T = Record<string, unknown>> = SuccessResponse<T> | ErrorResponse;

// Types pour la validation des requêtes
export interface RequestValidation<TBody = Record<string, unknown>, TQuery = Record<string, string>> {
  body?: TBody;
  query?: TQuery;
  headers?: Record<string, string>;
}

export interface ValidatedRequest<TBody = Record<string, unknown>, TQuery = Record<string, string>>
  extends NextRequest {
  validatedData: RequestValidation<TBody, TQuery>;
}

// Types pour les schémas de validation (Zod)
export interface RouteSchema<
  TParams = Record<string, string>,
  TBody = Record<string, unknown>,
  TQuery = Record<string, string>,
> {
  params?: Record<string, unknown>; // Zod schema
  body?: Record<string, unknown>; // Zod schema
  query?: Record<string, unknown>; // Zod schema
  response?: Record<string, unknown>; // Zod schema
}

// Types pour les rate limiting
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitContext {
  remaining: number;
  resetTime: Date;
  totalHits: number;
}

// Types pour les webhooks
export interface WebhookHandler<TPayload = unknown> {
  (payload: TPayload, headers: Record<string, string>): Promise<{ received: boolean }>;
}

export interface StripeWebhookHandler
  extends WebhookHandler<{
    type: string;
    data: { object: unknown };
  }> {}

export interface SupabaseWebhookHandler
  extends WebhookHandler<{
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    table: string;
    record: unknown;
    old_record?: unknown;
  }> {}

// Types pour les uploads de fichiers
export interface FileUploadContext {
  file: File;
  userId: string;
  uploadPath: string;
  allowedTypes: readonly string[];
  maxSize: number;
}

export interface FileUploadResult {
  url: string;
  path: string;
  size: number;
  mimeType: string;
  originalName: string;
}

// Types pour les API routes avec streaming
export interface StreamingRouteHandler<TData = unknown> {
  (request: NextRequest, context: RouteContext & RouteSearchParams): Promise<ReadableStream<TData>>;
}

// Types pour les Server Actions (si utilisés avec les route handlers)
export interface ServerActionResult<TData = unknown> {
  success: boolean;
  data?: TData;
  error?: string;
  redirect?: string;
}

export type ServerAction<TInput = unknown, TOutput = unknown> = (
  input: TInput,
) => Promise<ServerActionResult<TOutput>>;

// Types pour les erreurs spécifiques aux routes
export class RouteError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'RouteError';
  }
}

// Utilitaires pour les types de routes
export type ExtractParams<T extends string> = T extends `${string}[${infer P}]${infer Rest}`
  ? { [K in P]: string } & ExtractParams<Rest>
  : {};

export type RoutePattern = `/${string}`;

export interface RouteConfig<TPattern extends RoutePattern> {
  pattern: TPattern;
  methods: readonly ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')[];
  middleware?: readonly string[];
  rateLimit?: RateLimitConfig;
  auth?: {
    required: boolean;
    roles?: readonly UserRole[];
  };
  validation?: RouteSchema;
}

// Export des helpers pour la création de route handlers
export const createRouteHandler = <TParams, TResponse>(
  handler: RouteHandler<TParams, TResponse>,
): RouteHandler<TParams, TResponse> => handler;

export const createAuthenticatedRouteHandler = <TParams, TResponse>(
  handler: AuthenticatedRouteHandler<TParams, TResponse>,
): AuthenticatedRouteHandler<TParams, TResponse> => handler;

export const createRoleProtectedRouteHandler = <TParams, TResponse>(
  handler: RoleProtectedRouteHandler<TParams, TResponse>,
): RoleProtectedRouteHandler<TParams, TResponse> => handler;
