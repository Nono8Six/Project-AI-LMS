import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { orpc } from './client'

// Create TanStack Query utilities using the configured orPC client
export const orpcHooks = createTanstackQueryUtils(orpc)

// Export type for application usage
export type ORPCHooks = typeof orpcHooks

// Export individual hook utilities for convenience
export const {
  system: systemHooks,
  auth: authHooks,
} = orpcHooks;
