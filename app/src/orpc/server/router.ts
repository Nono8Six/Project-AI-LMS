import { os } from '@orpc/server'
import { BodyLimitPlugin } from '@orpc/server/fetch'
import { API_CONSTANTS } from '@/shared/constants/api'
import * as contracts from '@/orpc/contracts'
import * as handlers from '@/orpc/server/handlers'
import * as debugContracts from '@/orpc/contracts/debug.contract'
import type { AppContext } from '@/orpc/server/context'
import { assertEnv } from '@/orpc/server/middleware/envGuard.middleware'
import { enforceRateLimit } from '@/orpc/server/middleware/rateLimit.middleware'
import { resolveUser } from '@/orpc/server/middleware/auth.middleware'

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

// Pipeline pour endpoints système (pas de rate limit pour performance)
const systemEndpoints = baseCommon;

// Pipeline pour endpoints métier (avec rate limit)
const userEndpoints = baseCommon
  .use(async ({ context, next }) => {
    await enforceRateLimit(context)
    return next()
  })

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
    me: userEndpoints
      .input(contracts.auth.NoInput)
      .output(contracts.auth.MeOutput.nullable())
      .handler(async ({ context }) => handlers.auth.meHandler(context)),
    secure: userEndpoints
      .input(contracts.auth.NoInput)
      .output(contracts.auth.MeOutput)
      .handler(async ({ context }) => handlers.auth.meRequiredHandler(context)),
  },

  debug: {
    recent: userEndpoints
      .input(debugContracts.ObservabilityQuery.optional())
      .output(debugContracts.ObservabilityRecentOutput)
      .handler(async ({ context, input }) => handlers.debug.recentHandler(context, input)),

    stats: userEndpoints
      .input(contracts.system.NoInput)
      .output(debugContracts.ObservabilityStatsOutput)
      .handler(async ({ context }) => handlers.debug.statsHandler(context)),

    openapi: userEndpoints
      .input(contracts.system.NoInput)
      .output(debugContracts.debugContractSchemas.openapi.output)
      .handler(async ({ context }) => handlers.debug.openapiHandler(context)),
  },
});

export type AppRouter = typeof appRouter;

// Export default plugins configuration for fetch adapter consumers
export const fetchPlugins = [
  new BodyLimitPlugin<AppContext>({ maxBodySize: API_CONSTANTS.maxBodyBytes }),
];
