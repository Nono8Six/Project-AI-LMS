/**
 * Service de test des endpoints API oRPC
 * Teste tous les endpoints disponibles avec validation automatique
 */

import type {
  ApiEndpoint,
  EndpointTestRequest,
  TestResult,
  EndpointTestHistory,
  BatchTestConfig,
  BatchTestResult,
} from '@/shared/types/debug.types';
import { API_CONSTANTS } from '@/shared/constants/api';

export class EndpointTestService {
  private static instance: EndpointTestService;
  private testHistory: EndpointTestHistory[] = [];

  public static getInstance(): EndpointTestService {
    if (!EndpointTestService.instance) {
      EndpointTestService.instance = new EndpointTestService();
    }
    return EndpointTestService.instance;
  }

  /**
   * Endpoints disponibles basés sur le router oRPC existant
   */
  public readonly availableEndpoints: ApiEndpoint[] = [
    {
      path: `${API_CONSTANTS.prefix}/system/health`,
      method: 'POST',
      description: 'Health check avec version et timestamp',
      category: 'system',
      inputSchema: '{}',
    },
    {
      path: `${API_CONSTANTS.prefix}/system/time`,
      method: 'POST',
      description: 'Timestamp ISO actuel du serveur',
      category: 'system',
      inputSchema: '{}',
    },
    {
      path: `${API_CONSTANTS.prefix}/system/version`,
      method: 'POST',
      description: 'Version de l\'application avec source',
      category: 'system',
      inputSchema: '{}',
    },
    {
      path: `${API_CONSTANTS.prefix}/auth/me`,
      method: 'POST',
      description: 'Informations utilisateur authentifié (user profile)',
      category: 'auth',
      requiresAuth: true,
      inputSchema: '{}',
    },
  ];

  /**
   * Teste un endpoint individuel avec configuration personnalisée
   */
  public async testEndpoint(request: EndpointTestRequest): Promise<TestResult> {
    const startTime = performance.now();

    try {
      // Préparer les headers
      const headers: Record<string, string> = {
        'content-type': 'application/json',
        ...request.headers,
      };

      // Ajouter l'auth token si fourni
      if (request.authToken?.trim()) {
        headers.authorization = `Bearer ${request.authToken.trim()}`;
      }

      // Préparer le body
      let body = '{}';
      if (request.body) {
        if (typeof request.body === 'string') {
          try {
            JSON.parse(request.body);
            body = request.body;
          } catch {
            body = JSON.stringify(request.body);
          }
        } else {
          body = JSON.stringify(request.body);
        }
      }

      // Effectuer la requête
      const init: RequestInit = {
        method: request.endpoint.method,
        headers,
        cache: 'no-store',
        signal: AbortSignal.timeout(10000), // 10s timeout
      };
      if (request.endpoint.method !== 'GET') {
        init.body = body;
      }
      const response = await fetch(request.endpoint.path, init);

      const endTime = performance.now();

      // Lire la réponse
      const responseBody = await this.parseResponseBody(response);
      const responseHeaders = Object.fromEntries(response.headers.entries());

      // Construire le résultat
      const result: TestResult = {
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
          ...(response.headers.get('x-request-id') ? { requestId: response.headers.get('x-request-id')! } : {}),
          rateLimit: this.extractRateLimitMeta(responseHeaders),
        },
      };

      // Ajouter à l'historique
      this.addToHistory({
        endpoint: request.endpoint.path,
        result,
        timestamp: Date.now(),
        config: request,
      });

      return result;

    } catch (error) {
      const endTime = performance.now();

      const result: TestResult = {
        success: false,
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: null,
        error: (error as Error)?.message || 'Erreur réseau inconnue',
        timing: {
          start: startTime,
          end: endTime,
          duration: endTime - startTime,
        },
      };

      // Ajouter à l'historique même en cas d'erreur
      this.addToHistory({
        endpoint: request.endpoint.path,
        result,
        timestamp: Date.now(),
        config: request,
      });

      return result;
    }
  }

  /**
   * Teste un endpoint simple par son path
   */
  public async testEndpointByPath(
    path: string,
    options: {
      authToken?: string;
      customHeaders?: Record<string, string>;
      body?: unknown;
    } = {}
  ): Promise<TestResult> {
    const endpoint = this.availableEndpoints.find(e => e.path === path);
    if (!endpoint) {
      throw new Error(`Endpoint non trouvé: ${path}`);
    }

    const request: EndpointTestRequest = { endpoint };
    if (options.customHeaders) request.headers = options.customHeaders;
    if (typeof options.body !== 'undefined') request.body = options.body;
    if (options.authToken) request.authToken = options.authToken;
    return this.testEndpoint(request);
  }

  /**
   * Teste tous les endpoints d'une catégorie
   */
  public async testEndpointsByCategory(
    category: ApiEndpoint['category'],
    options: {
      authToken?: string;
      customHeaders?: Record<string, string>;
    } = {}
  ): Promise<TestResult[]> {
    const endpoints = this.availableEndpoints.filter(e => e.category === category);
    const results: TestResult[] = [];

    for (const endpoint of endpoints) {
      const request: EndpointTestRequest = { endpoint };
      if (options.customHeaders) request.headers = options.customHeaders;
      if (options.authToken && options.authToken.trim()) request.authToken = options.authToken.trim();

      const result = await this.testEndpoint(request);
      results.push(result);

      // Petit délai entre les tests pour éviter le spam
      await this.delay(100);
    }

    return results;
  }

  /**
   * Teste tous les endpoints disponibles
   */
  public async testAllEndpoints(options: {
    authToken?: string;
    customHeaders?: Record<string, string>;
    includeAuthRequired?: boolean;
  } = {}): Promise<TestResult[]> {
    const { includeAuthRequired = false } = options;
    
    const endpoints = this.availableEndpoints.filter(e => 
      includeAuthRequired || !e.requiresAuth
    );

    const results: TestResult[] = [];

    for (const endpoint of endpoints) {
      const request: EndpointTestRequest = { endpoint };
      if (options.customHeaders) request.headers = options.customHeaders;
      if (options.authToken && options.authToken.trim()) request.authToken = options.authToken.trim();

      const result = await this.testEndpoint(request);
      results.push(result);

      await this.delay(200); // Délai plus long pour tests complets
    }

    return results;
  }

  /**
   * Teste en batch avec configuration avancée
   */
  public async runBatchTest(config: BatchTestConfig): Promise<BatchTestResult> {
    const startTime = Date.now();
    const results: TestResult[] = [];

    for (let i = 0; i < config.iterations; i++) {
      for (const endpointPath of config.endpoints) {
        const endpoint = this.availableEndpoints.find(e => e.path === endpointPath);
        if (!endpoint) {
          console.warn(`Endpoint non trouvé pour batch test: ${endpointPath}`);
          continue;
        }

      const request: EndpointTestRequest = { endpoint };
      if (config.authToken) request.authToken = config.authToken;

        const result = await this.testEndpoint(request);
        results.push(result);

        // Arrêter si erreur et config l'exige
        if (!result.success && config.stopOnError) {
          break;
        }

        // Délai entre les requêtes
        if (config.delayBetweenRequests > 0) {
          await this.delay(config.delayBetweenRequests);
        }
      }

      // Arrêter si erreur détectée et config l'exige
      if (config.stopOnError && results.some(r => !r.success)) {
        break;
      }
    }

    const endTime = Date.now();

    // Calculer les statistiques
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      avgDuration: results.length > 0 
        ? results.reduce((sum, r) => sum + r.timing.duration, 0) / results.length 
        : 0,
      rateLimited: results.filter(r => r.status === 429).length,
    };

    return {
      config,
      results,
      summary,
      startTime,
      endTime,
    };
  }

  /**
   * Obtient l'historique des tests
   */
  public getTestHistory(limit?: number): EndpointTestHistory[] {
    const sorted = [...this.testHistory].sort((a, b) => b.timestamp - a.timestamp);
    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Obtient les statistiques globales des tests
   */
  public getTestStatistics(): {
    totalTests: number;
    successRate: number;
    averageDuration: number;
    mostTestedEndpoint: string | null;
    errorRate: number;
    rateLimitHits: number;
  } {
    if (this.testHistory.length === 0) {
      return {
        totalTests: 0,
        successRate: 0,
        averageDuration: 0,
        mostTestedEndpoint: null,
        errorRate: 0,
        rateLimitHits: 0,
      };
    }

    const successful = this.testHistory.filter(h => h.result.success).length;
    const avgDuration = this.testHistory.reduce((sum, h) => sum + h.result.timing.duration, 0) / this.testHistory.length;
    const rateLimited = this.testHistory.filter(h => h.result.status === 429).length;

    // Endpoint le plus testé
    const endpointCounts = this.testHistory.reduce((acc, h) => {
      acc[h.endpoint] = (acc[h.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostTested = Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)[0];

    return {
      totalTests: this.testHistory.length,
      successRate: (successful / this.testHistory.length) * 100,
      averageDuration: avgDuration,
      mostTestedEndpoint: mostTested ? mostTested[0] : null,
      errorRate: ((this.testHistory.length - successful) / this.testHistory.length) * 100,
      rateLimitHits: rateLimited,
    };
  }

  /**
   * Nettoie l'historique des tests
   */
  public clearHistory(): void {
    this.testHistory = [];
  }

  /**
   * Génère un template de requête pour un endpoint
   */
  public generateRequestTemplate(endpoint: ApiEndpoint): EndpointTestRequest {
    const req: EndpointTestRequest = {
      endpoint,
      headers: { 'user-agent': 'Debug-Endpoint-Tester' },
      body: endpoint.inputSchema ? JSON.parse(endpoint.inputSchema) : {},
    };
    return req;
  }

  // Méthodes privées

  private async parseResponseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch {
        return { error: 'Invalid JSON response', raw: await response.text().catch(() => 'Failed to read') };
      }
    }

    if (contentType.includes('text/')) {
      return await response.text().catch(() => 'Failed to read text response');
    }

    return { error: 'Unsupported content type', contentType };
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

  private addToHistory(entry: EndpointTestHistory): void {
    this.testHistory.push(entry);

    // Garder seulement les 100 derniers tests
    if (this.testHistory.length > 100) {
      this.testHistory = this.testHistory.slice(-100);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
