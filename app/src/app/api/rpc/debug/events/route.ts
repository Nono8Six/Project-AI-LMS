import type { NextRequest } from 'next/server'
import { observabilityStore } from '@/orpc/server/observability/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder()
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`))
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      const onMetric = (d: unknown) => send('metric', d)
      const onLog = (d: unknown) => send('log', d)
      const onRate = (d: unknown) => send('ratelimit', d)

      observabilityStore.on('metric', onMetric)
      observabilityStore.on('log', onLog)
      observabilityStore.on('ratelimit', onRate)

      // Send a comment to keep connection open
      controller.enqueue(encoder.encode(': connected\n\n'))

      const close = () => {
        observabilityStore.off('metric', onMetric)
        observabilityStore.off('log', onLog)
        observabilityStore.off('ratelimit', onRate)
        controller.close()
      }

      // Type-safe event listener for close event
      if ('addEventListener' in globalThis && typeof globalThis.addEventListener === 'function') {
        globalThis.addEventListener('close' as never, close as never);
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
