import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_LOGIN_PATH, UNAUTHORIZED_PATH, isAdminRoute, isMemberRoute } from '@/shared/constants/routes'
import { buildConnectSrcDomains, buildFrameSrcDomains, getSecurityConfig, getDomainsConfig, isProduction } from '@/shared/utils/config'
import { applySecurityHeaders } from '@/shared/utils/security'

function b64(bytes: Uint8Array) {
  // Edge runtime supports btoa via atob? Fallback manual
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
    // keep style-src strict but allow GFonts; add nonce if needed later
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const securityConfig = getSecurityConfig()
  const isProd = isProduction()

  // Prepare request headers (forward nonce)
  const requestHeaders = new Headers(request.headers)
  const nonce = securityConfig.cspUseNonce ? generateNonce() : ''
  if (securityConfig.cspUseNonce) requestHeaders.set('x-nonce', nonce)

  // Garde activable: pas d'effet si désactivée
  if (!securityConfig.enableAuthMiddleware) {
    const res = NextResponse.next({ request: { headers: requestHeaders } })
    if (securityConfig.cspUseNonce) applyCSP(res, nonce, isProd)
    applySecurityHeaders(res, pathname)
    return res
  }

  // Détection minimale basée cookies Supabase (si présents)
  const accessToken = request.cookies.get('sb-access-token')?.value
  const userRole = request.cookies.get('sb-role')?.value
  const isAuthenticated = Boolean(accessToken)
  const isAdmin = userRole === 'admin'

  // Protection routes admin
  if (isAdminRoute(pathname) && !isAdmin) {
    const res = NextResponse.redirect(new URL(UNAUTHORIZED_PATH, request.url))
    if (securityConfig.cspUseNonce) applyCSP(res, nonce, isProd)
    applySecurityHeaders(res, pathname)
    return res
  }

  // Protection routes membres
  if (isMemberRoute(pathname) && !isAuthenticated) {
    const res = NextResponse.redirect(new URL(AUTH_LOGIN_PATH, request.url))
    if (securityConfig.cspUseNonce) applyCSP(res, nonce, isProd)
    applySecurityHeaders(res, pathname)
    return res
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } })
  if (securityConfig.cspUseNonce) applyCSP(res, nonce, isProd)
  applySecurityHeaders(res, pathname)
  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}
