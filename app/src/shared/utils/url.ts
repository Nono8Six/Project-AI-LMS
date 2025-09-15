/**
 * Single source of truth pour la construction des URLs de l'application
 * Élimination complète du hardcode localhost
 */

export interface UrlOptions {
  readonly headers?: Headers | Record<string, string | undefined>;
  readonly fallbackHost?: string;
  readonly fallbackProtocol?: 'http' | 'https';
}

/**
 * Obtient l'URL de base de l'application de manière sécurisée
 * Priorité : ENV → Headers → Fallback
 */
export function getAppBaseUrl(options: UrlOptions = {}): string {
  const { 
    headers, 
    fallbackHost = 'localhost:3000', 
    fallbackProtocol = 'http' 
  } = options;
  
  // 1. Priorité : Variable d'environnement
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && envUrl.trim().length > 0) {
    try {
      return new URL(envUrl).toString().replace(/\/$/, '');
    } catch {
      // URL invalide, continue vers headers
    }
  }

  // 2. Si headers disponibles, construire depuis headers
  if (headers) {
    try {
      const headersObj = headers instanceof Headers 
        ? Object.fromEntries(headers.entries())
        : headers;
      
      const host = headersObj['x-forwarded-host'] || headersObj['host'];
      const protocol = headersObj['x-forwarded-proto'] || 
        (host?.includes('localhost') ? 'http' : 'https');
      
      if (host && typeof host === 'string') {
        return `${protocol}://${host}`;
      }
    } catch {
      // Erreur headers, continue vers fallback
    }
  }

  // 3. Fallback sécurisé
  return `${fallbackProtocol}://${fallbackHost}`;
}

/**
 * Construit une URL absolue depuis un path relatif
 */
export function getAbsoluteUrl(path: string, options: UrlOptions = {}): string {
  const baseUrl = getAppBaseUrl(options);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Helper pour les métadonnées Next.js
 */
export function getMetadataBaseUrl(options: UrlOptions = {}): URL {
  const urlString = getAppBaseUrl(options);
  return new URL(urlString);
}