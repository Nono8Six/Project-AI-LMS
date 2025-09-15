'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MiddlewareTestService } from '@/core/debug/services/MiddlewareTestService';

interface TestResult {
  success: boolean;
  status: number;
  headers: Record<string, string>;
  body: unknown;
  error?: string;
  meta?: {
    requestId?: string;
    rateLimit?: {
      limit: number;
      remaining: number;
      reset: number;
    };
  };
}

interface AuthTestState {
  token: string;
  result: TestResult | null;
  loading: boolean;
}

interface RateLimitTestState {
  ip: string;
  userAgent: string;
  results: TestResult[];
  loading: boolean;
}

export default function MiddlewareDebugPage() {
  const [authTest, setAuthTest] = useState<AuthTestState>({
    token: '',
    result: null,
    loading: false,
  });

  const [rateLimitTest, setRateLimitTest] = useState<RateLimitTestState>({
    ip: '127.0.0.1',
    userAgent: 'Debug-Test-Client',
    results: [],
    loading: false,
  });

  const testAuth = useCallback(async () => {
    setAuthTest(prev => ({ ...prev, loading: true, result: null }));
    try {
      const svc = MiddlewareTestService.getInstance();
      const cfg: { token?: string } = {};
      if (authTest.token.trim()) cfg.token = authTest.token.trim();
      const r = await svc.testAuthMiddleware(cfg);
      const meta: { requestId?: string; rateLimit?: { limit: number; remaining: number; reset: number } } = {};
      if (r.meta?.requestId) meta.requestId = r.meta.requestId;
      if (r.meta?.rateLimit) meta.rateLimit = r.meta.rateLimit;
      const result: TestResult = {
        success: r.success,
        status: r.status,
        headers: r.headers,
        body: r.body,
        ...(r.error ? { error: r.error } : {}),
        ...(Object.keys(meta).length ? { meta } : {}),
      };
      setAuthTest(prev => ({ ...prev, result }));
    } catch (error) {
      setAuthTest(prev => ({ ...prev, result: { success: false, status: 0, headers: {}, body: null, error: (error as Error)?.message || 'Network error' } }));
    } finally {
      setAuthTest(prev => ({ ...prev, loading: false }));
    }
  }, [authTest.token]);

  const testRateLimit = useCallback(async (count: number) => {
    setRateLimitTest(prev => ({ ...prev, loading: true }));
    try {
      const svc = MiddlewareTestService.getInstance();
      const arr = await svc.testRateLimitMiddleware({ requestCount: count, ip: rateLimitTest.ip, userAgent: rateLimitTest.userAgent });
      const mapped: TestResult[] = arr.map((r) => {
        const meta: { requestId?: string; rateLimit?: { limit: number; remaining: number; reset: number } } = {};
        if (r.meta?.requestId) meta.requestId = r.meta.requestId;
        if (r.meta?.rateLimit) meta.rateLimit = r.meta.rateLimit;
        const out: TestResult = {
          success: r.success,
          status: r.status,
          headers: r.headers,
          body: r.body,
          ...(r.error ? { error: r.error } : {}),
          ...(Object.keys(meta).length ? { meta } : {}),
        };
        return out;
      });
      setRateLimitTest(prev => ({ ...prev, results: mapped, loading: false }));
    } catch (error) {
      setRateLimitTest(prev => ({ ...prev, results: [{ success: false, status: 0, headers: {}, body: null, error: (error as Error)?.message || 'Network error' }], loading: false }));
    }
  }, [rateLimitTest.ip, rateLimitTest.userAgent]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-2">Middleware Testing</h1>
        <p className="text-muted-foreground">
          Test interactif des middleware auth, rate limiting et pipeline complet
        </p>
      </div>

      <Tabs defaultValue="auth" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="auth">🔐 Authentication</TabsTrigger>
          <TabsTrigger value="ratelimit">⚡ Rate Limiting</TabsTrigger>
          <TabsTrigger value="pipeline">🔄 Pipeline</TabsTrigger>
        </TabsList>

        {/* Auth Testing */}
        <TabsContent value="auth" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Middleware Test</CardTitle>
              <CardDescription>
                Testez l'extraction et validation des tokens Bearer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Bearer Token (optionnel)</Label>
                <Textarea
                  id="token"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={authTest.token}
                  onChange={(e) => setAuthTest(prev => ({ ...prev, token: e.target.value }))}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Laissez vide pour tester une requête anonyme
                </p>
              </div>

              <Button onClick={testAuth} disabled={authTest.loading} className="w-full">
                {authTest.loading ? 'Test en cours...' : 'Tester Authentication'}
              </Button>

              {authTest.result && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm px-2 py-1 rounded ${
                      authTest.result.success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {authTest.result.success ? '✅ SUCCESS' : '❌ ERROR'} - {authTest.result.status}
                    </span>
                    {authTest.result.meta?.requestId && (
                      <span className="text-xs text-muted-foreground font-mono">
                        ID: {authTest.result.meta.requestId}
                      </span>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2">Response Body</h4>
                      <pre className="text-xs bg-muted p-3 rounded border overflow-x-auto">
                        {JSON.stringify(authTest.result.body, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Response Headers</h4>
                      <pre className="text-xs bg-muted p-3 rounded border overflow-x-auto max-h-48">
                        {JSON.stringify(authTest.result.headers, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rate Limiting Testing */}
        <TabsContent value="ratelimit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limiting Middleware Test</CardTitle>
              <CardDescription>
                Testez les limites de rate limiting avec différentes configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ip">IP Address</Label>
                  <Input
                    id="ip"
                    value={rateLimitTest.ip}
                    onChange={(e) => setRateLimitTest(prev => ({ ...prev, ip: e.target.value }))}
                    placeholder="127.0.0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userAgent">User Agent</Label>
                  <Input
                    id="userAgent"
                    value={rateLimitTest.userAgent}
                    onChange={(e) => setRateLimitTest(prev => ({ ...prev, userAgent: e.target.value }))}
                    placeholder="Debug-Test-Client"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => testRateLimit(5)}
                  disabled={rateLimitTest.loading}
                  variant="outline"
                >
                  Test 5 requests
                </Button>
                <Button
                  onClick={() => testRateLimit(10)}
                  disabled={rateLimitTest.loading}
                  variant="outline"
                >
                  Test 10 requests
                </Button>
                <Button
                  onClick={() => testRateLimit(70)}
                  disabled={rateLimitTest.loading}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Test jusqu'à rate limit (70)
                </Button>
                <Button
                  onClick={() => setRateLimitTest(prev => ({ ...prev, results: [] }))}
                  variant="ghost"
                  size="sm"
                >
                  Clear
                </Button>
              </div>

              {rateLimitTest.loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Test en cours...
                </div>
              )}

              {rateLimitTest.results.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      Résultats ({rateLimitTest.results.length} requests)
                    </h4>
                    <div className="text-sm text-muted-foreground">
                      ✅ {rateLimitTest.results.filter(r => r.success).length} |
                      ❌ {rateLimitTest.results.filter(r => !r.success).length}
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {rateLimitTest.results.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded border text-sm ${
                          result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Request #{index + 1}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            result.success 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {result.status}
                          </span>
                        </div>
                        
                        {result.meta?.rateLimit && (
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>Limit: {result.meta.rateLimit.limit}</span>
                            <span>Remaining: {result.meta.rateLimit.remaining}</span>
                            <span>Reset: {result.meta.rateLimit.reset}</span>
                          </div>
                        )}
                        
                        {result.error && (
                          <div className="text-xs text-red-600 mt-1">
                            Error: {result.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline Testing */}
        <TabsContent value="pipeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Complete Pipeline Test</CardTitle>
              <CardDescription>
                Visualisation du pipeline complet : envGuard → auth → rateLimit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">🚧 Pipeline visualizer en cours de développement</p>
                <p className="text-sm">
                  Cette section permettra de visualiser le flow complet des middleware
                  avec tracing détaillé de chaque étape.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
