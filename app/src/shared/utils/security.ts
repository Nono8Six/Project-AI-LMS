/**
 * Security Headers Service - Configuration headers production ultra-sécurisés
 * Zero hardcode, configuré via ENV, compatible avec CSP existant
 */
import type { NextResponse } from 'next/server';
import { isProduction } from './config';

// Types pour configuration headers sécurité
export interface SecurityHeadersConfig {
  readonly hsts: {
    readonly enabled: boolean;
    readonly maxAge: number; // en secondes
    readonly includeSubDomains: boolean;
    readonly preload: boolean;
  };
  readonly xss: {
    readonly xFrameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
    readonly xContentTypeOptions: boolean;
    readonly xXSSProtection: '0' | '1' | '1; mode=block';
  };
  readonly referrer: {
    readonly policy: 'no-referrer' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin';
  };
  readonly permissions: {
    readonly camera: 'none' | 'self' | '*';
    readonly microphone: 'none' | 'self' | '*';
    readonly geolocation: 'none' | 'self' | '*';
    readonly payment: 'none' | 'self' | '*';
    readonly usb: 'none' | 'self' | '*';
    readonly magnetometer: 'none' | 'self' | '*';
    readonly gyroscope: 'none' | 'self' | '*';
    readonly accelerometer: 'none' | 'self' | '*';
  };
  readonly cache: {
    readonly noStoreRoutes: string[];
    readonly noCacheRoutes: string[];
  };
}

/**
 * Configuration headers par environnement
 */
function getSecurityHeadersConfig(): SecurityHeadersConfig {
  const isProd = isProduction();

  return {
    hsts: {
      enabled: isProd && (process.env.SECURITY_HSTS_ENABLED !== 'false'),
      maxAge: parseInt(process.env.SECURITY_HSTS_MAX_AGE || '31536000', 10), // 1 an par défaut
      includeSubDomains: process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS !== 'false',
      preload: process.env.SECURITY_HSTS_PRELOAD !== 'false'
    },
    xss: {
      xFrameOptions: (process.env.SECURITY_X_FRAME_OPTIONS as any) || 'DENY',
      xContentTypeOptions: process.env.SECURITY_X_CONTENT_TYPE_OPTIONS !== 'false',
      xXSSProtection: (process.env.SECURITY_X_XSS_PROTECTION as any) || '1; mode=block'
    },
    referrer: {
      policy: (process.env.SECURITY_REFERRER_POLICY as any) || 'strict-origin-when-cross-origin'
    },
    permissions: {
      camera: (process.env.SECURITY_PERMISSIONS_CAMERA as any) || 'none',
      microphone: (process.env.SECURITY_PERMISSIONS_MICROPHONE as any) || 'none',
      geolocation: (process.env.SECURITY_PERMISSIONS_GEOLOCATION as any) || 'none',
      payment: (process.env.SECURITY_PERMISSIONS_PAYMENT as any) || 'self', // Needed for Stripe
      usb: (process.env.SECURITY_PERMISSIONS_USB as any) || 'none',
      magnetometer: (process.env.SECURITY_PERMISSIONS_MAGNETOMETER as any) || 'none',
      gyroscope: (process.env.SECURITY_PERMISSIONS_GYROSCOPE as any) || 'none',
      accelerometer: (process.env.SECURITY_PERMISSIONS_ACCELEROMETER as any) || 'none'
    },
    cache: {
      noStoreRoutes: (process.env.SECURITY_NO_STORE_ROUTES || '/admin,/dashboard,/profile,/auth,/logout').split(','),
      noCacheRoutes: (process.env.SECURITY_NO_CACHE_ROUTES || '/api,/auth,/admin').split(',')
    }
  };
}

/**
 * Detection route sensible pour cache headers
 */
function isSensitiveRoute(pathname: string, config: SecurityHeadersConfig): boolean {
  return config.cache.noStoreRoutes.some(route =>
    pathname.startsWith(route.trim())
  ) || config.cache.noCacheRoutes.some(route =>
    pathname.startsWith(route.trim())
  );
}

/**
 * Detection route admin pour headers renforcés
 */
function isAdminRoute(pathname: string): boolean {
  const adminPaths = (process.env.SECURITY_ADMIN_PATHS || '/admin').split(',');
  return adminPaths.some(path => pathname.startsWith(path.trim()));
}

/**
 * Apply HSTS header production only
 */
function applyHSTS(response: NextResponse, config: SecurityHeadersConfig): void {
  if (!config.hsts.enabled) return;

  const hstsValue = [
    `max-age=${config.hsts.maxAge}`,
    config.hsts.includeSubDomains ? 'includeSubDomains' : null,
    config.hsts.preload ? 'preload' : null
  ].filter(Boolean).join('; ');

  response.headers.set('Strict-Transport-Security', hstsValue);
}

/**
 * Apply XSS protection headers
 */
function applyXSSHeaders(response: NextResponse, config: SecurityHeadersConfig): void {
  // X-Frame-Options pour protection clickjacking
  response.headers.set('X-Frame-Options', config.xss.xFrameOptions);

  // X-Content-Type-Options pour MIME sniffing
  if (config.xss.xContentTypeOptions) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
  }

  // X-XSS-Protection (legacy mais toujours utile)
  response.headers.set('X-XSS-Protection', config.xss.xXSSProtection);
}

/**
 * Apply Referrer Policy
 */
function applyReferrerPolicy(response: NextResponse, config: SecurityHeadersConfig): void {
  response.headers.set('Referrer-Policy', config.referrer.policy);
}

/**
 * Apply Permissions Policy (Feature Policy remplaçant)
 */
function applyPermissionsPolicy(response: NextResponse, config: SecurityHeadersConfig): void {
  const policies = [
    `camera=(${config.permissions.camera})`,
    `microphone=(${config.permissions.microphone})`,
    `geolocation=(${config.permissions.geolocation})`,
    `payment=(${config.permissions.payment})`,
    `usb=(${config.permissions.usb})`,
    `magnetometer=(${config.permissions.magnetometer})`,
    `gyroscope=(${config.permissions.gyroscope})`,
    `accelerometer=(${config.permissions.accelerometer})`
  ];

  response.headers.set('Permissions-Policy', policies.join(', '));
}

/**
 * Apply cache headers pour routes sensibles
 */
function applyCacheHeaders(response: NextResponse, pathname: string, config: SecurityHeadersConfig): void {
  if (!isSensitiveRoute(pathname, config)) return;

  // Headers ultra-strict pour routes auth/admin
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  // Headers additionnels pour admin
  if (isAdminRoute(pathname)) {
    response.headers.set('Surrogate-Control', 'no-store');
    response.headers.set('Vary', 'Authorization, Cookie');
  }
}

/**
 * Apply headers production additionnels
 */
function applyProductionHeaders(response: NextResponse): void {
  if (!isProduction()) return;

  // DNS Prefetch Control (sécurité)
  response.headers.set('X-DNS-Prefetch-Control', 'off');

  // Download Options (IE legacy)
  response.headers.set('X-Download-Options', 'noopen');

  // Permitted Cross-Domain Policies
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  // Server header hiding
  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');
}

/**
 * Service principal application headers sécurité
 */
export function applySecurityHeaders(response: NextResponse, pathname: string): void {
  const config = getSecurityHeadersConfig();

  // Headers HSTS (production uniquement)
  applyHSTS(response, config);

  // Headers XSS protection
  applyXSSHeaders(response, config);

  // Referrer Policy
  applyReferrerPolicy(response, config);

  // Permissions Policy
  applyPermissionsPolicy(response, config);

  // Cache headers pour routes sensibles
  applyCacheHeaders(response, pathname, config);

  // Headers production additionnels
  applyProductionHeaders(response);
}

/**
 * Validation configuration security headers
 */
export function validateSecurityConfig(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const config = getSecurityHeadersConfig();

  // Validation HSTS
  if (config.hsts.enabled && config.hsts.maxAge < 31536000) {
    errors.push('HSTS max-age should be at least 1 year (31536000 seconds)');
  }

  // Validation X-Frame-Options
  if (!['DENY', 'SAMEORIGIN', 'ALLOW-FROM'].includes(config.xss.xFrameOptions)) {
    errors.push('Invalid X-Frame-Options value');
  }

  // Validation Referrer Policy
  const validReferrerPolicies = ['no-referrer', 'same-origin', 'strict-origin', 'strict-origin-when-cross-origin'];
  if (!validReferrerPolicies.includes(config.referrer.policy)) {
    errors.push('Invalid Referrer-Policy value');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get configuration actuelle pour debugging
 */
export function getSecurityHeadersStatus(): {
  config: SecurityHeadersConfig;
  environment: string;
  validation: ReturnType<typeof validateSecurityConfig>;
} {
  return {
    config: getSecurityHeadersConfig(),
    environment: isProduction() ? 'production' : 'development',
    validation: validateSecurityConfig()
  };
}

