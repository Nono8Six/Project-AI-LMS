import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

async function loadConfigModule() {
  vi.resetModules();
  return await import('../app/src/shared/utils/config');
}

const ORIGINAL_ENV = { ...process.env };

describe('config.ts - CSP Utilities', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    // Clear all external domain env vars
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.MUX_STREAM_DOMAIN;
    delete process.env.MUX_DOMAIN;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.STRIPE_API_DOMAIN;
    delete process.env.STRIPE_JS_DOMAIN;
    delete process.env.MUX_JS_DOMAIN;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = { ...ORIGINAL_ENV };
  });

  describe('getExternalDomains', () => {
    it('returns null for all domains when no env vars are set', async () => {
      const { getExternalDomains } = await loadConfigModule();
      const domains = getExternalDomains();
      
      expect(domains).toEqual({
        supabase: null,
        muxStream: null,
        muxDomain: null,
        apiBase: null,
        stripeApi: null,
        stripeJs: null,
        muxJs: null,
      });
    });

    it('returns configured domains when env vars are set', async () => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
      vi.stubEnv('MUX_STREAM_DOMAIN', 'stream.mux.com');
      vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.example.com');
      
      const { getExternalDomains } = await loadConfigModule();
      const domains = getExternalDomains();
      
      expect(domains.supabase).toBe('https://example.supabase.co');
      expect(domains.muxStream).toBe('stream.mux.com');
      expect(domains.apiBase).toBe('https://api.example.com');
    });
  });

  describe('buildConnectSrcDomains', () => {
    it('includes self as base domain', async () => {
      const { buildConnectSrcDomains } = await loadConfigModule();
      const domains = buildConnectSrcDomains();
      
      expect(domains).toContain("'self'");
    });

    it('adds configured external domains with proper URL parsing', async () => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
      vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.example.com:8080');
      
      const { buildConnectSrcDomains } = await loadConfigModule();
      const domains = buildConnectSrcDomains();
      
      expect(domains).toContain("'self'");
      expect(domains).toContain('https://example.supabase.co');
      expect(domains).toContain('https://api.example.com:8080');
    });

    it('handles invalid URLs gracefully', async () => {
      vi.stubEnv('MUX_STREAM_DOMAIN', 'invalid-url-format');
      
      const { buildConnectSrcDomains } = await loadConfigModule();
      const domains = buildConnectSrcDomains();
      
      expect(domains).toContain("'self'");
      expect(domains).toContain('invalid-url-format');
    });

    it('skips null/undefined domains', async () => {
      const { buildConnectSrcDomains } = await loadConfigModule();
      const domains = buildConnectSrcDomains();
      
      expect(domains).toEqual(["'self'"]);
    });

    it('adds all configured services', async () => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://supabase.example.com');
      vi.stubEnv('MUX_STREAM_DOMAIN', 'https://stream.mux.com');
      vi.stubEnv('MUX_DOMAIN', 'https://mux.com');
      vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.example.com');
      vi.stubEnv('STRIPE_API_DOMAIN', 'https://api.stripe.com');
      vi.stubEnv('MUX_JS_DOMAIN', 'https://src.mux.com');
      
      const { buildConnectSrcDomains } = await loadConfigModule();
      const domains = buildConnectSrcDomains();
      
      expect(domains).toContain("'self'");
      expect(domains).toContain('https://supabase.example.com');
      expect(domains).toContain('https://stream.mux.com');
      expect(domains).toContain('https://mux.com');
      expect(domains).toContain('https://api.example.com');
      expect(domains).toContain('https://api.stripe.com');
      expect(domains).toContain('https://src.mux.com');
    });
  });

  describe('buildFrameSrcDomains', () => {
    it('includes self as base domain', async () => {
      const { buildFrameSrcDomains } = await loadConfigModule();
      const domains = buildFrameSrcDomains();
      
      expect(domains).toContain("'self'");
    });

    it('adds only specific frame-allowed services', async () => {
      vi.stubEnv('STRIPE_JS_DOMAIN', 'https://js.stripe.com');
      vi.stubEnv('MUX_JS_DOMAIN', 'https://src.mux.com');
      // These should not be added to frame-src
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://supabase.example.com');
      vi.stubEnv('STRIPE_API_DOMAIN', 'https://api.stripe.com');
      
      const { buildFrameSrcDomains } = await loadConfigModule();
      const domains = buildFrameSrcDomains();
      
      expect(domains).toContain("'self'");
      expect(domains).toContain('https://js.stripe.com');
      expect(domains).toContain('https://src.mux.com');
      expect(domains).not.toContain('https://supabase.example.com');
      expect(domains).not.toContain('https://api.stripe.com');
    });

    it('handles invalid URLs by filtering them out while allowing valid origins', async () => {
      // Valid URLs will be parsed and their origins added
      vi.stubEnv('STRIPE_JS_DOMAIN', 'http://insecure.stripe.com');
      vi.stubEnv('MUX_JS_DOMAIN', 'ftp://invalid.mux.com');
      
      const { buildFrameSrcDomains } = await loadConfigModule();
      const domains = buildFrameSrcDomains();
      
      expect(domains).toContain("'self'");
      expect(domains).toContain('http://insecure.stripe.com');
      expect(domains).toContain('ftp://invalid.mux.com');
    });

    it('filters out truly invalid URLs but keeps https fallbacks', async () => {
      // Invalid URLs that can't be parsed will only be added if they start with https://
      vi.stubEnv('STRIPE_JS_DOMAIN', 'https://valid.stripe.com');
      vi.stubEnv('MUX_JS_DOMAIN', 'not-a-url-at-all');
      
      const { buildFrameSrcDomains } = await loadConfigModule();
      const domains = buildFrameSrcDomains();
      
      expect(domains).toContain("'self'");
      expect(domains).toContain('https://valid.stripe.com');
      expect(domains).not.toContain('not-a-url-at-all');
    });
  });

  describe('buildImageDomains', () => {
    it('returns empty array when no domains configured', async () => {
      const { buildImageDomains } = await loadConfigModule();
      const domains = buildImageDomains();
      
      expect(domains).toEqual([]);
    });

    it('extracts host from Supabase URL', async () => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
      
      const { buildImageDomains } = await loadConfigModule();
      const domains = buildImageDomains();
      
      expect(domains).toContain('example.supabase.co');
    });

    it('adds Mux domains when configured', async () => {
      vi.stubEnv('MUX_DOMAIN', 'images.mux.com');
      vi.stubEnv('MUX_STREAM_DOMAIN', 'stream.mux.com');
      
      const { buildImageDomains } = await loadConfigModule();
      const domains = buildImageDomains();
      
      expect(domains).toContain('images.mux.com');
      expect(domains).toContain('stream.mux.com');
    });

    it('handles invalid URLs gracefully', async () => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'not-a-valid-url');
      vi.stubEnv('MUX_DOMAIN', 'valid.mux.com');
      
      const { buildImageDomains } = await loadConfigModule();
      const domains = buildImageDomains();
      
      expect(domains).toContain('valid.mux.com');
      expect(domains).not.toContain('not-a-valid-url');
    });

    it('filters out falsy values', async () => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
      vi.stubEnv('MUX_DOMAIN', ''); // Empty string
      
      const { buildImageDomains } = await loadConfigModule();
      const domains = buildImageDomains();
      
      expect(domains).toContain('example.supabase.co');
      expect(domains).not.toContain('');
      expect(domains.length).toBe(1);
    });
  });

  describe('getSecurityConfig', () => {
    it('returns false defaults when no env vars set', async () => {
      const { getSecurityConfig } = await loadConfigModule();
      const config = getSecurityConfig();
      
      expect(config).toEqual({
        cspReportOnly: false,
        cspAllowInlineStyle: false,
        cspUseNonce: false,
        enableAuthMiddleware: false,
      });
    });

    it('correctly parses boolean env vars', async () => {
      vi.stubEnv('CSP_REPORT_ONLY', 'true');
      vi.stubEnv('CSP_ALLOW_INLINE_STYLE', 'true');
      vi.stubEnv('CSP_USE_NONCE', 'true');
      vi.stubEnv('NEXT_PUBLIC_ENABLE_AUTH_MIDDLEWARE', 'true');
      
      const { getSecurityConfig } = await loadConfigModule();
      const config = getSecurityConfig();
      
      expect(config).toEqual({
        cspReportOnly: true,
        cspAllowInlineStyle: true,
        cspUseNonce: true,
        enableAuthMiddleware: true,
      });
    });

    it('treats non-true values as false', async () => {
      vi.stubEnv('CSP_REPORT_ONLY', 'false');
      vi.stubEnv('CSP_ALLOW_INLINE_STYLE', '1');
      vi.stubEnv('CSP_USE_NONCE', 'yes');
      vi.stubEnv('NEXT_PUBLIC_ENABLE_AUTH_MIDDLEWARE', 'enabled');
      
      const { getSecurityConfig } = await loadConfigModule();
      const config = getSecurityConfig();
      
      expect(config).toEqual({
        cspReportOnly: false,
        cspAllowInlineStyle: false,
        cspUseNonce: false,
        enableAuthMiddleware: false,
      });
    });
  });

  describe('getDomainsConfig', () => {
    it('returns default Google Fonts domains when not configured', async () => {
      const { getDomainsConfig } = await loadConfigModule();
      const config = getDomainsConfig();
      
      expect(config).toEqual({
        googleFonts: 'fonts.googleapis.com',
        googleFontsStatic: 'fonts.gstatic.com',
      });
    });

    it('uses configured Google Fonts domains when set', async () => {
      vi.stubEnv('GOOGLE_FONTS_DOMAIN', 'custom-fonts.googleapis.com');
      vi.stubEnv('GOOGLE_FONTS_STATIC_DOMAIN', 'custom-fonts.gstatic.com');
      
      const { getDomainsConfig } = await loadConfigModule();
      const config = getDomainsConfig();
      
      expect(config).toEqual({
        googleFonts: 'custom-fonts.googleapis.com',
        googleFontsStatic: 'custom-fonts.gstatic.com',
      });
    });
  });

  describe('Utility functions', () => {
    it('shouldAnalyzeBundle returns correct boolean', async () => {
      const { shouldAnalyzeBundle } = await loadConfigModule();
      
      expect(shouldAnalyzeBundle()).toBe(false);
      
      vi.stubEnv('ANALYZE', 'true');
      const { shouldAnalyzeBundle: analyze2 } = await loadConfigModule();
      expect(analyze2()).toBe(true);
    });

    it('isProduction returns correct boolean', async () => {
      const { isProduction } = await loadConfigModule();
      
      vi.stubEnv('NODE_ENV', 'development');
      expect(isProduction()).toBe(false);
      
      vi.stubEnv('NODE_ENV', 'production');
      const { isProduction: prod2 } = await loadConfigModule();
      expect(prod2()).toBe(true);
    });
  });
});