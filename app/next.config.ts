import type { NextConfig } from 'next'
// Load environment from the monorepo root .env to ensure a single source of truth
// This is the optimal solution for monorepos: single .env file at root level
import dotenv from 'dotenv'
import path from 'node:path'
// Use shared route constants to avoid hardcoded paths
import { AUTH_LOGIN_PATH, AUTH_SIGNUP_PATH } from './src/shared/constants/routes'
// Use shared prefix logic to avoid duplication
import { deriveApiPrefix } from './src/shared/utils/prefix'
// Use shared config utilities to avoid hardcoded domain access
import { buildImageDomains, buildConnectSrcDomains, buildFrameSrcDomains, getSecurityConfig, getDomainsConfig, shouldAnalyzeBundle, isProduction } from './src/shared/utils/config'

function hostFromUrl(url?: string): string | undefined {
  if (!url) return undefined
  try {
    const u = new URL(url)
    return u.host
  } catch {
    return undefined
  }
}


try {
  dotenv.config({ path: path.resolve(__dirname, '../.env') })
} catch {
  // ignore if not present; Next will still work with process env
}

const nextConfig: NextConfig = {
  // Optimisations de performance
  compress: true,
  poweredByHeader: false,

  // Configuration expérimentale pour Next.js 15
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', 'lucide-react'],
  },

  // Configuration des images
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: buildImageDomains(),
    // Désactiver les SVG non sûrs; prévoir sanitization stricte plus tard
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
  },

  // Configuration webpack pour optimisations
  webpack: (config, { dev, isServer }) => {
    // Optimisations de production
    if (!dev) {
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
    }

    // Support SVG
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })

    // Bundle analyzer (dev opt-in)
    if (shouldAnalyzeBundle() && !isServer) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: 8888,
          openAnalyzer: true,
        }),
      )
    }

    return config
  },

  // Headers de sécurité CSP
  async headers() {
    const isProd = isProduction()
    const securityConfig = getSecurityConfig()
    const domainsConfig = getDomainsConfig()
    const connectSrc = buildConnectSrcDomains()
    const frameSrc = buildFrameSrcDomains()

    const base = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
    ]

    const cspDev = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      `style-src 'self' 'unsafe-inline' ${domainsConfig.googleFonts}`,
      `font-src 'self' ${domainsConfig.googleFontsStatic}`,
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      `connect-src ${connectSrc.join(' ')}`,
      `frame-src ${frameSrc.join(' ')}`,
    ].join('; ')

    // Production CSP: Ultra-strict, NO unsafe-inline allowed
    const cspProd = [
      "default-src 'self'",
      "script-src 'self'",
      `style-src 'self' ${domainsConfig.googleFonts}`,
      `font-src 'self' ${domainsConfig.googleFontsStatic}`,
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      `connect-src ${connectSrc.join(' ')}`,
      `frame-src ${frameSrc.join(' ')}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')

    // If nonce-based CSP is handled in middleware, skip static CSP headers here
    if (securityConfig.cspUseNonce) {
      return []
    }

    const cspHeaderKey = securityConfig.cspReportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy'
    return [
      {
        source: '/(.*)',
        headers: [
          ...base,
          { key: cspHeaderKey, value: isProd ? cspProd : cspDev },
        ],
      },
    ]
  },

  // Rewrites to support custom ORPC_PREFIX while keeping the physical route at /api/rpc
  async rewrites() {
    const prefix = deriveApiPrefix()
    if (prefix !== '/api/rpc') {
      return [
        {
          source: `${prefix}/:path*`,
          destination: '/api/rpc/:path*',
        },
      ]
    }
    return []
  },

  // Configuration des redirects
  async redirects() {
    return [
      // Legacy FR → current auth paths (temporary during init)
      {
        source: '/auth/connexion',
        destination: AUTH_LOGIN_PATH,
        permanent: false,
      },
      {
        source: '/connexion',
        destination: AUTH_LOGIN_PATH,
        permanent: false,
      },
      {
        source: '/inscription',
        destination: AUTH_SIGNUP_PATH,
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
