import { createServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { buildContext } from '../../orpc/server/context'
import { API_CONSTANTS } from '../../shared/constants/api'
import { getAppBaseUrl } from '../../shared/utils/url'

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const ipHeader = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
  const context = buildContext({ 
    headers: new Headers(
      Object.entries(req.headers)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value] as [string, string])
    ), 
    ip: ipHeader ?? null 
  })

  // Basic request handling for dev purposes
  // Note: This is a simplified implementation for testing
  const url = new URL(req.url || '/', getAppBaseUrl())
  
  if (!url.pathname.startsWith(API_CONSTANTS.prefix)) {
    res.statusCode = 404
    res.setHeader('x-request-id', context.meta.requestId)
    res.end('Not Found')
    return
  }

  // For now, just return a basic response
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('x-request-id', context.meta.requestId)
  res.end(JSON.stringify({ message: 'Dev server running', timestamp: new Date().toISOString() }))
});

const PORT = Number(process.env.PORT || '3001')
const HOST = process.env.HOST || '127.0.0.1'

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`oRPC dev server listening on http://${HOST}:${PORT}${API_CONSTANTS.prefix}`)
})
