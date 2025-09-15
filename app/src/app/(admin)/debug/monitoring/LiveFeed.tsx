"use client"

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { API_CONSTANTS } from '@/shared/constants/api'

type Metric = { endpoint: string; method: string; status: number; duration: number; timestamp: number; requestId: string }
type Log = { kind: 'debug'|'info'|'warn'|'error'; requestId: string; message: string; timestamp: number }
type Bucket = { key: string; limit: number; remaining: number; reset: number; lastActivity: number }

export default function LiveFeed() {
  const [running, setRunning] = useState(false)
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [level, setLevel] = useState<'debug'|'info'|'warn'|'error'>('info')
  const [onlyErrors, setOnlyErrors] = useState(false)
  const [reqId, setReqId] = useState('')

  const start = useCallback(() => setRunning(true), [])
  const stop = useCallback(() => setRunning(false), [])

  useEffect(() => {
    if (!running) return
    const es = new EventSource(API_CONSTANTS.prefix + '/debug/events')
    const onMetric = (e: MessageEvent) => {
      try { const d = JSON.parse(e.data) as Metric; setMetrics(prev => [d, ...prev].slice(0,50)) } catch { void 0 }
    }
    const onLog = (e: MessageEvent) => {
      try { const d = JSON.parse(e.data) as Log; setLogs(prev => [d, ...prev].slice(0,50)) } catch { void 0 }
    }
    const onRate = (e: MessageEvent) => {
      try { const d = JSON.parse(e.data) as Bucket; setBuckets(prev => [d, ...prev].slice(0,50)) } catch { void 0 }
    }
    es.addEventListener('metric', onMetric)
    es.addEventListener('log', onLog)
    es.addEventListener('ratelimit', onRate)
    es.onerror = () => { return }
    return () => { es.close() }
  }, [running])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Feed (SSE)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Button onClick={running ? stop : start} variant={running ? 'destructive' : 'default'}>
            {running ? 'Arrêter' : 'Démarrer'}
          </Button>
          <div className="text-sm text-muted-foreground mr-4">{running ? 'En écoute…' : 'Arrêté'}</div>
          <Select value={level} onValueChange={(v)=>setLevel(v as 'debug'|'info'|'warn'|'error')}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Niveau" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="debug">Debug+</SelectItem>
              <SelectItem value="info">Info+</SelectItem>
              <SelectItem value="warn">Warn+</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Button variant={onlyErrors ? 'secondary' : 'outline'} size="sm" onClick={()=>setOnlyErrors(!onlyErrors)}>Seulement erreurs</Button>
          <input className="h-9 px-2 rounded-md border bg-background text-sm" placeholder="Filtrer par requestId" value={reqId} onChange={(e)=>setReqId(e.target.value)} />
          <Button variant="ghost" size="sm" onClick={()=>{setMetrics([]); setLogs([]); setBuckets([])}}>Clear</Button>
        </div>
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <div>
            <div className="text-xs text-muted-foreground">Métriques</div>
            <div className="font-mono">{metrics.length}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Logs</div>
            <div className="font-mono">{logs.length}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Rate buckets</div>
            <div className="font-mono">{buckets.length}</div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium mb-2">Dernières métriques</div>
            <div className="border rounded">
              <div className="grid grid-cols-6 text-xs text-muted-foreground border-b px-2 py-1">
                <div>Time</div><div>Method</div><div>Endpoint</div><div>Status</div><div>Duration</div><div>ReqID</div>
              </div>
              <div className="max-h-72 overflow-y-auto text-xs">
                {metrics
                  .filter(m => (onlyErrors ? m.status >= 400 : true))
                  .filter(m => (reqId ? m.requestId.includes(reqId) : true))
                  .map((m,i)=> (
                  <div key={i} className="grid grid-cols-6 px-2 py-1 border-b">
                    <div>{new Date(m.timestamp).toLocaleTimeString()}</div>
                    <div className="font-mono">{m.method}</div>
                    <div className="truncate" title={m.endpoint}>{m.endpoint}</div>
                    <div className={`font-mono ${m.status>=500?'text-red-600':m.status>=400?'text-yellow-700':'text-green-700'}`}>{m.status}</div>
                    <div className="font-mono">{m.duration.toFixed(1)}ms</div>
                    <div className="font-mono truncate" title={m.requestId}>{m.requestId}</div>
                  </div>))}
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Derniers logs</div>
            <div className="border rounded">
              <div className="grid grid-cols-4 text-xs text-muted-foreground border-b px-2 py-1">
                <div>Time</div><div>Level</div><div>Message</div><div>ReqID</div>
              </div>
              <div className="max-h-72 overflow-y-auto text-xs">
                {logs
                  .filter(l => {
                    const order = ['debug','info','warn','error'] as const
                    return order.indexOf(l.kind) >= order.indexOf(level)
                  })
                  .filter(l => (reqId ? l.requestId.includes(reqId) : true))
                  .map((l,i)=> (
                  <div key={i} className="grid grid-cols-4 px-2 py-1 border-b">
                    <div>{new Date(l.timestamp).toLocaleTimeString()}</div>
                    <div className={`${l.kind==='error'?'text-red-600':l.kind==='warn'?'text-yellow-700':l.kind==='info'?'text-blue-700':'text-gray-600'}`}>{l.kind.toUpperCase()}</div>
                    <div className="truncate" title={l.message}>{l.message}</div>
                    <div className="font-mono truncate" title={l.requestId}>{l.requestId}</div>
                  </div>))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-sm font-medium mb-2">Rate limit buckets</div>
          <div className="border rounded">
            <div className="grid grid-cols-5 text-xs text-muted-foreground border-b px-2 py-1">
              <div>Key</div><div>Limit</div><div>Remaining</div><div>Reset</div><div>Last</div>
            </div>
            <div className="max-h-48 overflow-y-auto text-xs">
              {buckets.map((b,i)=> (
                <div key={i} className="grid grid-cols-5 px-2 py-1 border-b">
                  <div className="font-mono truncate" title={b.key}>{b.key}</div>
                  <div className="font-mono">{b.limit}</div>
                  <div className="font-mono">{b.remaining}</div>
                  <div className="font-mono">{b.reset}</div>
                  <div>{new Date(b.lastActivity).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
