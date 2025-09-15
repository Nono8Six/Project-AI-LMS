import type { AppContext } from '../context';
import { ORPCError } from '@orpc/client';
import { z } from 'zod';

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

export async function resolveUser(ctx: AppContext): Promise<AppContext> {
  const token = extractToken(ctx.headers);
  if (!token) {
    return { ...ctx, user: null };
  }

  try {
    // Prefer service role for reliable verification
    try {
      const admin = ctx.supabase.getAdminClient();
      const { data, error } = await admin.auth.getUser(token);
      if (!error && data?.user) {
        // Validation sécurisée avec Zod au lieu de cast dangereux
        const parseResult = SupabaseUserSchema.safeParse(data.user);
        if (parseResult.success) {
          const user = parseResult.data;
          const role = user.user_metadata?.role ?? null;
          return { ...ctx, user: { id: user.id, email: user.email ?? null, role } };
        }
        ctx.logger.warn('Invalid user data from Supabase admin client', { userId: data.user?.id });
      }
      ctx.logger.debug('Admin getUser failed, fallback to anon client', { reason: error?.message });
    } catch (e) {
      ctx.logger.debug('Admin client unavailable, fallback to anon client', { err: getErrorMessage(e) });
    }

    const userClient = ctx.supabase.getUserClient();
    if (userClient) {
      const { data, error } = await userClient.auth.getUser(token);
      if (!error && data?.user) {
        // Validation sécurisée avec Zod au lieu de cast dangereux
        const parseResult = SupabaseUserSchema.safeParse(data.user);
        if (parseResult.success) {
          const user = parseResult.data;
          const role = user.user_metadata?.role ?? null;
          return { ...ctx, user: { id: user.id, email: user.email ?? null, role } };
        }
        ctx.logger.warn('Invalid user data from Supabase user client', { userId: data.user?.id });
      }
      ctx.logger.debug('Anon getUser failed', { reason: error?.message });
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
  if (!ctx.user.role || ctx.user.role !== role) throw new ORPCError('FORBIDDEN');
}
