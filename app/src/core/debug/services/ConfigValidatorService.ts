/**
 * Service de validation de configuration pour le debug
 * Valide toutes les variables d'environnement et configurations système
 */

import type {
  ConfigSection,
  ConfigItem,
  ConfigValidationResult,
  ConnectivityTest,
  ConnectivityTestSuite,
  ConfigStatus,
} from '@/shared/types/debug.types';
import { getAppBaseUrl } from '@/shared/utils/url';

export class ConfigValidatorService {
  private static instance: ConfigValidatorService;

  public static getInstance(): ConfigValidatorService {
    if (!ConfigValidatorService.instance) {
      ConfigValidatorService.instance = new ConfigValidatorService();
    }
    return ConfigValidatorService.instance;
  }

  private maskValue(value: string | undefined, masked?: boolean): string {
    if (!value) return '❌ Non défini';
    if (!masked) return value;
    
    if (value.length <= 8) {
      return '••••••••';
    }
    
    return `${value.slice(0, 4)}${'•'.repeat(Math.min(12, value.length - 8))}${value.slice(-4)}`;
  }

  private validateConfigItem(
    key: string, 
    value: string | undefined, 
    options: {
      required?: boolean;
      masked?: boolean;
      description?: string;
      validator?: (value: string) => boolean;
      dependsOn?: string[];
    } = {}
  ): ConfigItem {
    const { required = false, masked = false, description, validator, dependsOn = [] } = options;
    
    let status: ConfigStatus = 'ok';

    // Check if value exists
    if (!value || value.trim() === '') {
      status = required ? 'error' : 'warning';
    } else if (validator && !validator(value)) {
      status = 'error';
    } else if (dependsOn.length > 0) {
      // Check dependencies
      const missingDependencies = dependsOn.filter(dep => !process.env[dep]);
      if (missingDependencies.length > 0) {
        status = 'warning';
      }
    }

    const base: ConfigItem = {
      key,
      value: this.maskValue(value, masked),
      status,
      masked,
      required,
    };
    return typeof description !== 'undefined' ? { ...base, description } : base;
  }

  private isValidUrl = (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  private isValidPort = (value: string): boolean => {
    const port = parseInt(value, 10);
    return !isNaN(port) && port > 0 && port <= 65535;
  };

  private isValidLogLevel = (value: string): boolean => {
    return ['debug', 'info', 'warn', 'error'].includes(value.toLowerCase());
  };

  public async validateConfiguration(): Promise<ConfigValidationResult> {
    const sections: ConfigSection[] = [
      // Configuration oRPC & API
      {
        title: 'Configuration oRPC & API',
        description: 'Configuration du serveur API et middleware oRPC',
        category: 'orpc',
        items: [
          this.validateConfigItem('ORPC_PREFIX', process.env.ORPC_PREFIX || '/api/rpc', {
            description: 'Préfixe des routes oRPC',
            validator: (v) => v.startsWith('/'),
          }),
          this.validateConfigItem('API_MAX_BODY', process.env.API_MAX_BODY || '1048576', {
            description: 'Taille maximum du payload (bytes)',
            validator: (v) => !isNaN(parseInt(v, 10)) && parseInt(v, 10) > 0,
          }),
          this.validateConfigItem('API_RATE_LIMIT_ANON_PER_MIN', process.env.API_RATE_LIMIT_ANON_PER_MIN || '60', {
            description: 'Rate limit pour utilisateurs anonymes (par minute)',
            validator: (v) => !isNaN(parseInt(v, 10)) && parseInt(v, 10) > 0,
          }),
          this.validateConfigItem('API_RATE_LIMIT_USER_PER_MIN', process.env.API_RATE_LIMIT_USER_PER_MIN || '120', {
            description: 'Rate limit pour utilisateurs authentifiés (par minute)',
            validator: (v) => !isNaN(parseInt(v, 10)) && parseInt(v, 10) > 0,
          }),
          this.validateConfigItem('RATE_LIMIT_PROVIDER', process.env.RATE_LIMIT_PROVIDER || 'memory', {
            description: 'Provider de rate limiting (memory/redis)',
            validator: (v) => ['memory', 'redis'].includes(v.toLowerCase()),
          }),
          this.validateConfigItem('LOG_LEVEL', process.env.LOG_LEVEL || 'info', {
            description: 'Niveau de logging structuré',
            validator: this.isValidLogLevel,
          }),
        ],
      },

      // Configuration Supabase
      {
        title: 'Configuration Supabase',
        description: 'Base de données PostgreSQL et authentification',
        category: 'supabase',
        items: [
          this.validateConfigItem('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL, {
            required: true,
            description: 'URL du projet Supabase',
            validator: this.isValidUrl,
          }),
          this.validateConfigItem('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
            required: true,
            masked: true,
            description: 'Clé publique Supabase (anon role)',
          }),
          this.validateConfigItem('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY, {
            masked: true,
            description: 'Clé service role pour opérations admin',
          }),
          this.validateConfigItem('SUPABASE_JWT_SECRET', process.env.SUPABASE_JWT_SECRET, {
            masked: true,
            description: 'Secret JWT pour validation des tokens',
          }),
          this.validateConfigItem('SUPABASE_DB_URL', process.env.SUPABASE_DB_URL, {
            masked: true,
            description: 'URL directe de connexion PostgreSQL',
          }),
        ],
      },

      // Configuration Redis
      {
        title: 'Configuration Redis (Rate Limiting)',
        description: 'Cache Redis Upstash pour rate limiting avancé',
        category: 'redis',
        items: [
          this.validateConfigItem('UPSTASH_REDIS_REST_URL', process.env.UPSTASH_REDIS_REST_URL, {
            description: 'URL de l\'API REST Upstash Redis',
            validator: this.isValidUrl,
            required: process.env.RATE_LIMIT_PROVIDER === 'redis',
          }),
          this.validateConfigItem('UPSTASH_REDIS_REST_TOKEN', process.env.UPSTASH_REDIS_REST_TOKEN, {
            masked: true,
            description: 'Token d\'authentification Upstash Redis',
            required: process.env.RATE_LIMIT_PROVIDER === 'redis',
          }),
        ],
      },

      // Configuration Application
      {
        title: 'Configuration Application',
        description: 'Variables d\'environnement générales de l\'application',
        category: 'app',
        items: [
          this.validateConfigItem('NODE_ENV', process.env.NODE_ENV || 'development', {
            description: 'Environnement d\'exécution Node.js',
            validator: (v) => ['development', 'production', 'test'].includes(v),
          }),
          this.validateConfigItem('NEXT_PUBLIC_APP_URL', process.env.NEXT_PUBLIC_APP_URL || getAppBaseUrl(), {
            description: 'URL publique de l\'application',
            validator: this.isValidUrl,
          }),
          this.validateConfigItem('NEXT_PUBLIC_APP_NAME', process.env.NEXT_PUBLIC_APP_NAME || 'LMS IA', {
            description: 'Nom de l\'application',
          }),
          this.validateConfigItem('NEXT_PUBLIC_APP_VERSION', process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0', {
            description: 'Version de l\'application',
            validator: (v) => /^\d+\.\d+\.\d+/.test(v),
          }),
        ],
      },

      // Configuration Sécurité & CSP
      {
        title: 'Configuration CSP & Sécurité',
        description: 'Content Security Policy et options de sécurité',
        category: 'security',
        items: [
          this.validateConfigItem('CSP_USE_NONCE', process.env.CSP_USE_NONCE || 'false', {
            description: 'Utilisation des nonces CSP pour les scripts/styles',
            validator: (v) => ['true', 'false'].includes(v.toLowerCase()),
          }),
          this.validateConfigItem('CSP_REPORT_ONLY', process.env.CSP_REPORT_ONLY || 'false', {
            description: 'Mode report-only CSP (pas de blocage)',
            validator: (v) => ['true', 'false'].includes(v.toLowerCase()),
          }),
          this.validateConfigItem('CSP_ALLOW_INLINE_STYLE', process.env.CSP_ALLOW_INLINE_STYLE || 'false', {
            description: 'Autoriser les styles inline (unsafe)',
            validator: (v) => ['true', 'false'].includes(v.toLowerCase()),
          }),
        ],
      },
    ];

    // Calculer le résumé
    const allItems = sections.flatMap(section => section.items);
    const summary = {
      total: allItems.length,
      ok: allItems.filter(item => item.status === 'ok').length,
      warnings: allItems.filter(item => item.status === 'warning').length,
      errors: allItems.filter(item => item.status === 'error').length,
      info: allItems.filter(item => item.status === 'info').length,
    };

    return {
      sections,
      summary,
    };
  }

  public async testConnectivity(): Promise<ConnectivityTestSuite> {
    const tests: ConnectivityTest[] = [];

    // Test Supabase REST API
    await this.testSupabaseConnectivity(tests);

    // Test Redis connectivity (si configuré)
    await this.testRedisConnectivity(tests);

    // Test API Health endpoint
    await this.testApiHealthEndpoint(tests);

    // Calculer le résumé
    const summary = {
      total: tests.length,
      passed: tests.filter(t => t.status === 'ok').length,
      failed: tests.filter(t => t.status === 'error').length,
      warnings: tests.filter(t => t.status === 'warning').length,
    };

    return { tests, summary };
  }

  private async testSupabaseConnectivity(tests: ConnectivityTest[]): Promise<void> {
    const startTime = Date.now();

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        tests.push({
          name: 'Supabase REST API',
          status: 'error',
          message: 'Configuration Supabase manquante',
          duration: Date.now() - startTime,
        });
        return;
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': anonKey,
          'authorization': `Bearer ${anonKey}`,
        },
        signal: AbortSignal.timeout(5000), // 5s timeout
      }).catch(() => null);

      tests.push({
        name: 'Supabase REST API',
        status: response?.ok ? 'ok' : 'error',
        message: response?.ok ? 'Connexion REST API réussie' : 'Échec connexion REST API',
        duration: Date.now() - startTime,
        endpoint: `${supabaseUrl}/rest/v1/`,
        details: response ? {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        } : undefined,
      });

    } catch (error) {
      tests.push({
        name: 'Supabase REST API',
        status: 'error',
        message: `Erreur: ${(error as Error)?.message || 'Erreur inconnue'}`,
        duration: Date.now() - startTime,
      });
    }
  }

  private async testRedisConnectivity(tests: ConnectivityTest[]): Promise<void> {
    const startTime = Date.now();

    if (process.env.RATE_LIMIT_PROVIDER !== 'redis') {
      tests.push({
        name: 'Redis (Upstash)',
        status: 'info',
        message: 'Non utilisé (RATE_LIMIT_PROVIDER=memory)',
        duration: Date.now() - startTime,
      });
      return;
    }

    try {
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!redisUrl || !redisToken) {
        tests.push({
          name: 'Redis (Upstash)',
          status: 'error',
          message: 'Configuration Redis incomplète',
          duration: Date.now() - startTime,
        });
        return;
      }

      const response = await fetch(`${redisUrl}/ping`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${redisToken}`,
        },
        signal: AbortSignal.timeout(5000),
      }).catch(() => null);

      const body = response ? await response.json().catch(() => null) : null;

      tests.push({
        name: 'Redis (Upstash)',
        status: response?.ok ? 'ok' : 'error',
        message: response?.ok ? 'Ping Redis réussi' : 'Ping Redis échoué',
        duration: Date.now() - startTime,
        endpoint: `${redisUrl}/ping`,
        details: {
          status: response?.status,
          statusText: response?.statusText,
          response: body,
        },
      });

    } catch (error) {
      tests.push({
        name: 'Redis (Upstash)',
        status: 'error',
        message: `Erreur Redis: ${(error as Error)?.message || 'Erreur inconnue'}`,
        duration: Date.now() - startTime,
      });
    }
  }

  private async testApiHealthEndpoint(tests: ConnectivityTest[]): Promise<void> {
    const startTime = Date.now();

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || getAppBaseUrl();
      const orpcPrefix = process.env.ORPC_PREFIX || '/api/rpc';
      const healthUrl = `${appUrl}${orpcPrefix}/system/health`;

      const response = await fetch(healthUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: '{}',
        signal: AbortSignal.timeout(5000),
      }).catch(() => null);

      const data = response ? await response.json().catch(() => null) : null;

      tests.push({
        name: 'oRPC Health Endpoint',
        status: response?.ok ? 'ok' : 'error',
        message: response?.ok ? 'API oRPC fonctionnelle' : 'API oRPC non accessible',
        duration: Date.now() - startTime,
        endpoint: healthUrl,
        details: {
          status: response?.status,
          statusText: response?.statusText,
          data,
          headers: response ? Object.fromEntries(response.headers.entries()) : undefined,
        },
      });

    } catch (error) {
      tests.push({
        name: 'oRPC Health Endpoint',
        status: 'error',
        message: `Erreur API: ${(error as Error)?.message || 'Erreur inconnue'}`,
        duration: Date.now() - startTime,
      });
    }
  }

  public async runFullDiagnostic(): Promise<{
    configuration: ConfigValidationResult;
    connectivity: ConnectivityTestSuite;
    timestamp: number;
  }> {
    const [configuration, connectivity] = await Promise.all([
      this.validateConfiguration(),
      this.testConnectivity(),
    ]);

    return {
      configuration,
      connectivity,
      timestamp: Date.now(),
    };
  }
}
