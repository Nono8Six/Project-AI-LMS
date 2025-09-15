/**
 * Logger structuré pour l'application LMS IA
 * Remplace console.log/warn/error avec niveaux configurables
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
  requestId?: string;
  userId?: string;
}

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableJson: boolean;
}

class Logger {
  private config: LoggerConfig;
  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): LoggerConfig {
    const level = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || 'info';
    const isProd = process.env.NODE_ENV === 'production';
    
    return {
      level,
      enableConsole: !isProd,
      enableJson: isProd,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.config.level];
  }

  private formatEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta && { meta }),
    };
  }

  private write(entry: LogEntry): void {
    if (this.config.enableConsole) {
      // ESLint autorise seulement console.warn et console.error
      const logFn = (entry.level === 'error') ? console.error : console.warn;
      if (entry.meta) {
        logFn(`[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`, entry.meta);
      } else {
        logFn(`[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`);
      }
    }
    
    if (this.config.enableJson) {
      // En production, écrire en JSON structuré via méthode autorisée
      const outputFn = entry.level === 'error' ? console.error : console.warn;
      outputFn(JSON.stringify(entry));
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) return;
    this.write(this.formatEntry('debug', message, meta));
  }

  info(message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog('info')) return;
    this.write(this.formatEntry('info', message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog('warn')) return;
    this.write(this.formatEntry('warn', message, meta));
  }

  error(message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog('error')) return;
    this.write(this.formatEntry('error', message, meta));
  }

  // Méthodes utilitaires pour le contexte
  withRequestId(requestId: string) {
    return {
      debug: (message: string, meta?: Record<string, unknown>) =>
        this.debug(message, { ...meta, requestId }),
      info: (message: string, meta?: Record<string, unknown>) =>
        this.info(message, { ...meta, requestId }),
      warn: (message: string, meta?: Record<string, unknown>) =>
        this.warn(message, { ...meta, requestId }),
      error: (message: string, meta?: Record<string, unknown>) =>
        this.error(message, { ...meta, requestId }),
    };
  }

  withUserId(userId: string) {
    return {
      debug: (message: string, meta?: Record<string, unknown>) =>
        this.debug(message, { ...meta, userId }),
      info: (message: string, meta?: Record<string, unknown>) =>
        this.info(message, { ...meta, userId }),
      warn: (message: string, meta?: Record<string, unknown>) =>
        this.warn(message, { ...meta, userId }),
      error: (message: string, meta?: Record<string, unknown>) =>
        this.error(message, { ...meta, userId }),
    };
  }
}

// Instance singleton
export const logger = new Logger();

// Export des types pour utilisation externe
export type { LogLevel, LogEntry, LoggerConfig };