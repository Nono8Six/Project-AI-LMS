import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Geist, Geist_Mono } from 'next/font/google';
import { validateServerEnv } from '@/shared/utils/env.server';
import { getMetadataBaseUrl } from '@/shared/utils/url';
import type { ReactNode } from 'react';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  // Minimal, sans contenu métier ni textes codés
  metadataBase: getMetadataBaseUrl(),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  if (process.env.NODE_ENV === 'production') {
    // Validation stricte des variables d'environnement serveur en prod
    validateServerEnv();
  }
  // Extrait le nonce généré par le middleware (si CSP_USE_NONCE=true)
  let nonce: string | null = null;
  try {
    const h = await headers();
    nonce = h.get('x-nonce');
  } catch {
    // ignore (environnements non-Next)
  }
  return (
    <html 
      lang="fr" 
      className="h-full theme-transition"
      suppressHydrationWarning
    >
      <head>
        {nonce ? (
          // Optionnel: expose le nonce via meta pour usage client (ex: libs qui en ont besoin)
          <meta name="csp-nonce" content={nonce} />
        ) : null}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased font-sans theme-transition`}
        suppressHydrationWarning
      >
        {/* Skip-link pour navigation clavier accessibilité */}
        <a 
          href="#content" 
          className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-6 focus:z-[9999] focus:bg-violet focus:text-white focus:px-4 focus:py-2 focus:rounded-b-md focus:font-medium focus:no-underline"
        >
          Aller au contenu principal
        </a>
        
        {/* Portails pour composants globaux (Phase 6+) */}
        {/* <div id="toast-portal" /> */}
        {/* <div id="modal-portal" /> */}
        
        {/* Contenu principal de l'application */}
        {children}
      </body>
    </html>
  );
}
