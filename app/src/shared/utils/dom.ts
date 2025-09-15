/**
 * DOM utilities for safe script injection with CSP nonces
 * Client-only. Does nothing on server.
 */

export type ScriptCrossOrigin = '' | 'anonymous' | 'use-credentials'

// Stub interfaces for SSR fallbacks - implements minimal HTMLElement interface
interface HTMLElementStub {
  readonly id: string
  readonly tagName: string
  remove(): void
  setAttribute(name: string, value: string): void
  addEventListener(type: string, listener: () => void): void
  removeEventListener(type: string, listener: () => void): void
}

interface HTMLScriptElementStub extends HTMLElementStub {
  readonly tagName: 'SCRIPT'
  src: string
  type: string
  text: string
  async: boolean
  defer: boolean
  integrity: string
  crossOrigin: ScriptCrossOrigin
  referrerPolicy: ReferrerPolicy
}

interface HTMLStyleElementStub extends HTMLElementStub {
  readonly tagName: 'STYLE'
  media: string
  disabled: boolean
  appendChild(node: { textContent: string }): void
}

export interface AppendScriptOptions {
  id?: string
  src?: string
  text?: string
  async?: boolean
  defer?: boolean
  type?: string
  integrity?: string
  crossOrigin?: ScriptCrossOrigin
  referrerPolicy?: ReferrerPolicy
  parent?: 'head' | 'body'
  attrs?: Record<string, string>
  nonce?: string | null
}

export interface AppendScriptResult {
  el: HTMLScriptElement | HTMLScriptElementStub
  loaded: Promise<void>
  dispose: () => void
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

// Create safe SSR stubs that implement minimal interfaces
function createScriptElementStub(): HTMLScriptElementStub {
  const noop = () => void 0
  return {
    id: '',
    tagName: 'SCRIPT' as const,
    src: '',
    type: '',
    text: '',
    async: false,
    defer: false,
    integrity: '',
    crossOrigin: '',
    referrerPolicy: 'no-referrer',
    remove: noop,
    setAttribute: noop,
    addEventListener: noop,
    removeEventListener: noop,
  }
}

function createStyleElementStub(): HTMLStyleElementStub {
  const noop = () => void 0
  return {
    id: '',
    tagName: 'STYLE' as const,
    media: '',
    disabled: false,
    remove: noop,
    setAttribute: noop,
    addEventListener: noop,
    removeEventListener: noop,
    appendChild: noop,
  }
}

export function getNonceFromMeta(): string | null {
  if (!isBrowser()) return null
  const meta = document.querySelector('meta[name="csp-nonce"]') as HTMLMetaElement | null
  return meta?.content ?? null
}

/**
 * Append a <script> with a CSP nonce. If no nonce provided, attempts to read from <meta name="csp-nonce"/>.
 * Returns the element, a loaded promise, and a disposer to remove the element.
 */
export function appendScriptWithNonce(opts: AppendScriptOptions): AppendScriptResult {
  if (!isBrowser()) {
    // Fallback no-op in SSR or non-DOM contexts
    const noop = () => void 0
    return {
      el: createScriptElementStub(),
      loaded: Promise.resolve(),
      dispose: noop,
    }
  }

  const el = document.createElement('script')
  if (opts.id) el.id = opts.id
  const nonce = typeof opts.nonce !== 'undefined' ? opts.nonce : getNonceFromMeta()
  if (nonce) el.setAttribute('nonce', nonce)
  if (opts.type) el.type = opts.type
  if (opts.async) el.async = true
  if (opts.defer) el.defer = true
  if (opts.integrity) el.integrity = opts.integrity
  if (typeof opts.crossOrigin !== 'undefined') el.crossOrigin = opts.crossOrigin
  if (opts.referrerPolicy) el.referrerPolicy = opts.referrerPolicy
  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) el.setAttribute(k, v)
  }

  let resolve!: () => void
  let reject!: (e: unknown) => void
  const loaded = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })

  el.addEventListener('load', () => resolve())
  el.addEventListener('error', (e) => reject(e))

  const parent = opts.parent === 'body' ? document.body : document.head
  if (opts.src) {
    el.src = opts.src
    parent.appendChild(el)
  } else {
    // Inline script
    el.text = opts.text ?? ''
    parent.appendChild(el)
    // For inline content, onload may not fire consistently across browsers
    resolve()
  }

  const dispose = () => {
    try {
      el.remove()
    } catch {
      /* ignore */
    }
  }

  return { el, loaded, dispose }
}

// -------------------------------
// STYLE injection with CSP nonce
// -------------------------------

export interface AppendStyleOptions {
  id?: string
  text?: string
  media?: string
  disabled?: boolean
  parent?: 'head' | 'body'
  attrs?: Record<string, string>
  nonce?: string | null
}

export interface AppendStyleResult {
  el: HTMLStyleElement | HTMLStyleElementStub
  dispose: () => void
}

export function appendStyleWithNonce(opts: AppendStyleOptions): AppendStyleResult {
  if (!isBrowser()) {
    return { el: createStyleElementStub(), dispose: () => void 0 }
  }
  const el = document.createElement('style')
  if (opts.id) el.id = opts.id
  const nonce = typeof opts.nonce !== 'undefined' ? opts.nonce : getNonceFromMeta()
  if (nonce) el.setAttribute('nonce', nonce)
  if (opts.media) el.media = opts.media
  if (typeof opts.disabled !== 'undefined') el.disabled = opts.disabled
  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) el.setAttribute(k, v)
  }
  if (opts.text) el.appendChild(document.createTextNode(opts.text))
  const parent = opts.parent === 'body' ? document.body : document.head
  parent.appendChild(el)
  const dispose = () => {
    try { el.remove() } catch { /* ignore */ }
  }
  return { el, dispose }
}
