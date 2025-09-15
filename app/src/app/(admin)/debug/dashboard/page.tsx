import { Suspense } from 'react';
import { headers } from 'next/headers';
import { API_CONSTANTS } from '@/shared/constants/api';
import { getAppBaseUrl } from '@/shared/utils/url';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

async function SystemHealthCheck() {
  try {
    const { getAbsoluteUrl } = await import('@/shared/utils/url');
    const h = await headers();
    const target = getAbsoluteUrl(`${API_CONSTANTS.prefix}/system/health`, { headers: h });
    const sig: AbortSignal | null = (AbortSignal as { timeout?: (ms: number) => AbortSignal }).timeout
      ? (AbortSignal as { timeout: (ms: number) => AbortSignal }).timeout(5000)
      : null;
    const res = await fetch(target, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      cache: 'no-store',
      // Empêche un chargement infini si une mauvaise URL d'app est configurée et garantit un retour rapide en erreur
      signal: sig,
    });
    const raw: unknown = await res.json();
    const isJsonEnvelope = (o: unknown): o is { json: unknown } =>
      typeof o === 'object' && o !== null && 'json' in o;
    const unwrapOnce = (o: unknown): unknown => (isJsonEnvelope(o) ? o.json : o);
    const data = unwrapOnce(unwrapOnce(raw));
    return {
      status: res.ok ? 'healthy' : 'error',
      response: data,
      statusCode: res.status,
    };
  } catch (error) {
    return {
      status: 'error',
      response: { error: (error as Error)?.message || 'Unknown error' },
      statusCode: 0,
    };
  }
}

async function ConfigurationCheck() {
  const config = {
    // Configuration oRPC
    orpc: {
      prefix: API_CONSTANTS.prefix,
      maxBody: process.env.API_MAX_BODY || '1048576',
      rateLimitProvider: process.env.RATE_LIMIT_PROVIDER || 'memory',
      anonymousPerMin: process.env.API_RATE_LIMIT_ANON_PER_MIN || '60',
      userPerMin: process.env.API_RATE_LIMIT_USER_PER_MIN || '120',
    },
    // Configuration Supabase
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configured' : '❌ Missing',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing',
      serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configured' : '❌ Missing',
    },
    // Configuration Redis
    redis: {
      enabled: process.env.RATE_LIMIT_PROVIDER === 'redis',
      url: process.env.UPSTASH_REDIS_REST_URL ? '✅ Configured' : '❌ Missing',
      token: process.env.UPSTASH_REDIS_REST_TOKEN ? '✅ Configured' : '❌ Missing',
    },
    // Environment général
    env: {
      nodeEnv: process.env.NODE_ENV || 'development',
      logLevel: process.env.LOG_LEVEL || 'info',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || getAppBaseUrl(),
    },
  };

  return config;
}

function StatusIndicator({ status }: { status: 'healthy' | 'warning' | 'error' }) {
  const colors = {
    healthy: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
  };

  const icons = {
    healthy: '✅',
    warning: '⚠️',
    error: '❌',
  };

  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md border text-xs font-medium ${colors[status]}`}>
      <span>{icons[status]}</span>
      {status.toUpperCase()}
    </div>
  );
}

async function DashboardContent() {
  const [healthCheck, configCheck] = await Promise.all([
    SystemHealthCheck(),
    ConfigurationCheck(),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between space-y-0">
          <CardTitle className="text-lg font-semibold">System Health</CardTitle>
          <StatusIndicator status={healthCheck.status === 'healthy' ? 'healthy' : 'error'} />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-medium mb-2">API Response</h3>
              <pre className="text-xs bg-muted p-3 rounded border overflow-x-auto">
                {JSON.stringify(healthCheck.response, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-medium mb-2">Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status Code:</span>
                  <span className="font-mono">{healthCheck.statusCode}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Configuration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 className="font-medium mb-3">oRPC</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(configCheck.orpc).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="font-mono text-xs">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-3">Supabase</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(configCheck.supabase).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="text-xs">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-3">Redis</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(configCheck.redis).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="text-xs">{typeof value === 'boolean' ? (value ? '✅ Enabled' : '❌ Disabled') : value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <a href="/debug/middleware" className="flex items-center gap-2 p-3 rounded-md border hover:bg-accent transition-colors">
              <span>🔧</span>
              <span className="font-medium">Test Middleware</span>
            </a>
            <a href="/debug/endpoints" className="flex items-center gap-2 p-3 rounded-md border hover:bg-accent transition-colors">
              <span>🔗</span>
              <span className="font-medium">Test Endpoints</span>
            </a>
            <a href="/debug/config" className="flex items-center gap-2 p-3 rounded-md border hover:bg-accent transition-colors">
              <span>⚙️</span>
              <span className="font-medium">Config Diagnostic</span>
            </a>
            <a href="/debug/monitoring" className="flex items-center gap-2 p-3 rounded-md border hover:bg-accent transition-colors">
              <span>📈</span>
              <span className="font-medium">Live Monitoring</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardDebugPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de la santé du système et configuration
        </p>
      </div>

      <Suspense fallback={<div className="text-sm text-muted-foreground">Chargement…</div>}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
