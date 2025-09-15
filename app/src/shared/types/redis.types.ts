/**
 * Types stricts pour l'intégration Redis Upstash
 * Élimine le besoin de `any` dans le rate limiting
 */

export interface UpstashRedisClient {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
}

export interface UpstashRedisConstructor {
  new (config: { url: string; token: string }): UpstashRedisClient;
}

export interface UpstashRedisModule {
  Redis: UpstashRedisConstructor;
}