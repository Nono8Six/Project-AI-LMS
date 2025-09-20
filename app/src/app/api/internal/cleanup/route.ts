import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.generated';

// Configuration sécurisée pour l'endpoint de nettoyage
const CLEANUP_SECRET = process.env.CLEANUP_SECRET;
const ALLOWED_IPS = process.env.CLEANUP_ALLOWED_IPS?.split(',') || [];

type CleanupConfig = {
  table: string;
  timeField: string;
  maxAgeMs: number;
  description: string;
  additionalWhere?: string;
  customCondition?: string;
};

const CLEANUP_CONFIGS: Record<string, CleanupConfig> = {
  rateLimitEntries: {
    table: 'auth_rate_limit_counters',
    timeField: 'window_start',
    maxAgeMs: 2 * 60 * 60 * 1000, // 2 heures
    description: 'rate limit entries'
  },
  bruteforceAttempts: {
    table: 'auth_bruteforce_attempts',
    timeField: 'last_failure_at',
    maxAgeMs: 24 * 60 * 60 * 1000, // 24 heures
    description: 'bruteforce attempts',
    additionalWhere: "blocked_until IS NULL OR blocked_until < NOW()"
  },
  expiredSessions: {
    table: 'auth_sessions',
    timeField: 'expires_at',
    maxAgeMs: 0,
    description: 'expired sessions',
    customCondition: "expires_at < NOW()"
  }
};

function validateRequest(request: NextRequest): { isValid: boolean; error?: string } {
  // Vérifier le secret
  const authHeader = request.headers.get('Authorization');
  const providedSecret = authHeader?.replace('Bearer ', '');

  if (!CLEANUP_SECRET) {
    return { isValid: false, error: 'Cleanup endpoint not configured' };
  }

  if (!providedSecret || providedSecret !== CLEANUP_SECRET) {
    return { isValid: false, error: 'Invalid authorization' };
  }

  // Vérifier IP si configuré
  if (ALLOWED_IPS.length > 0) {
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';

    if (!ALLOWED_IPS.includes(clientIP) && !ALLOWED_IPS.includes('*')) {
      return { isValid: false, error: 'IP not allowed' };
    }
  }

  return { isValid: true };
}

async function performCleanup(
  config: CleanupConfig,
  client: ReturnType<typeof createClient<Database>>,
  dryRun: boolean = false
) {
  const { table, timeField, maxAgeMs, description, additionalWhere, customCondition } = config;

  try {
    let query = client.from(table as "auth_rate_limit_counters" | "auth_bruteforce_attempts" | "auth_sessions").select('count(*)', { count: 'exact', head: true });

    if (customCondition) {
      query = query.or(customCondition);
    } else {
      const thresholdIso = new Date(Date.now() - maxAgeMs).toISOString();
      query = query.lt(timeField, thresholdIso);
      if (additionalWhere) {
        query = query.or(additionalWhere);
      }
    }

    const { count: countToDelete, error: countError } = await query;

    if (countError) {
      return { success: false, deleted: 0, error: countError.message };
    }

    if (!countToDelete || countToDelete === 0) {
      return { success: true, deleted: 0 };
    }

    if (dryRun) {
      return { success: true, deleted: 0, wouldDelete: countToDelete, dryRun: true };
    }

    // Exécuter la suppression
    let deleteQuery = client.from(table as "auth_rate_limit_counters" | "auth_bruteforce_attempts" | "auth_sessions").delete();

    if (customCondition) {
      deleteQuery = deleteQuery.or(customCondition);
    } else {
      const thresholdIso = new Date(Date.now() - maxAgeMs).toISOString();
      deleteQuery = deleteQuery.lt(timeField, thresholdIso);
      if (additionalWhere) {
        deleteQuery = deleteQuery.or(additionalWhere);
      }
    }

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      return { success: false, deleted: 0, error: deleteError.message };
    }

    return { success: true, deleted: countToDelete };
  } catch (error) {
    return {
      success: false,
      deleted: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Validation sécurité
  const validation = validateRequest(request);
  if (!validation.isValid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 401 }
    );
  }

  // Parse body
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    // Body optionnel
  }

  const {
    tables = Object.keys(CLEANUP_CONFIGS),
    dryRun = false
  } = body;

  // Validation environnement
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: 'Missing required environment variables' },
      { status: 500 }
    );
  }

  const client = createClient<Database>(supabaseUrl, serviceKey);
  const results: Record<string, any> = {};
  let totalDeleted = 0;
  let hasErrors = false;

  // Exécuter nettoyage pour chaque table
  for (const tableName of tables) {
    const config = CLEANUP_CONFIGS[tableName];
    if (!config) {
      results[tableName] = { success: false, error: 'Unknown table config' };
      hasErrors = true;
      continue;
    }

    const result = await performCleanup(config, client, dryRun);
    results[tableName] = result;

    if (result.success) {
      totalDeleted += result.deleted;
    } else {
      hasErrors = true;
    }
  }

  const response = {
    success: !hasErrors,
    timestamp: new Date().toISOString(),
    duration: Date.now() - startTime,
    totalDeleted,
    dryRun,
    results
  };

  return NextResponse.json(response, {
    status: hasErrors ? 207 : 200, // 207 Multi-Status si erreurs partielles
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

// Méthode GET pour health check
export async function GET() {
  return NextResponse.json({
    service: 'Cleanup API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      POST: 'Execute cleanup',
    },
    tables: Object.keys(CLEANUP_CONFIGS)
  });
}