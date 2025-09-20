import { os } from '@orpc/server';
import { BodyLimitPlugin } from '@orpc/server/fetch';
import { API_CONSTANTS } from '@/shared/constants/api';
import * as contracts from '@/orpc/contracts';
import * as handlers from '@/orpc/server/handlers';
import type { AppContext } from '@/orpc/server/context';
import { assertEnv } from '@/orpc/server/middleware/envGuard.middleware';
import { enforceRateLimit } from '@/orpc/server/middleware/rateLimit.middleware';
import { resolveUser } from '@/orpc/server/middleware/auth.middleware';

// Base pipeline: context typing + env guard + auth (sans rate limit)
const baseCommon = os
  .$context<AppContext>()
  .errors({
    TOO_MANY_REQUESTS: { status: 429 },
    UNAUTHORIZED: { status: 401 },
    FORBIDDEN: { status: 403 },
    PAYLOAD_TOO_LARGE: { status: 413 },
  })
  .use(async ({ context, next }) => {
    assertEnv(context);
    const ctx2 = await resolveUser(context);
    return next({ context: ctx2 });
  });

// Helper pour enrichir context avec endpoint info
function withEndpoint(endpoint: string) {
  return baseCommon.use(async ({ context, next }) => {
    const enrichedContext = {
      ...context,
      meta: {
        ...context.meta,
        endpoint,
      } as typeof context.meta & { endpoint: string },
    };

    await enforceRateLimit(enrichedContext);
    return next({ context: enrichedContext });
  });
}

// Pipeline pour endpoints système (pas de rate limit pour performance)
const systemEndpoints = baseCommon;

export const appRouter = baseCommon.router({
  system: {
    health: systemEndpoints
      .input(contracts.system.NoInput)
      .output(contracts.system.HealthOutput)
      .handler(async ({ context }) => handlers.system.healthHandler(context)),

    time: systemEndpoints
      .input(contracts.system.NoInput)
      .output(contracts.system.TimeOutput)
      .handler(async ({ context }) => handlers.system.timeHandler(context)),

    version: systemEndpoints
      .input(contracts.system.NoInput)
      .output(contracts.system.VersionOutput)
      .handler(async ({ context }) => handlers.system.versionHandler(context)),
  },

  auth: {
    me: withEndpoint('auth.me')
      .input(contracts.auth.NoInput)
      .output(contracts.auth.MeOutput.nullable())
      .handler(async ({ context }) => handlers.auth.meHandler(context)),
    secure: withEndpoint('auth.secure')
      .input(contracts.auth.NoInput)
      .output(contracts.auth.MeOutput)
      .handler(async ({ context }) => handlers.auth.meRequiredHandler(context)),
    logout: withEndpoint('auth.logout')
      .input(contracts.auth.LogoutInput)
      .output(contracts.auth.LogoutOutput)
      .handler(async ({ context, input }) => handlers.auth.logoutHandler(context, input)),
    refresh: withEndpoint('auth.refresh')
      .input(contracts.auth.RefreshInput)
      .output(contracts.auth.RefreshOutput)
      .handler(async ({ context }) => handlers.auth.refreshHandler(context)),
  },

  profile: {
    get: withEndpoint('profile.get')
      .input(contracts.profile.ProfileGetInput)
      .output(contracts.profile.ProfileGetOutput)
      .handler(async ({ context, input }) => handlers.profile.getProfileHandler(context, input)),

    create: withEndpoint('profile.create')
      .input(contracts.profile.ProfileCreateInput)
      .output(contracts.profile.ProfileCreateOutput)
      .handler(async ({ context, input }) => handlers.profile.createProfileHandler(context, input)),

    update: withEndpoint('profile.update')
      .input(contracts.profile.ProfileUpdateInput)
      .output(contracts.profile.ProfileUpdateOutput)
      .handler(async ({ context, input }) => handlers.profile.updateProfileHandler(context, input)),
  },
});

export type AppRouter = typeof appRouter;

// Export default plugins configuration for fetch adapter consumers
export const fetchPlugins = [
  new BodyLimitPlugin<AppContext>({ maxBodySize: API_CONSTANTS.maxBodyBytes }),
];
