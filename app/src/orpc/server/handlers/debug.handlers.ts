import { ObservabilityRecentOutput, ObservabilityStatsOutput } from '@/orpc/contracts/debug.contract'
import type { AppContext } from '@/orpc/server/context'
import { observabilityStore } from '@/orpc/server/observability/store'
import { OpenAPIGenerator } from '@orpc/openapi'
import { oc } from '@orpc/contract'
import { appRouter } from '@/orpc/server/router'
import { API_CONSTANTS } from '@/shared/constants/api'

export async function recentHandler(_ctx: AppContext, input: { limit?: number | undefined } | undefined) {
  const data = observabilityStore.getRecent(
    typeof input?.limit === 'number' ? { limit: input.limit } : undefined,
  )
  return ObservabilityRecentOutput.parse(data)
}

export async function statsHandler(_ctx: AppContext) {
  const data = observabilityStore.getStats(15)
  return ObservabilityStatsOutput.parse(data)
}

export async function openapiHandler(_ctx: AppContext) {
  const generator = new OpenAPIGenerator({})
  const spec = await generator.generate(
    oc.tag('system', 'auth', 'debug').prefix(API_CONSTANTS.prefix).router(appRouter),
    {
      info: {
        title: 'LMS-IA API',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0',
      },
      servers: [
        {
          url: (() => {
            const base = process.env.NEXT_PUBLIC_APP_URL
            return base ? new URL(API_CONSTANTS.prefix, base).toString() : API_CONSTANTS.prefix
          })(),
        },
      ],
    },
  )
  return spec as unknown
}
