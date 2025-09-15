import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

async function loadUrlModule() {
  vi.resetModules();
  return await import('../app/src/shared/utils/url');
}

const ORIGINAL_ENV = { ...process.env };

describe('url.ts - URL Utilities', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = { ...ORIGINAL_ENV };
  });

  describe('getAppBaseUrl', () => {
    describe('Environment Variable Priority', () => {
      it('uses NEXT_PUBLIC_APP_URL when set', async () => {
        vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://production.example.com');
        
        const { getAppBaseUrl } = await loadUrlModule();
        const url = getAppBaseUrl();
        
        expect(url).toBe('https://production.example.com');
      });

      it('removes trailing slash from env URL', async () => {
        vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://example.com/');
        
        const { getAppBaseUrl } = await loadUrlModule();
        const url = getAppBaseUrl();
        
        expect(url).toBe('https://example.com');
      });

      it('removes single trailing slash from env URL (multiple slashes remain)', async () => {
        vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://example.com///');
        
        const { getAppBaseUrl } = await loadUrlModule();
        const url = getAppBaseUrl();
        
        // Implementation only removes single trailing slash with replace(/\/$/, '')
        expect(url).toBe('https://example.com//');
      });

      it('handles invalid env URL gracefully', async () => {
        vi.stubEnv('NEXT_PUBLIC_APP_URL', 'not-a-valid-url');
        
        const { getAppBaseUrl } = await loadUrlModule();
        const url = getAppBaseUrl();
        
        // Should fallback to default
        expect(url).toBe('http://localhost:3000');
      });

      it('ignores empty or whitespace-only env URL', async () => {
        vi.stubEnv('NEXT_PUBLIC_APP_URL', '   ');
        
        const { getAppBaseUrl } = await loadUrlModule();
        const url = getAppBaseUrl();
        
        expect(url).toBe('http://localhost:3000');
      });
    });

    describe('Headers Fallback', () => {
      it('constructs URL from Headers object', async () => {
        const headers = {
          'host': 'api.example.com',
          'x-forwarded-proto': 'https'
        };
        
        const { getAppBaseUrl } = await loadUrlModule();
        const url = getAppBaseUrl({ headers });
        
        expect(url).toBe('https://api.example.com');
      });

      it('constructs URL from Headers instance', async () => {
        const headers = new Headers();
        headers.set('host', 'staging.example.com');
        headers.set('x-forwarded-proto', 'https');
        
        const { getAppBaseUrl } = await loadUrlModule();
        const url = getAppBaseUrl({ headers });
        
        expect(url).toBe('https://staging.example.com');
      });

      it('prioritizes x-forwarded-host over host', async () => {
        const headers = {
          'host': 'internal.example.com',
          'x-forwarded-host': 'public.example.com',
          'x-forwarded-proto': 'https'
        };
        
        const { getAppBaseUrl } = await loadUrlModule();
        const url = getAppBaseUrl({ headers });
        
        expect(url).toBe('https://public.example.com');
      });

      it('defaults to https for non-localhost hosts', async () => {
        const headers = {
          'host': 'production.example.com'
          // No x-forwarded-proto set
        };
        
        const { getAppBaseUrl } = await loadUrlModule();
        const url = getAppBaseUrl({ headers });
        
        expect(url).toBe('https://production.example.com');
      });

      it('uses http for localhost hosts by default', async () => {
        const headers = {
          'host': 'localhost:3000'
        };
        
        const { getAppBaseUrl } = await loadUrlModule();
        const url = getAppBaseUrl({ headers });
        
        expect(url).toBe('http://localhost:3000');
      });

      it('uses http for localhost with port variations', async () => {
        const testCases = ['localhost:3000', 'localhost:8080', 'localhost'];
        
        const { getAppBaseUrl } = await loadUrlModule();
        
        for (const host of testCases) {
          const url = getAppBaseUrl({ headers: { host } });
          expect(url.startsWith('http://')).toBe(true);
        }
      });

      it('handles missing host gracefully', async () => {
        const headers = {
          'x-forwarded-proto': 'https'
          // No host header
        };
        
        const { getAppBaseUrl } = await loadUrlModule();
        const url = getAppBaseUrl({ headers });
        
        // Should fallback to default
        expect(url).toBe('http://localhost:3000');
      });

      it('handles non-string host values', async () => {
        const headers = {
          'host': undefined as any
        };
        
        const { getAppBaseUrl } = await loadUrlModule();
        const url = getAppBaseUrl({ headers });
        
        expect(url).toBe('http://localhost:3000');
      });

      it('handles headers processing errors gracefully', async () => {
        // Create a mock headers object that throws on access
        const headers = new Proxy({}, {
          get() { throw new Error('Headers access error'); }
        });
        
        const { getAppBaseUrl } = await loadUrlModule();
        const url = getAppBaseUrl({ headers });
        
        expect(url).toBe('http://localhost:3000');
      });
    });

    describe('Fallback Options', () => {
      it('uses custom fallback host', async () => {
        const { getAppBaseUrl } = await loadUrlModule();
        const url = getAppBaseUrl({ 
          fallbackHost: 'custom.example.com:8080' 
        });
        
        expect(url).toBe('http://custom.example.com:8080');
      });

      it('uses custom fallback protocol', async () => {
        const { getAppBaseUrl } = await loadUrlModule();
        const url = getAppBaseUrl({ 
          fallbackProtocol: 'https'
        });
        
        expect(url).toBe('https://localhost:3000');
      });

      it('combines custom fallback options', async () => {
        const { getAppBaseUrl } = await loadUrlModule();
        const url = getAppBaseUrl({ 
          fallbackHost: 'secure.example.com',
          fallbackProtocol: 'https'
        });
        
        expect(url).toBe('https://secure.example.com');
      });

      it('uses fallback when both env and headers fail', async () => {
        vi.stubEnv('NEXT_PUBLIC_APP_URL', 'invalid-url');
        
        const { getAppBaseUrl } = await loadUrlModule();
        const url = getAppBaseUrl({ 
          headers: { /* invalid headers */ },
          fallbackHost: 'backup.example.com',
          fallbackProtocol: 'https'
        });
        
        expect(url).toBe('https://backup.example.com');
      });
    });

    describe('Priority Chain', () => {
      it('env overrides headers and fallback', async () => {
        vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://env.example.com');
        
        const { getAppBaseUrl } = await loadUrlModule();
        const url = getAppBaseUrl({
          headers: { host: 'headers.example.com' },
          fallbackHost: 'fallback.example.com',
          fallbackProtocol: 'https'
        });
        
        expect(url).toBe('https://env.example.com');
      });

      it('headers override fallback when env invalid', async () => {
        vi.stubEnv('NEXT_PUBLIC_APP_URL', 'invalid-url');
        
        const { getAppBaseUrl } = await loadUrlModule();
        const url = getAppBaseUrl({
          headers: { host: 'headers.example.com' },
          fallbackHost: 'fallback.example.com',
          fallbackProtocol: 'https'
        });
        
        expect(url).toBe('https://headers.example.com');
      });

      it('uses fallback as last resort', async () => {
        const { getAppBaseUrl } = await loadUrlModule();
        const url = getAppBaseUrl({
          fallbackHost: 'last-resort.example.com',
          fallbackProtocol: 'https'
        });
        
        expect(url).toBe('https://last-resort.example.com');
      });
    });
  });

  describe('getAbsoluteUrl', () => {
    it('combines base URL with relative path', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://example.com');
      
      const { getAbsoluteUrl } = await loadUrlModule();
      const url = getAbsoluteUrl('/api/health');
      
      expect(url).toBe('https://example.com/api/health');
    });

    it('adds leading slash to path without one', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://example.com');
      
      const { getAbsoluteUrl } = await loadUrlModule();
      const url = getAbsoluteUrl('api/health');
      
      expect(url).toBe('https://example.com/api/health');
    });

    it('handles empty path', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://example.com');
      
      const { getAbsoluteUrl } = await loadUrlModule();
      const url = getAbsoluteUrl('');
      
      expect(url).toBe('https://example.com/');
    });

    it('handles root path', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://example.com');
      
      const { getAbsoluteUrl } = await loadUrlModule();
      const url = getAbsoluteUrl('/');
      
      expect(url).toBe('https://example.com/');
    });

    it('forwards options to getAppBaseUrl', async () => {
      const { getAbsoluteUrl } = await loadUrlModule();
      const url = getAbsoluteUrl('/test', {
        fallbackHost: 'test.example.com',
        fallbackProtocol: 'https'
      });
      
      expect(url).toBe('https://test.example.com/test');
    });

    it('works with headers from options', async () => {
      const headers = { 
        host: 'dynamic.example.com',
        'x-forwarded-proto': 'https' 
      };
      
      const { getAbsoluteUrl } = await loadUrlModule();
      const url = getAbsoluteUrl('/dashboard', { headers });
      
      expect(url).toBe('https://dynamic.example.com/dashboard');
    });

    it('handles complex paths', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://example.com');
      
      const { getAbsoluteUrl } = await loadUrlModule();
      const url = getAbsoluteUrl('/api/v1/users/123?include=profile');
      
      expect(url).toBe('https://example.com/api/v1/users/123?include=profile');
    });

    it('preserves query parameters and fragments', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://example.com');
      
      const { getAbsoluteUrl } = await loadUrlModule();
      const url = getAbsoluteUrl('/page?param=value#section');
      
      expect(url).toBe('https://example.com/page?param=value#section');
    });
  });

  describe('getMetadataBaseUrl', () => {
    it('returns URL object from base URL', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://example.com');
      
      const { getMetadataBaseUrl } = await loadUrlModule();
      const url = getMetadataBaseUrl();
      
      expect(url).toBeInstanceOf(URL);
      expect(url.toString()).toBe('https://example.com/');
    });

    it('forwards options to getAppBaseUrl', async () => {
      const { getMetadataBaseUrl } = await loadUrlModule();
      const url = getMetadataBaseUrl({
        fallbackHost: 'meta.example.com',
        fallbackProtocol: 'https'
      });
      
      expect(url.origin).toBe('https://meta.example.com');
    });

    it('works with headers', async () => {
      const headers = { 
        host: 'metadata.example.com',
        'x-forwarded-proto': 'https' 
      };
      
      const { getMetadataBaseUrl } = await loadUrlModule();
      const url = getMetadataBaseUrl({ headers });
      
      expect(url.origin).toBe('https://metadata.example.com');
    });

    it('provides proper URL methods', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://example.com:8080');
      
      const { getMetadataBaseUrl } = await loadUrlModule();
      const url = getMetadataBaseUrl();
      
      expect(url.hostname).toBe('example.com');
      expect(url.port).toBe('8080');
      expect(url.protocol).toBe('https:');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles environment with only whitespace', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', '\n\t   \r\n');
      
      const { getAppBaseUrl } = await loadUrlModule();
      const url = getAppBaseUrl();
      
      expect(url).toBe('http://localhost:3000');
    });

    it('handles malformed URLs in environment', async () => {
      const malformedUrls = [
        '://missing-protocol',
        'http://[invalid-ipv6',
        'not-a-valid-url',
        'just-a-string',
        'http://',
        'https://',
      ];
      
      const { getAppBaseUrl } = await loadUrlModule();
      
      for (const malformed of malformedUrls) {
        vi.stubEnv('NEXT_PUBLIC_APP_URL', malformed);
        const { getAppBaseUrl: getUrl } = await loadUrlModule();
        expect(getUrl()).toBe('http://localhost:3000');
      }
    });

    it('handles URLs that are valid but uncommon protocols', async () => {
      // These are technically valid URLs but represent edge cases
      const validButUncommonUrls = [
        'ftp://example.com',
        'file://localhost/path',
        'data:text/plain,hello'
      ];
      
      const { getAppBaseUrl } = await loadUrlModule();
      
      for (const validUrl of validButUncommonUrls) {
        vi.stubEnv('NEXT_PUBLIC_APP_URL', validUrl);
        const { getAppBaseUrl: getUrl } = await loadUrlModule();
        // These should be accepted since they're valid URLs
        expect(getUrl()).not.toBe('http://localhost:3000');
      }
    });

    it('handles null and undefined options gracefully', async () => {
      const { getAppBaseUrl, getAbsoluteUrl, getMetadataBaseUrl } = await loadUrlModule();
      
      expect(() => getAppBaseUrl(undefined)).not.toThrow();
      expect(() => getAbsoluteUrl('/', undefined)).not.toThrow();
      expect(() => getMetadataBaseUrl(undefined)).not.toThrow();
    });

    it('maintains consistent behavior across calls', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://consistent.example.com');
      
      const { getAppBaseUrl } = await loadUrlModule();
      
      const url1 = getAppBaseUrl();
      const url2 = getAppBaseUrl();
      const url3 = getAppBaseUrl({});
      
      expect(url1).toBe(url2);
      expect(url2).toBe(url3);
    });
  });
});