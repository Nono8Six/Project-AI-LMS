#!/usr/bin/env node

/**
 * Script de nettoyage planifié pour auth_rate_limit_counters
 * Usage: node scripts/cleanup-rate-limits.mjs
 * Ou via cron: 0 star/5 * * * * node /path/to/scripts/cleanup-rate-limits.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'node:path';

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), '.env') });

// Configuration
const CLEANUP_CONFIGS = {
  // Entrées rate limit standard (plus de 2 heures)
  rateLimitEntries: {
    table: 'auth_rate_limit_counters',
    timeField: 'window_start',
    maxAgeMs: 2 * 60 * 60 * 1000, // 2 heures
    description: 'rate limit entries'
  },

  // Tentatives de bruteforce (plus de 24 heures si non bloquées)
  bruteforceAttempts: {
    table: 'auth_bruteforce_attempts',
    timeField: 'last_failure_at',
    maxAgeMs: 24 * 60 * 60 * 1000, // 24 heures
    description: 'bruteforce attempts',
    additionalWhere: "blocked_until IS NULL OR blocked_until < NOW()"
  },

  // Sessions expirées (plus de 7 jours)
  expiredSessions: {
    table: 'auth_sessions',
    timeField: 'expires_at',
    maxAgeMs: 0, // Déjà expirées
    description: 'expired sessions',
    customCondition: "expires_at < NOW()"
  }
};

class RateLimitCleaner {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!this.supabaseUrl || !this.serviceKey) {
      throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    }

    this.client = createClient(this.supabaseUrl, this.serviceKey);
  }

  async cleanup(config, dryRun = false) {
    const { table, timeField, maxAgeMs, description, additionalWhere, customCondition } = config;

    let query = this.client.from(table).select('count(*)', { count: 'exact', head: true });

    if (customCondition) {
      // Utiliser condition personnalisée (ex: expires_at < NOW())
      query = query.or(customCondition);
    } else {
      // Utiliser âge basé sur maxAgeMs
      const thresholdIso = new Date(Date.now() - maxAgeMs).toISOString();
      query = query.lt(timeField, thresholdIso);
      if (additionalWhere) {
        query = query.or(additionalWhere);
      }
    }

    // Compter les entrées à supprimer
    const { count: countToDelete, error: countError } = await query;

    if (countError) {
      console.error(`❌ Error counting ${description}:`, countError.message);
      return { success: false, deleted: 0, error: countError.message };
    }

    if (!countToDelete || countToDelete === 0) {
      console.log(`✅ No ${description} to clean up`);
      return { success: true, deleted: 0 };
    }

    console.log(`🧹 Found ${countToDelete} ${description} to clean up`);

    if (dryRun) {
      console.log(`🔍 DRY RUN: Would delete ${countToDelete} ${description}`);
      return { success: true, deleted: 0, dryRun: true };
    }

    // Exécuter la suppression
    let deleteQuery = this.client.from(table).delete();

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
      console.error(`❌ Error deleting ${description}:`, deleteError.message);
      return { success: false, deleted: 0, error: deleteError.message };
    }

    console.log(`✅ Successfully cleaned up ${countToDelete} ${description}`);
    return { success: true, deleted: countToDelete };
  }

  async run(options = {}) {
    const { dryRun = false, tables = Object.keys(CLEANUP_CONFIGS) } = options;
    const startTime = Date.now();

    console.log('🚀 Starting scheduled cleanup of auth tables');
    console.log('📅 Time:', new Date().toISOString());
    console.log('🔍 Mode:', dryRun ? 'DRY RUN' : 'LIVE');
    console.log('📋 Tables:', tables.join(', '));
    console.log('');

    const results = {};
    let totalDeleted = 0;
    let hasErrors = false;

    for (const tableName of tables) {
      const config = CLEANUP_CONFIGS[tableName];
      if (!config) {
        console.warn(`⚠️  Unknown table config: ${tableName}`);
        continue;
      }

      console.log(`\n🔄 Cleaning ${config.description}...`);
      const result = await this.cleanup(config, dryRun);
      results[tableName] = result;

      if (result.success) {
        totalDeleted += result.deleted;
      } else {
        hasErrors = true;
      }
    }

    const duration = Date.now() - startTime;
    console.log('\n📊 Cleanup Summary:');
    console.log('===================');
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`🗑️  Total deleted: ${totalDeleted}`);
    console.log(`❌ Errors: ${hasErrors ? 'Yes' : 'No'}`);

    if (dryRun) {
      console.log('🔍 This was a dry run - no actual deletions were performed');
    }

    return {
      success: !hasErrors,
      totalDeleted,
      duration,
      results,
      dryRun
    };
  }
}

// Configuration CLI
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    tables: Object.keys(CLEANUP_CONFIGS),
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--dry-run':
      case '-d':
        options.dryRun = true;
        break;
      case '--tables':
      case '-t':
        if (i + 1 < args.length) {
          options.tables = args[i + 1].split(',').map(t => t.trim());
          i++;
        }
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        console.warn(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function showHelp() {
  console.log(`
🧹 Rate Limit Cleanup Script

Usage: node scripts/cleanup-rate-limits.mjs [options]

Options:
  --dry-run, -d         Run without actually deleting (preview mode)
  --tables, -t TABLES   Comma-separated list of tables to clean
                       Available: ${Object.keys(CLEANUP_CONFIGS).join(', ')}
  --help, -h           Show this help message

Examples:
  node scripts/cleanup-rate-limits.mjs                    # Clean all tables
  node scripts/cleanup-rate-limits.mjs --dry-run          # Preview mode
  node scripts/cleanup-rate-limits.mjs -t rateLimitEntries # Clean only rate limits

Cron job example (every 5 minutes):
  0 */5 * * * * cd /path/to/project && node scripts/cleanup-rate-limits.mjs

Environment variables required:
  NEXT_PUBLIC_SUPABASE_URL     # Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY    # Service role key for admin access
`);
}

// Main execution
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  try {
    const cleaner = new RateLimitCleaner();
    const result = await cleaner.run(options);

    if (result.success) {
      console.log('\n🎉 Cleanup completed successfully');
      process.exit(0);
    } else {
      console.log('\n💥 Cleanup completed with errors');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Exécution si script appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { RateLimitCleaner, CLEANUP_CONFIGS };