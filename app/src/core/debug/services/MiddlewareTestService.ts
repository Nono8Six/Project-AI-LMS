/**
 * Service de test des middleware oRPC
 * Teste auth, rate limiting et pipeline complet
 */

import type {
  MiddlewareTestConfig,
  AuthTestResult,
  RateLimitTestResult,
  // TestResult,
  PipelineExecution,
  MiddlewarePipelineStep,
  RateLimitBucket,
  RateLimitMeta,
} from '@/shared/types/debug.types';
import { API_CONSTANTS } from '@/shared/constants/api';

export class MiddlewareTestService {
  private static instance: MiddlewareTestService;
  private rateLimitState: Map<string, RateLimitBucket> = new Map();

  public static getInstance(): MiddlewareTestService {
    if (!MiddlewareTestService.instance) {
      MiddlewareTestService.instance = new MiddlewareTestService();
    }
    return MiddlewareTestService.instance;
  }

  /**
   * Teste le middleware d'authentification
   */
  public async testAuthMiddleware(config: MiddlewareTestConfig = {}): Promise<AuthTestResult> {
    const startTime = performance.now();

    try {
      // Préparer les headers
      const headers: Record<string, string> = {
        'content-type': 'application/json',
        'user-agent': config.userAgent || 'Debug-Auth-Test',
        ...config.customHeaders,
      };

      // Ajouter le token Bearer si fourni
      if (config.token?.trim()) {
        headers.authorization = `Bearer ${config.token.trim()}`;
      }

      // Ajouter IP forwarding si spécifié
      if (config.ip) {
        headers['x-forwarded-for'] = config.ip;
      }

      // Tester avec l'endpoint /auth/me qui nécessite auth
      const response = await fetch(`${API_CONSTANTS.prefix}/auth/me`, {
        method: 'POST',
        headers,
        body: '{}',
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });

      const endTime = performance.now();
      const responseBody = await this.parseResponseBody(response);
      const responseHeaders = Object.fromEntries(response.headers.entries());

      // Extraire les infos utilisateur si disponibles
      let userInfo = null;
      if (response.ok && responseBody && typeof responseBody === 'object' && responseBody !== null) {
        const data = responseBody as Partial<{ id: string; email?: string | null; role?: string | null }>;
        if (data.id) {
          userInfo = {
            id: data.id,
            email: data.email || null,
            role: data.role || null,
          };
        }
      }

      const result: AuthTestResult = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        timing: {
          start: startTime,
          end: endTime,
          duration: endTime - startTime,
        },
        meta: {
          requestId: response.headers.get('x-request-id') || undefined,
          rateLimit: this.extractRateLimitMeta(responseHeaders),
        },
        userInfo,
      };

      return result;

    } catch (error) {
      const endTime = performance.now();

      return {
        success: false,
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: null,
        error: (error as Error)?.message || 'Erreur réseau',
        timing: {
          start: startTime,
          end: endTime,
          duration: endTime - startTime,
        },
        userInfo: null,
      };
    }
  }

  /**
   * Teste le middleware de rate limiting
   */
  public async testRateLimitMiddleware(
    config: MiddlewareTestConfig & { requestCount?: number } = {}
  ): Promise<RateLimitTestResult[]> {
    const { requestCount = 5, ip = '127.0.0.1', userAgent = 'Debug-RateLimit-Test' } = config;
    const results: RateLimitTestResult[] = [];

    for (let i = 0; i < requestCount; i++) {
      const startTime = performance.now();

      try {
        const headers: Record<string, string> = {
          'content-type': 'application/json',
          'user-agent': userAgent,
          'x-forwarded-for': ip,
          ...config.customHeaders,
        };

        if (config.token?.trim()) {
          headers.authorization = `Bearer ${config.token.trim()}`;
        }

        // Utiliser l'endpoint health pour tester rate limiting
        const response = await fetch(`${API_CONSTANTS.prefix}/system/health`, {
          method: 'POST',
          headers,
          body: '{}',
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        });

        const endTime = performance.now();
        const responseBody = await this.parseResponseBody(response);
        const responseHeaders = Object.fromEntries(response.headers.entries());
        const rateLimitInfo = this.extractRateLimitMeta(responseHeaders);

        // Mettre à jour notre état local des buckets
        if (rateLimitInfo) {
          const key = config.token ? `user_${config.token.slice(0, 8)}` : ip;
          this.updateRateLimitBucket(key, rateLimitInfo, config.token ? 'user' : 'ip');
        }

        const meta: AuthTestResult['meta'] = {
          ...(response.headers.get('x-request-id') ? { requestId: response.headers.get('x-request-id')! } : {}),
          ...(rateLimitInfo ? { rateLimit: rateLimitInfo } : {}),
        }
        const result: RateLimitTestResult = {
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          body: responseBody,
          timing: {
            start: startTime,
            end: endTime,
            duration: endTime - startTime,
          },
          ...(meta && Object.keys(meta).length > 0 ? { meta } : {}),
          ...(rateLimitInfo ? { rateLimitInfo } : {}),
        } as RateLimitTestResult;

        results.push(result);

        // Si rate limited, on peut arrêter
        if (response.status === 429) {
          break;
        }

        // Petit délai entre les requêtes
        if (i < requestCount - 1) {
          await this.delay(100);
        }

      } catch (error) {
        const endTime = performance.now();

        results.push({
          success: false,
          status: 0,
          statusText: 'Network Error',
          headers: {},
          body: null,
          error: (error as Error)?.message || 'Erreur réseau',
          timing: {
            start: startTime,
            end: endTime,
            duration: endTime - startTime,
          },
        } as RateLimitTestResult);
      }
    }

    return results;
  }

  /**
   * Teste le pipeline complet des middleware
   */
  public async testMiddlewarePipeline(config: MiddlewareTestConfig = {}): Promise<PipelineExecution> {
    const requestId = `pipeline_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const startTime = Date.now();

    const steps: MiddlewarePipelineStep[] = [
      {
        name: 'envGuard',
        description: 'Validation des variables d\'environnement',
        order: 1,
        status: 'pending',
      },
      {
        name: 'resolveUser',
        description: 'Résolution et authentification utilisateur',
        order: 2,
        status: 'pending',
      },
      {
        name: 'enforceRateLimit',
        description: 'Vérification des limites de taux',
        order: 3,
        status: 'pending',
      },
      {
        name: 'handler',
        description: 'Exécution du handler métier',
        order: 4,
        status: 'pending',
      },
    ];

    // Simuler l'exécution du pipeline (en production, ceci serait intégré avec le tracing)
    try {
      const step0 = steps[0]!;
      step0.status = 'running';
      await this.delay(10);
      step0.status = 'success';
      step0.duration = 10;

      // Step 2: resolveUser
      const step1 = steps[1]!;
      step1.status = 'running';
      const authResult = await this.testAuthMiddleware(config);
      step1.duration = authResult.timing.duration;
      
      if (authResult.success || authResult.status === 401) {
        step1.status = 'success';
        step1.metadata = { authenticated: authResult.success, user: authResult.userInfo } as Record<string, unknown>;
      } else {
        step1.status = 'error';
        step1.error = authResult.error || 'Auth middleware failed';
      }

      // Step 3: enforceRateLimit (seulement si auth a réussi)
      const step2 = steps[2]!;
      if (step1.status === 'success') {
        step2.status = 'running';
        const rateLimitResults = await this.testRateLimitMiddleware({ ...config, requestCount: 1 });
        const rateLimitResult = rateLimitResults[0];
        
        if (rateLimitResult) {
          step2.duration = rateLimitResult.timing.duration;
          
          if (rateLimitResult.status === 429) {
            step2.status = 'error';
            step2.error = 'Rate limit exceeded';
            if (rateLimitResult.rateLimitInfo) step2.metadata = { rateLimit: rateLimitResult.rateLimitInfo } as Record<string, unknown>;
          } else if (rateLimitResult.success) {
            step2.status = 'success';
            if (rateLimitResult.rateLimitInfo) step2.metadata = { rateLimit: rateLimitResult.rateLimitInfo } as Record<string, unknown>;
          } else {
            step2.status = 'error';
            step2.error = rateLimitResult.error || 'Rate limit check failed';
          }
        }
      } else {
        step2.status = 'error';
        step2.error = 'Skipped due to auth failure';
      }

      // Step 4: handler (seulement si tout a réussi)
      const step3 = steps[3]!;
      if (step2.status === 'success') {
        step3.status = 'running';
        const t0 = performance.now();
        try {
          const resp = await fetch(`${API_CONSTANTS.prefix}/system/time`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{}',
            cache: 'no-store',
            signal: AbortSignal.timeout(5000),
          });
          const t1 = performance.now();
          const body = await this.parseResponseBody(resp);
          step3.status = resp.ok ? 'success' : 'error';
          step3.duration = t1 - t0;
          step3.metadata = (resp.ok ? { body } : { error: body }) as unknown as Record<string, unknown>;
        } catch (e) {
          const t1 = performance.now();
          step3.status = 'error';
          step3.duration = t1 - t0;
          step3.metadata = { error: (e as Error)?.message || 'handler error' } as unknown as Record<string, unknown>;
        }
      } else {
        step3.status = 'error';
        step3.error = 'Skipped due to middleware failure';
      }

    } catch (error) {
      // Marquer l'étape courante comme erreur
      const currentStep = steps.find(s => s.status === 'running');
      if (currentStep) {
        currentStep.status = 'error';
        currentStep.error = (error as Error)?.message || 'Unknown error';
      }
    }

    const endTime = Date.now();
    const finalStatus = steps.every(s => s.status === 'success') ? 'success' : 'error';

    return {
      requestId,
      startTime,
      endTime,
      totalDuration: endTime - startTime,
      steps,
      finalStatus,
      context: {
        ip: config.ip || '127.0.0.1',
        userAgent: config.userAgent || 'Debug-Pipeline-Test',
        userId: config.token ? 'test-user' : undefined,
        endpoint: `${API_CONSTANTS.prefix}/system/health`,
      },
    };
  }

  /**
   * Obtient l'état actuel des buckets de rate limiting
   */
  public getRateLimitBuckets(): RateLimitBucket[] {
    const now = Date.now();
    return Array.from(this.rateLimitState.values()).filter(bucket => {
      // Filtrer les buckets expirés
      return (bucket.reset * 1000) > now;
    });
  }


  // Méthodes privées

  private async parseResponseBody(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      try {
        return await response.text();
      } catch {
        return null;
      }
    }
  }

  private extractRateLimitMeta(headers: Record<string, string>) {
    const limit = headers['x-ratelimit-limit'];
    const remaining = headers['x-ratelimit-remaining'];
    const reset = headers['x-ratelimit-reset'];

    if (!limit) return undefined;

    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining || '0', 10),
      reset: parseInt(reset || '0', 10),
    };
  }

  private updateRateLimitBucket(key: string, meta: RateLimitMeta, type: 'ip' | 'user' | 'anonymous'): void {
    const bucket: RateLimitBucket = {
      key,
      type,
      limit: meta.limit,
      remaining: meta.remaining,
      reset: meta.reset,
      lastActivity: Date.now(),
      requests: meta.limit - meta.remaining,
    };

    this.rateLimitState.set(key, bucket);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
