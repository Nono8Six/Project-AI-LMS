import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_LOGIN_PATH, isAdminRoute, isMemberRoute } from '@/shared/constants/routes'
import { buildConnectSrcDomains, buildFrameSrcDomains, getSecurityConfig, getDomainsConfig, isProduction } from '@/shared/utils/config'
import { applySecurityHeaders } from '@/shared/utils/security'

const TOKEN_CACHE_MAX_SIZE = 500
const tokenValidationCache = new Map<string, number>()

function pruneTokenCache() {
  if (tokenValidationCache.size < TOKEN_CACHE_MAX_SIZE) return
  const now = Date.now()
  for (const [token, expiry] of tokenValidationCache.entries()) {
    if (expiry <= now) tokenValidationCache.delete(token)
  }
  if (tokenValidationCache.size > TOKEN_CACHE_MAX_SIZE) {
    tokenValidationCache.clear()
  }
}

function normalizeBase64Url(segment: string): string {
  const replaced = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padding = replaced.length % 4
  if (padding === 0) return replaced
  return replaced.padEnd(replaced.length + (4 - padding), '=')
}

function decodeJwtExpiry(token: string): number | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const payload = parts[1]
  if (!payload) return null
  try {
    const normalized = normalizeBase64Url(payload)
    const decoded = atob(normalized)
    const parsed = JSON.parse(decoded) as Record<string, unknown>
    const exp = typeof parsed.exp === 'number' ? parsed.exp : null
    return exp ? exp * 1000 : null
  } catch {
    return null
  }
}

async function isAccessTokenValid(token: string | undefined): Promise<boolean> {
  if (!token) return false

  const cachedExpiry = tokenValidationCache.get(token)
  if (cachedExpiry && cachedExpiry > Date.now()) {
    return true
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return false

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey,
        Accept: 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return false
    }

    const expiry = decodeJwtExpiry(token)
    const ttl = expiry ? Math.max(expiry - 10_000, Date.now() + 5_000) : Date.now() + 60_000
    tokenValidationCache.set(token, ttl)
    pruneTokenCache()
    return true
  } catch {
    return false
  }
}

function b64(bytes: Uint8Array) {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

function generateNonce(): string {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return b64(arr)
}

function buildConnectSrc(): string[] {
  return buildConnectSrcDomains()
}

function applyCSP(response: NextResponse, nonce: string, isProd: boolean) {
  const connectSrc = buildConnectSrc().join(' ')
  const securityConfig = getSecurityConfig()
  const domainsConfig = getDomainsConfig()
  const frameSrc = buildFrameSrcDomains()

  const key = securityConfig.cspReportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy'

  const dev = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`,
    `style-src 'self' 'unsafe-inline' ${domainsConfig.googleFonts}`,
    `font-src 'self' ${domainsConfig.googleFontsStatic}`,
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    `connect-src ${connectSrc}`,
    `frame-src ${frameSrc.join(' ')}`,
  ].join('; ')

  const prod = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    securityConfig.cspAllowInlineStyle ? `style-src 'self' 'unsafe-inline' ${domainsConfig.googleFonts}` : `style-src 'self' ${domainsConfig.googleFonts}`,
    `font-src 'self' ${domainsConfig.googleFontsStatic}`,
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    `connect-src ${connectSrc}`,
    `frame-src ${frameSrc.join(' ')}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  response.headers.set(key, isProd ? prod : dev)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const securityConfig = getSecurityConfig()
  const isProd = isProduction()

  const requestHeaders = new Headers(request.headers)
  const nonce = securityConfig.cspUseNonce ? generateNonce() : ''
  if (securityConfig.cspUseNonce) requestHeaders.set('x-nonce', nonce)

  if (securityConfig.enableAuthMiddleware && (isAdminRoute(pathname) || isMemberRoute(pathname))) {
    const accessToken = request.cookies.get('sb-access-token')?.value
    const tokenValid = await isAccessTokenValid(accessToken)

    if (!tokenValid) {
      const loginUrl = new URL(AUTH_LOGIN_PATH, request.url)
      const res = NextResponse.redirect(loginUrl)
      res.cookies.delete('sb-access-token')
      res.cookies.delete('sb-refresh-token')
      if (securityConfig.cspUseNonce) applyCSP(res, nonce, isProd)
      applySecurityHeaders(res, pathname)
      return res
    }
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } })
  if (securityConfig.cspUseNonce) applyCSP(res, nonce, isProd)
  applySecurityHeaders(res, pathname)
  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}