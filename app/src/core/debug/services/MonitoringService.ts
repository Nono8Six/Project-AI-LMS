/**
 * Service de monitoring et métriques pour le debug
 * Simule la collecte de logs et métriques en temps réel
 */

import type {
  LogEntry,
  LogLevel,
  PerformanceMetric,
  PerformanceStats,
  DebugServiceConfig,
} from '@/shared/types/debug.types';

export class MonitoringService {
  private static instance: MonitoringService;
  private logs: LogEntry[] = [];
  private metrics: PerformanceMetric[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private config: DebugServiceConfig;

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  constructor() {
    this.config = {
      enableRealTimeLogging: true,
      logRetentionMinutes: 60,
      metricsRetentionMinutes: 120,
      rateLimitMonitoring: true,
      performanceThresholds: {
        slowRequestMs: 1000,
        errorRateThreshold: 5,
      },
    };
  }

  /**
   * Démarre le monitoring en temps réel
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Simuler la génération de logs et métriques
    this.monitoringInterval = setInterval(() => {
      this.generateMockLog();
      
      // Générer des métriques moins fréquemment
      if (Math.random() < 0.3) {
        this.generateMockMetric();
      }

      // Nettoyer les anciens logs/métriques
      this.cleanupOldData();
    }, 1000 + Math.random() * 2000);
  }

  /**
   * Arrête le monitoring
   */
  public stopMonitoring(): void {
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Obtient les logs avec filtrage
   */
  public getLogs(options: {
    level?: LogLevel;
    limit?: number;
    since?: number;
    requestId?: string;
    userId?: string;
  } = {}): LogEntry[] {
    let filtered = [...this.logs];

    // Filtrer par niveau de log
    if (options.level) {
      const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
      const minLevelIndex = levels.indexOf(options.level);
      filtered = filtered.filter(log => {
        const logLevelIndex = levels.indexOf(log.kind);
        return logLevelIndex >= minLevelIndex;
      });
    }

    // Filtrer par timestamp
    const { since } = options;
    if (typeof since === 'number') {
      filtered = filtered.filter(log => log.timestamp >= since);
    }

    // Filtrer par request ID
    if (options.requestId) {
      filtered = filtered.filter(log => log.requestId.includes(options.requestId!));
    }

    // Filtrer par user ID
    if (options.userId) {
      filtered = filtered.filter(log => log.userId === options.userId);
    }

    // Trier par timestamp (plus récent en premier)
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    // Limiter le nombre de résultats
    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  /**
   * Obtient les métriques de performance
   */
  public getMetrics(options: {
    endpoint?: string;
    since?: number;
    limit?: number;
    status?: number;
  } = {}): PerformanceMetric[] {
    let filtered = [...this.metrics];

    if (options.endpoint) {
      filtered = filtered.filter(m => m.endpoint.includes(options.endpoint!));
    }

    const { since: metricsSince } = options;
    if (typeof metricsSince === 'number') {
      filtered = filtered.filter(m => m.timestamp >= metricsSince);
    }

    if (options.status) {
      filtered = filtered.filter(m => m.status === options.status);
    }

    filtered.sort((a, b) => b.timestamp - a.timestamp);

    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  /**
   * Calcule les statistiques de performance
   */
  public getPerformanceStats(timeWindowMinutes = 15): PerformanceStats {
    const cutoff = Date.now() - (timeWindowMinutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoff);

    if (recentMetrics.length === 0) {
      return {
        avgDuration: 0,
        successRate: 0,
        errorRate: 0,
        requestsPerMinute: 0,
        p95Duration: 0,
        p99Duration: 0,
      };
    }

    const durations = recentMetrics.map(m => m.duration).sort((a, b) => a - b);
    const successful = recentMetrics.filter(m => m.status < 400).length;
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;

    // Calculer les percentiles
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);

    return {
      avgDuration: Math.round(avgDuration * 100) / 100,
      successRate: Math.round((successful / recentMetrics.length) * 100 * 100) / 100,
      errorRate: Math.round(((recentMetrics.length - successful) / recentMetrics.length) * 100 * 100) / 100,
      requestsPerMinute: Math.round((recentMetrics.length / timeWindowMinutes) * 100) / 100,
      p95Duration: durations[p95Index] || 0,
      p99Duration: durations[p99Index] || 0,
    };
  }

  /**
   * Ajoute un log personnalisé
   */
  public addLog(entry: Omit<LogEntry, 'timestamp'>): void {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: Date.now(),
    };

    this.logs.push(logEntry);
    this.enforceLogRetention();
  }

  /**
   * Ajoute une métrique personnalisée
   */
  public addMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const metricEntry: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
    };

    this.metrics.push(metricEntry);
    this.enforceMetricsRetention();
  }

  /**
   * Obtient les statistiques par endpoint
   */
  public getEndpointStats(timeWindowMinutes = 60): Array<{
    endpoint: string;
    requests: number;
    avgDuration: number;
    successRate: number;
    errors: number;
  }> {
    const cutoff = Date.now() - (timeWindowMinutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoff);

    const endpointGroups = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.endpoint]) {
        acc[metric.endpoint] = [];
      }
      acc[metric.endpoint].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);

    return Object.entries(endpointGroups).map(([endpoint, metrics]) => {
      const successful = metrics.filter(m => m.status < 400).length;
      const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;

      return {
        endpoint,
        requests: metrics.length,
        avgDuration: Math.round(avgDuration * 100) / 100,
        successRate: Math.round((successful / metrics.length) * 100 * 100) / 100,
        errors: metrics.length - successful,
      };
    }).sort((a, b) => b.requests - a.requests);
  }

  /**
   * Analyse des erreurs récentes
   */
  public getErrorAnalysis(timeWindowMinutes = 30): Array<{
    status: number;
    count: number;
    endpoints: string[];
    lastOccurrence: number;
  }> {
    const cutoff = Date.now() - (timeWindowMinutes * 60 * 1000);
    const errorMetrics = this.metrics.filter(m => 
      m.timestamp >= cutoff && m.status >= 400
    );

    const errorGroups = errorMetrics.reduce((acc, metric) => {
      if (!acc[metric.status]) {
        acc[metric.status] = {
          count: 0,
          endpoints: new Set<string>(),
          lastOccurrence: 0,
        };
      }

      acc[metric.status].count++;
      acc[metric.status].endpoints.add(metric.endpoint);
      acc[metric.status].lastOccurrence = Math.max(
        acc[metric.status].lastOccurrence,
        metric.timestamp
      );

      return acc;
    }, {} as Record<number, { count: number; endpoints: Set<string>; lastOccurrence: number }>);

    return Object.entries(errorGroups).map(([status, data]) => ({
      status: parseInt(status, 10),
      count: data.count,
      endpoints: Array.from(data.endpoints),
      lastOccurrence: data.lastOccurrence,
    })).sort((a, b) => b.count - a.count);
  }

  /**
   * Nettoie toutes les données
   */
  public clearAllData(): void {
    this.logs = [];
    this.metrics = [];
  }

  /**
   * Obtient le status du monitoring
   */
  public getMonitoringStatus(): {
    isRunning: boolean;
    logsCount: number;
    metricsCount: number;
    oldestLog: number | null;
    newestLog: number | null;
    config: DebugServiceConfig;
  } {
    return {
      isRunning: this.isMonitoring,
      logsCount: this.logs.length,
      metricsCount: this.metrics.length,
      oldestLog: this.logs.length > 0 ? Math.min(...this.logs.map(l => l.timestamp)) : null,
      newestLog: this.logs.length > 0 ? Math.max(...this.logs.map(l => l.timestamp)) : null,
      config: this.config,
    };
  }

  // Méthodes privées

  private generateMockLog(): void {
    if (!this.config.enableRealTimeLogging) return;

    // const kinds: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const messages = [
      'Request processed successfully',
      'User authentication attempted',
      'Rate limit check passed',
      'Middleware pipeline completed',
      'Database query executed',
      'Cache hit on user session',
      'API response sent',
      'Auth token validated',
      'Rate limit bucket updated',
      'Request received from client',
      'Configuration validated',
      'Supabase client initialized',
      'Redis connection established',
      'JWT token verified',
      'Request context built',
    ];

    // Répartition réaliste des niveaux de log
    const kindWeights = { debug: 0.4, info: 0.4, warn: 0.15, error: 0.05 };
    const kind = this.weightedRandomChoice(kindWeights);
    const message = messages[Math.floor(Math.random() * messages.length)];

    const logEntry: LogEntry = {
      kind,
      requestId: `req_${Math.random().toString(36).substring(2, 15)}`,
      message,
      meta: this.generateLogMeta(kind),
      time: new Date().toISOString(),
      timestamp: Date.now(),
      source: 'debug-simulator',
      userId: Math.random() < 0.3 ? `user_${Math.random().toString(36).substring(2, 8)}` : undefined,
    };

    this.addLog(logEntry);
  }

  private generateMockMetric(): void {
    const endpoints = [
      '/api/rpc/system/health',
      '/api/rpc/system/time',
      '/api/rpc/system/version',
      '/api/rpc/auth/me',
    ];

    // Répartition réaliste des status codes
    const statusWeights = { 200: 0.85, 401: 0.08, 404: 0.03, 429: 0.03, 500: 0.01 };
    const status = parseInt(this.weightedRandomChoice(statusWeights));
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

    // Durée basée sur le status (erreurs souvent plus rapides)
    let duration: number;
    if (status >= 400) {
      duration = Math.random() * 100 + 5; // Erreurs: 5-105ms
    } else {
      duration = Math.random() * 800 + 10; // Succès: 10-810ms
    }

    const metric: PerformanceMetric = {
      endpoint,
      method: 'POST',
      status,
      duration: Math.round(duration * 100) / 100,
      timestamp: Date.now(),
      requestId: `req_${Math.random().toString(36).substring(2, 15)}`,
      userId: Math.random() < 0.4 ? `user_${Math.random().toString(36).substring(2, 8)}` : undefined,
      rateLimited: status === 429,
    };

    this.addMetric(metric);
  }

  private generateLogMeta(kind: LogLevel): Record<string, unknown> {
    const baseMeta = {
      duration: Math.random() * 100 + 10,
      ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
    };

    switch (kind) {
      case 'error':
        return {
          ...baseMeta,
          error: 'Sample error details',
          stack: 'Error: Sample error\n    at handler (/path/to/file.js:123:45)',
        };

      case 'warn':
        return {
          ...baseMeta,
          warning: 'Sample warning details',
          threshold: Math.random() * 1000,
        };

      case 'debug':
        return {
          ...baseMeta,
          debug: {
            step: 'middleware-auth',
            user_id: `user_${Math.random().toString(36).substring(2, 8)}`,
          },
        };

      default:
        return baseMeta;
    }
  }

  private weightedRandomChoice<T extends string>(weights: Record<T, number>): T {
    const items = Object.keys(weights) as T[];
    const totalWeight = (Object.values(weights) as number[]).reduce((sum: number, weight: number) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of items) {
      random -= weights[item];
      if (random <= 0) {
        return item;
      }
    }

    return items[items.length - 1];
  }

  private cleanupOldData(): void {
    this.enforceLogRetention();
    this.enforceMetricsRetention();
  }

  private enforceLogRetention(): void {
    if (!this.config.logRetentionMinutes) return;

    const cutoff = Date.now() - (this.config.logRetentionMinutes * 60 * 1000);
    this.logs = this.logs.filter(log => log.timestamp >= cutoff);

    // Limiter aussi par nombre (max 1000 logs)
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }

  private enforceMetricsRetention(): void {
    if (!this.config.metricsRetentionMinutes) return;

    const cutoff = Date.now() - (this.config.metricsRetentionMinutes * 60 * 1000);
    this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoff);

    // Limiter aussi par nombre (max 500 métriques)
    if (this.metrics.length > 500) {
      this.metrics = this.metrics.slice(-500);
    }
  }
}
