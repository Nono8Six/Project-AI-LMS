/**
 * Types stricts pour l'authentification Supabase
 * Élimine le besoin de `any` dans l'auth middleware
 */

export interface SupabaseUserMetadata {
  role?: string;
  [key: string]: unknown;
}

export interface TypedSupabaseUser {
  id: string;
  email?: string | null;
  user_metadata: SupabaseUserMetadata;
}

export interface SupabaseAuthResponse {
  data?: {
    user?: TypedSupabaseUser;
  };
  error?: {
    message: string;
  } | null;
}

export type UserRole = 'visitor' | 'member' | 'moderator' | 'admin';

export interface AuthenticatedUser {
  id: string;
  email?: string | null;
  role?: string | null;
}