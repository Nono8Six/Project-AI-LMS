import type { RouterClient } from '@orpc/server'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { API_CONSTANTS } from '@/shared/constants/api'
import type { AppRouter } from '@/orpc/server/router'

// Build a client instance pointed to our server prefix.
// Note: Not consumed by UI yet; provided for future usage and tests.
const baseUrl = process.env.NEXT_PUBLIC_APP_URL
const url = baseUrl ? new URL(API_CONSTANTS.prefix, baseUrl).toString() : API_CONSTANTS.prefix

export const rpcLink = new RPCLink({ url })
export const orpc: RouterClient<AppRouter> = createORPCClient(rpcLink)
