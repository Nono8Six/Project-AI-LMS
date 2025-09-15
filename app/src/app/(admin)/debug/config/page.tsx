import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfigValidatorService } from '@/core/debug/services/ConfigValidatorService';
import NonceDemo from './NonceDemo';
import type { ConfigSection } from '@/shared/types/debug.types';

export const dynamic = 'force-dynamic';


import { API_CONSTANTS } from '@/shared/constants/api';
import type { ConnectivityTest as SharedConnectivityTest } from '@/shared/types/debug.types';

type ConnectivityTest = SharedConnectivityTest;

async function validateConfiguration(): Promise<ConfigSection[]> {
  const svc = ConfigValidatorService.getInstance();
  const { sections } = await svc.validateConfiguration();
  return sections;
}

async function testConnectivity(): Promise<ConnectivityTest[]> {
  const tests: ConnectivityTest[] = [];

  // Test Supabase connectivity
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
      }).catch(() => null);

      tests.push({
        name: 'Supabase REST API',
        status: response?.ok ? 'ok' : 'error',
        message: response?.ok ? 'Connexion réussie' : 'Connexion échouée',
        details: response ? {
          status: response.status,
          statusText: response.statusText,
        } : undefined,
      });
    } else {
      tests.push({
        name: 'Supabase REST API',
        status: 'error',
        message: 'URL Supabase non configurée',
      });
    }
  } catch (error) {
    tests.push({
      name: 'Supabase REST API',
      status: 'error',
      message: `Erreur: ${(error as Error)?.message || 'Unknown error'}`,
    });
  }

  // Test Redis connectivity (si configuré)
  if (process.env.RATE_LIMIT_PROVIDER === 'redis') {
    try {
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
          headers: {
            'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          },
        }).catch(() => null);

        tests.push({
          name: 'Redis (Upstash)',
          status: response?.ok ? 'ok' : 'error',
          message: response?.ok ? 'Ping réussi' : 'Ping échoué',
          details: response ? {
            status: response.status,
            statusText: response.statusText,
          } : undefined,
        });
      } else {
        tests.push({
          name: 'Redis (Upstash)',
          status: 'error',
          message: 'Configuration Redis incomplète',
        });
      }
    } catch (error) {
      tests.push({
        name: 'Redis (Upstash)',
        status: 'error',
        message: `Erreur: ${(error as Error)?.message || 'Unknown error'}`,
      });
    }
  } else {
    tests.push({
      name: 'Redis (Upstash)',
      status: 'info',
      message: 'Non utilisé (RATE_LIMIT_PROVIDER=memory)',
    });
  }

  // Test API health
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const target = appUrl
      ? new URL(`${API_CONSTANTS.prefix}/system/health`, appUrl).toString()
      : `${API_CONSTANTS.prefix}/system/health`;
    const response = await fetch(target, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    }).catch(() => null);

    const data = response ? await response.json().catch(() => null) : null;

    tests.push({
      name: 'oRPC Health Endpoint',
      status: response?.ok ? 'ok' : 'error',
      message: response?.ok ? 'API fonctionnelle' : 'API non accessible',
      details: {
        status: response?.status,
        data,
      },
    });
  } catch (error) {
    tests.push({
      name: 'oRPC Health Endpoint',
      status: 'error',
      message: `Erreur: ${(error as Error)?.message || 'Unknown error'}`,
    });
  }

  return tests;
}

function StatusBadge({ status }: { status: 'ok' | 'warning' | 'error' | 'info' }) {
  const variants = {
    ok: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const icons = {
    ok: '✅',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️',
  };

  return (
    <Badge variant="outline" className={variants[status]}>
      <span className="mr-1">{icons[status]}</span>
      {status.toUpperCase()}
    </Badge>
  );
}

function maskValue(value: string | undefined, masked?: boolean): string {
  if (!value) return '❌ Non défini';
  if (!masked) return value;
  
  if (value.length <= 8) {
    return '••••••••';
  }
  
  return `${value.slice(0, 4)}${'•'.repeat(Math.min(12, value.length - 8))}${value.slice(-4)}`;
}

async function ConfigContent() {
  const [config, connectivity] = await Promise.all([
    validateConfiguration(),
    testConnectivity(),
  ]);

  return (
    <div className="space-y-6">
      {/* Connectivity Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Tests de Connectivité</CardTitle>
          <CardDescription>
            Vérification de la connectivité avec les services externes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {connectivity.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{test.name}</div>
                  <div className="text-sm text-muted-foreground">{test.message}</div>
                  {test.details && (
                    <pre className="text-xs text-muted-foreground mt-1 max-w-xs overflow-hidden">
                      {JSON.stringify(test.details, null, 1)}
                    </pre>
                  )}
                </div>
                <StatusBadge status={test.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CSP Nonce Demonstration */}
      <NonceDemo />

      {/* Configuration Sections */}
      {config.map((section, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium font-mono text-sm">{item.key}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    {item.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {maskValue(item.value, item.masked)}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé de Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { 
                label: 'Variables OK', 
                count: config.flatMap(s => s.items).filter(i => i.status === 'ok').length,
                color: 'text-green-600'
              },
              { 
                label: 'Avertissements', 
                count: config.flatMap(s => s.items).filter(i => i.status === 'warning').length,
                color: 'text-yellow-600'
              },
              { 
                label: 'Erreurs', 
                count: config.flatMap(s => s.items).filter(i => i.status === 'error').length,
                color: 'text-red-600'
              },
              { 
                label: 'Info', 
                count: config.flatMap(s => s.items).filter(i => i.status === 'info').length,
                color: 'text-blue-600'
              },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.count}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfigDebugPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-2">Configuration Diagnostic</h1>
        <p className="text-muted-foreground">
          Validation complète de la configuration et tests de connectivité
        </p>
      </div>

      <Suspense fallback={<div className="text-sm text-muted-foreground">Chargement…</div>}>
        <ConfigContent />
      </Suspense>
    </div>
  );
}
