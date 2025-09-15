'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { API_CONSTANTS } from '@/shared/constants/api';
import { EndpointTestService } from '@/core/debug/services/EndpointTestService';
import type { ApiEndpoint, EndpointTestRequest } from '@/shared/types/debug.types';

type OpenAPIPaths = Record<string, { post?: { summary?: string } }>;
type OpenAPISpec = { paths?: OpenAPIPaths };

function deriveEndpointsFromOpenAPI(specUnknown: unknown): ApiEndpoint[] {
  const out: ApiEndpoint[] = [];
  const spec = (specUnknown && typeof specUnknown === 'object' ? (specUnknown as OpenAPISpec) : {}) as OpenAPISpec;
  if (!spec.paths) return out;
  for (const [path, methods] of Object.entries(spec.paths)) {
    if (!path.startsWith(API_CONSTANTS.prefix)) continue;
    const post = methods.post;
    if (!post) continue;
    const seg = path.replace(API_CONSTANTS.prefix + '/', '').split('/');
    const ns = seg[0];
    const name = seg[1];
    const category = (ns === 'system' || ns === 'auth') ? (ns as 'system' | 'auth') : 'custom';
    out.push({
      path,
      method: 'POST',
      description: post?.summary || `${ns}.${name}`,
      category,
      requiresAuth: false,
      inputSchema: '{}',
    });
  }
  out.sort((a,b)=> a.path.localeCompare(b.path));
  return out;
}

interface TestResult {
  success: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  error?: string;
  timing: {
    start: number;
    end: number;
    duration: number;
  };
  meta?: {
    requestId?: string;
    rateLimit?: {
      limit: number;
      remaining: number;
      reset: number;
    };
  };
}

interface EndpointTestState {
  selectedEndpoint: string;
  customHeaders: string;
  requestBody: string;
  authToken: string;
  result: TestResult | null;
  loading: boolean;
  history: Array<{ endpoint: string; result: TestResult; timestamp: number }>;
}

export default function EndpointsDebugPage() {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [testState, setTestState] = useState<EndpointTestState>({
    selectedEndpoint: '',
    customHeaders: JSON.stringify({ 'content-type': 'application/json', 'user-agent': 'Debug-Endpoint-Tester' }, null, 2),
    requestBody: '{}',
    authToken: '',
    result: null,
    loading: false,
    history: [],
  });

  const selectedEndpointInfo = endpoints.find(e => e.path === testState.selectedEndpoint);

  const loadOpenAPI = useCallback(async () => {
    try {
      const res = await fetch(`${API_CONSTANTS.prefix}/debug/openapi`, { method: 'POST', cache: 'no-store', headers: { 'content-type': 'application/json' } });
      const raw: unknown = await res.json().catch(() => null);
      const isJsonEnvelope = (o: unknown): o is { json: unknown } => typeof o === 'object' && o !== null && 'json' in o;
      const unwrapOnce = (o: unknown): unknown => (isJsonEnvelope(o) ? o.json : o);
      const spec = unwrapOnce(unwrapOnce(raw));
      let eps = deriveEndpointsFromOpenAPI(spec);
      if (!eps.length) {
        // Fallback to known endpoints if OpenAPI unavailable
        const svc = EndpointTestService.getInstance();
        eps = [...svc.availableEndpoints];
      }
      setEndpoints(eps);
      if (eps.length > 0) setTestState(prev => ({ ...prev, selectedEndpoint: eps[0]!.path }));
    } catch {
      console.warn('Failed to load OpenAPI spec');
    }
  }, []);

  useEffect(() => { loadOpenAPI(); }, [loadOpenAPI]);

  const testEndpoint = useCallback(async () => {
    if (!selectedEndpointInfo) return;

    setTestState(prev => ({ ...prev, loading: true, result: null }));

    const start = performance.now();

    try {
      // Parse headers
      let headers: Record<string, string> = {
        'content-type': 'application/json',
      };

      try {
        const customHeaders = JSON.parse(testState.customHeaders);
        headers = { ...headers, ...customHeaders };
      } catch {
        // Ignore invalid JSON headers
      }

      // Add auth token if provided
      if (testState.authToken.trim()) {
        headers.authorization = `Bearer ${testState.authToken.trim()}`;
      }

      // Parse body
      let body = '{}';
      try {
        body = testState.requestBody.trim() || '{}';
        // Validate JSON
        JSON.parse(body);
      } catch {
        body = '{}';
      }

      
      const svc = EndpointTestService.getInstance();
      const req: EndpointTestRequest = { endpoint: selectedEndpointInfo, headers, body };
      if (testState.authToken && testState.authToken.trim()) req.authToken = testState.authToken.trim();
      const svcResult = await svc.testEndpoint(req);
      const end = performance.now();
      const meta: { requestId?: string; rateLimit?: { limit: number; remaining: number; reset: number } } = {};
      if (svcResult.meta?.requestId) meta.requestId = svcResult.meta.requestId;
      if (svcResult.meta?.rateLimit) meta.rateLimit = svcResult.meta.rateLimit;
      const result: TestResult = {
        success: svcResult.success,
        status: svcResult.status,
        statusText: svcResult.statusText,
        headers: svcResult.headers,
        body: svcResult.body,
        ...(svcResult.error ? { error: svcResult.error } : {}),
        timing: { start, end, duration: end - start },
        ...(Object.keys(meta).length ? { meta } : {}),
      };

      setTestState(prev => ({
        ...prev,
        result,
        history: [
          { endpoint: selectedEndpointInfo.path, result, timestamp: Date.now() },
          ...prev.history.slice(0, 9)
        ],
      }));


    } catch (error) {
      const end = performance.now();
      
      setTestState(prev => ({
        ...prev,
        result: {
          success: false,
          status: 0,
          statusText: 'Network Error',
          headers: {},
          body: null,
          error: (error as Error)?.message || 'Network error',
          timing: {
            start,
            end,
            duration: end - start,
          },
        },
      }));
    } finally {
      setTestState(prev => ({ ...prev, loading: false }));
    }
  }, [testState.customHeaders, testState.requestBody, testState.authToken, selectedEndpointInfo]);

  const loadEndpointTemplate = useCallback((endpoint: ApiEndpoint) => {
    setTestState(prev => ({
      ...prev,
      selectedEndpoint: endpoint.path,
      requestBody: endpoint.inputSchema || '{}',
      authToken: endpoint.requiresAuth ? prev.authToken : '',
    }));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-2">API Endpoints Testing</h1>
        <p className="text-muted-foreground">Test interactif de tous les endpoints oRPC avec validation Zod</p>
        <div className="mt-3 text-xs text-muted-foreground">
          <div className="mb-1 font-medium">Mode d'emploi rapide</div>
          <ul className="list-disc ml-5 space-y-1">
            <li>Choisis un endpoint dans la liste ou via « Templates rapides ».</li>
            <li>Request Body: la plupart des endpoints système attendent un objet vide <code className="font-mono">{`{}`}</code>.</li>
            <li>Headers: garde <code className="font-mono">content-type: application/json</code>. Ajoute <code className="font-mono">x-forwarded-for</code> pour simuler une IP (rate limit).</li>
            <li>Auth (auth.me): ajoute un token dans « Bearer Token » ou le header <code className="font-mono">authorization: Bearer &lt;token&gt;</code>.</li>
            <li>Exécute le test puis consulte les onglets Response, Headers et Meta (x-request-id, rate limit).</li>
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Panel - Test Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration du Test</CardTitle>
              <CardDescription>
                Configurez et exécutez des tests sur les endpoints disponibles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Endpoint Selection */}
              <div className="space-y-2">
                <Label htmlFor="endpoint">Endpoint</Label>
                <Select
                  value={testState.selectedEndpoint}
                  onValueChange={(value) => setTestState(prev => ({ ...prev, selectedEndpoint: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {endpoints.map((endpoint) => (
                      <SelectItem key={endpoint.path} value={endpoint.path}>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            endpoint.category === 'system' ? 'bg-blue-100 text-blue-800' :
                            endpoint.category === 'auth' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {endpoint.category}
                          </span>
                          <span className="font-mono text-sm">{endpoint.path}</span>
                          {endpoint.requiresAuth && (
                            <span className="text-xs">🔐</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedEndpointInfo && (
                  <p className="text-sm text-muted-foreground">
                    {selectedEndpointInfo.description}
                  </p>
                )}
              </div>

              {/* Auth Token */}
              {selectedEndpointInfo?.requiresAuth && (
                <div className="space-y-2">
                  <Label htmlFor="authToken">Bearer Token</Label>
                  <Textarea
                    id="authToken"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={testState.authToken}
                    onChange={(e) => setTestState(prev => ({ ...prev, authToken: e.target.value }))}
                    rows={2}
                  />
                </div>
              )}

              {/* Request Body */}
              <div className="space-y-2">
                <Label htmlFor="requestBody">Request Body (JSON)</Label>
                <Textarea
                  id="requestBody"
                  value={testState.requestBody}
                  onChange={(e) => setTestState(prev => ({ ...prev, requestBody: e.target.value }))}
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Astuce: laisse <code className="font-mono">{`{}`}</code> pour les endpoints système (health/time/version).</p>
              </div>

              {/* Custom Headers */}
              <div className="space-y-2">
                <Label htmlFor="customHeaders">Headers personnalisés (JSON)</Label>
                <Textarea
                  id="customHeaders"
                  value={testState.customHeaders}
                  onChange={(e) => setTestState(prev => ({ ...prev, customHeaders: e.target.value }))}
                  rows={3}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Par défaut: <code className="font-mono">content-type: application/json</code>. Tu peux ajouter <code className="font-mono">x-forwarded-for</code> pour le rate limit ou <code className="font-mono">authorization: Bearer &lt;token&gt;</code> pour l’auth.</p>
              </div>

              <Button
                onClick={testEndpoint}
                disabled={testState.loading}
                className="w-full"
                size="lg"
              >
                {testState.loading ? 'Test en cours...' : `Tester ${selectedEndpointInfo?.method} ${selectedEndpointInfo?.path}`}
              </Button>
            </CardContent>
          </Card>

          {/* Test Result */}
          {testState.result && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Résultat du Test</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm px-2 py-1 rounded ${
                      testState.result.success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {testState.result.success ? '✅' : '❌'} {testState.result.status} {testState.result.statusText}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {testState.result.timing.duration.toFixed(2)}ms
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="response" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="response">Response</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="meta">Meta</TabsTrigger>
                  </TabsList>

                  <TabsContent value="response" className="space-y-2">
                    <pre className="text-xs bg-muted p-4 rounded border overflow-x-auto max-h-64">
                      {JSON.stringify(testState.result.body, null, 2)}
                    </pre>
                    {testState.result.error && (
                      <div className="text-sm text-red-600 p-3 bg-red-50 rounded border">
                        <strong>Error:</strong> {testState.result.error}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="headers" className="space-y-2">
                    <pre className="text-xs bg-muted p-4 rounded border overflow-x-auto max-h-64">
                      {JSON.stringify(testState.result.headers, null, 2)}
                    </pre>
                  </TabsContent>

                  <TabsContent value="meta" className="space-y-2">
                    <div className="space-y-3">
                      {testState.result.meta?.requestId && (
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm font-medium">Request ID</span>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {testState.result.meta.requestId}
                          </code>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Duration</span>
                        <span className="text-sm">{testState.result.timing.duration.toFixed(2)}ms</span>
                      </div>

                      {testState.result.meta?.rateLimit && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Rate Limiting</h4>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-xs text-muted-foreground">Limit</div>
                              <div className="font-mono">{testState.result.meta.rateLimit.limit}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Remaining</div>
                              <div className="font-mono">{testState.result.meta.rateLimit.remaining}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Reset</div>
                              <div className="font-mono text-xs">{testState.result.meta.rateLimit.reset}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Quick Templates & History */}
        <div className="space-y-6">
          {/* Quick Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Templates Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {endpoints.map((endpoint) => (
                <Button
                  key={endpoint.path}
                  variant="outline"
                  size="sm"
                  onClick={() => loadEndpointTemplate(endpoint)}
                  className="w-full justify-start text-left h-auto py-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        endpoint.category === 'system' ? 'bg-blue-100 text-blue-800' :
                        endpoint.category === 'auth' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {endpoint.category}
                      </span>
                      {endpoint.requiresAuth && (
                        <span className="text-xs">🔐</span>
                      )}
                    </div>
                    <div className="text-xs font-mono">{endpoint.path}</div>
                    <div className="text-xs text-muted-foreground">
                      {endpoint.description}
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* History */}
          {testState.history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Historique</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {testState.history.map((item, index) => (
                  <div key={index} className="p-2 border rounded text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono">{item.endpoint.split('/').pop()}</span>
                      <span className={`px-1 py-0.5 rounded ${
                        item.result.success 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.result.status}
                      </span>
                    </div>
                    <div className="text-muted-foreground mt-1">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

