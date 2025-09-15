/**
 * Types TypeScript pour le système de debug professionnel
 * Supports tous les aspects du debug : middleware, API, config, monitoring
 */

// Types de base pour les résultats de tests
export interface TestResult {
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
    requestId?: string | undefined;
    rateLimit?: RateLimitMeta | undefined;
  };
}

export interface RateLimitMeta {
  limit: number;
  remaining: number;
  reset: number;
}

// Types pour les tests de middleware
export interface MiddlewareTestConfig {
  token?: string;
  ip?: string;
  userAgent?: string;
  customHeaders?: Record<string, string>;
}

export interface AuthTestResult extends TestResult {
  userInfo?: {
    id: string;
    email?: string | null;
    role?: string | null;
  } | null;
}

export interface RateLimitTestResult extends TestResult {
  rateLimitInfo?: RateLimitMeta;
}

// Types pour les tests d'endpoints
export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  requiresAuth?: boolean;
  inputSchema?: string;
  category: 'system' | 'auth' | 'custom';
  deprecated?: boolean;
}

export interface EndpointTestRequest {
  endpoint: ApiEndpoint;
  headers?: Record<string, string>;
  body?: unknown;
  authToken?: string;
}

export interface EndpointTestHistory {
  endpoint: string;
  result: TestResult;
  timestamp: number;
  config: EndpointTestRequest;
}

// Types pour la validation de configuration
export type ConfigStatus = 'ok' | 'warning' | 'error' | 'info';

export interface ConfigItem {
  key: string;
  value: string | undefined;
  status: ConfigStatus;
  description?: string;
  masked?: boolean;
  required?: boolean;
}

export interface ConfigSection {
  title: string;
  description: string;
  category: 'orpc' | 'supabase' | 'redis' | 'app' | 'security' | 'external';
  items: ConfigItem[];
}

export interface ConfigValidationResult {
  sections: ConfigSection[];
  summary: {
    total: number;
    ok: number;
    warnings: number;
    errors: number;
    info: number;
  };
}

// Types pour les tests de connectivité
export interface ConnectivityTest {
  name: string;
  status: ConfigStatus;
  message: string;
  details?: Record<string, unknown> | undefined;
  duration?: number;
  endpoint?: string;
}

export interface ConnectivityTestSuite {
  tests: ConnectivityTest[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

// Types pour le monitoring et les métriques
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  kind: LogLevel;
  requestId: string;
  message: string;
  meta?: Record<string, unknown>;
  time: string;
  timestamp: number;
  source?: string;
  userId?: string;
}

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  status: number;
  duration: number;
  timestamp: number;
  requestId: string;
  userId?: string;
  rateLimited?: boolean;
}

export interface PerformanceStats {
  avgDuration: number;
  successRate: number;
  errorRate: number;
  requestsPerMinute: number;
  p95Duration?: number;
  p99Duration?: number;
}

// Types pour le rate limiting
export interface RateLimitBucket {
  key: string;
  type: 'ip' | 'user' | 'anonymous';
  limit: number;
  remaining: number;
  reset: number;
  lastActivity: number;
  requests: number;
}

export interface RateLimitStats {
  totalBuckets: number;
  activeBuckets: number;
  rateLimitedKeys: string[];
  nearLimitKeys: string[];
  averageUtilization: number;
}

// Types pour les services de debug
export interface DebugServiceConfig {
  enableRealTimeLogging?: boolean;
  logRetentionMinutes?: number;
  metricsRetentionMinutes?: number;
  rateLimitMonitoring?: boolean;
  performanceThresholds?: {
    slowRequestMs?: number;
    errorRateThreshold?: number;
  };
}

export interface DebugServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
  requestId?: string;
}

// Types pour les tests batch/pipeline
export interface BatchTestConfig {
  endpoints: string[];
  iterations: number;
  delayBetweenRequests: number;
  authToken?: string;
  stopOnError: boolean;
}

export interface BatchTestResult {
  config: BatchTestConfig;
  results: TestResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    avgDuration: number;
    rateLimited: number;
  };
  startTime: number;
  endTime: number;
}

// Types pour la pipeline visualization
export interface MiddlewarePipelineStep {
  name: string;
  description: string;
  order: number;
  duration?: number;
  status: 'pending' | 'running' | 'success' | 'error';
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface PipelineExecution {
  requestId: string;
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  steps: MiddlewarePipelineStep[];
  finalStatus: 'success' | 'error' | 'timeout';
  context?: {
    ip?: string | undefined;
    userAgent?: string | undefined;
    userId?: string | undefined;
    endpoint?: string | undefined;
  };
}

// Types pour l'export de données
export interface DebugDataExport {
  timestamp: number;
  version: string;
  sections: {
    configuration?: ConfigValidationResult;
    connectivity?: ConnectivityTestSuite;
    logs?: LogEntry[];
    metrics?: PerformanceMetric[];
    rateLimitBuckets?: RateLimitBucket[];
    testHistory?: EndpointTestHistory[];
  };
  metadata: {
    exportedBy: string;
    exportReason?: string;
    filters?: Record<string, unknown>;
  };
}

// Types utilitaires
export interface DebugPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export interface DebugComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Constants et enums pour le debug
export const DEBUG_CATEGORIES = {
  ORPC: 'orpc',
  SUPABASE: 'supabase', 
  REDIS: 'redis',
  APP: 'app',
  SECURITY: 'security',
  EXTERNAL: 'external',
} as const;

export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const;

export const ENDPOINT_CATEGORIES = {
  SYSTEM: 'system',
  AUTH: 'auth',
  CUSTOM: 'custom',
} as const;

// Type guards
export const isLogLevel = (value: string): value is LogLevel => {
  return Object.values(LOG_LEVELS).includes(value as LogLevel);
};

export const isConfigStatus = (value: string): value is ConfigStatus => {
  return ['ok', 'warning', 'error', 'info'].includes(value);
};

export const isValidEndpointCategory = (category: string): category is ApiEndpoint['category'] => {
  return Object.values(ENDPOINT_CATEGORIES).includes(category as ApiEndpoint['category']);
};