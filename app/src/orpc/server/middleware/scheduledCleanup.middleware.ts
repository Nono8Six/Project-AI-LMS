import type { AppContext } from '../context';
import { cleanupRateLimitEntries } from '@/shared/services/security.service';

/**
 * Middleware de nettoyage planifié amélioré
 * Combine approche déterministe + temporelle pour garantir le nettoyage
 */

// État global du nettoyage (singleton)
class CleanupState {
  private static instance: CleanupState;
  private lastCleanupTime = 0;
  private callCounter = 0;
  private cleanupInProgress = false;

  private constructor() {}

  static getInstance(): CleanupState {
    if (!CleanupState.instance) {
      CleanupState.instance = new CleanupState();
    }
    return CleanupState.instance;
  }

  shouldRunCleanup(options: {
    counterInterval: number;
    timeInterval: number;
    forceTime?: boolean;
  }): boolean {
    const now = Date.now();
    this.callCounter++;

    // Éviter nettoyages concurrents
    if (this.cleanupInProgress) return false;

    // Déterministe: tous les N appels
    const counterTriggered = this.callCounter >= options.counterInterval;

    // Temporel: après X ms depuis dernier nettoyage
    const timeSinceLastCleanup = now - this.lastCleanupTime;
    const timeTriggered = timeSinceLastCleanup >= options.timeInterval;

    // Force basé sur le temps si spécifié
    if (options.forceTime && timeTriggered) return true;

    // Standard: soit compteur soit temps
    return counterTriggered || timeTriggered;
  }

  markCleanupStart(): void {
    this.cleanupInProgress = true;
    this.lastCleanupTime = Date.now();
  }

  markCleanupEnd(): void {
    this.cleanupInProgress = false;
    this.callCounter = 0; // Reset du compteur après nettoyage réussi
  }

  getStats() {
    return {
      lastCleanupTime: this.lastCleanupTime,
      callCounter: this.callCounter,
      cleanupInProgress: this.cleanupInProgress,
      timeSinceLastCleanup: Date.now() - this.lastCleanupTime
    };
  }
}

type CleanupOptions = {
  // Nettoyage tous les N appels (déterministe)
  counterInterval: number;
  // Nettoyage après X ms depuis le dernier (temporel)
  timeInterval: number;
  // Force le nettoyage basé sur le temps même si compteur pas atteint
  forceTimeBasedCleanup: boolean;
  // Âge maximum des entrées à nettoyer
  maxEntryAge: number;
  // Activer logging détaillé
  enableLogging: boolean;
};

const DEFAULT_OPTIONS: CleanupOptions = {
  counterInterval: 100,        // Tous les 100 appels
  timeInterval: 5 * 60 * 1000, // Ou tous les 5 minutes
  forceTimeBasedCleanup: true, // Garantir nettoyage même si faible trafic
  maxEntryAge: 60 * 60 * 1000, // Nettoyer entrées > 1 heure
  enableLogging: true
};

/**
 * Middleware de nettoyage planifié hybride
 * Garantit le nettoyage même dans les scénarios de trafic variable
 */
export function createScheduledCleanupMiddleware(options: Partial<CleanupOptions> = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const cleanupState = CleanupState.getInstance();

  return async function scheduledCleanupMiddleware(ctx: AppContext): Promise<void> {
    const shouldCleanup = cleanupState.shouldRunCleanup({
      counterInterval: config.counterInterval,
      timeInterval: config.timeInterval,
      forceTime: config.forceTimeBasedCleanup
    });

    if (!shouldCleanup) return;

    // Nettoyage asynchrone pour ne pas bloquer la requête
    setImmediate(async () => {
      cleanupState.markCleanupStart();

      try {
        const startTime = Date.now();
        const adminClient = ctx.supabase.getAdminClient();

        await cleanupRateLimitEntries(adminClient, config.maxEntryAge);

        const duration = Date.now() - startTime;
        const stats = cleanupState.getStats();

        if (config.enableLogging) {
          ctx.logger.info('Scheduled cleanup completed', {
            duration,
            maxEntryAge: config.maxEntryAge,
            trigger: stats.callCounter >= config.counterInterval ? 'counter' : 'time',
            stats: {
              callCounter: stats.callCounter,
              timeSinceLastCleanup: stats.timeSinceLastCleanup
            }
          });
        }

        cleanupState.markCleanupEnd();
      } catch (error) {
        cleanupState.markCleanupEnd(); // Reset même en cas d'erreur

        if (config.enableLogging) {
          ctx.logger.error('Scheduled cleanup failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stats: cleanupState.getStats()
          });
        }
      }
    });
  };
}

/**
 * Middleware simplifié pour les endpoints système
 * Nettoyage minimal et rapide
 */
export function createLightweightCleanupMiddleware() {
  return createScheduledCleanupMiddleware({
    counterInterval: 200,        // Moins fréquent pour endpoints système
    timeInterval: 10 * 60 * 1000, // 10 minutes
    forceTimeBasedCleanup: false, // Pas de force temporelle
    enableLogging: false         // Pas de logs pour éviter spam
  });
}

/**
 * Middleware agressif pour les endpoints d'authentification
 * Nettoyage plus fréquent pour la sécurité
 */
export function createSecurityCleanupMiddleware() {
  return createScheduledCleanupMiddleware({
    counterInterval: 50,         // Plus fréquent
    timeInterval: 2 * 60 * 1000, // 2 minutes
    forceTimeBasedCleanup: true, // Force le nettoyage temporel
    maxEntryAge: 30 * 60 * 1000, // 30 minutes seulement
    enableLogging: true          // Logs complets pour audit
  });
}

/**
 * Utilitaire pour obtenir les statistiques de nettoyage
 * Utile pour monitoring et debugging
 */
export function getCleanupStats() {
  return CleanupState.getInstance().getStats();
}

/**
 * Utilitaire pour forcer un nettoyage immédiat
 * Usage: tests, debugging, administration
 */
export async function forceCleanup(ctx: AppContext, options: Partial<CleanupOptions> = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const cleanupState = CleanupState.getInstance();

  if (cleanupState.getStats().cleanupInProgress) {
    throw new Error('Cleanup already in progress');
  }

  cleanupState.markCleanupStart();

  try {
    const startTime = Date.now();
    const adminClient = ctx.supabase.getAdminClient();

    await cleanupRateLimitEntries(adminClient, config.maxEntryAge);

    const duration = Date.now() - startTime;

    ctx.logger.info('Force cleanup completed', {
      duration,
      maxEntryAge: config.maxEntryAge
    });

    cleanupState.markCleanupEnd();
    return { success: true, duration };
  } catch (error) {
    cleanupState.markCleanupEnd();
    ctx.logger.error('Force cleanup failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}