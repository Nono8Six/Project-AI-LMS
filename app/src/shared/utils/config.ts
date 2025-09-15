/**
 * Configuration centralisée pour les domaines et URLs externes
 * Évite les accès directs à process.env dans middleware et next.config
 */

export interface ExternalDomains {
  supabase: string | null;
  muxStream: string | null;
  muxDomain: string | null;
  apiBase: string | null;
  stripeApi: string | null;
  stripeJs: string | null;
  muxJs: string | null;
}

export interface SecurityConfig {
  cspReportOnly: boolean;
  cspAllowInlineStyle: boolean;
  cspUseNonce: boolean;
  enableAuthMiddleware: boolean;
}

export interface DomainsConfig {
  googleFonts: string;
  googleFontsStatic: string;
}

/**
 * Obtient tous les domaines externes configurés
 */
export function getExternalDomains(): ExternalDomains {
  return {
    supabase: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    muxStream: process.env.MUX_STREAM_DOMAIN || null,
    muxDomain: process.env.MUX_DOMAIN || null,
    apiBase: process.env.NEXT_PUBLIC_API_BASE_URL || null,
    stripeApi: process.env.STRIPE_API_DOMAIN || null,
    stripeJs: process.env.STRIPE_JS_DOMAIN || null,
    muxJs: process.env.MUX_JS_DOMAIN || null,
  };
}

/**
 * Configuration de sécurité centralisée
 */
export function getSecurityConfig(): SecurityConfig {
  return {
    cspReportOnly: process.env.CSP_REPORT_ONLY === 'true',
    cspAllowInlineStyle: process.env.CSP_ALLOW_INLINE_STYLE === 'true',
    cspUseNonce: process.env.CSP_USE_NONCE === 'true',
    enableAuthMiddleware: process.env.NEXT_PUBLIC_ENABLE_AUTH_MIDDLEWARE === 'true',
  };
}

/**
 * Configuration des domaines de fonts et autres ressources
 */
export function getDomainsConfig(): DomainsConfig {
  return {
    googleFonts: process.env.GOOGLE_FONTS_DOMAIN || 'fonts.googleapis.com',
    googleFontsStatic: process.env.GOOGLE_FONTS_STATIC_DOMAIN || 'fonts.gstatic.com',
  };
}

/**
 * Helper pour construire les connect-src CSP
 */
export function buildConnectSrcDomains(): string[] {
  const domains: string[] = ["'self'"];
  const external = getExternalDomains();
  
  const addDomain = (url: string | null) => {
    if (!url) return;
    try {
      const u = new URL(url);
      domains.push(u.origin);
    } catch {
      if (url) domains.push(url);
    }
  };

  addDomain(external.supabase);
  addDomain(external.muxStream);
  addDomain(external.muxDomain);
  addDomain(external.apiBase);
  addDomain(external.stripeApi);
  addDomain(external.muxJs);

  return domains;
}

/**
 * Helper pour construire les frame-src CSP
 */
export function buildFrameSrcDomains(): string[] {
  const domains: string[] = ["'self'"];
  const external = getExternalDomains();

  const addFrameDomain = (url: string | null) => {
    if (!url) return;
    try {
      const u = new URL(url);
      domains.push(u.origin);
    } catch {
      if (url?.startsWith('https://')) {
        domains.push(url);
      }
    }
  };

  addFrameDomain(external.stripeJs);
  addFrameDomain(external.muxJs);

  return domains;
}

/**
 * Helper pour construire les domaines d'images autorisés
 */
export function buildImageDomains(): string[] {
  const domains: string[] = [];
  const external = getExternalDomains();

  const addImageDomain = (url: string | null) => {
    if (!url) return;
    try {
      const u = new URL(url);
      domains.push(u.host);
    } catch {
      // Ignore les URLs invalides
    }
  };

  addImageDomain(external.supabase);
  if (external.muxDomain) domains.push(external.muxDomain);
  if (external.muxStream) domains.push(external.muxStream);

  return domains.filter(Boolean);
}

/**
 * Configuration d'analyse bundle
 */
export function shouldAnalyzeBundle(): boolean {
  return process.env.ANALYZE === 'true';
}

/**
 * Environnement de production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}