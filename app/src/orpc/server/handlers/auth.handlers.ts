import { MeOutput } from '@/orpc/contracts/auth.contract';
import type { AppContext } from '@/orpc/server/context';
import { ORPCError } from '@orpc/client';

export async function meHandler(ctx: AppContext) {
  if (!ctx.user) return null;
  const out = { id: ctx.user.id, email: ctx.user.email ?? null, role: ctx.user.role ?? null };
  return MeOutput.nullable().parse(out);
}

export async function meRequiredHandler(ctx: AppContext) {
  if (!ctx.user) throw new ORPCError('UNAUTHORIZED');
  const out = { id: ctx.user.id, email: ctx.user.email ?? null, role: ctx.user.role ?? null };
  return MeOutput.parse(out);
}
