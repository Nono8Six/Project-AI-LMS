import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import LiveFeed from './LiveFeed'
import { API_CONSTANTS } from '@/shared/constants/api'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

const absolute = async (path: string) => {
  const base = process.env.NEXT_PUBLIC_APP_URL
  if (base) return new URL(path, base).toString()
  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (!host) throw new Error(`Missing host header to build absolute URL for ${path}`)
  return new URL(path, `${proto}://${host}`).toString()
}

type RecentMetric = { endpoint: string; method: string; status: number; duration: number; timestamp: number; requestId: string }
type RecentLog = { kind: 'debug'|'info'|'warn'|'error'; requestId: string; message: string; timestamp: number; time?: string; meta?: Record<string, unknown> }
type RecentBucket = { key: string; limit: number; remaining: number; reset: number; lastActivity: number; requests?: number }
type RecentData = { metrics: RecentMetric[]; logs: RecentLog[]; rateLimitBuckets: RecentBucket[] }

async function fetchRecent(limit = 50) {
  const res = await fetch(await absolute(`${API_CONSTANTS.prefix}/debug/recent`), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ limit }),
    cache: 'no-store',
  })
  const raw: unknown = await res.json().catch(() => null)
  const isJsonEnvelope = (o: unknown): o is { json: unknown } => typeof o === 'object' && o !== null && 'json' in o
  const unwrapOnce = (o: unknown): unknown => (isJsonEnvelope(o) ? o.json : o)
  const dataUnknown = unwrapOnce(unwrapOnce(raw))
  const candidate = (dataUnknown && typeof dataUnknown === 'object' ? (dataUnknown as Partial<RecentData>) : undefined)
  const valid = !!(
    candidate &&
    Array.isArray(candidate.metrics) &&
    Array.isArray(candidate.logs) &&
    Array.isArray(candidate.rateLimitBuckets)
  )
  return {
    ok: res.ok,
    status: res.status,
    data: (valid ? (dataUnknown as RecentData) : { logs: [], metrics: [], rateLimitBuckets: [] }) as RecentData,
  }
}

type Stats = { totalRequests: number; successRate: number; errorRate: number; avgDuration: number; p95Duration: number; p99Duration: number }

async function fetchStats() {
  const res = await fetch(await absolute(`${API_CONSTANTS.prefix}/debug/stats`), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    cache: 'no-store',
  })
  const raw: unknown = await res.json().catch(() => null)
  const isJsonEnvelope = (o: unknown): o is { json: unknown } => typeof o === 'object' && o !== null && 'json' in o
  const unwrapOnce = (o: unknown): unknown => (isJsonEnvelope(o) ? o.json : o)
  const dataUnknown = unwrapOnce(unwrapOnce(raw))
  const statsCandidate = (dataUnknown && typeof dataUnknown === 'object' ? (dataUnknown as Partial<Stats>) : undefined)
  const valid = !!(
    statsCandidate &&
    typeof statsCandidate.totalRequests === 'number' &&
    typeof statsCandidate.successRate === 'number'
  )
  const fallback: Stats = valid
    ? (dataUnknown as Stats)
    : { totalRequests: 0, successRate: 0, errorRate: 0, avgDuration: 0, p95Duration: 0, p99Duration: 0 }
  return { ok: res.ok, status: res.status, data: fallback }
}

export default async function MonitoringDebugPage() {
  const [recent, stats] = await Promise.all([fetchRecent(50), fetchStats()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold mb-1">Monitoring</h1>
        <p className="text-muted-foreground text-sm">Logs, métriques et rate limiting (temps réel du serveur)</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Statistiques (15 min)</CardTitle>
          </CardHeader>
          <CardContent>
            {!stats.ok ? (
              <div className="text-sm text-red-600">Impossible de lire les stats (code {stats.status})</div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Requêtes</div>
                  <div className="font-mono">{stats.data.totalRequests}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Succès %</div>
                  <div className="font-mono">{stats.data.successRate}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Erreurs %</div>
                  <div className="font-mono">{stats.data.errorRate}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Avg</div>
                  <div className="font-mono">{stats.data.avgDuration}ms</div>
                </div>
                <div>
                  <div className="text-muted-foreground">p95</div>
                  <div className="font-mono">{stats.data.p95Duration}ms</div>
                </div>
                <div>
                  <div className="text-muted-foreground">p99</div>
                  <div className="font-mono">{stats.data.p99Duration}ms</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Dernières métriques</CardTitle>
            <CardDescription>Dernières requêtes traitées (max 50)</CardDescription>
          </CardHeader>
          <CardContent>
            {!recent.ok ? (
              <div className="text-sm text-red-600">Lecture échouée (code {recent.status})</div>
            ) : recent.data.metrics.length === 0 ? (
              <div className="text-sm text-muted-foreground">Aucune métrique pour l’instant. Lance des appels via l’onglet Endpoints.</div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {recent.data.metrics.map((m, i: number) => (
                  <div key={i} className="p-3 border rounded text-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-xs">{m.method} {m.endpoint}</div>
                      <span className={`px-2 py-0.5 rounded text-xs ${m.status < 400 ? 'bg-green-100 text-green-800' : m.status === 429 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{m.status}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                      <span className="font-mono">{m.duration.toFixed(2)}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Derniers logs</CardTitle>
          </CardHeader>
          <CardContent>
            {!recent.ok ? (
              <div className="text-sm text-red-600">Lecture échouée.</div>
            ) : recent.data.logs.length === 0 ? (
              <div className="text-sm text-muted-foreground">Aucun log enregistré.</div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {recent.data.logs.map((log, i: number) => (
                  <div key={i} className="p-3 border rounded text-sm">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        log.kind === 'info' ? 'bg-blue-100 text-blue-800' :
                        log.kind === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                        log.kind === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>{log.kind.toUpperCase()}</span>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">{log.requestId}</code>
                    </div>
                    <div className="mt-2">{log.message}</div>
                    {log.meta && (
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">{JSON.stringify(log.meta, null, 2)}</pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rate limiting</CardTitle>
            <CardDescription>Clés actives récemment</CardDescription>
          </CardHeader>
          <CardContent>
            {!recent.ok ? (
              <div className="text-sm text-red-600">Lecture échouée.</div>
            ) : recent.data.rateLimitBuckets.length === 0 ? (
              <div className="text-sm text-muted-foreground">Aucune activité récente.</div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {recent.data.rateLimitBuckets.map((b: RecentBucket, i: number) => (
                  <div key={i} className="text-sm p-2 border rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-mono">{b.key}</span>
                      <span className="text-xs text-muted-foreground">{new Date(b.lastActivity).toLocaleTimeString()}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center mt-2">
                      <div>
                        <div className="text-xs text-muted-foreground">Limit</div>
                        <div className="font-mono">{b.limit}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Remaining</div>
                        <div className="font-mono">{b.remaining}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Reset</div>
                        <div className="font-mono">{b.reset}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Requests</div>
                        <div className="font-mono">{b.requests ?? 0}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <div className="md:col-span-2">
          <LiveFeed />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
      </div>

      
    </div>
  )
}
