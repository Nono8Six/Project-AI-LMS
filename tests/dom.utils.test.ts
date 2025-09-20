import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock DOM environment
const mockDocument = {
  createElement: vi.fn(),
  querySelector: vi.fn(),
  head: { appendChild: vi.fn() },
  body: { appendChild: vi.fn() },
  createTextNode: vi.fn(),
};

const mockElement = {
  id: '',
  setAttribute: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  remove: vi.fn(),
  appendChild: vi.fn(),
  src: '',
  type: '',
  text: '',
  async: false,
  defer: false,
  integrity: '',
  crossOrigin: '',
  referrerPolicy: 'no-referrer',
  media: '',
  disabled: false,
};

async function loadDOMModule() {
  vi.resetModules();
  return await import('../app/src/shared/utils/dom');
}

describe('dom.ts - DOM Utilities', () => {
  const originalWindow = global.window;
  const originalDocument = global.document;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.window = originalWindow;
    global.document = originalDocument;
  });

  describe('SSR Context (no window/document)', () => {
    beforeEach(() => {
      delete (global as any).window;
      delete (global as any).document;
    });

    it('getNonceFromMeta returns null in SSR', async () => {
      const { getNonceFromMeta } = await loadDOMModule();
      expect(getNonceFromMeta()).toBe(null);
    });

    it('appendScriptWithNonce returns stub in SSR', async () => {
      const { appendScriptWithNonce } = await loadDOMModule();
      const result = appendScriptWithNonce({ src: 'test.js' });
      
      expect(result.el).toBeDefined();
      expect(result.el.tagName).toBe('SCRIPT');
      expect(result.loaded).toBeInstanceOf(Promise);
      expect(typeof result.dispose).toBe('function');
      
      // Verify promise resolves
      await expect(result.loaded).resolves.toBeUndefined();
      
      // Verify dispose function doesn't throw
      expect(() => result.dispose()).not.toThrow();
    });

    it('appendStyleWithNonce returns stub in SSR', async () => {
      const { appendStyleWithNonce } = await loadDOMModule();
      const result = appendStyleWithNonce({ text: 'body { color: red; }' });
      
      expect(result.el).toBeDefined();
      expect(result.el.tagName).toBe('STYLE');
      expect(typeof result.dispose).toBe('function');
      
      // Verify dispose function doesn't throw
      expect(() => result.dispose()).not.toThrow();
    });
  });

  describe('Browser Context', () => {
    beforeEach(() => {
      global.window = {} as any;
      global.document = mockDocument as any;
      
      // Reset mock element to default state
      mockElement.id = '';
      mockElement.src = '';
      mockElement.type = '';
      mockElement.text = '';
      mockElement.async = false;
      mockElement.defer = false;
      mockElement.integrity = '';
      mockElement.crossOrigin = '';
      mockElement.referrerPolicy = 'no-referrer';
      mockElement.media = '';
      mockElement.disabled = false;
      
      // Reset mocks
      mockDocument.createElement.mockReturnValue(mockElement);
      mockDocument.querySelector.mockReturnValue(null);
      mockDocument.createTextNode.mockReturnValue({ textContent: '' });
    });

    describe('getNonceFromMeta', () => {
      it('returns null when no nonce meta tag exists', async () => {
        mockDocument.querySelector.mockReturnValue(null);
        
        const { getNonceFromMeta } = await loadDOMModule();
        expect(getNonceFromMeta()).toBe(null);
        expect(mockDocument.querySelector).toHaveBeenCalledWith('meta[name="csp-nonce"]');
      });

      it('returns nonce value from meta tag', async () => {
        const mockMetaElement = { content: 'test-nonce-value' };
        mockDocument.querySelector.mockReturnValue(mockMetaElement);
        
        const { getNonceFromMeta } = await loadDOMModule();
        expect(getNonceFromMeta()).toBe('test-nonce-value');
      });

      it('returns null when meta tag has no content', async () => {
        const mockMetaElement = { content: null };
        mockDocument.querySelector.mockReturnValue(mockMetaElement);
        
        const { getNonceFromMeta } = await loadDOMModule();
        expect(getNonceFromMeta()).toBe(null);
      });
    });

    describe('appendScriptWithNonce', () => {
      it('creates script element with all basic attributes', async () => {
        const { appendScriptWithNonce } = await loadDOMModule();
        const options = {
          id: 'test-script',
          src: 'https://example.com/script.js',
          type: 'text/javascript',
          async: true,
          defer: true,
          integrity: 'sha256-test',
          crossOrigin: 'anonymous' as const,
          referrerPolicy: 'no-referrer' as ReferrerPolicy,
        };

        appendScriptWithNonce(options);

        expect(mockDocument.createElement).toHaveBeenCalledWith('script');
        expect(mockElement.id).toBe('test-script');
        expect(mockElement.src).toBe('https://example.com/script.js');
        expect(mockElement.type).toBe('text/javascript');
        expect(mockElement.async).toBe(true);
        expect(mockElement.defer).toBe(true);
        expect(mockElement.integrity).toBe('sha256-test');
        expect(mockElement.crossOrigin).toBe('anonymous');
        expect(mockElement.referrerPolicy).toBe('no-referrer');
      });

      it('uses provided nonce', async () => {
        const { appendScriptWithNonce } = await loadDOMModule();
        
        appendScriptWithNonce({ src: 'test.js', nonce: 'provided-nonce' });
        
        expect(mockElement.setAttribute).toHaveBeenCalledWith('nonce', 'provided-nonce');
      });

      it('uses nonce from meta tag when not provided', async () => {
        const mockMetaElement = { content: 'meta-nonce' };
        mockDocument.querySelector.mockReturnValue(mockMetaElement);
        
        const { appendScriptWithNonce } = await loadDOMModule();
        appendScriptWithNonce({ src: 'test.js' });
        
        expect(mockElement.setAttribute).toHaveBeenCalledWith('nonce', 'meta-nonce');
      });

      it('skips nonce when explicitly set to null', async () => {
        const { appendScriptWithNonce } = await loadDOMModule();
        
        appendScriptWithNonce({ src: 'test.js', nonce: null });
        
        expect(mockElement.setAttribute).not.toHaveBeenCalledWith('nonce', expect.anything());
      });

      it('appends to head by default', async () => {
        const { appendScriptWithNonce } = await loadDOMModule();
        
        appendScriptWithNonce({ src: 'test.js' });
        
        expect(mockDocument.head.appendChild).toHaveBeenCalledWith(mockElement);
        expect(mockDocument.body.appendChild).not.toHaveBeenCalled();
      });

      it('appends to body when specified', async () => {
        const { appendScriptWithNonce } = await loadDOMModule();
        
        appendScriptWithNonce({ src: 'test.js', parent: 'body' });
        
        expect(mockDocument.body.appendChild).toHaveBeenCalledWith(mockElement);
        expect(mockDocument.head.appendChild).not.toHaveBeenCalled();
      });

      it('sets custom attributes', async () => {
        const { appendScriptWithNonce } = await loadDOMModule();
        
        appendScriptWithNonce({ 
          src: 'test.js', 
          attrs: { 'data-test': 'value', 'custom-attr': 'custom' } 
        });
        
        expect(mockElement.setAttribute).toHaveBeenCalledWith('data-test', 'value');
        expect(mockElement.setAttribute).toHaveBeenCalledWith('custom-attr', 'custom');
      });

      it('handles inline scripts', async () => {
        const { appendScriptWithNonce } = await loadDOMModule();
        
        const result = appendScriptWithNonce({ text: 'console.log("test");' });
        
        expect(mockElement.text).toBe('console.log("test");');
        expect(mockDocument.head.appendChild).toHaveBeenCalledWith(mockElement);
        
        // For inline scripts, loaded promise should resolve immediately
        await expect(result.loaded).resolves.toBeUndefined();
      });

      it('sets up event listeners for external scripts', async () => {
        const { appendScriptWithNonce } = await loadDOMModule();
        
        appendScriptWithNonce({ src: 'external.js' });
        
        expect(mockElement.addEventListener).toHaveBeenCalledWith('load', expect.any(Function));
        expect(mockElement.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      });

      it('returns working dispose function', async () => {
        const { appendScriptWithNonce } = await loadDOMModule();
        
        const result = appendScriptWithNonce({ src: 'test.js' });
        
        expect(() => result.dispose()).not.toThrow();
        expect(mockElement.remove).toHaveBeenCalled();
      });

      it('dispose handles removal errors gracefully', async () => {
        mockElement.remove.mockImplementation(() => {
          throw new Error('Remove failed');
        });
        
        const { appendScriptWithNonce } = await loadDOMModule();
        const result = appendScriptWithNonce({ src: 'test.js' });
        
        expect(() => result.dispose()).not.toThrow();
      });
    });

    describe('appendStyleWithNonce', () => {
      it('creates style element with basic attributes', async () => {
        const { appendStyleWithNonce } = await loadDOMModule();
        const options = {
          id: 'test-style',
          media: 'screen',
          disabled: true,
        };

        appendStyleWithNonce(options);

        expect(mockDocument.createElement).toHaveBeenCalledWith('style');
        expect(mockElement.id).toBe('test-style');
        expect(mockElement.media).toBe('screen');
        expect(mockElement.disabled).toBe(true);
      });

      it('uses provided nonce', async () => {
        const { appendStyleWithNonce } = await loadDOMModule();
        
        appendStyleWithNonce({ nonce: 'style-nonce' });
        
        expect(mockElement.setAttribute).toHaveBeenCalledWith('nonce', 'style-nonce');
      });

      it('uses nonce from meta tag when not provided', async () => {
        const mockMetaElement = { content: 'meta-style-nonce' };
        mockDocument.querySelector.mockReturnValue(mockMetaElement);
        
        const { appendStyleWithNonce } = await loadDOMModule();
        appendStyleWithNonce({});
        
        expect(mockElement.setAttribute).toHaveBeenCalledWith('nonce', 'meta-style-nonce');
      });

      it('appends text content', async () => {
        const mockTextNode = { textContent: 'body { color: red; }' };
        mockDocument.createTextNode.mockReturnValue(mockTextNode);
        
        const { appendStyleWithNonce } = await loadDOMModule();
        
        appendStyleWithNonce({ text: 'body { color: red; }' });
        
        expect(mockDocument.createTextNode).toHaveBeenCalledWith('body { color: red; }');
        expect(mockElement.appendChild).toHaveBeenCalledWith(mockTextNode);
      });

      it('appends to head by default', async () => {
        const { appendStyleWithNonce } = await loadDOMModule();
        
        appendStyleWithNonce({ text: 'body { color: red; }' });
        
        expect(mockDocument.head.appendChild).toHaveBeenCalledWith(mockElement);
        expect(mockDocument.body.appendChild).not.toHaveBeenCalled();
      });

      it('appends to body when specified', async () => {
        const { appendStyleWithNonce } = await loadDOMModule();
        
        appendStyleWithNonce({ text: 'body { color: red; }', parent: 'body' });
        
        expect(mockDocument.body.appendChild).toHaveBeenCalledWith(mockElement);
        expect(mockDocument.head.appendChild).not.toHaveBeenCalled();
      });

      it('sets custom attributes', async () => {
        const { appendStyleWithNonce } = await loadDOMModule();
        
        appendStyleWithNonce({ 
          attrs: { 'data-component': 'header', 'data-version': '1.0' } 
        });
        
        expect(mockElement.setAttribute).toHaveBeenCalledWith('data-component', 'header');
        expect(mockElement.setAttribute).toHaveBeenCalledWith('data-version', '1.0');
      });

      it('returns working dispose function', async () => {
        const { appendStyleWithNonce } = await loadDOMModule();
        
        const result = appendStyleWithNonce({ text: 'body { color: blue; }' });
        
        expect(() => result.dispose()).not.toThrow();
        expect(mockElement.remove).toHaveBeenCalled();
      });

      it('dispose handles removal errors gracefully', async () => {
        mockElement.remove.mockImplementation(() => {
          throw new Error('Style remove failed');
        });
        
        const { appendStyleWithNonce } = await loadDOMModule();
        const result = appendStyleWithNonce({ text: 'body { color: green; }' });
        
        expect(() => result.dispose()).not.toThrow();
      });
    });

    describe('Type Safety', () => {
      it('ScriptCrossOrigin type accepts valid values', async () => {
        const { appendScriptWithNonce } = await loadDOMModule();
        
        // These should compile without TypeScript errors
        appendScriptWithNonce({ src: 'test.js', crossOrigin: '' });
        appendScriptWithNonce({ src: 'test.js', crossOrigin: 'anonymous' });
        appendScriptWithNonce({ src: 'test.js', crossOrigin: 'use-credentials' });
      });

      it('handles undefined disabled flag correctly', async () => {
        // Reset disabled to default false before test
        mockElement.disabled = false;
        
        const { appendStyleWithNonce } = await loadDOMModule();
        
        appendStyleWithNonce({ disabled: undefined });
        
        // Should not change disabled property when undefined (stays at default)
        expect(mockElement.disabled).toBe(false);
      });
    });
  });
});